from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
sigla_uno = chr(97) + chr(105)
sigla_dos = chr(105) + chr(97)
blocked = [
    ("proveedor", re.compile("fig" + "ma", re.IGNORECASE)),
    ("generador", re.compile("chat" + "gpt", re.IGNORECASE)),
    ("proveedor", re.compile("open" + sigla_uno, re.IGNORECASE)),
    ("proveedor", re.compile("cl" + "aude", re.IGNORECASE)),
    ("proveedor", re.compile("anth" + "ropic", re.IGNORECASE)),
    ("proveedor", re.compile("gem" + "ini", re.IGNORECASE)),
    ("modelo", re.compile(r"\b" + "ll" + "m" + r"\b", re.IGNORECASE)),
    ("frase", re.compile("generado por " + sigla_dos, re.IGNORECASE)),
    ("rol", re.compile("asis" + "tente", re.IGNORECASE)),
    ("frase", re.compile("inteligencia " + "artificial", re.IGNORECASE)),
    ("sigla", re.compile(r"\b" + sigla_uno + r"\b", re.IGNORECASE)),
    ("sigla", re.compile(r"\b" + sigla_dos + r"\b", re.IGNORECASE)),
]
old_prices = [
    re.compile(r"\$" + "5" + r"\.29(?:\s*MXN)?", re.IGNORECASE),
    re.compile(r"\$" + "5" + r"\.05(?:\s*MXN)?", re.IGNORECASE),
    re.compile(r"~\s*\$?" + "6" + r"(?:\.00)?\s*MXN", re.IGNORECASE),
    re.compile(r"\$" + "9" + r"\.40(?:\s*MXN)?", re.IGNORECASE),
    re.compile(r"\$" + "0" + r"\.60(?:\s*MXN)?", re.IGNORECASE),
    re.compile(r"\$" + "20" + r"(?:\.00)?(?:\s*MXN)?", re.IGNORECASE),
    re.compile(r"\$" + "14" + r"\.55(?:\s*MXN)?", re.IGNORECASE),
]
forbidden_financial_terms = re.compile(r"\b" + "comisi" + r"[óo]n(?:es)?(?:\b|_)|" + r"3\.5%|" + r"\b" + "I" + "VA" + r"\b", re.IGNORECASE)

ignored_dirs = {".git", "node_modules", "dist", ".wrangler"}
issues = []

for path in ROOT.rglob("*"):
    if any(part in ignored_dirs for part in path.parts):
        continue
    rel = path.relative_to(ROOT).as_posix()
    if any(pattern.search(path.name) for _, pattern in blocked):
        issues.append(f"{rel}: nombre de archivo no permitido")
    if path.is_dir():
        if any(pattern.search(rel) for _, pattern in blocked):
            issues.append(f"{rel}: nombre de directorio no permitido")
        continue
    try:
        content = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        continue
    for line_no, line in enumerate(content.splitlines(), 1):
        for label, pattern in blocked:
            if pattern.search(line):
                issues.append(f"{rel}:{line_no}: referencia bloqueada ({label})")
        for pattern in old_prices:
            if pattern.search(line):
                issues.append(f"{rel}:{line_no}: precio anterior detectado")
        if rel != "scripts/audit-repository.py" and forbidden_financial_terms.search(line):
            issues.append(f"{rel}:{line_no}: término financiero no permitido")

if issues:
    print("\n".join(issues))
    sys.exit(1)

print("Auditoría correcta: sin referencias bloqueadas ni precios anteriores.")
