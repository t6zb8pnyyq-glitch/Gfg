const Engine = {
    objects: [], time: 0, dt: 120, integratorType: "RK4", gravityAlgorithm: "BARNES_HUT",
    status: "STABLE", paused: false, frames: 0, lastFpsTime: 0, adaptiveDt: false, minDt: 1e-6, maxDt: 1e12, safety: 0.2,
    activeModels: ["Gravity", "Collision", "Thermodynamics"],
    setIntegrator: function(type) { this.integratorType = String(type).toUpperCase(); },
    getAccelerations: function(objs) {
        const accels = new Array(objs.length).fill(null).map(() => new Vec3());
        if(this.activeModels.includes("Gravity")) {
            const gravAcc = GravityEngine.computeAccelerations(objs, this.gravityAlgorithm === "BARNES_HUT");
            for(let i=0;i<objs.length;i++) accels[i]=accels[i].add(gravAcc[i]);
        }
        if(this.activeModels.includes("Relativity")) {
            const grAcc = RelativityEngine.computeSchwarzschildPrecession(objs);
            for(let i=0;i<objs.length;i++) accels[i]=accels[i].add(grAcc[i]);
        }
        if(this.activeModels.includes("Electromagnetic")) {
            const emAcc = ElectromagneticEngine.computeAccelerations(objs);
            for(let i=0;i<objs.length;i++) accels[i]=accels[i].add(emAcc[i]);
        }
        return accels;
    },
    step: function() {
        if(this.status==="FAILED"||this.paused) return;
        for(const o of this.objects) {
            const finite=[o.pos.x,o.pos.y,o.pos.z,o.vel.x,o.vel.y,o.vel.z].every(Number.isFinite);
            if(!finite){this.status="FAILED";throw new Error("Non-finite state detected");}
            if(o.vel.magSq()>=PhysicsConstants.c*PhysicsConstants.c){this.status="FAILED";throw new Error("Superluminal velocity detected");}
        }
        if(!(this.dt>0)||!Number.isFinite(this.dt)){this.status="FAILED";throw new Error("Invalid timestep");} if(this.dt<this.minDt||this.dt>this.maxDt){this.status="FAILED";throw new Error("Timestep outside configured safety bounds");}
        const t_integrator=String(this.integratorType).toLowerCase();
        if(t_integrator==="euler") Integrators.eulerSemiImplicit(this.objects,this.dt,this.getAccelerations(this.objects));
        else if(t_integrator==="verlet") Integrators.verlet(this.objects,this.dt,obs=>this.getAccelerations(obs));
        else if(t_integrator==="rk4") Integrators.rk4(this.objects,this.dt,obs=>this.getAccelerations(obs));
        else {this.status="FAILED";throw new Error("Unknown integrator: "+this.integratorType);}
        if(this.activeModels.includes("Fluid")) FluidEngine.computeSPH(this.objects);
        if(this.activeModels.includes("Nuclear")) NuclearEngine.computeFusion(this.dt,this.objects);
        if(this.activeModels.includes("Collision")) CollisionEngine.checkAndResolve(this.objects);
        if(this.activeModels.includes("Thermodynamics")){
            ThermoEngine.updateTemperature(this.objects);
            ThermoEngine.computeRadiation(this.dt,this.objects);
        }
        if(this.adaptiveDt){let amin=Infinity;for(const o of this.objects){const a=o.acc.mag();if(a>0)amin=Math.min(amin,Math.sqrt(Math.max(o.radius,1)/a));}if(Number.isFinite(amin))this.dt=Math.max(this.minDt,Math.min(this.maxDt,this.safety*amin));} this.time+=this.dt;
        Diagnostics.update(this.objects);
        UI.updateInspector();
    },
    togglePause: function() {
        this.paused=!this.paused;
        const b=document.getElementById("btn-pause"); if(b) b.innerText=this.paused?"재개 (RESUME)":"일시정지 (PAUSE)";
    },
    loop: function() {
        requestAnimationFrame(()=>this.loop());
        const now=performance.now(); this.frames++;
        if(now-this.lastFpsTime>=1000){this.frames=0;this.lastFpsTime=now;}
        if(!this.paused){
            try{this.step();}catch(e){this.status="FAILED";this.paused=true;const b=document.getElementById("btn-pause");if(b)b.innerText="재개 (RESUME)";}
        }
        Renderer.draw();
    }
};