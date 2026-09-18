# Scientific Library / Reference Stack

## Vendored runtime library

### Astronomy Engine
- Repository: https://github.com/cosinekitty/astronomy
- License: MIT
- Role in Universe Creator: validated Solar-System ephemerides and J2000 barycentric initial conditions.
- Stated accuracy: approximately 1 arcminute against NOVAS/JPL Horizons for its supported ephemeris scope.
- The project vendors the browser build under `vendor/astronomy-engine.min.js` and keeps the original MIT attribution in `vendor/ASTRONOMY_ENGINE_LICENSE.txt`.

## External scientific references used for architecture/verification

### REBOUND
- Repository: https://github.com/hannorein/rebound
- Role: reference architecture for high-accuracy N-body integration, adaptive timestepping, symplectic methods, collision handling and long-term orbital verification.
- Important: REBOUND is GPL-3.0. Its implementation is not copied into the browser artifact. Algorithmic design is treated as an external scientific reference.

### AMUSE
- Repository: https://github.com/amusecode/amuse
- Role: reference architecture for coupling independent astrophysical solvers (gravity, hydrodynamics, stellar evolution and related codes).
- License: Apache-2.0.

### EinsteinPy
- Repository: https://github.com/einsteinpy/einsteinpy
- Role: reference for symbolic/numerical general-relativity metrics, tensors and geodesic calculations.
- License: MIT.

## Engineering rule

A library is not treated as a black-box "accuracy badge". Every imported/reference component must have:
1. explicit units and reference frame,
2. documented validity domain,
3. independent regression tests,
4. conservation/error diagnostics where applicable,
5. a clear distinction between exact equations, reduced-order models, and visualization-only approximations.

The standalone CodePen build remains dependency-free at runtime because all required browser code is bundled into one HTML artifact.
