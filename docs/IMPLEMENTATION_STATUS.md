# IMPLEMENTATION STATUS

## Current phase: Scientific hardening

This repository is **not labelled NASA/ESA-grade**. A subsystem is only promoted to VERIFIED after an executable regression test passes.

| Subsystem | Current status | Evidence / remaining work |
|---|---|---|
| Core state/build | IMPLEMENTED | Modular source tree and deterministic build path |
| Newtonian N-body | IMPLEMENTED | Direct summation + Barnes-Hut; long-duration convergence tests added |
| Integrators | IMPLEMENTED | RK4 + Velocity Verlet; timestep-convergence test added |
| Collision/merger | IMPLEMENTED | Linear momentum and rigid-body angular-momentum transfer added |
| SPH | HARDENED | Kernel density, symmetric pressure force, Monaghan-style artificial viscosity and internal-energy update |
| EOS/opacity | NEW | Ideal-gas + radiation pressure, mean molecular weight, Kramers/electron-scattering opacity |
| Nuclear network | REDUCED-ORDER | PP/CNO/triple-alpha analytic rate approximations; not a laboratory/tabulated reaction network |
| Stellar structure | REDUCED-ORDER | 1D hydrostatic/radiative structure integration; not time-dependent stellar evolution |
| Radiation transport | REDUCED-ORDER | Grey diffusion and optical-depth primitives; no frequency-dependent transport yet |
| MHD | REDUCED-ORDER | 1D ideal-MHD conservative state + Rusanov flux; constrained longitudinal field |
| GR | REDUCED-ORDER | Schwarzschild geodesic primitives exist separately; full 4D numerical spacetime solver is not complete |
| Quantum | HARDENED | 1D Schrödinger Crank-Nicolson evolution with Dirichlet boundaries and normalization |
| Cosmology | IMPLEMENTED | Friedmann integration |
| Verification | HARDENED | Deterministic scientific regression suite; CI workflow added |
| UI/mobile | HARDENED | Removed invalid global camera dependency and retained pointer-event interaction model |

### Scientific honesty gate

The UI must never display “NASA-grade”, “10/10”, or “all physics verified” merely because the application loads or a subset of tests passes.

The remaining acceptance gate is:

1. analytical-solution agreement;
2. conservation-law checks;
3. timestep/grid convergence;
4. deterministic regression;
5. cross-module coupling tests;
6. documented numerical limitations;
7. repeatable CI/build success.

Until those gates are satisfied, the project is a research-oriented computational sandbox rather than research-grade validated software.
