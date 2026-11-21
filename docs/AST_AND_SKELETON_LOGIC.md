# AST and Skeleton Logic

## 1. Purpose

The AST/skeleton implementation exists to reduce prompt size. It is not the repository issue-search engine and it is not a full semantic code analyzer.

The only real Python AST transformation in the agent is `agent/git_utils/ast_skeletonizer.py`. The main repository scanner creates a filename/file-tree inventory, while `file_selector.py` ranks relevant files by keyword heuristics.

## 2. Entry Point

`SkeletonTransformer` and the public functions are in [agent/git_utils/ast_skeletonizer.py](../agent/git_utils/ast_skeletonizer.py).

```text
skeletonize_code(file_path, source_code)
  ├── empty or shorter than 400 characters -> unchanged
  ├── .py -> skeletonize_python()
  └── all other/fallback files -> skeletonize_generic()
```

The threshold means small files are sent unchanged to preserve imports, constants, and implementation context.

## 3. Python AST Pipeline

### Parse

`ast.parse(source_code)` constructs a Python syntax tree. Syntax errors cause `skeletonize_python()` to return `None`, after which the caller falls back to generic handling.

### Transform

`SkeletonTransformer(ast.NodeTransformer)` traverses the AST.

#### `_skeletonize_body(body)`

For a function body:

1. Preserve the first statement if it is a string `Expr`/docstring.
2. Replace every implementation statement with one ellipsis expression:

```python
ast.Expr(value=ast.Constant(value=...))
```

The transformer therefore removes control flow and local logic while retaining the callable's docstring.

#### `visit_FunctionDef`

Replaces the body of ordinary Python functions with `_skeletonize_body()`.

#### `visit_AsyncFunctionDef`

Uses the same transformation for `async def` functions.

#### `visit_ClassDef`

For a class:

1. Preserve a leading class docstring.
2. Preserve nested `FunctionDef`, `AsyncFunctionDef`, and `ClassDef` nodes by recursively visiting them.
3. Preserve `AnnAssign` and `Assign` nodes, representing class-level attributes and constants.
4. If no meaningful class body remains, place an ellipsis in the body.

Method decorators, arguments, return annotations, and class bases remain in the AST and are preserved by `ast.unparse()`.

### Restore locations and unparse

The transformer calls `ast.fix_missing_locations(transformed_tree)`, then `ast.unparse(transformed_tree)` produces source text.

Example:

```python
def calculate(value: int) -> int:
    """Calculate a value."""
    result = value * 2
    if result > 10:
        return result
    return 0
```

becomes structurally similar to:

```python
def calculate(value: int) -> int:
    """Calculate a value."""
    ...
```

## 4. Generic Skeleton Pipeline

`Skeletonize_generic()` is a regex and line-filter fallback for JavaScript, TypeScript, JSX, Go, Java, C++, C, Rust, and other non-Python source.

It:

- removes blank lines;
- keeps block-comment lines until `*/`;
- keeps line comments and `#` comments;
- keeps import/from/require/package declarations;
- keeps lines matching a declaration pattern for:
  - `function`
  - `class`
  - `interface`
  - `type`
  - `const`
  - `let`
  - `var`
  - `def`
  - `func`
  - `struct`
  - parenthesized or function-like named declarations;
- truncates after a configurable 100-line ceiling.

This is structural heuristic extraction, not an AST. It does not parse braces or scopes and can retain too much or too little depending on formatting.

## 5. Use in the Planner

The planner:

1. Takes the top three relevant files.
2. Reads each file's full content from repository context.
3. Calls `skeletonize_code()`.
4. Truncates a single skeleton to 800 characters.
5. Serializes the skeletons into JSON.
6. Keeps the complete prompt below roughly 3,500 characters.

The patch generator uses full file content for one or two target files, so skeletonization primarily benefits plan creation rather than the final patch synthesis.

## 6. Strengths

- Real Python AST parsing preserves signatures and type annotations.
- Docstrings survive and give the model design context.
- Nested methods and class attributes are preserved.
- Generic fallback provides basic coverage for most common languages.
- Small files are excluded from transformation.

## 7. Limitations

- Python syntax containing unsupported/new syntax can cause parsing to fall back.
- TypeScript and JavaScript are not parsed with their respective AST parsers.
- Generic extraction is formatting-sensitive and does not understand scopes.
- It cannot prove semantic relevance, dependencies, or call graphs.
- File scoring remains independent of the skeletonizer.
- Generated/dependency code must be removed upstream to avoid ranking noise.

## 8. AST-Based vs. AST-Like Terminology

Repository code should distinguish between:

- **AST-backed skeletonization** - Python only.
- **AST-like or structural skeletonization** - regex fallback for other languages.
- **Repository scanning** - filesystem inventory, not AST parsing.
- **Relevant-file selection** - keyword scoring, not AST symbol resolution.
