const Diagnostics = {
        initEnergy: 0,
        getKineticEnergy: function(objects) { return objects.reduce((sum, o) => sum + 0.5 * o.mass * o.vel.magSq(), 0); },
        getPotentialEnergy: function(objects) {
            let u = 0;
            for(let i=0; i<objects.length; i++) {
                for(let j=i+1; j<objects.length; j++) {
                    let r = objects[i].pos.sub(objects[j].pos).mag();
                    if(r > 0) u -= PhysicsConstants.G * objects[i].mass * objects[j].mass / r;
                }
            }
            return u;
        },
        getTotalMomentum: function(objects) { return objects.reduce((sum, o) => sum.add(o.vel.mult(o.mass)), new Vec3()); },
        update: function(objects) {
            let totalE = this.getKineticEnergy(objects) + this.getPotentialEnergy(objects);
            let mom = this.getTotalMomentum(objects);
            if(this.initEnergy === 0 && objects.length > 0) this.initEnergy = totalE;
            let eErr = this.initEnergy !== 0 ? Math.abs((totalE - this.initEnergy)/this.initEnergy) * 100 : 0;

            document.getElementById('diag-energy').innerText = totalE.toExponential(3) + " J";
            document.getElementById('diag-e-err').innerText = eErr.toFixed(6) + " %";
            document.getElementById('diag-mom').innerText = mom.mag().toExponential(3);

            let statusEl = document.getElementById('diag-status');
            if(isNaN(totalE) || eErr > 100) { statusEl.innerText = "FAIL (발산)"; statusEl.className = "val fail"; Engine.status = "FAILED"; }
            else if(eErr > 1) { statusEl.innerText = "WARNING (경고)"; statusEl.className = "val warn"; }
            else { statusEl.innerText = "STABLE (안정)"; statusEl.className = "val pass"; }
        }
    }