const RelativityEngine = {
        computeSchwarzschildPrecession: function(objects) {
            let accels = new Array(objects.length).fill(null).map(() => new Vec3());
            // Assume obj 0 is the dominant mass (black hole)
            if(objects.length < 2 || objects[0].type !== "BLACK_HOLE") return accels;
            let M = objects[0].mass;
            let posM = objects[0].pos;
            for(let i=1; i<objects.length; i++) {
                let rVec = objects[i].pos.sub(posM);
                let r = rVec.mag();
                let vVec = objects[i].vel;
                let vSq = vVec.magSq();

                // PN correction
                let rDotV = rVec.dot(vVec);
                let term1 = (4 * PhysicsConstants.G * M) / (PhysicsConstants.c * PhysicsConstants.c * r) - (vSq / (PhysicsConstants.c * PhysicsConstants.c));
                let term2 = 4 * rDotV / (PhysicsConstants.c * PhysicsConstants.c);

                let a_gr = rVec.mult(term1).add(vVec.mult(term2)).mult(PhysicsConstants.G * M / Math.pow(r, 3));
                accels[i] = accels[i].add(a_gr);
            }
            return accels;
        }
    }