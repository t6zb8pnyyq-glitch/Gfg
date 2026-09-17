const CosmologyEngine = {
        solveFriedmann: function(H0, Omega_m, Omega_r, Omega_lambda, t_end, dt) {
            let a = 1.0; let t = 0.0; let history = [];
            while(t < t_end) {
                history.push({t: t, a: a});
                let H_sq = H0*H0 * ( Omega_m*Math.pow(a,-3) + Omega_r*Math.pow(a,-4) + Omega_lambda );
                let H = Math.sqrt(Math.max(0, H_sq));
                a += a * H * dt; t += dt;
            }
            return history;
        }
    }