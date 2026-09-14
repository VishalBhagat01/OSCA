import ast
import re
from typing import Optional


class SkeletonTransformer(ast.NodeTransformer):
    """AST transformer that keeps signatures and docstrings, replacing bodies with ..."""

    def _skeletonize_body(self, body: list) -> list:
        new_body = []
        # Keep docstring if first statement is an Expr with a Constant string
        if body and isinstance(body[0], ast.Expr) and isinstance(getattr(body[0], "value", None), ast.Constant) and isinstance(body[0].value.value, str):
            new_body.append(body[0])

        # Add ellipsis (...)
        new_body.append(ast.Expr(value=ast.Constant(value=...)))
        return new_body

    def visit_FunctionDef(self, node: ast.FunctionDef) -> ast.AST:
        node.body = self._skeletonize_body(node.body)
        return node

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef) -> ast.AST:
        node.body = self._skeletonize_body(node.body)
        return node

    def visit_ClassDef(self, node: ast.ClassDef) -> ast.AST:
        # Recursively visit methods/classes inside the class
        new_body = []
        for item in node.body:
            # Preserve docstrings
            if isinstance(item, ast.Expr) and isinstance(getattr(item, "value", None), ast.Constant) and isinstance(item.value.value, str):
                new_body.append(item)
            elif isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                new_body.append(self.visit(item))
            elif isinstance(item, (ast.AnnAssign, ast.Assign)):
                # Keep class-level type annotations / variables
                new_body.append(item)

        if not new_body:
            new_body = [ast.Expr(value=ast.Constant(value=...))]

        node.body = new_body
        return node


def skeletonize_python(source_code: str) -> Optional[str]:
    """Parse Python source code and return a concise skeleton (signatures + docstrings)."""
    try:
        tree = ast.parse(source_code)
        transformer = SkeletonTransformer()
        transformed_tree = transformer.visit(tree)
        ast.fix_missing_locations(transformed_tree)
        return ast.unparse(transformed_tree)
    except Exception:
        return None


def skeletonize_generic(source_code: str, max_lines: int = 100) -> str:
    """Lightweight regex-based skeletonizer for JS/TS/Go and fallback."""
    kept_lines = []
    in_block_comment = False

    sig_pattern = re.compile(
        r"^\s*(?:(?:export|default|async|static|public|private|protected)\s+)*(?:function\b|class\b|interface\b|type\b|const\b|let\b|var\b|def\b|func\b|struct\b|[a-zA-Z_$][a-zA-Z0-9_$]*\s*\()"
    )
    import_pattern = re.compile(r"^\s*(?:import|from|require|package)\b")

    for line in source_code.splitlines():
        trimmed = line.strip()
        if not trimmed:
            continue

        if "/*" in trimmed:
            in_block_comment = True
        if in_block_comment:
            kept_lines.append(line)
            if "*/" in trimmed:
                in_block_comment = False
            continue

        if trimmed.startswith(("//", "#", "/*", "*")):
            kept_lines.append(line)
            continue

        if import_pattern.match(line) or sig_pattern.match(line):
            kept_lines.append(line)
        elif trimmed.endswith(("{", ":")) and len(kept_lines) > 0 and kept_lines[-1] == line:
            kept_lines.append("    // ...")

        if len(kept_lines) >= max_lines:
            kept_lines.append("// ... [outline truncated]")
            break

    return "\n".join(kept_lines)


def skeletonize_code(file_path: str, source_code: str) -> str:
    """Generate a token-efficient skeleton for a given source file."""
    if not source_code or len(source_code) < 400:
        return source_code

    norm_path = file_path.lower().replace("\\", "/")
    if norm_path.endswith(".py"):
        skeleton = skeletonize_python(source_code)
        if skeleton:
            return skeleton

    return skeletonize_generic(source_code)
