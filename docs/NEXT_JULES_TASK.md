# NEXT JULES TASK

**NEXT TASK:**
Refactor the Python generation architecture (Phase 0) to support a modular multi-file structure.

**Rationale:**
The project is currently housed entirely within `generate_html.py`, producing a monolithic output. To support tens of thousands of lines of code as required by the Master Autonomous Development Protocol, the generation script must pull from a structured directory (e.g., `src/physics`, `src/ui`, `src/math`) rather than using massive string literals in a single python file.

**Required Steps:**
1. Create a `src/` directory structure separating `physics`, `ui`, `core`, `render`, etc.
2. Extract the JavaScript logic from `generate_html.py` into individual `.js` source files within `src/`.
3. Extract the CSS into `src/css/style.css`.
4. Rewrite `generate_html.py` (or create a new build script, e.g., `build.py`) to read all files from the `src/` directory and compile them into the final `universe_creator.html`.

**Completion Criteria:**
- `generate_html.py` no longer contains hardcoded JavaScript logic.
- A new build system aggregates files from `src/`.
- The output `universe_creator.html` remains functionally identical to the current working version, passing all existing tests.
