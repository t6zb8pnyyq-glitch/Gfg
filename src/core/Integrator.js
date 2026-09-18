const Integrators = {
    eulerSemiImplicit: function(objects, dt, accels) {
        for(let i=0; i<objects.length; i++) {
            objects[i].vel = objects[i].vel.add(accels[i].mult(dt));
            objects[i].pos = objects[i].pos.add(objects[i].vel.mult(dt));
            objects[i].acc = accels[i];
        }
    },

    verlet: function(objects, dt, getAccelsFn) {
        if(!(dt>0)||!Number.isFinite(dt)) throw new Error("Invalid Velocity-Verlet timestep");
        const currentAccels=getAccelsFn(objects);
        if(currentAccels.length!==objects.length) throw new Error("Acceleration/state size mismatch");
        for(let i=0;i<objects.length;i++){
            objects[i].acc=currentAccels[i];
            objects[i].pos=objects[i].pos.add(objects[i].vel.mult(dt)).add(currentAccels[i].mult(0.5*dt*dt));
        }
        const newAccels=getAccelsFn(objects);
        for(let i=0;i<objects.length;i++){
            objects[i].vel=objects[i].vel.add(currentAccels[i].add(newAccels[i]).mult(0.5*dt));
            objects[i].acc=newAccels[i];
        }
    },

    leapfrogKDK: function(objects, dt, getAccelsFn) {
        if(!(dt!==0)||!Number.isFinite(dt)) throw new Error("Invalid leapfrog timestep");
        const a0=getAccelsFn(objects);
        for(let i=0;i<objects.length;i++) objects[i].vel=objects[i].vel.add(a0[i].mult(0.5*dt));
        for(let i=0;i<objects.length;i++) objects[i].pos=objects[i].pos.add(objects[i].vel.mult(dt));
        const a1=getAccelsFn(objects);
        for(let i=0;i<objects.length;i++){ objects[i].vel=objects[i].vel.add(a1[i].mult(0.5*dt)); objects[i].acc=a1[i]; }
    },

    yoshida4: function(objects, dt, getAccelsFn) {
        if(!(dt>0)||!Number.isFinite(dt)) throw new Error("Invalid Yoshida timestep");
        // Forest-Ruth/Yoshida fourth-order symmetric composition:
        // S4(h)=S2(w1 h) S2(w0 h) S2(w1 h),
        // w1=1/(2-2^(1/3)), w0=-2^(1/3)/(2-2^(1/3)).
        // It is symplectic for separable autonomous Hamiltonians.
        const q=Math.cbrt(2), w1=1/(2-q), w0=-q/(2-q);
        const sub=(h)=>this.leapfrogKDK(objects,h,getAccelsFn);
        sub(w1*dt); sub(w0*dt); sub(w1*dt);
    },

    rk4Step: function(objects, dt, getAccelsFn) {
        const base=objects.map(o=>o.clone());
        const k1_v=getAccelsFn(base), k1_x=base.map(o=>o.vel.clone());

        const s2=base.map((o,i)=>{const q=o.clone();q.pos=base[i].pos.add(k1_x[i].mult(.5*dt));q.vel=base[i].vel.add(k1_v[i].mult(.5*dt));return q;});
        const k2_v=getAccelsFn(s2), k2_x=s2.map(o=>o.vel.clone());

        const s3=base.map((o,i)=>{const q=o.clone();q.pos=base[i].pos.add(k2_x[i].mult(.5*dt));q.vel=base[i].vel.add(k2_v[i].mult(.5*dt));return q;});
        const k3_v=getAccelsFn(s3), k3_x=s3.map(o=>o.vel.clone());

        const s4=base.map((o,i)=>{const q=o.clone();q.pos=base[i].pos.add(k3_x[i].mult(dt));q.vel=base[i].vel.add(k3_v[i].mult(dt));return q;});
        const k4_v=getAccelsFn(s4), k4_x=s4.map(o=>o.vel.clone());

        for(let i=0;i<objects.length;i++){
            objects[i].pos=base[i].pos.add(
                k1_x[i].add(k2_x[i].mult(2)).add(k3_x[i].mult(2)).add(k4_x[i]).mult(dt/6)
            );
            objects[i].vel=base[i].vel.add(
                k1_v[i].add(k2_v[i].mult(2)).add(k3_v[i].mult(2)).add(k4_v[i]).mult(dt/6)
            );
            objects[i].acc=k4_v[i];
        }
    },

    rk4: function(objects, dt, getAccelsFn) {
        this.rk4Step(objects,dt,getAccelsFn);
    },

    rk4Adaptive: function(objects, dt, getAccelsFn, tolerance=1e-8, minDt=1e-6, maxAttempts=8) {
        if(!(dt>0)||!Number.isFinite(dt)) throw new Error("Invalid adaptive RK4 timestep");
        const original=objects.map(o=>o.clone());
        let trialDt=dt, lastError=Infinity;

        for(let attempt=0;attempt<maxAttempts;attempt++){
            // One full fourth-order step.
            const full=original.map(o=>o.clone());
            this.rk4Step(full,trialDt,getAccelsFn);

            // Richardson step-doubling: two half steps provide a fourth-order
            // local error estimate without assuming a problem-specific scale.
            const half=original.map(o=>o.clone());
            this.rk4Step(half,trialDt*.5,getAccelsFn);
            this.rk4Step(half,trialDt*.5,getAccelsFn);

            let err=0;
            for(let i=0;i<original.length;i++){
                const pScale=Math.max(original[i].pos.mag(),full[i].pos.mag(),half[i].pos.mag(),1);
                const vScale=Math.max(original[i].vel.mag(),full[i].vel.mag(),half[i].vel.mag(),1);
                const ep=full[i].pos.sub(half[i].pos).mag()/(pScale*15);
                const ev=full[i].vel.sub(half[i].vel).mag()/(vScale*15);
                err=Math.max(err,ep,ev);
            }
            lastError=err;

            if(err<=tolerance || trialDt<=minDt*1.0000001){
                for(let i=0;i<objects.length;i++){
                    objects[i].pos=half[i].pos;
                    objects[i].vel=half[i].vel;
                    objects[i].acc=half[i].acc;
                }
                const factor=err>0 ? .9*Math.pow(tolerance/err,.2) : 2;
                const nextDt=Math.max(minDt,Math.min(dt*4,trialDt*Math.max(.2,Math.min(2.5,factor))));
                return {acceptedDt:trialDt,nextDt,error:err,attempts:attempt+1};
            }

            const factor=.9*Math.pow(tolerance/Math.max(err,1e-300),.2);
            trialDt=Math.max(minDt,trialDt*Math.max(.1,Math.min(.5,factor)));
        }

        throw new Error("Adaptive RK4 failed to converge: error="+lastError);
    }
};