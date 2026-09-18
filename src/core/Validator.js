const Validator = {
    tests: [
        {
            name: "Gravity: Analytical Two-Body Orbital Period (Kepler)",
            run: () => {
                // Controlled State
                let M = PhysicsConstants.M_sun;
                let m = PhysicsConstants.M_earth;
                let r = PhysicsConstants.AU;
                let v = Math.sqrt(PhysicsConstants.G * M / r);

                let b1 = new PhysicalBody("S1", "STAR", M, 1e9, new Vec3(0,0,0), new Vec3(0,0,0));
                let b2 = new PhysicalBody("P1", "PLANET", m, 1e6, new Vec3(r,0,0), new Vec3(0,v,0));

                let testObjs = [b1, b2];
                let dt = 3600;
                let period = 2 * Math.PI * Math.sqrt(Math.pow(r, 3) / (PhysicsConstants.G * M));
                let steps = Math.floor(period / dt);

                for(let i=0; i<steps; i++) {
                    let accels = GravityEngine.computeAccelerations(testObjs, false);
                    Integrators.verlet(testObjs, dt, (objs) => GravityEngine.computeAccelerations(objs, false));
                }

                // After 1 period, Earth should be back near (r, 0, 0)
                let error = Math.abs(testObjs[1].pos.x - r) / r;
                return { status: error < 0.05 ? 'PASS' : 'FAIL', error: error, tolerance: '5%' };
            }
        },
        {
            name: "Collision: Inelastic Momentum Conservation",
            run: () => {
                // Controlled State
                let m1 = 1e24, m2 = 1e24;
                let v1 = new Vec3(1000, 0, 0), v2 = new Vec3(-1000, 0, 0);

                let b1 = new PhysicalBody("1", "PLANET", m1, 1e6, new Vec3(-1e6,0,0), v1);
                let b2 = new PhysicalBody("2", "PLANET", m2, 1e6, new Vec3(1e6,0,0), v2);

                let p_initial = v1.mult(m1).add(v2.mult(m2));

                let testObjs = [b1, b2];
                CollisionEngine.checkAndResolve(testObjs);

                if(testObjs.length !== 1) return { status: 'FAIL', error: 1.0, tolerance: 'Exact Merger' };

                let p_final = testObjs[0].vel.mult(testObjs[0].mass);
                let diff = p_initial.sub(p_final).mag();

                return { status: diff < 1e-5 ? 'PASS' : 'FAIL', error: diff, tolerance: '1e-5 kg m/s' };
            }
        },
        {
            name: "Barnes-Hut vs Direct Summation Convergence",
            run: () => {
                let testObjsBH = [];
                let testObjsDirect = [];
                for(let i=0; i<51; i++) { // Must be > 50 to trigger Barnes Hut inside GravityEngine
                    let b = new PhysicalBody(""+i, "PLANET", 1e20, 1e5,
                        new Vec3(Math.random()*1e8, Math.random()*1e8, 0), new Vec3());
                    testObjsBH.push(b.clone());
                    testObjsDirect.push(b.clone());
                }

                let accelsBH = GravityEngine.computeAccelerations(testObjsBH, true);
                let accelsDirect = GravityEngine.computeAccelerations(testObjsDirect, false);

                let maxErr = 0;
                for(let i=0; i<testObjsBH.length; i++) {
                    let err = accelsBH[i].sub(accelsDirect[i]).mag() / (accelsDirect[i].mag() + 1e-20);
                    if(err > maxErr) maxErr = err;
                }

                return { status: maxErr < 0.1 ? 'PASS' : 'WARNING', error: maxErr, tolerance: '10%' };
            }
        }
    ],
    runAllTests: function(returnResults = false) {
        let results = [];
        for (let test of this.tests) {
            try {
                let res = test.run();
                results.push({ name: test.name, ...res });
            } catch(e) {
                results.push({ name: test.name, status: 'FAIL', error: 1, tolerance: 'N/A' });
            }
        }
        return results;
    }
};