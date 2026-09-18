const QuantumEngine = {
        // Strict SI 1D Time-Dependent Schrodinger Equation
        // i * hbar * d(psi)/dt = [ - (hbar^2 / 2m) * d2(psi)/dx2 + V(x) ] * psi
        solve1DSchrodinger: function(V_array, dx, dt, steps, particleMass) {
            let N = V_array.length;
            let psi_re = new Float64Array(N); // Need higher precision for quantum SI scales
            let psi_im = new Float64Array(N);

            let x0 = N/4, sigma = N/20, norm = 0;

            // Initialize Gaussian wave packet
            for(let i=0; i<N; i++) {
                psi_re[i] = Math.exp(-Math.pow(i-x0,2)/(2*sigma*sigma));
                norm += psi_re[i]*psi_re[i];
            }
            norm = Math.sqrt(norm * dx); // Proper spatial integration normalization
            for(let i=0; i<N; i++) psi_re[i] /= norm;

            let hbar = PhysicsConstants.h_bar;
            let m = particleMass || 9.10938356e-31; // Default to electron mass

            // Explicit Euler method implementation for TISE
            // d(psi_re)/dt = (1/hbar) * [ (hbar^2/2m)*d2(psi_im)/dx2 - V(x)*psi_im ]
            // d(psi_im)/dt = (-1/hbar) * [ (hbar^2/2m)*d2(psi_re)/dx2 - V(x)*psi_re ]

            for(let step=0; step<steps; step++) {
                let next_re = new Float64Array(N);
                let next_im = new Float64Array(N);

                // Keep boundary conditions fixed at 0 (Infinite Square Well bounds)
                for(let i=1; i<N-1; i++) {
                    let d2_re = (psi_re[i+1] - 2*psi_re[i] + psi_re[i-1]) / (dx*dx);
                    let d2_im = (psi_im[i+1] - 2*psi_im[i] + psi_im[i-1]) / (dx*dx);

                    let kinetic_re = (hbar * hbar / (2 * m)) * d2_re;
                    let kinetic_im = (hbar * hbar / (2 * m)) * d2_im;

                    let deriv_re = (1 / hbar) * (kinetic_im - V_array[i] * psi_im[i]);
                    let deriv_im = (-1 / hbar) * (kinetic_re - V_array[i] * psi_re[i]);

                    next_re[i] = psi_re[i] + deriv_re * dt;
                    next_im[i] = psi_im[i] + deriv_im * dt;
                }
                psi_re = next_re;
                psi_im = next_im;
            }

            return {re: psi_re, im: psi_im};
        }
    }