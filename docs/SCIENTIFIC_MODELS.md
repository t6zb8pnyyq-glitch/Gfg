# SCIENTIFIC MODELS

This document explicitly defines the mathematical models, numerical methods, and approximations used in the Universe Creator.

## N-Body Gravity
*   **Model:** Newtonian Point-Mass Gravity
*   **Equation:** $\mathbf{F}_{ij} = -G \frac{m_i m_j}{|\mathbf{r}_i-\mathbf{r}_j|^3}(\mathbf{r}_i-\mathbf{r}_j)$
*   **Numerical Method:** Barnes-Hut Tree ($O(N \log N)$), Multipole approximation (monopole only currently).
*   **Status:** Partially Implemented

## Numerical Integration
*   **Model:** Explicit Runge-Kutta 4th Order (RK4) / Velocity Verlet
*   **Status:** Implemented

## Thermodynamics (Fluid)
*   **Model:** Smoothed Particle Hydrodynamics (SPH)
*   **Approximations:** Ideal gas equation of state.
*   **Status:** Partially Implemented

## Relativity (General)
*   **Model:** Post-Newtonian Schwarzschild Precession Proxy
*   **Limitations:** This is a reduced-order model. It applies a perturbing acceleration to Newtonian gravity. It is *not* a full tensor equation solver.
*   **Status:** Partially Implemented
