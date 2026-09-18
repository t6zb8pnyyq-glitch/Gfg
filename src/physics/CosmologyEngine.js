const CosmologyEngine = {
        // H0 passed in here should be in strict SI units (s^-1)
        solveFriedmann: function(H0_si, Omega_m, Omega_r, Omega_lambda, t_end, dt, a_initial) {
            let a = a_initial; // Must not assume a=1 for early universe integration
            let t = 0.0;
            let history = [];

            // Integrate forward in time
            while(t < t_end) {
                history.push({t: t, a: a});
                let H_sq = H0_si*H0_si * ( Omega_m*Math.pow(a,-3) + Omega_r*Math.pow(a,-4) + Omega_lambda );

                // If H_sq becomes negative, the universe has collapsed or entered an invalid domain.
                // Do NOT hide it with Math.max(0). Report failure.
                if (H_sq < 0) {
                    console.error("Cosmology Engine Failure: H_sq became negative (Big Crunch or Invalid State).");
                    break;
                }

                let H = Math.sqrt(H_sq);
                a += a * H * dt;
                t += dt;
            }
            return history;
        }
    }