const Validator = {
        tests: [
            {
                name: "Momentum Conservation",
                run: () => {
                    if (bodies.length === 0) return { status: 'NOT APPLICABLE', error: 0, tolerance: 1e-6 };
                    let initialP = {x:0, y:0, z:0};
                    let currentP = {x:0, y:0, z:0};
                    for(let b of bodies) {
                        currentP.x += b.mass * b.velocity.x;
                        currentP.y += b.mass * b.velocity.y;
                        currentP.z += b.mass * b.velocity.z;
                    }
                    if(!this._initP) this._initP = { ...currentP };
                    initialP = this._initP;

                    let pMag = Math.sqrt(currentP.x**2 + currentP.y**2 + currentP.z**2);
                    let initPMag = Math.sqrt(initialP.x**2 + initialP.y**2 + initialP.z**2);
                    let diff = Math.abs(pMag - initPMag);
                    let rel = initPMag === 0 ? diff : diff / initPMag;

                    return { status: rel < 1e-6 ? 'PASS' : 'FAIL', error: rel, tolerance: 1e-6 };
                }
            },
            {
                name: "Energy Consistency",
                run: () => {
                    if (bodies.length < 2) return { status: 'NOT APPLICABLE', error: 0, tolerance: 1e-4 };
                    let ke = 0, pe = 0;
                    for (let i = 0; i < bodies.length; i++) {
                        let b = bodies[i];
                        let v2 = b.velocity.x**2 + b.velocity.y**2 + b.velocity.z**2;
                        ke += 0.5 * b.mass * v2;
                        for (let j = i + 1; j < bodies.length; j++) {
                            let b2 = bodies[j];
                            let dx = b2.position.x - b.position.x;
                            let dy = b2.position.y - b.position.y;
                            let dz = b2.position.z - b.position.z;
                            let r = Math.sqrt(dx*dx + dy*dy + dz*dz) + 0.0001;
                            pe -= PhysicsConstants.G * b.mass * b2.mass / r;
                        }
                    }
                    let currentE = ke + pe;
                    if(!this._initE) this._initE = currentE;

                    let diff = Math.abs(currentE - this._initE);
                    let rel = this._initE === 0 ? diff : diff / Math.abs(this._initE);

                    return { status: rel < 0.1 ? 'PASS' : (rel < 0.5 ? 'WARNING' : 'FAIL'), error: rel, tolerance: 0.1 };
                }
            }
        ],
        runAllTests: function(returnResults = false) {
            let results = [];
            for (let test of this.tests) {
                let res = test.run();
                results.push({ name: test.name, ...res });
            }
            if(returnResults) return results;

            // Legacy UI update (only if not requested for explicit return)
            let html = "";
            for (let r of results) {
                let color = r.status === 'PASS' ? '#4caf50' : (r.status === 'WARNING' ? '#ff9800' : (r.status === 'FAIL' ? '#f44336' : '#9e9e9e'));
                html += `<div><strong>${r.name}:</strong> <span style="color:${color}">${r.status}</span> (Error: ${(r.error*100).toFixed(4)}%)</div>`;
            }
            document.getElementById('validation-results').innerHTML = html;
            document.getElementById('validation-modal').style.display = 'block';
        }
    }