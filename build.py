"""Validate the standalone browser artifact without overwriting it.

The project intentionally ships a single-file browser application. The legacy module
tree remains available for scientific reference/tests, but build must never replace
the verified standalone artifact with an incompatible shell.
"""
from pathlib import Path

ARTIFACT = Path("universe_creator.html")

def validate_artifact():
    html = ARTIFACT.read_text(encoding="utf-8")
    if not html.strip():
        raise RuntimeError("universe_creator.html is empty")
    if html.count("<script>") != 1 or html.count("</script>") != 1:
        raise RuntimeError("Expected exactly one inline script")
    if "\\n" in html:
        raise RuntimeError("Literal backslash-n leaked into HTML")
    if "module.exports" in html or "exports." in html or "require(" in html:
        raise RuntimeError("CommonJS dependency leaked into browser artifact")
    required = [
        'id="canvas"', 'id="create"', 'id="clear"', 'id="newSystem"',
        'id="pause"', 'id="step"', 'id="dt"', 'id="resetView"',
        'id="creator"', 'id="inspector"', 'id="diag"'
    ]
    missing = [x for x in required if x not in html]
    if missing:
        raise RuntimeError("Missing required UI nodes: " + ", ".join(missing))
    print(f"Validated {ARTIFACT} ({len(html)} bytes)")

if __name__ == "__main__":
    validate_artifact()
