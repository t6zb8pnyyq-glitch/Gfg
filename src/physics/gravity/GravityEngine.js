const GravityEngine = {
        computeAccelerations: function(objects, useBarnesHut) {
            let accels = new Array(objects.length).fill(null).map(() => new Vec3());

            if(useBarnesHut && objects.length > 50) {
                // Barnes-Hut O(N log N)
                let min = new Vec3(Infinity, Infinity, Infinity);
                let max = new Vec3(-Infinity, -Infinity, -Infinity);
                for(let o of objects) {
                    min.x = Math.min(min.x, o.pos.x); min.y = Math.min(min.y, o.pos.y); min.z = Math.min(min.z, o.pos.z);
                    max.x = Math.max(max.x, o.pos.x); max.y = Math.max(max.y, o.pos.y); max.z = Math.max(max.z, o.pos.z);
                }
                let size = Math.max(max.x - min.x, max.y - min.y, max.z - min.z) + 1;
                let root = new OctreeNode(new BBox(min.x, min.y, min.z, size));
                for(let o of objects) root.insert(o);

                let theta = 0.5; // accuracy param

                function calculateForce(node, body) {
                    if(node.mass === 0) return new Vec3();
                    let rVec = node.centerOfMass.sub(body.pos);
                    let rSq = rVec.magSq();
                    let r = Math.sqrt(rSq);
                    if(r === 0) return new Vec3();

                    if(node.children === null || (node.box.size / r) < theta) {
                        let fMag = PhysicsConstants.G * node.mass / rSq;
                        return rVec.mult(fMag / r);
                    } else {
                        let acc = new Vec3();
                        for(let i=0; i<8; i++) acc = acc.add(calculateForce(node.children[i], body));
                        return acc;
                    }
                }

                for(let i=0; i<objects.length; i++) {
                    accels[i] = calculateForce(root, objects[i]);
                }

            } else {
                // Direct O(N^2)
                for(let i=0; i<objects.length; i++) {
                    for(let j=i+1; j<objects.length; j++) {
                        let rVec = objects[j].pos.sub(objects[i].pos);
                        let rSq = rVec.magSq();
                        if(rSq === 0) continue;
                        let r = Math.sqrt(rSq);
                        let fMag = PhysicsConstants.G / rSq;

                        let a_i = rVec.mult(fMag * objects[j].mass / r);
                        let a_j = rVec.mult(-fMag * objects[i].mass / r);

                        accels[i] = accels[i].add(a_i);
                        accels[j] = accels[j].add(a_j);
                    }
                }
            }
            return accels;
        }
    }