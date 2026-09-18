const FluidEngine = {
        h: 1e6, // Smoothing length (m)
        gamma: 5/3, // Adiabatic index for monatomic ideal gas
        mu: 0.01, // Artificial dynamic viscosity
        computeSPH: function(objects) {
            let gasObjs = objects.filter(o => o.type === "GAS_CLOUD");
            if(gasObjs.length === 0) return;

            // 1. Compute Density
            for(let i=0; i<gasObjs.length; i++) {
                let density = 0;
                for(let j=0; j<gasObjs.length; j++) {
                    let r = gasObjs[i].pos.sub(gasObjs[j].pos).mag();
                    if(r < this.h) {
                        // Poly6 kernel approx
                        density += gasObjs[j].mass * Math.pow(this.h*this.h - r*r, 3);
                    }
                }
                gasObjs[i].sph_density = density * (315 / (64 * Math.PI * Math.pow(this.h, 9)));
                // Equation of State (Ideal Gas P = (gamma - 1) * rho * u)
                // where u is specific internal energy (internalEnergy / mass)
                let specificEnergy = gasObjs[i].internalEnergy / gasObjs[i].mass;
                // Add a small floor to pressure to prevent collapse if internal energy is 0
                if(specificEnergy <= 0) specificEnergy = 1.0;
                gasObjs[i].sph_pressure = (this.gamma - 1) * gasObjs[i].sph_density * specificEnergy;
            }

            // 2. Compute Pressure & Viscosity Forces
            for(let i=0; i<gasObjs.length; i++) {
                let pForce = new Vec3();
                for(let j=0; j<gasObjs.length; j++) {
                    if(i===j) continue;
                    let rVec = gasObjs[i].pos.sub(gasObjs[j].pos);
                    let r = rVec.mag();
                    if(r > 0 && r < this.h) {
                        let pTerm = (gasObjs[i].sph_pressure + gasObjs[j].sph_pressure) / (2 * gasObjs[j].sph_density);
                        let gradKernel = rVec.normalize().mult(-45 / (Math.PI * Math.pow(this.h, 6)) * Math.pow(this.h - r, 2));
                        pForce = pForce.add(gradKernel.mult(-gasObjs[j].mass * pTerm));
                    }
                }
                // Simple Viscosity term (mu * del^2 v)
                let vForce = new Vec3();
                for(let j=0; j<gasObjs.length; j++) {
                    if(i===j) continue;
                    let rVec = gasObjs[i].pos.sub(gasObjs[j].pos);
                    let r = rVec.mag();
                    if(r > 0 && r < this.h) {
                        let velDiff = gasObjs[j].vel.sub(gasObjs[i].vel);
                        let laplacianKernel = (45 / (Math.PI * Math.pow(this.h, 6))) * (this.h - r);
                        vForce = vForce.add(velDiff.mult(this.mu * gasObjs[j].mass * laplacianKernel / gasObjs[j].sph_density));
                    }
                }
                gasObjs[i].acc = gasObjs[i].acc.add(pForce.add(vForce).div(gasObjs[i].sph_density));
            }
        }
    }