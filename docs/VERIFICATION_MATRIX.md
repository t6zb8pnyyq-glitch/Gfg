# SCIENTIFIC VERIFICATION MATRIX

This document tracks the verification of implemented physical models against known analytical solutions or conservation laws.

| Test Case | Physics Subsystem | Validation Method | Current Status | Expected Tolerance |
| :--- | :--- | :--- | :--- | :--- |
| Keplerian Orbit | Orbital Mechanics | Compare numeric integration against analytical orbital elements | PENDING | < 1% error over 10 periods |
| Momentum Conservation | Core Mechanics | Calculate total momentum $\sum p_i$ | PENDING | < 1e-6 error |
| Energy Conservation | Core Mechanics | Calculate $T + V$ | PENDING | < 1e-4 error |
| Collision Outcome | Collision Mechanics| Verify $p_{final} = p_{initial}$ | PENDING | Exact |
| Fluid Hydrostatic Equilibrium | Thermodynamics | SPH gradient zero in stable star | PENDING | < 1% density variance |
