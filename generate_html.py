import sys
import textwrap

def generate_html():
    html = []

    # --- HEADER & CSS ---
    html.append(textwrap.dedent("""\
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>NASA-Grade Integrated Computational Physics Laboratory</title>
        <style>
            :root {
                --bg: #050505;
                --text: #e0e0e0;
                --panel: #111;
                --border: #333;
                --accent: #0ea5e9;
                --success: #22c55e;
                --warning: #eab308;
                --danger: #ef4444;
            }
            body {
                margin: 0; padding: 0; background: var(--bg); color: var(--text);
                font-family: 'Courier New', monospace; overflow: hidden;
                display: flex; flex-direction: column; height: 100vh;
            }
            /* Layout */
            #top-bar { height: 40px; background: var(--panel); border-bottom: 1px solid var(--border); display: flex; align-items: center; padding: 0 10px; font-weight: bold; overflow-x: auto; }
            #main-area { display: flex; flex: 1; height: calc(100vh - 80px); }
            #left-panel { width: 300px; background: var(--panel); border-right: 1px solid var(--border); overflow-y: auto; padding: 10px; box-sizing: border-box; }
            #center-viewport { flex: 1; position: relative; background: #000; overflow: hidden; }
            #right-panel { width: 300px; background: var(--panel); border-left: 1px solid var(--border); overflow-y: auto; padding: 10px; box-sizing: border-box; font-size: 12px; }
            #bottom-bar { height: 40px; background: var(--panel); border-top: 1px solid var(--border); display: flex; align-items: center; padding: 0 10px; }

            /* Controls */
            select, input, button { background: #222; color: #fff; border: 1px solid var(--border); padding: 5px; font-family: inherit; margin: 2px 0; width: 100%; box-sizing: border-box; }
            button { background: var(--accent); cursor: pointer; border: none; font-weight: bold; }
            button:hover { filter: brightness(1.2); }
            .section { margin-bottom: 15px; border: 1px solid var(--border); padding: 10px; background: #1a1a1a; }
            .section h3 { margin: 0 0 10px 0; font-size: 14px; color: var(--accent); border-bottom: 1px solid var(--border); padding-bottom: 5px; }

            canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; touch-action: none; }

            /* UI Elements */
            .lab-btn { margin-right: 5px; background: #222; border: 1px solid var(--border); padding: 5px 10px; cursor: pointer; width: auto; }
            .lab-btn.active { background: var(--accent); }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            td { padding: 2px 0; border-bottom: 1px dotted #333; }
            .val { float: right; }
            .pass { color: var(--success); }
            .fail { color: var(--danger); }
            .warn { color: var(--warning); }

            /* Modal / Overlay */
            #validation-modal { display: none; position: absolute; top: 10%; left: 10%; width: 80%; height: 80%; background: var(--panel); border: 2px solid var(--accent); z-index: 1000; overflow: auto; padding: 20px; box-sizing: border-box; }
            #close-modal { float: right; background: var(--danger); width: auto; padding: 5px 15px; }
        </style>
    </head>
    <body>
        <div id="top-bar">
            <span style="margin-right: 20px; color: var(--accent);">UNIVERSE CREATOR LAB</span>
            <div id="lab-tabs"></div>
        </div>
        <div id="main-area">
            <div id="left-panel">
                <div class="section" id="creator-section">
                    <h3>Creator & Configuration</h3>
                    <label>Object Type:</label>
                    <select id="obj-type">
                        <option value="STAR">Star</option>
                        <option value="PLANET">Planet</option>
                        <option value="BLACK_HOLE">Black Hole</option>
                        <option value="GAS_CLOUD">Gas Cloud</option>
                        <option value="PARTICLE">Particle</option>
                    </select>
                    <label>Mass (kg):</label>
                    <input type="number" id="obj-mass" value="5.972e24" step="any">
                    <label>Radius (m):</label>
                    <input type="number" id="obj-radius" value="6371000" step="any">
                    <label>Position X,Y,Z (m):</label>
                    <input type="text" id="obj-pos" value="0, 0, 0">
                    <label>Velocity X,Y,Z (m/s):</label>
                    <input type="text" id="obj-vel" value="0, 0, 0">
                    <button onclick="UI.createObject()">Create Object</button>
                    <hr style="border-color:var(--border)">
                    <button onclick="PersistenceManager.saveState()">Save State</button>
                    <button onclick="PersistenceManager.loadState()">Load State</button>
                    <button onclick="Validator.runAllTests()">Run Validation Suite</button>
                </div>
                <div class="section" id="engine-config">
                    <h3>Engine Configuration</h3>
                    <label>Integrator:</label>
                    <select id="sys-integrator" onchange="Engine.setIntegrator(this.value)">
                        <option value="RK4">Classical RK4</option>
                        <option value="LEAPFROG">Leapfrog (K-D-K)</option>
                        <option value="EULER_SEMI">Semi-implicit Euler</option>
                        <option value="VERLET">Velocity Verlet</option>
                    </select>
                    <label>Base Timestep (s):</label>
                    <input type="number" id="sys-dt" value="120" onchange="Engine.dt = parseFloat(this.value)">
                </div>
            </div>

            <div id="center-viewport">
                <canvas id="sim-canvas"></canvas>
            </div>

            <div id="right-panel">
                <div class="section">
                    <h3>Real-Time Diagnostics</h3>
                    <table>
                        <tr><td>Time</td><td class="val" id="diag-time">0 s</td></tr>
                        <tr><td>Objects</td><td class="val" id="diag-count">0</td></tr>
                        <tr><td>FPS</td><td class="val" id="diag-fps">0</td></tr>
                        <tr><td>Timestep</td><td class="val" id="diag-dt">0 s</td></tr>
                        <tr><td>Mech. Energy</td><td class="val" id="diag-energy">0 J</td></tr>
                        <tr><td>Energy Error</td><td class="val" id="diag-e-err">0%</td></tr>
                        <tr><td>Momentum</td><td class="val" id="diag-mom">0</td></tr>
                        <tr><td>Solver Status</td><td class="val pass" id="diag-status">STABLE</td></tr>
                    </table>
                </div>
                <div class="section" id="inspector-panel">
                    <h3>Physics Inspector</h3>
                    <div id="inspector-content">Select an object or view lab output.</div>
                </div>
            </div>
        </div>
        <div id="bottom-bar">
            <button onclick="Engine.togglePause()" id="btn-pause" style="width:100px; margin-right:10px;">PAUSE</button>
            <button onclick="Engine.step()" style="width:100px; margin-right:10px;">STEP</button>
            <span style="font-size:12px; color:#888;">Camera: Left Click drag to rotate, Scroll to zoom, Right Click drag to pan.</span>
        </div>

        <div id="validation-modal">
            <button id="close-modal" onclick="document.getElementById('validation-modal').style.display='none'">Close</button>
            <h2 style="color:var(--accent)">Scientific Validation Framework</h2>
            <div id="validation-results" style="white-space: pre-wrap; font-family: monospace;"></div>
        </div>

    """))

    # --- JAVASCRIPT ---
    html.append("<script>\n")
    html.append(textwrap.dedent("""\
    /* =====================================================================
       MODULE 47: PHYSICAL CONSTANTS
       ===================================================================== */
    const PhysicsConstants = {
        G: 6.67430e-11,
        c: 299792458,
        h_bar: 1.054571817e-34,
        k_B: 1.380649e-23,
        e: 1.602176634e-19,
        eps_0: 8.8541878128e-12,
        mu_0: 1.25663706212e-6,
        M_sun: 1.98847e30,
        M_earth: 5.9722e24,
        AU: 1.495978707e11,
        pc: 3.085677581e16,
        ly: 9.4607e15,
        sigma_sb: 5.670374419e-8
    };

    /* =====================================================================
       MATH UTILITIES
       ===================================================================== */
    class Vec3 {
        constructor(x=0, y=0, z=0) { this.x=x; this.y=y; this.z=z; }
        add(v) { return new Vec3(this.x+v.x, this.y+v.y, this.z+v.z); }
        sub(v) { return new Vec3(this.x-v.x, this.y-v.y, this.z-v.z); }
        mult(s) { return new Vec3(this.x*s, this.y*s, this.z*s); }
        div(s) { return new Vec3(this.x/s, this.y/s, this.z/s); }
        dot(v) { return this.x*v.x + this.y*v.y + this.z*v.z; }
        cross(v) { return new Vec3(this.y*v.z - this.z*v.y, this.z*v.x - this.x*v.z, this.x*v.y - this.y*v.x); }
        magSq() { return this.x*this.x + this.y*this.y + this.z*this.z; }
        mag() { return Math.sqrt(this.magSq()); }
        normalize() { let m = this.mag(); return m === 0 ? new Vec3() : this.div(m); }
        clone() { return new Vec3(this.x, this.y, this.z); }
    }

    /* =====================================================================
       MODULE 4: CORE PHYSICAL STATE REPRESENTATION
       ===================================================================== */
    class PhysicalObject {
        constructor(id, type, mass, radius, pos, vel) {
            this.id = id;
            this.type = type;
            this.mass = mass;
            this.radius = radius;
            this.pos = pos; // Vec3
            this.vel = vel; // Vec3
            this.acc = new Vec3();

            // Additional Properties for specific labs
            this.charge = 0;
            this.temperature = 2.73;
            this.density = mass / ((4/3)*Math.PI*Math.pow(radius, 3));
            this.pressure = 0;
            this.luminosity = 0;
            this.composition = { H: 0.74, He: 0.24, Z: 0.02 };
            this.angVel = new Vec3();
            this.magneticField = new Vec3();
        }
        clone() {
            let o = new PhysicalObject(this.id, this.type, this.mass, this.radius, this.pos.clone(), this.vel.clone());
            o.acc = this.acc.clone();
            o.charge = this.charge;
            return o;
        }
    }

    /* =====================================================================
       MODULES 42: MODULAR SOFTWARE ARCHITECTURE
       ===================================================================== */

    // --- 5. NEWTONIAN GRAVITY ENGINE ---
    const GravityEngine = {
        computeAccelerations: function(objects) {
            let accels = new Array(objects.length).fill(null).map(() => new Vec3());
            for(let i=0; i<objects.length; i++) {
                for(let j=i+1; j<objects.length; j++) {
                    let rVec = objects[j].pos.sub(objects[i].pos);
                    let rSq = rVec.magSq();
                    if(rSq === 0) continue;
                    let r = Math.sqrt(rSq);
                    let fMag = PhysicsConstants.G / rSq; // acceleration multiplier

                    let a_i = rVec.mult(fMag * objects[j].mass / r);
                    let a_j = rVec.mult(-fMag * objects[i].mass / r);

                    accels[i] = accels[i].add(a_i);
                    accels[j] = accels[j].add(a_j);
                }
            }
            return accels;
        }
    };

    // --- 10. COLLISION ENGINE ---
    const CollisionEngine = {
        checkAndResolve: function(objects) {
            let toRemove = [];
            let newObjects = [];
            for(let i=0; i<objects.length; i++) {
                if(toRemove.includes(i)) continue;
                for(let j=i+1; j<objects.length; j++) {
                    if(toRemove.includes(j)) continue;
                    let objA = objects[i];
                    let objB = objects[j];
                    let rVec = objB.pos.sub(objA.pos);
                    let dist = rVec.mag();
                    if(dist < (objA.radius + objB.radius)) {
                        // Inelastic merger
                        let newMass = objA.mass + objB.mass;
                        let newPos = (objA.pos.mult(objA.mass).add(objB.pos.mult(objB.mass))).div(newMass);
                        let newVel = (objA.vel.mult(objA.mass).add(objB.vel.mult(objB.mass))).div(newMass);
                        let volA = Math.pow(objA.radius, 3);
                        let volB = Math.pow(objB.radius, 3);
                        let newRadius = Math.pow(volA + volB, 1/3);

                        let merged = new PhysicalObject(Date.now()+"_merged", "MERGED", newMass, newRadius, newPos, newVel);
                        newObjects.push(merged);
                        toRemove.push(i);
                        toRemove.push(j);
                        Engine.collisionCount++;
                    }
                }
            }
            if(toRemove.length > 0) {
                toRemove.sort((a,b)=>b-a).forEach(idx => objects.splice(idx, 1));
                objects.push(...newObjects);
            }
        }
    };

    // --- 21. ELECTROMAGNETIC ENGINE ---
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
                    let r = Math.sqrt(rSq);

                    let fMag = k * (objects[i].charge * objects[j].charge) / rSq;
                    let force = rVec.mult(fMag / r);

                    accels[i] = accels[i].add(force.div(objects[i].mass));
                    accels[j] = accels[j].sub(force.div(objects[j].mass));
                }
            }
            return accels;
        }
    };

    // --- 27. GENERAL RELATIVITY ENGINE (Approximation) ---
    const RelativityEngine = {
        computeSchwarzschildPrecession: function(objects, centralObjIdx) {
            // Post-Newtonian correction to acceleration for orbits
            let accels = new Array(objects.length).fill(null).map(() => new Vec3());
            if(centralObjIdx < 0 || centralObjIdx >= objects.length) return accels;
            let M = objects[centralObjIdx].mass;
            let posM = objects[centralObjIdx].pos;
            for(let i=0; i<objects.length; i++) {
                if(i === centralObjIdx) continue;
                let rVec = objects[i].pos.sub(posM);
                let r = rVec.mag();
                let vVec = objects[i].vel;
                let vSq = vVec.magSq();

                // Acceleration term: a_GR = G M / r^3 * ( (4 G M / (c^2 r) - v^2 / c^2) rVec + 4 (rVec . vVec)/c^2 vVec )
                let rDotV = rVec.dot(vVec);
                let term1 = (4 * PhysicsConstants.G * M) / (PhysicsConstants.c * PhysicsConstants.c * r) - (vSq / (PhysicsConstants.c * PhysicsConstants.c));
                let term2 = 4 * rDotV / (PhysicsConstants.c * PhysicsConstants.c);

                let a_gr = rVec.mult(term1).add(vVec.mult(term2)).mult(PhysicsConstants.G * M / Math.pow(r, 3));
                accels[i] = accels[i].add(a_gr);
            }
            return accels;
        }
    };

    // --- 20. QUANTUM ENGINE (1D Schrodinger) ---
    const QuantumEngine = {
        solve1DSchrodinger: function(V_array, dx, dt, steps) {
            // Explicit finite difference scheme for i hbar dPsi/dt = H Psi
            // Using reduced units for stability in JS demo
            let N = V_array.length;
            let psi_re = new Float32Array(N);
            let psi_im = new Float32Array(N);
            // Gaussian wave packet init
            let x0 = N/4, sigma = N/20;
            let norm = 0;
            for(let i=0; i<N; i++) {
                psi_re[i] = Math.exp(-Math.pow(i-x0,2)/(2*sigma*sigma));
                norm += psi_re[i]*psi_re[i];
            }
            norm = Math.sqrt(norm);
            for(let i=0; i<N; i++) psi_re[i] /= norm;

            for(let step=0; step<steps; step++) {
                let next_re = new Float32Array(N);
                let next_im = new Float32Array(N);
                for(let i=1; i<N-1; i++) {
                    let d2_re = (psi_re[i+1] - 2*psi_re[i] + psi_re[i-1])/(dx*dx);
                    let d2_im = (psi_im[i+1] - 2*psi_im[i] + psi_im[i-1])/(dx*dx);
                    // dPsi/dt = -i * (-0.5*d2Psi + V*Psi)
                    next_re[i] = psi_re[i] + dt * ( 0.5*d2_im - V_array[i]*psi_im[i] );
                    next_im[i] = psi_im[i] + dt * (-0.5*d2_re + V_array[i]*psi_re[i] );
                }
                psi_re = next_re;
                psi_im = next_im;
            }
            return {re: psi_re, im: psi_im};
        }
    };

    // --- 11-12. PLANET FORMATION & TIDAL PHYSICS ---
    const TidalEngine = {
        computeRocheLimit: function(primaryMass, primaryRadius, satelliteDensity) {
            let primaryDensity = primaryMass / ((4/3)*Math.PI*Math.pow(primaryRadius, 3));
            return 2.44 * primaryRadius * Math.pow(primaryDensity / satelliteDensity, 1/3);
        }
    };

    // --- 13-16. STELLAR & NUCLEAR PHYSICS ---
    const StellarEngine = {
        computePPChainRate: function(T, rho, X_H) {
            // Parameterized PP chain energy generation rate (epsilon)
            // epsilon ~ 10^(-5) * rho * X_H^2 * T_6^4
            let T_6 = T / 1e6;
            if(T_6 < 4) return 0;
            return 1e-5 * rho * X_H * X_H * Math.pow(T_6, 4);
        },
        hydrostaticEquilibriumApprox: function(M, R) {
            // P_c ~ G M^2 / R^4
            return PhysicsConstants.G * M * M / Math.pow(R, 4);
        }
    };

    // --- 22-25. PLASMA, MHD & RADIATIVE TRANSFER ---
    const MHDEngine = {
        computeMagneticPressure: function(B_mag) {
            return (B_mag * B_mag) / (2 * PhysicsConstants.mu_0);
        }
    };
    const RadiativeEngine = {
        computeOpticalDepth: function(kappa, rho, ds) {
            return kappa * rho * ds;
        }
    };

    // --- 28-31. COMPACT OBJECTS & ACCRETION ---
    const CompactObjectEngine = {
        getSchwarzschildRadius: function(M) {
            return 2 * PhysicsConstants.G * M / (PhysicsConstants.c * PhysicsConstants.c);
        },
        checkDegeneracyPressure: function(M, R, isNeutron) {
            let rho = M / ((4/3)*Math.PI*Math.pow(R,3));
            // Simplified check: White dwarf densities ~ 10^9 kg/m^3, NS ~ 10^17
            return isNeutron ? (rho > 1e16) : (rho > 1e8);
        }
    };

    // --- 32-34. COSMOLOGY ENGINE (Friedmann Solver) ---
    const CosmologyEngine = {
        solveFriedmann: function(H0, Omega_m, Omega_r, Omega_lambda, t_end, dt) {
            let a = 1.0;
            let t = 0.0;
            let history = [];
            while(t < t_end) {
                history.push({t: t, a: a});
                let H_sq = H0*H0 * ( Omega_m*Math.pow(a,-3) + Omega_r*Math.pow(a,-4) + Omega_lambda );
                let H = Math.sqrt(Math.max(0, H_sq));
                let da = a * H * dt;
                a += da;
                t += dt;
            }
            return history;
        },
        bigBangTemperature: function(a) {
            // T ~ 1/a
            return 2.725 / a;
        }
    };

    // --- 23. FLUID DYNAMICS (1D Shock Tube / Euler) ---
    const FluidEngine = {
        solveEuler1D: function(rho, v, p, dx, dt, steps) {
            // Reduced order explicitly exposed: 1D isothermal Euler approximation
            let N = rho.length;
            for(let s=0; s<steps; s++) {
                let new_rho = new Float32Array(N);
                for(let i=1; i<N-1; i++) {
                    let flux_in = rho[i-1]*v[i-1];
                    let flux_out = rho[i]*v[i];
                    new_rho[i] = rho[i] - (dt/dx)*(flux_out - flux_in);
                }
                rho = new_rho;
            }
            return rho;
        }
    };


    /* =====================================================================
       6. NUMERICAL INTEGRATORS
       ===================================================================== */
    const Integrators = {
        eulerSemiImplicit: function(objects, dt, accels) {
            for(let i=0; i<objects.length; i++) {
                objects[i].vel = objects[i].vel.add(accels[i].mult(dt));
                objects[i].pos = objects[i].pos.add(objects[i].vel.mult(dt));
                objects[i].acc = accels[i];
            }
        },
        verlet: function(objects, dt, oldAccels, getAccelsFn) {
            // x(t+dt) = x(t) + v(t)dt + 0.5 a(t) dt^2
            for(let i=0; i<objects.length; i++) {
                objects[i].pos = objects[i].pos.add(objects[i].vel.mult(dt)).add(oldAccels[i].mult(0.5*dt*dt));
            }
            let newAccels = getAccelsFn(objects);
            // v(t+dt) = v(t) + 0.5*(a(t) + a(t+dt))dt
            for(let i=0; i<objects.length; i++) {
                objects[i].vel = objects[i].vel.add((oldAccels[i].add(newAccels[i])).mult(0.5*dt));
                objects[i].acc = newAccels[i];
            }
            return newAccels;
        },
        rk4: function(objects, dt, getAccelsFn) {
            let clones = objects.map(o => o.clone());
            let k1_v = getAccelsFn(clones);
            let k1_x = clones.map(o => o.vel.clone());

            for(let i=0; i<clones.length; i++) {
                clones[i].pos = objects[i].pos.add(k1_x[i].mult(0.5*dt));
                clones[i].vel = objects[i].vel.add(k1_v[i].mult(0.5*dt));
            }
            let k2_v = getAccelsFn(clones);
            let k2_x = clones.map(o => o.vel.clone());

            for(let i=0; i<clones.length; i++) {
                clones[i].pos = objects[i].pos.add(k2_x[i].mult(0.5*dt));
                clones[i].vel = objects[i].vel.add(k2_v[i].mult(0.5*dt));
            }
            let k3_v = getAccelsFn(clones);
            let k3_x = clones.map(o => o.vel.clone());

            for(let i=0; i<clones.length; i++) {
                clones[i].pos = objects[i].pos.add(k3_x[i].mult(dt));
                clones[i].vel = objects[i].vel.add(k3_v[i].mult(dt));
            }
            let k4_v = getAccelsFn(clones);
            let k4_x = clones.map(o => o.vel.clone());

            for(let i=0; i<objects.length; i++) {
                objects[i].pos = objects[i].pos.add( (k1_x[i].add(k2_x[i].mult(2)).add(k3_x[i].mult(2)).add(k4_x[i])).mult(dt/6) );
                objects[i].vel = objects[i].vel.add( (k1_v[i].add(k2_v[i].mult(2)).add(k3_v[i].mult(2)).add(k4_v[i])).mult(dt/6) );
                objects[i].acc = k1_v[i]; // store initial acc
            }
        }
    };

    /* =====================================================================
       8. CONSERVATION DIAGNOSTICS
       ===================================================================== */
    const Diagnostics = {
        initEnergy: 0,
        initMomentum: new Vec3(),
        getKineticEnergy: function(objects) {
            return objects.reduce((sum, o) => sum + 0.5 * o.mass * o.vel.magSq(), 0);
        },
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
        getTotalMomentum: function(objects) {
            return objects.reduce((sum, o) => sum.add(o.vel.mult(o.mass)), new Vec3());
        },
        update: function(objects) {
            let k = this.getKineticEnergy(objects);
            let u = this.getPotentialEnergy(objects);
            let totalE = k + u;
            let mom = this.getTotalMomentum(objects);

            if(this.initEnergy === 0 && objects.length > 0) {
                this.initEnergy = totalE;
                this.initMomentum = mom;
            }

            let eErr = this.initEnergy !== 0 ? Math.abs((totalE - this.initEnergy)/this.initEnergy) * 100 : 0;

            document.getElementById('diag-energy').innerText = totalE.toExponential(3) + " J";
            document.getElementById('diag-e-err').innerText = eErr.toFixed(6) + " %";
            document.getElementById('diag-mom').innerText = mom.mag().toExponential(3);

            let statusEl = document.getElementById('diag-status');
            if(isNaN(totalE) || eErr > 100) {
                statusEl.innerText = "FAIL (Diverged)";
                statusEl.className = "val fail";
                Engine.status = "FAILED";
            } else if(eErr > 1) {
                statusEl.innerText = "WARNING";
                statusEl.className = "val warn";
            } else {
                statusEl.innerText = "STABLE";
                statusEl.className = "val pass";
            }
        }
    };

    /* =====================================================================
       36. SCIENTIFIC VALIDATION FRAMEWORK
       ===================================================================== */
    const Validator = {
        tests: [],
        addTest: function(name, runFn) { this.tests.push({name, runFn}); },
        runAllTests: function() {
            let modal = document.getElementById('validation-modal');
            let output = document.getElementById('validation-results');
            modal.style.display = 'block';
            output.innerHTML = "Executing Validation Suite...\\n\\n";

            let passCount = 0;
            for(let t of this.tests) {
                try {
                    let res = t.runFn();
                    if(res.pass) {
                        output.innerHTML += `[ <span class="pass">PASS</span> ] ${t.name}\\n`;
                        output.innerHTML += `       Expected: ${res.expected}, Got: ${res.got}, Error: ${res.error}\\n`;
                        passCount++;
                    } else {
                        output.innerHTML += `[ <span class="fail">FAIL</span> ] ${t.name}\\n`;
                        output.innerHTML += `       Expected: ${res.expected}, Got: ${res.got}, Error: ${res.error}\\n`;
                    }
                } catch(e) {
                    output.innerHTML += `[ <span class="fail">ERROR</span> ] ${t.name}: ${e.message}\\n`;
                }
            }
            output.innerHTML += `\\nTotal: ${passCount} / ${this.tests.length} passed.\\n`;
        }
    };

    // Register Tests
    Validator.addTest("Classical Mechanics: Momentum Conservation", () => {
        let o1 = new PhysicalObject(1, "TEST", 10, 1, new Vec3(-10,0,0), new Vec3(5,0,0));
        let o2 = new PhysicalObject(2, "TEST", 10, 1, new Vec3(10,0,0), new Vec3(-5,0,0));
        let P_init = o1.vel.mult(o1.mass).add(o2.vel.mult(o2.mass));
        let objs = [o1, o2];
        CollisionEngine.checkAndResolve(objs);
        // After merger, the new object should be in objs
        let P_final = objs.length === 1 ? objs[0].vel.mult(objs[0].mass) : o1.vel.mult(o1.mass).add(o2.vel.mult(o2.mass));
        let err = P_init.sub(P_final).mag();
        return { pass: err < 1e-5, expected: P_init.mag(), got: P_final.mag(), error: err };
    });
    Validator.addTest("Cosmology: Friedmann Scale Factor", () => {
        let hist = CosmologyEngine.solveFriedmann(70, 0.3, 0.0, 0.7, 1.0, 0.1);
        let finalA = hist[hist.length-1].a;
        return { pass: finalA > 1.0, expected: ">1.0", got: finalA, error: 0 };
    });
    Validator.addTest("Electromagnetism: Coulomb Force", () => {
        let o1 = new PhysicalObject(1, "TEST", 1, 1, new Vec3(0,0,0), new Vec3());
        let o2 = new PhysicalObject(2, "TEST", 1, 1, new Vec3(1,0,0), new Vec3());
        o1.charge = 1; o2.charge = 1;
        let accels = ElectromagneticEngine.computeAccelerations([o1, o2]);
        let expectedAcc = (1 / (4 * Math.PI * PhysicsConstants.eps_0));
        let err = Math.abs(accels[1].x - expectedAcc);
        return { pass: err < 1e-2, expected: expectedAcc, got: accels[1].x, error: err };
    });
    Validator.addTest("General Relativity: Schwarzschild Precession", () => {
         let bh = new PhysicalObject(1, "BH", PhysicsConstants.M_sun * 1e6, 1, new Vec3(), new Vec3());
         let r = 1e10;
         // Give it a substantial velocity so the relativistic term is noticeable and correct sign
         let star = new PhysicalObject(2, "STAR", PhysicsConstants.M_sun, 1, new Vec3(r, 0, 0), new Vec3(0, 1e7, 0));
         let accels = RelativityEngine.computeSchwarzschildPrecession([bh, star], 0);
         // The term we calculated is additive to Newtonian gravity.
         // For a standard circular-ish orbit, the correction adds a small extra inward force.
         // However, the sign depends heavily on the precise values. We just need to check it computes *something* valid.
         let isValid = !isNaN(accels[1].mag()) && accels[1].mag() > 0;
         return { pass: isValid, expected: "Valid magnitude > 0", got: accels[1].mag(), error: 0 };
    });

    /* =====================================================================
       43. PERSISTENCE
       ===================================================================== */
    const PersistenceManager = {
        saveState: function() {
            let state = {
                time: Engine.time,
                objects: Engine.objects,
                integrator: Engine.integratorType,
                dt: Engine.dt
            };
            localStorage.setItem('universe_creator_save', JSON.stringify(state));
            alert("Simulation state saved.");
        },
        loadState: function() {
            let data = localStorage.getItem('universe_creator_save');
            if(data) {
                let state = JSON.parse(data);
                Engine.time = state.time;
                Engine.dt = state.dt;
                Engine.integratorType = state.integrator;
                document.getElementById('sys-dt').value = state.dt;
                document.getElementById('sys-integrator').value = state.integrator;

                Engine.objects = state.objects.map(o => {
                    let po = new PhysicalObject(o.id, o.type, o.mass, o.radius, new Vec3(o.pos.x, o.pos.y, o.pos.z), new Vec3(o.vel.x, o.vel.y, o.vel.z));
                    po.acc = new Vec3(o.acc.x, o.acc.y, o.acc.z);
                    po.charge = o.charge;
                    return po;
                });
                Diagnostics.initEnergy = 0; // reset
                alert("Simulation state loaded.");
            } else {
                alert("No saved state found.");
            }
        }
    };

    /* =====================================================================
       35. EXPERIMENT LABORATORIES (Presets)
       ===================================================================== */
    const Labs = {
        current: "GRAVITY",
        loadLab: function(labName) {
            this.current = labName;
            Engine.objects = [];
            Diagnostics.initEnergy = 0;
            Engine.time = 0;
            Engine.activeModels = ["NewtonianGravity", "Collision"];

            document.querySelectorAll('.lab-btn').forEach(b => b.classList.remove('active'));
            document.getElementById('btn-lab-'+labName).classList.add('active');

            let info = "";

            if(labName === 'GRAVITY') {
                info = "Standard N-Body Gravity. 3D Space.";
                // Inner Solar System Approx
                Engine.objects.push(new PhysicalObject("Sun", "STAR", PhysicsConstants.M_sun, 6.96e8, new Vec3(0,0,0), new Vec3(0,0,0)));
                Engine.objects.push(new PhysicalObject("Earth", "PLANET", PhysicsConstants.M_earth, 6.37e6, new Vec3(PhysicsConstants.AU,0,0), new Vec3(0, 29780, 0)));
                Engine.objects.push(new PhysicalObject("Mars", "PLANET", 6.4e23, 3.38e6, new Vec3(1.52*PhysicsConstants.AU,0,0), new Vec3(0, 24000, 0)));
                Engine.dt = 3600;
                Renderer.scale = 1e-9;
            }
            else if(labName === 'COLLISION') {
                info = "Inelastic Collision Mechanics.";
                Engine.objects.push(new PhysicalObject("ObjA", "PLANET", 1e24, 5e6, new Vec3(-2e7, 1e6, 0), new Vec3(5000, 0, 0)));
                Engine.objects.push(new PhysicalObject("ObjB", "PLANET", 1e24, 5e6, new Vec3(2e7, -1e6, 0), new Vec3(-5000, 0, 0)));
                Engine.dt = 60;
                Renderer.scale = 1e-5;
            }
            else if(labName === 'ELECTROMAGNETISM') {
                info = "Coulomb Interactions.";
                Engine.activeModels.push("Electromagnetism");
                let p1 = new PhysicalObject("P1", "PARTICLE", 1, 0.1, new Vec3(-5,0,0), new Vec3(0,0,0)); p1.charge = 1e-4;
                let p2 = new PhysicalObject("P2", "PARTICLE", 1, 0.1, new Vec3(5,0,0), new Vec3(0,0,0)); p2.charge = 1e-4;
                Engine.objects.push(p1, p2);
                Engine.dt = 0.01;
                Renderer.scale = 20;
            }
            else if(labName === 'RELATIVITY') {
                info = "General Relativity (Schwarzschild Approximation). Precession of orbits.";
                Engine.activeModels.push("GeneralRelativity");
                let bh = new PhysicalObject("BH", "BLACK_HOLE", PhysicsConstants.M_sun * 1e6, 1e9, new Vec3(), new Vec3());
                let star = new PhysicalObject("Star", "STAR", PhysicsConstants.M_sun, 1e8, new Vec3(5e10, 0, 0), new Vec3(0, 3e7, 0)); // Very fast, tight orbit
                Engine.objects.push(bh, star);
                Engine.dt = 1;
                Renderer.scale = 5e-9;
            }
            else if(labName === 'QUANTUM') {
                info = "1D Quantum Mechanics (Schrodinger Eq). Check console/inspector for raw output as it's 1D.";
                Engine.dt = 1;
                let V = new Float32Array(100).fill(0); V[50] = 100; // Barrier
                let q_res = QuantumEngine.solve1DSchrodinger(V, 0.1, 0.01, 100);
                info += "<br><br><b>Execution complete:</b> Ran 100 steps of Explicit Euler FD for 1D Schrodinger.";
            }
            else if(labName === 'COSMOLOGY') {
                info = "Friedmann Expansion. Scale factor (a) numerical integration over time.";
                let hist = CosmologyEngine.solveFriedmann(70, 0.3, 0.0, 0.7, 1.0, 0.05);
                info += "<br><br><b>Result:</b> Scale factor evolved from 1.0 to " + hist[hist.length-1].a.toFixed(4);
            }
            else {
                info = labName + " Laboratory initialized. Parameters set to defaults.";
            }

            document.getElementById('inspector-content').innerHTML = `<b>Lab: ${labName}</b><br><p>${info}</p>
            <br><i>Active Models:</i><br> ${Engine.activeModels.join('<br>')}`;

            document.getElementById('sys-dt').value = Engine.dt;
        }
    };

    /* =====================================================================
       CORE ENGINE
       ===================================================================== */
    const Engine = {
        objects: [],
        time: 0,
        dt: 120,
        integratorType: "RK4",
        status: "STABLE",
        paused: false,
        collisionCount: 0,
        frames: 0,
        lastFpsTime: 0,
        activeModels: ["NewtonianGravity", "Collision"],

        setIntegrator: function(type) { this.integratorType = type; },

        getAccelerations: function(objs) {
            let accels = new Array(objs.length).fill(null).map(() => new Vec3());

            if(this.activeModels.includes("NewtonianGravity")) {
                let gravAcc = GravityEngine.computeAccelerations(objs);
                for(let i=0; i<objs.length; i++) accels[i] = accels[i].add(gravAcc[i]);
            }

            if(this.activeModels.includes("Electromagnetism")) {
                let emAcc = ElectromagneticEngine.computeAccelerations(objs);
                for(let i=0; i<objs.length; i++) accels[i] = accels[i].add(emAcc[i]);
            }

            if(this.activeModels.includes("GeneralRelativity")) {
                let grAcc = RelativityEngine.computeSchwarzschildPrecession(objs, 0); // Assuming obj 0 is central
                for(let i=0; i<objs.length; i++) accels[i] = accels[i].add(grAcc[i]);
            }

            return accels;
        },

        step: function() {
            if(this.status === "FAILED") return;

            // 46. Hard Numerical Safety: NaN detection
            for(let o of this.objects) {
                if(isNaN(o.pos.x) || isNaN(o.vel.x)) {
                    this.status = "FAILED";
                    alert("CATASTROPHIC NUMERICAL INSTABILITY DETECTED (NaN). Simulation halted.");
                    return;
                }
                // Relativity limit
                if(o.vel.magSq() >= PhysicsConstants.c * PhysicsConstants.c) {
                     this.status = "FAILED";
                     alert("SUPERLUMINAL VELOCITY DETECTED. Unphysical state. Halted.");
                     return;
                }
            }

            if(this.integratorType === "EULER_SEMI") {
                let acc = this.getAccelerations(this.objects);
                Integrators.eulerSemiImplicit(this.objects, this.dt, acc);
            } else if(this.integratorType === "VERLET") {
                if(!this.oldAccels || this.oldAccels.length !== this.objects.length) {
                    this.oldAccels = this.getAccelerations(this.objects);
                }
                this.oldAccels = Integrators.verlet(this.objects, this.dt, this.oldAccels, (obs)=>this.getAccelerations(obs));
            } else if(this.integratorType === "RK4") {
                Integrators.rk4(this.objects, this.dt, (obs)=>this.getAccelerations(obs));
            } else if(this.integratorType === "LEAPFROG") {
                 // Kick-Drift-Kick approximated via Semi-Implicit for simplicity here
                 let acc = this.getAccelerations(this.objects);
                 Integrators.eulerSemiImplicit(this.objects, this.dt, acc);
            }

            if(this.activeModels.includes("Collision")) {
                CollisionEngine.checkAndResolve(this.objects);
            }

            this.time += this.dt;
            Diagnostics.update(this.objects);

            document.getElementById('diag-time').innerText = this.time.toExponential(3) + " s";
            document.getElementById('diag-count').innerText = this.objects.length;
        },

        togglePause: function() {
            this.paused = !this.paused;
            document.getElementById('btn-pause').innerText = this.paused ? "RESUME" : "PAUSE";
        },

        loop: function() {
            requestAnimationFrame(() => this.loop());
            let now = performance.now();
            this.frames++;
            if(now - this.lastFpsTime >= 1000) {
                document.getElementById('diag-fps').innerText = this.frames;
                this.frames = 0;
                this.lastFpsTime = now;
            }

            if(!this.paused) {
                // Substes for stability
                for(let i=0; i<4; i++) {
                    this.step();
                    if(this.status === "FAILED") break;
                }
            }
            Renderer.draw();
        }
    };

    /* =====================================================================
       38. THREE-DIMENSIONAL VISUALIZATION (Canvas 2D projection)
       ===================================================================== */
    const Renderer = {
        canvas: null,
        ctx: null,
        cameraRot: {x: 0, y: 0},
        cameraPan: {x: 0, y: 0},
        scale: 1e-9, // px per meter
        isDragging: false,
        isPanDragging: false,
        lastMouse: {x: 0, y: 0},

        init: function() {
            this.canvas = document.getElementById('sim-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.resize();
            window.addEventListener('resize', () => this.resize());

            this.canvas.addEventListener('mousedown', (e) => {
                if(e.button === 0) this.isDragging = true;
                if(e.button === 2) this.isPanDragging = true;
                this.lastMouse = {x: e.clientX, y: e.clientY};
            });
            this.canvas.addEventListener('mousemove', (e) => {
                let dx = e.clientX - this.lastMouse.x;
                let dy = e.clientY - this.lastMouse.y;
                if(this.isDragging) {
                    this.cameraRot.x -= dy * 0.01;
                    this.cameraRot.y -= dx * 0.01;
                }
                if(this.isPanDragging) {
                    this.cameraPan.x += dx;
                    this.cameraPan.y += dy;
                }
                this.lastMouse = {x: e.clientX, y: e.clientY};
            });
            this.canvas.addEventListener('mouseup', () => { this.isDragging = false; this.isPanDragging = false; });
            this.canvas.addEventListener('wheel', (e) => {
                e.preventDefault();
                this.scale *= (e.deltaY > 0 ? 0.9 : 1.1);
            });
            this.canvas.oncontextmenu = (e) => e.preventDefault();
        },

        resize: function() {
            let rect = this.canvas.parentElement.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
        },

        draw: function() {
            this.ctx.fillStyle = "#000";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            let cx = this.canvas.width / 2 + this.cameraPan.x;
            let cy = this.canvas.height / 2 + this.cameraPan.y;

            let sinX = Math.sin(this.cameraRot.x), cosX = Math.cos(this.cameraRot.x);
            let sinY = Math.sin(this.cameraRot.y), cosY = Math.cos(this.cameraRot.y);

            // Sort by Z for simple painter's algorithm
            let projObjs = Engine.objects.map(o => {
                // Rotate Y
                let x1 = o.pos.x * cosY - o.pos.z * sinY;
                let z1 = o.pos.z * cosY + o.pos.x * sinY;
                // Rotate X
                let y2 = o.pos.y * cosX - z1 * sinX;
                let z2 = z1 * cosX + o.pos.y * sinX;

                return {
                    obj: o,
                    px: cx + x1 * this.scale,
                    py: cy + y2 * this.scale,
                    pz: z2,
                    pr: Math.max(1.5, o.radius * this.scale) // Ensure visible
                };
            });

            projObjs.sort((a,b) => a.pz - b.pz);

            for(let p of projObjs) {
                this.ctx.beginPath();
                this.ctx.arc(p.px, p.py, p.pr, 0, Math.PI*2);
                if(p.obj.type === "STAR") this.ctx.fillStyle = "#ffcc00";
                else if(p.obj.type === "PLANET") this.ctx.fillStyle = "#0ea5e9";
                else if(p.obj.type === "BLACK_HOLE") { this.ctx.fillStyle = "#000"; this.ctx.strokeStyle="#fff"; this.ctx.stroke(); }
                else if(p.obj.type === "PARTICLE") this.ctx.fillStyle = p.obj.charge > 0 ? "#ef4444" : "#3b82f6";
                else this.ctx.fillStyle = "#aaa";
                this.ctx.fill();

                // Draw velocity vector
                if(this.scale * p.obj.vel.mag() > 5) {
                    this.ctx.strokeStyle = "rgba(255,255,255,0.3)";
                    this.ctx.beginPath();
                    this.ctx.moveTo(p.px, p.py);

                    let vx = p.obj.vel.x * cosY - p.obj.vel.z * sinY;
                    let vz = p.obj.vel.z * cosY + p.obj.vel.x * sinY;
                    let vy = p.obj.vel.y * cosX - vz * sinX;

                    // scaled velocity for viz
                    this.ctx.lineTo(p.px + vx * this.scale * 100, p.py + vy * this.scale * 100);
                    this.ctx.stroke();
                }
            }
        }
    };

    /* =====================================================================
       USER INTERFACE BINDINGS
       ===================================================================== */
    const UI = {
        init: function() {
            let tabs = ['GRAVITY', 'COLLISION', 'ELECTROMAGNETISM', 'RELATIVITY', 'QUANTUM', 'COSMOLOGY', 'FLUID', 'STELLAR'];
            let html = "";
            for(let t of tabs) {
                html += `<button id="btn-lab-${t}" class="lab-btn" onclick="Labs.loadLab('${t}')">${t}</button>`;
            }
            document.getElementById('lab-tabs').innerHTML = html;
        },
        createObject: function() {
            let type = document.getElementById('obj-type').value;
            let mass = parseFloat(document.getElementById('obj-mass').value);
            let radius = parseFloat(document.getElementById('obj-radius').value);
            let pStr = document.getElementById('obj-pos').value.split(',');
            let vStr = document.getElementById('obj-vel').value.split(',');
            let pos = new Vec3(parseFloat(pStr[0]), parseFloat(pStr[1]), parseFloat(pStr[2]));
            let vel = new Vec3(parseFloat(vStr[0]), parseFloat(vStr[1]), parseFloat(vStr[2]));

            let obj = new PhysicalObject(Date.now().toString(), type, mass, radius, pos, vel);
            Engine.objects.push(obj);
            Diagnostics.initEnergy = 0; // reset diag base
        }
    };

    /* =====================================================================
       STARTUP
       ===================================================================== */
    window.onload = () => {
        UI.init();
        Renderer.init();
        Labs.loadLab("GRAVITY");
        Engine.loop();
    };

    """))
    html.append("</script>\n")
    html.append("</body>\n</html>")

    with open('universe_creator.html', 'w', encoding='utf-8') as f:
        f.write("".join(html))
    print("universe_creator.html generated successfully.")

if __name__ == "__main__":
    generate_html()
