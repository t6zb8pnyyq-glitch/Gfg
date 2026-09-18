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


                        // Determine type based on mass hierarchy
                        let type = objA.mass > objB.mass ? objA.type : objB.type;
                        if(type !== "BLACK_HOLE" && newMass > 3.0 * PhysicsConstants.M_sun) type = "BLACK_HOLE";
                        else if(type === "PLANET" && newMass > 0.08 * PhysicsConstants.M_sun) type = "STAR";

                        let merged = new PhysicalBody(Date.now()+"_merged", type, newMass, newRadius, newPos, newVel);

                        // Conservation of internal energy and thermodynamics (Inelastic merger)
                        let keA = 0.5 * objA.mass * objA.vel.magSq();
                        let keB = 0.5 * objB.mass * objB.vel.magSq();
                        let keMerged = 0.5 * merged.mass * merged.vel.magSq();
                        let energyDissipated = (keA + keB) - keMerged; // Dissipated kinetic becomes internal heat

                        merged.internalEnergy = objA.internalEnergy + objB.internalEnergy + energyDissipated;

                        // Weighted composition
                        merged.composition.X = (objA.composition.X * objA.mass + objB.composition.X * objB.mass) / newMass;
                        merged.composition.Y = (objA.composition.Y * objA.mass + objB.composition.Y * objB.mass) / newMass;
                        merged.composition.Z = (objA.composition.Z * objA.mass + objB.composition.Z * objB.mass) / newMass;

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