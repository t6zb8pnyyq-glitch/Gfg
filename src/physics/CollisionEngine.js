const CollisionEngine = {
        checkAndResolve: function(objects) {
            let toRemove = []; let newObjects = [];
            for(let i=0; i<objects.length; i++) {
                if(toRemove.includes(i)) continue;
                for(let j=i+1; j<objects.length; j++) {
                    if(toRemove.includes(j)) continue;
                    let objA = objects[i]; let objB = objects[j];
                    let rVec = objB.pos.sub(objA.pos);
                    let dist = rVec.mag();
                    if(dist < (objA.radius + objB.radius)) {
                        let newMass = objA.mass + objB.mass;
                        let newPos = (objA.pos.mult(objA.mass).add(objB.pos.mult(objB.mass))).div(newMass);
                        let newVel = (objA.vel.mult(objA.mass).add(objB.vel.mult(objB.mass))).div(newMass);
                        let newRadius = Math.pow(Math.pow(objA.radius, 3) + Math.pow(objB.radius, 3), 1/3);

                        let merged = new PhysicalBody(Date.now()+"_merged", "PLANET", newMass, newRadius, newPos, newVel);
                        newObjects.push(merged);
                        toRemove.push(i); toRemove.push(j);
                    }
                }
            }
            if(toRemove.length > 0) {
                toRemove.sort((a,b)=>b-a).forEach(idx => objects.splice(idx, 1));
                objects.push(...newObjects);
            }
        }
    }