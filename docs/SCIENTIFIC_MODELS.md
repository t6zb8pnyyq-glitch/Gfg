# SCIENTIFIC MODELS

## Newtonian N-body
Point-mass gravity:
F_ij = -G m_i m_j (r_i-r_j) / |r_i-r_j|^3.
Direct summation is the reference calculation. Barnes-Hut uses a monopole tree approximation and must be checked against direct summation.

## Time integration
Velocity Verlet is used for conservative second-order orbital integration. RK4 is available for general ODE evolution. Scientific tests compare timestep refinements rather than assuming a method is accurate.

## SPH
Density uses the 3D Poly6 kernel. Pressure acceleration uses the symmetric SPH pressure form. Artificial viscosity is activated for approaching particles and internal-energy evolution includes pressure work and viscous heating.

## EOS and opacity
The current EOS combines fully ionized ideal-gas pressure with radiation pressure. Opacity contains electron-scattering and Kramers-style analytic terms. These are reduced-order stellar models, not OPAL/OP tables.

## Nuclear network
PP-chain, CNO and triple-alpha energy-generation rates are represented by analytic approximations. The implementation is intentionally marked reduced-order until isotope-resolved reaction networks, screening, detailed balance and published-rate regression data are added.

## Stellar structure
The 1D structure solver integrates hydrostatic equilibrium, mass continuity, luminosity generation and radiative temperature-gradient equations with an EOS closure. It is a static structure solver, not a complete stellar-evolution code.

## Radiation transport
Grey diffusion uses optical depth tau = kappa rho ds and the diffusion approximation F = -c/(3 kappa rho) grad(E_r). Frequency-dependent transfer, scattering redistribution and full radiative equilibrium are not yet implemented.

## Ideal MHD
The 1D solver evolves conservative ideal-MHD variables with a Rusanov approximate Riemann flux. The longitudinal magnetic field is held constant, which enforces the 1D divergence constraint. Multi-dimensional constrained transport is not yet implemented.

## General relativity
Schwarzschild geodesic primitives use the Schwarzschild metric and proper-time geodesic equations. This is a reduced-order GR module; it is not a full numerical-relativity spacetime evolution code and does not claim Kerr or dynamical spacetime support.

## Quantum mechanics
The 1D time-dependent Schrödinger equation is discretized with a second-order finite-difference Hamiltonian and Crank-Nicolson time stepping. Dirichlet boundaries are explicit and the wavefunction is renormalized after each step. Norm conservation is regression-tested.

## Verification
Every module must acquire deterministic tests against an analytical solution, conservation law, manufactured solution, or published benchmark before being promoted to VERIFIED.
