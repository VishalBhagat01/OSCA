import os
import re
import difflib
import subprocess
from pathlib import Path
from typing import List, Tuple, Optional


def run_git_cmd(command: List[str], cwd: str) -> Tuple[bool, str]:
    """Execute git command and return (success, output)."""
    try:
        res = subprocess.run(
            command,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=15,
        )
        return res.returncode == 0, res.stdout or res.stderr
    except Exception as e:
        return False, str(e)


def fuzzy_find_window(file_lines: List[str], search_lines: List[str], threshold: float = 0.82) -> Optional[Tuple[int, int]]:
    """Find start and end line indices in file_lines that best match search_lines."""
    if not search_lines or not file_lines:
        return None

    n_search = len(search_lines)
    search_str = "\n".join(search_lines).strip()

    # 1. Exact substring check
    for i in range(len(file_lines) - n_search + 1):
        window = file_lines[i : i + n_search]
        if "\n".join(window).strip() == search_str:
            return i, i + n_search

    # 2. Normalized whitespace check (ignore leading/trailing indentation)
    norm_search = "\n".join(line.strip() for line in search_lines if line.strip())
    for i in range(len(file_lines) - n_search + 1):
        window = file_lines[i : i + n_search]
        norm_window = "\n".join(line.strip() for line in window if line.strip())
        if norm_window == norm_search:
            return i, i + n_search

    # 3. Sliding window fuzzy match using SequenceMatcher
    best_ratio = 0.0
    best_span = None

    # Search window sizes slightly varying from n_search (-2 to +2)
    for w_size in range(max(1, n_search - 2), min(len(file_lines) + 1, n_search + 3)):
        for i in range(len(file_lines) - w_size + 1):
            window_str = "\n".join(file_lines[i : i + w_size])
            matcher = difflib.SequenceMatcher(None, window_str, search_str)
            ratio = matcher.quick_ratio()
            if ratio > best_ratio and ratio >= threshold:
                full_ratio = matcher.ratio()
                if full_ratio > best_ratio and full_ratio >= threshold:
                    best_ratio = full_ratio
                    best_span = (i, i + w_size)

    return best_span


def apply_search_replace_block(file_content: str, search_text: str, replace_text: str) -> Optional[str]:
    """Apply a single SEARCH/REPLACE block to file content with fuzzy fallback."""
    # Fast exact match
    if search_text in file_content:
        return file_content.replace(search_text, replace_text, 1)

    file_lines = file_content.splitlines(keepends=True)
    search_lines = search_text.splitlines(keepends=True)
    replace_lines = replace_text.splitlines(keepends=True)

    span = fuzzy_find_window(file_lines, search_lines)
    if span is not None:
        start_idx, end_idx = span
        new_file_lines = file_lines[:start_idx] + replace_lines + file_lines[end_idx:]
        return "".join(new_file_lines)

    return None


def parse_search_replace_blocks(patch_text: str) -> List[dict]:
    """Parse Aider-style <<<<<<< SEARCH ... ======= ... >>>>>>> REPLACE blocks."""
    pattern = re.compile(
        r"(?:(?:#|\*|\/{2})?\s*(?:File|Path):\s*([^\n\r]+)\s*)?"
        r"<<<{5,8}\s*SEARCH\s*\n(.*?)\n={5,8}\s*\n(.*?)\n>{5,8}\s*REPLACE",
        re.DOTALL,
    )
    blocks = []
    for match in pattern.finditer(patch_text):
        path = match.group(1).strip() if match.group(1) else ""
        search = match.group(2)
        replace = match.group(3)
        blocks.append({"file": path, "search": search, "replace": replace})
    return blocks


def apply_fuzzy_patch(repo_path: str, patch_text: str) -> Tuple[bool, str]:
    """Resilient patch application pipeline.
    1. Try native git apply --whitespace=fix
    2. Try git apply with relaxed flags (--recount --ignore-whitespace)
    3. Try search/replace block extraction with fuzzy sliding window alignment
    """
    if not patch_text or not patch_text.strip():
        return False, "Patch is empty."

    root = Path(repo_path)
    patch_file = root / ".osa_temp.patch"

    try:
        patch_file.write_text(patch_text, encoding="utf-8")

        # Step 1: Standard clean apply
        ok, out = run_git_cmd(
            ["git", "apply", "--check", "--whitespace=fix", str(patch_file.name)],
            repo_path,
        )
        if ok:
            ok_apply, out_apply = run_git_cmd(
                ["git", "apply", "--whitespace=fix", str(patch_file.name)],
                repo_path,
            )
            if ok_apply:
                return True, "Patch applied cleanly via git apply."

        # Step 2: Relaxed apply with --recount and --ignore-whitespace
        ok_rel, _ = run_git_cmd(
            ["git", "apply", "--check", "--whitespace=fix", "--recount", "--ignore-whitespace", str(patch_file.name)],
            repo_path,
        )
        if ok_rel:
            ok_rel_apply, out_rel = run_git_cmd(
                ["git", "apply", "--whitespace=fix", "--recount", "--ignore-whitespace", str(patch_file.name)],
                repo_path,
            )
            if ok_rel_apply:
                return True, "Patch applied cleanly via relaxed git apply."

        # Step 3: Check for SEARCH/REPLACE blocks
        sr_blocks = parse_search_replace_blocks(patch_text)
        if sr_blocks:
            applied_any = False
            for block in sr_blocks:
                target_path = block.get("file")
                if not target_path or not (root / target_path).is_file():
                    # Look for file mentioned in diff header or single changed file
                    continue

                full_path = root / target_path
                content = full_path.read_text(encoding="utf-8", errors="ignore")
                updated = apply_search_replace_block(content, block["search"], block["replace"])
                if updated is not None:
                    full_path.write_text(updated, encoding="utf-8")
                    applied_any = True

            if applied_any:
                diff_ok, diff_out = run_git_cmd(["git", "diff"], repo_path)
                if diff_ok and diff_out.strip():
                    return True, "Search/Replace blocks applied with fuzzy alignment."

        return False, f"git apply failed: {out}"

    finally:
        if patch_file.exists():
            try:
                patch_file.unlink()
            except Exception:
                pass
