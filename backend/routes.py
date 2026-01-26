import re
from pathlib import Path

BACKEND_ROOT = Path(__file__).parent
SRC_DIR = BACKEND_ROOT / "src"
INDEX_FILE = SRC_DIR / "index.js"
OUTPUT_FILE = BACKEND_ROOT / "routes.txt"

# ================= REGEX =================

IMPORT_RE = re.compile(
    r"""import\s+(?P<name>\w+)\s+from\s+['"](?P<path>[^'"]+)['"]"""
)

APP_USE_RE = re.compile(
    r"""app\.use\(\s*['"](?P<prefix>[^'"]+)['"]\s*,\s*(?P<router>\w+)\s*\)"""
)

ROUTE_RE = re.compile(
    r"""router\.(?P<method>get|post|put|patch|delete|options)\s*
        \(\s*
        ['"](?P<path>[^'"]*)['"]\s*
        ,\s*(?P<handlers>.+?)\)
    """,
    re.VERBOSE | re.DOTALL,
)

# function declarations
FUNCTION_DEF_RE = re.compile(r"""function\s+(?P<name>\w+)\s*\(""")
ARROW_FUNC_RE = re.compile(r"""const\s+(?P<name>\w+)\s*=\s*\(.*?\)\s*=>""")

ASYNC_HANDLER_RE = re.compile(r"async\s*\(\s*req\s*,\s*res\s*\)")
NORMAL_HANDLER_RE = re.compile(r"\(\s*req\s*,\s*res\s*\)")


# ================= HELPERS =================

def read(p: Path) -> str:
    return p.read_text(encoding="utf-8", errors="ignore")


def resolve_route_file(import_path: str) -> Path:
    p = (SRC_DIR / import_path).resolve()
    if p.suffix == "":
        p = p.with_suffix(".js")
    return p


def split_handlers(blob: str):
    blob = blob.replace("\n", " ")
    return [p.strip() for p in blob.split(",") if p.strip()]


def format_handler(h: str) -> str:
    if ASYNC_HANDLER_RE.search(h):
        return "async (req, res)"
    if NORMAL_HANDLER_RE.search(h):
        return "(req, res)"
    return h


def find_all_functions(code: str):
    funcs = set()
    for m in FUNCTION_DEF_RE.finditer(code):
        funcs.add(m.group("name"))
    for m in ARROW_FUNC_RE.finditer(code):
        funcs.add(m.group("name"))
    return sorted(funcs)


# ================= MAIN =================

def main():
    index_code = read(INDEX_FILE)

    imports = {
        m.group("name"): m.group("path")
        for m in IMPORT_RE.finditer(index_code)
    }

    app_routes = [
        (m.group("prefix"), m.group("router"))
        for m in APP_USE_RE.finditer(index_code)
    ]

    out = []
    out.append("=== EXPRESS ROUTES MAP ===\n")

    for prefix, router_name in app_routes:
        if router_name not in imports:
            continue

        route_file = resolve_route_file(imports[router_name])
        if not route_file.exists():
            continue

        code = read(route_file)

        out.append("-" * 60)
        out.append(f"FILE: {route_file.relative_to(BACKEND_ROOT)}")
        out.append("-" * 60)

        # -------- ROUTES --------
        for m in ROUTE_RE.finditer(code):
            method = m.group("method").upper()
            path = m.group("path")

            full_path = (
                f"{prefix}{path}"
                if path.startswith("/")
                else f"{prefix}/{path}"
            )

            handlers = split_handlers(m.group("handlers"))
            middlewares = handlers[:-1]
            handler = format_handler(handlers[-1])

            line = f"[{method}] {full_path}"

            if middlewares:
                line += ", " + ", ".join(middlewares)

            line += f", {handler}"

            out.append(line)

        # -------- FUNCTIONS --------
        functions = find_all_functions(code)
        if functions:
            out.append("\nFUNCTIONS:")
            for fn in functions:
                out.append(f"- {fn}")

        out.append('')  # separator between files

    OUTPUT_FILE.write_text("\n".join(out), encoding="utf-8")
    print(f"routes.txt generated → {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
