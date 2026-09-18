const GravityEngine = {
    computeAccelerations:function(objects,useBarnesHut){
        const accels=new Array(objects.length).fill(null).map(()=>new Vec3());

        if(useBarnesHut&&objects.length>50){
            let min=new Vec3(Infinity,Infinity,Infinity),max=new Vec3(-Infinity,-Infinity,-Infinity);
            for(const o of objects){
                min.x=Math.min(min.x,o.pos.x); min.y=Math.min(min.y,o.pos.y); min.z=Math.min(min.z,o.pos.z);
                max.x=Math.max(max.x,o.pos.x); max.y=Math.max(max.y,o.pos.y); max.z=Math.max(max.z,o.pos.z);
            }
            const span=Math.max(max.x-min.x,max.y-min.y,max.z-min.z);
            const size=Math.max(span,1);
            const root=new OctreeNode(new BBox(min.x,min.y,min.z,size*(1+1e-12)));
            for(const o of objects) root.insert(o);
            const theta=.2;

            function pairAcceleration(source,target){
                if(source===target) return new Vec3();
                const rv=source.pos.sub(target.pos),r2=rv.magSq();
                if(!(r2>0)||!Number.isFinite(r2)) return new Vec3();
                const invR=1/Math.sqrt(r2);
                return rv.mult(PhysicsConstants.G*source.mass*invR/r2);
            }

            function force(node,body){
                if(node.mass===0) return new Vec3();

                // A degenerate leaf containing several bodies at exactly the
                // same coordinate must be evaluated exactly.
                if(!node.children && node.bodies){
                    let a=new Vec3();
                    for(const source of node.bodies) a=a.add(pairAcceleration(source,body));
                    return a;
                }

                if(!node.children && node.body===body) return new Vec3();

                const rv=node.centerOfMass.sub(body.pos),r2=rv.magSq();
                if(!(r2>0)||!Number.isFinite(r2)) return new Vec3();
                const r=Math.sqrt(r2);

                // Barnes-Hut opening criterion: never approximate a node that
                // contains the target body; otherwise accept if s/r < theta.
                const containsTarget=node.box.contains(body.pos);
                if(!containsTarget && node.box.size/r < theta){
                    return rv.mult(PhysicsConstants.G*node.mass/(r2*r));
                }

                if(!node.children) return pairAcceleration(node.body,body);

                let a=new Vec3();
                for(const child of node.children) a=a.add(force(child,body));
                return a;
            }

            for(let i=0;i<objects.length;i++) accels[i]=force(root,objects[i]);
        }else{
            for(let i=0;i<objects.length;i++){
                for(let j=i+1;j<objects.length;j++){
                    const rv=objects[j].pos.sub(objects[i].pos),r2=rv.magSq();
                    if(!(r2>0)||!Number.isFinite(r2)) continue;
                    const invR=1/Math.sqrt(r2),common=PhysicsConstants.G*invR/r2;
                    accels[i]=accels[i].add(rv.mult(common*objects[j].mass));
                    accels[j]=accels[j].add(rv.mult(-common*objects[i].mass));
                }
            }
        }
        return accels;
    }
};