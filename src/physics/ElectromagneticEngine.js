const ElectromagneticEngine = {
        computeAccelerations: function(objects) {
            let accels = new Array(objects.length).fill(null).map(() => new Vec3());
            let k = 1 / (4 * Math.PI * PhysicsConstants.eps_0);
            for(let i=0; i<objects.length; i++) {
                if(objects[i].charge === 0) continue;
                for(let j=i+1; j<objects.length; j++) {
                    if(objects[j].charge === 0) continue;
                    let rVec = objects[i].pos.sub(objects[j].pos);
                    let rSq = rVec.magSq();
                    if(rSq === 0) continue;
                    let fMag = k * (objects[i].charge * objects[j].charge) / rSq;
                    let force = rVec.mult(fMag / Math.sqrt(rSq));
                    accels[i] = accels[i].add(force.div(objects[i].mass));
                    accels[j] = accels[j].sub(force.div(objects[j].mass));
                }
            }
            return accels;
        }
    }