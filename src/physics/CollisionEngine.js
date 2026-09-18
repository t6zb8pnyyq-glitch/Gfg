const CollisionEngine = {
    checkAndResolve(objects) {
        const consumed = new Set();
        const mergedBodies = [];

        for(let i=0;i<objects.length;i++){
            if(consumed.has(i)) continue;
            for(let j=i+1;j<objects.length;j++){
                if(consumed.has(j)) continue;
                const a=objects[i], b=objects[j];
                const d=a.pos.sub(b.pos).mag();
                if(!(d < a.radius+b.radius)) continue;

                const M=a.mass+b.mass;
                const pos=a.pos.mult(a.mass).add(b.pos.mult(b.mass)).div(M);
                const vel=a.vel.mult(a.mass).add(b.vel.mult(b.mass)).div(M);
                const R=Math.cbrt(a.radius**3+b.radius**3);

                let type=a.mass>=b.mass?a.type:b.type;
                if(type!=="BLACK_HOLE" && M>3*PhysicsConstants.M_sun) type="BLACK_HOLE";
                else if(type==="PLANET" && M>0.08*PhysicsConstants.M_sun) type="STAR";

                const merged=new PhysicalBody("merge-"+Date.now()+"-"+i+"-"+j,type,M,R,pos,vel);
                const keA=.5*a.mass*a.vel.magSq(), keB=.5*b.mass*b.vel.magSq(), keM=.5*M*vel.magSq();
                merged.internalEnergy=Math.max(0,a.internalEnergy+b.internalEnergy+Math.max(0,keA+keB-keM));
                merged.composition.X=(a.composition.X*a.mass+b.composition.X*b.mass)/M;
                merged.composition.Y=(a.composition.Y*a.mass+b.composition.Y*b.mass)/M;
                merged.composition.Z=(a.composition.Z*a.mass+b.composition.Z*b.mass)/M;

                // Preserve total angular momentum by converting unresolved orbital/spin
                // angular momentum into rigid-body spin of the merged sphere.
                const LA=a.pos.sub(pos).cross(a.vel.sub(vel).mult(a.mass));
                const LB=b.pos.sub(pos).cross(b.vel.sub(vel).mult(b.mass));
                const IA=(2/5)*a.mass*a.radius*a.radius, IB=(2/5)*b.mass*b.radius*b.radius;
                const spinAngularMomentum=a.spin.mult(IA).add(b.spin.mult(IB));
                const L=LA.add(LB).add(spinAngularMomentum);
                const I=(2/5)*M*R*R;
                merged.spin=I>0?L.div(I):new Vec3();

                if(type==="BLACK_HOLE"){
                    merged.radius=2*PhysicsConstants.G*M/(PhysicsConstants.c**2);
                    merged.updateDensity();
                }
                consumed.add(i); consumed.add(j);
                mergedBodies.push(merged);
                break;
            }
        }
        if(consumed.size){
            const survivors=objects.filter((_,idx)=>!consumed.has(idx));
            objects.length=0;
            objects.push(...survivors,...mergedBodies);
        }
    }
};
