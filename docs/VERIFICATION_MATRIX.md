# SCIENTIFIC VERIFICATION MATRIX

| Test | Subsystem | Method | Gate |
|---|---|---|---|
| Kepler 10 periods | N-body/integration | analytic two-body orbit | radius error < 2e-3 |
| Timestep convergence | integration | dt vs dt/2 refinement | refinement does not materially worsen error |
| Linear momentum | N-body | closed-system invariant | relative error < 1e-12 |
| Mechanical energy | N-body | closed-system invariant | relative error < 1e-5 |
| Merger linear/angular momentum | collision | exact conservation accounting | linear < 1e-14, angular < 1e-12 |
| Barnes-Hut convergence | gravity | direct-sum reference | max relative acceleration error < 3% |
| Quantum norm | quantum | integral of |psi|^2 | error < 1e-10 |
| SPH symmetry | fluid | equal-particle manufactured symmetry | relative density error < 1e-14 |

## Required next validation gates

- Restricted three-body / Jacobi integral.
- Close-encounter timestep convergence.
- SPH Sod shock tube.
- Sedov blast.
- Kelvin-Helmholtz instability.
- Hydrostatic stellar models against Lane-Emden polytropes.
- PP/CNO reaction-rate regression against tabulated reference data.
- Radiative diffusion manufactured solution and optical-depth limits.
- 1D MHD shock-tube tests.
- Schwarzschild circular-orbit precession and redshift.
- Quantum infinite-well eigenvalues and tunnelling convergence.
- Friedmann limiting cases (matter, radiation, Lambda dominated).
- Full regression suite across all coupled modules.

A passing test means only that the named test passed. It does not certify the entire application.
