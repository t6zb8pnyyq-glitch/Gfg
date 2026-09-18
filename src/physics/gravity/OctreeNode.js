class OctreeNode {
    constructor(box) {
        this.box = box;
        this.body = null;
        this.bodies = null;
        this.children = null;
        this.mass = 0;
        this.centerOfMass = new Vec3();
    }

    insert(body) {
        if(!this.box.contains(body.pos)) return;

        if(this.mass === 0) {
            this.body = body;
            this.mass = body.mass;
            this.centerOfMass = body.pos.clone();
            return;
        }

        // Exact-coordinate degeneracy: keep a finite leaf list and never
        // subdivide indefinitely. The gravity evaluator handles this leaf
        // by direct pairwise summation, excluding the target body.
        if(!this.children && this.body &&
           this.body.pos.x === body.pos.x &&
           this.body.pos.y === body.pos.y &&
           this.body.pos.z === body.pos.z) {
            if(!this.bodies) this.bodies = [this.body];
            this.bodies.push(body);
            const totalMass = this.mass + body.mass;
            this.centerOfMass = this.centerOfMass.mult(this.mass)
                .add(body.pos.mult(body.mass)).div(totalMass);
            this.mass = totalMass;
            return;
        }

        if(!this.children) this.subdivide();

        if(this.body) {
            this.insertIntoChildren(this.body);
            this.body = null;
        }
        if(this.bodies) {
            for(const b of this.bodies) this.insertIntoChildren(b);
            this.bodies = null;
        }

        this.insertIntoChildren(body);

        const totalMass = this.mass + body.mass;
        this.centerOfMass = this.centerOfMass.mult(this.mass)
            .add(body.pos.mult(body.mass)).div(totalMass);
        this.mass = totalMass;
    }

    subdivide() {
        const s = this.box.size / 2;
        const x = this.box.x, y = this.box.y, z = this.box.z;
        this.children = [
            new OctreeNode(new BBox(x,y,z,s)),
            new OctreeNode(new BBox(x+s,y,z,s)),
            new OctreeNode(new BBox(x,y+s,z,s)),
            new OctreeNode(new BBox(x+s,y+s,z,s)),
            new OctreeNode(new BBox(x,y,z+s,s)),
            new OctreeNode(new BBox(x+s,y,z+s,s)),
            new OctreeNode(new BBox(x,y+s,z+s,s)),
            new OctreeNode(new BBox(x+s,y+s,z+s,s))
        ];
    }

    insertIntoChildren(body) {
        for(let i=0; i<8; i++) {
            if(this.children[i].box.contains(body.pos)) {
                this.children[i].insert(body);
                return;
            }
        }
        // The root box uses half-open bounds; a body exactly on its upper
        // boundary can fall outside due to floating-point rounding.
        // Retry against the nearest child without changing its coordinates.
        let best = 0, bestD = Infinity;
        for(let i=0;i<8;i++) {
            const c=this.children[i];
            const cx=c.box.x+c.box.size*.5, cy=c.box.y+c.box.size*.5, cz=c.box.z+c.box.size*.5;
            const d=(body.pos.x-cx)**2+(body.pos.y-cy)**2+(body.pos.z-cz)**2;
            if(d<bestD){bestD=d;best=i;}
        }
        this.children[best].insert(body);
    }
}