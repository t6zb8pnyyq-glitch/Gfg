const Integrators = {
        eulerSemiImplicit: function(objects, dt, accels) {
            for(let i=0; i<objects.length; i++) {
                objects[i].vel = objects[i].vel.add(accels[i].mult(dt));
                objects[i].pos = objects[i].pos.add(objects[i].vel.mult(dt));
                objects[i].acc = accels[i];
            }
        },
        verlet: function(objects, dt, getAccelsFn) {
            // Velocity Verlet: r(t+dt) = r(t) + v(t)dt + 0.5*a(t)dt^2
            // v(t+dt) = v(t) + 0.5*(a(t) + a(t+dt))dt
            for(let i=0; i<objects.length; i++) {
                objects[i].pos = objects[i].pos.add(objects[i].vel.mult(dt)).add(objects[i].acc.mult(0.5 * dt * dt));
            }
            let newAccels = getAccelsFn(objects);
            for(let i=0; i<objects.length; i++) {
                objects[i].vel = objects[i].vel.add((objects[i].acc.add(newAccels[i])).mult(0.5 * dt));
                objects[i].acc = newAccels[i];
            }
        },
        rk4: function(objects, dt, getAccelsFn) {
            let clones = objects.map(o => o.clone());
            let k1_v = getAccelsFn(clones); let k1_x = clones.map(o => o.vel.clone());
            for(let i=0; i<clones.length; i++) { clones[i].pos = objects[i].pos.add(k1_x[i].mult(0.5*dt)); clones[i].vel = objects[i].vel.add(k1_v[i].mult(0.5*dt)); }

            let k2_v = getAccelsFn(clones); let k2_x = clones.map(o => o.vel.clone());
            for(let i=0; i<clones.length; i++) { clones[i].pos = objects[i].pos.add(k2_x[i].mult(0.5*dt)); clones[i].vel = objects[i].vel.add(k2_v[i].mult(0.5*dt)); }

            let k3_v = getAccelsFn(clones); let k3_x = clones.map(o => o.vel.clone());
            for(let i=0; i<clones.length; i++) { clones[i].pos = objects[i].pos.add(k3_x[i].mult(dt)); clones[i].vel = objects[i].vel.add(k3_v[i].mult(dt)); }

            let k4_v = getAccelsFn(clones); let k4_x = clones.map(o => o.vel.clone());
            for(let i=0; i<objects.length; i++) {
                objects[i].pos = objects[i].pos.add( (k1_x[i].add(k2_x[i].mult(2)).add(k3_x[i].mult(2)).add(k4_x[i])).mult(dt/6) );
                objects[i].vel = objects[i].vel.add( (k1_v[i].add(k2_v[i].mult(2)).add(k3_v[i].mult(2)).add(k4_v[i])).mult(dt/6) );
                objects[i].acc = k1_v[i];
            }
        }
    }