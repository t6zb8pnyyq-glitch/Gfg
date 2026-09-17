# ACCEPTANCE CRITERIA

A feature is considered COMPLETE only when it meets the following criteria:

1.  **Mathematical Foundation:** The implementation is based on explicitly documented physical equations (or documented reduced-order models), not visual heuristics.
2.  **Integration:** The subsystem correctly interfaces with the core state architecture (e.g., updates `body.velocity`, modifies total energy).
3.  **UI Connected:** The physical properties are exposed and controllable via the application interface (without dead buttons).
4.  **Diagnostics:** The subsystem outputs relevant diagnostic data to the right-hand Inspector panel.
5.  **Automated Testing:** Tests exist that mathematically verify the subsystem's correctness.
6.  **Scientific Verification:** Output is compared against known analytical results or conservation laws.
7.  **Documentation:** The equations, limitations, and assumptions are updated in `SCIENTIFIC_MODELS.md` and `VERIFICATION_MATRIX.md`.
