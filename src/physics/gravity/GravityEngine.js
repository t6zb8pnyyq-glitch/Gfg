const GravityEngine = {
    computeAccelerations:function(objects,useBarnesHut){
        const accels=new Array(objects.length).fill(null).map(()=>new Vec3());
        if(useBarnesHut&&objects.length>50){
            let min=new Vec3(Infinity,Infinity,Infinity),max=new Vec3(-Infinity,-Infinity,-Infinity);
            for(const o of objects){min.x=Math.min(min.x,o.pos.x);min.y=Math.min(min.y,o.pos.y);min.z=Math.min(min.z,o.pos.z);max.x=Math.max(max.x,o.pos.x);max.y=Math.max(max.y,o.pos.y);max.z=Math.max(max.z,o.pos.z)}
            const size=Math.max(max.x-min.x,max.y-min.y,max.z-min.z)+1,root=new OctreeNode(new BBox(min.x,min.y,min.z,size)),theta=.5;
            for(const o of objects)root.insert(o);
            function force(node,body){
                if(node.mass===0)return new Vec3();
                if(!node.children&&node.body===body)return new Vec3();
                const rv=node.centerOfMass.sub(body.pos),r2=rv.magSq();if(r2===0)return new Vec3();
                const r=Math.sqrt(r2);
                if(!node.children||(!node.box.contains(body.pos)&&(node.box.size/r)<theta)){
                    const f=PhysicsConstants.G*node.mass/r2;return rv.mult(f/r);
                }
                let a=new Vec3();for(const child of node.children)a=a.add(force(child,body));return a;
            }
            for(let i=0;i<objects.length;i++)accels[i]=force(root,objects[i]);
        }else{
            for(let i=0;i<objects.length;i++)for(let j=i+1;j<objects.length;j++){const rv=objects[j].pos.sub(objects[i].pos),r2=rv.magSq();if(r2===0)continue;const r=Math.sqrt(r2),f=PhysicsConstants.G/r2,ai=rv.mult(f*objects[j].mass/r),aj=rv.mult(-f*objects[i].mass/r);accels[i]=accels[i].add(ai);accels[j]=accels[j].add(aj)}
        }
        return accels;
    }
};