const QuantumEngine = {
        solve1DSchrodinger: function(V_array, dx, dt, steps) {
            let N = V_array.length;
            let psi_re = new Float32Array(N); let psi_im = new Float32Array(N);
            let x0 = N/4, sigma = N/20, norm = 0;
            for(let i=0; i<N; i++) { psi_re[i] = Math.exp(-Math.pow(i-x0,2)/(2*sigma*sigma)); norm += psi_re[i]*psi_re[i]; }
            norm = Math.sqrt(norm); for(let i=0; i<N; i++) psi_re[i] /= norm;

            for(let step=0; step<steps; step++) {
                let next_re = new Float32Array(N); let next_im = new Float32Array(N);
                for(let i=1; i<N-1; i++) {
                    let d2_re = (psi_re[i+1] - 2*psi_re[i] + psi_re[i-1])/(dx*dx);
                    let d2_im = (psi_im[i+1] - 2*psi_im[i] + psi_im[i-1])/(dx*dx);
                    next_re[i] = psi_re[i] + dt * ( 0.5*d2_im - V_array[i]*psi_im[i] );
                    next_im[i] = psi_im[i] + dt * (-0.5*d2_re + V_array[i]*psi_re[i] );
                }
                psi_re = next_re; psi_im = next_im;
            }
            return {re: psi_re, im: psi_im};
        }
    }