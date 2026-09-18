const Engine = {
        objects: [], time: 0, dt: 120, integratorType: "RK4", gravityAlgorithm: "BARNES_HUT",
        status: "STABLE", paused: false, frames: 0, lastFpsTime: 0,
        activeModels: ["Gravity", "Collision"],

        setIntegrator: function(type) { this.integratorType = type; },

        getAccelerations: function(objs) {
            let accels = new Array(objs.length).fill(null).map(() => new Vec3());

            if(this.activeModels.includes("Gravity")) {
                let gravAcc = GravityEngine.computeAccelerations(objs, this.gravityAlgorithm === "BARNES_HUT");
                for(let i=0; i<objs.length; i++) accels[i] = accels[i].add(gravAcc[i]);
            }
            if(this.activeModels.includes("Relativity")) {
                let grAcc = RelativityEngine.computeSchwarzschildPrecession(objs);
                for(let i=0; i<objs.length; i++) accels[i] = accels[i].add(grAcc[i]);
            }
            if(this.activeModels.includes("Electromagnetic")) {
                let emAcc = ElectromagneticEngine.computeAccelerations(objs);
                for(let i=0; i<objs.length; i++) accels[i] = accels[i].add(emAcc[i]);
            }
            return accels;
        },

        step: function() {
            if(this.status === "FAILED") return;

            // Safety
            for(let o of this.objects) {
                if(isNaN(o.pos.x) || isNaN(o.vel.x)) { this.status = "FAILED"; alert("CATASTROPHIC NUMERICAL INSTABILITY DETECTED (NaN)."); return; }
                if(o.vel.magSq() >= PhysicsConstants.c * PhysicsConstants.c) { this.status = "FAILED"; alert("SUPERLUMINAL VELOCITY DETECTED."); return; }
            }

            let t_integrator = this.integratorType.toLowerCase();
            if(t_integrator === "euler") {
                Integrators.eulerSemiImplicit(this.objects, this.dt, this.getAccelerations(this.objects));
            } else if(t_integrator === "verlet") {
                Integrators.verlet(this.objects, this.dt, (obs)=>this.getAccelerations(obs));
            } else if(t_integrator === "rk4") {
                Integrators.rk4(this.objects, this.dt, (obs)=>this.getAccelerations(obs));
            }

            if(this.activeModels.includes("Fluid")) FluidEngine.computeSPH(this.objects);
            if(this.activeModels.includes("Nuclear")) NuclearEngine.computeFusion(this.dt, this.objects);
            if(this.activeModels.includes("Collision")) CollisionEngine.checkAndResolve(this.objects);

            this.time += this.dt;
            Diagnostics.update(this.objects);

            document.getElementById('diag-time').innerText = this.time.toExponential(3) + " s";
            document.getElementById('diag-count').innerText = this.objects.length;

            // Update Inspector for first object
            if(this.objects.length > 0) {
                let o = this.objects[0];
                let ins = document.getElementById('inspector-content');
                if(o.type === "STAR" && this.activeModels.includes("Nuclear")) {
                    ins.innerHTML = `<b>Target: ${o.id}</b><br>
                    Mass: ${o.mass.toExponential(3)} kg<br>
                    Core Temp: ${o.temperature.toExponential(3)} K<br>
                    Hydrogen (X): ${o.composition.X.toFixed(4)}<br>
                    Helium (Y): ${o.composition.Y.toFixed(4)}<br>
                    Metals (Z): ${o.composition.Z.toFixed(4)}<br>
                    Luminosity: ${o.luminosity.toExponential(3)} W`;
                }
            }
        },

        togglePause: function() { this.paused = !this.paused; document.getElementById('btn-pause').innerText = this.paused ? "재개 (RESUME)" : "일시정지 (PAUSE)"; },

        loop: function() {
            requestAnimationFrame(() => this.loop());
            let now = performance.now(); this.frames++;
            if(now - this.lastFpsTime >= 1000) { document.getElementById('diag-fps').innerText = this.frames; this.frames = 0; this.lastFpsTime = now; }

            if(!this.paused) {
                for(let i=0; i<2; i++) { this.step(); if(this.status === "FAILED") break; }
            }
            Renderer.draw();
        }
    }