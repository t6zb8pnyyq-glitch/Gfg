class OctreeNode {
        constructor(box) {
            this.box = box;
            this.body = null;
            this.children = null;
            this.mass = 0;
            this.centerOfMass = new Vec3();
        }
        insert(body) {
            if(!this.box.contains(body.pos)) return;
            // Prevent infinite recursion if bodies have exactly identical coordinates
            if (this.body && this.body.pos.x === body.pos.x && this.body.pos.y === body.pos.y && this.body.pos.z === body.pos.z) {
                body.pos.x += 1e-4; // Perturb slightly
            }
            if(this.mass === 0) {
                this.body = body;
                this.mass = body.mass;
                this.centerOfMass = body.pos.clone();
            } else {
                if(!this.children) this.subdivide();
                if(this.body) {
                    this.insertIntoChildren(this.body);
                    this.body = null; // internal nodes don't hold bodies
                }
                this.insertIntoChildren(body);
                // Update COM
                let totalMass = this.mass + body.mass;
                this.centerOfMass = this.centerOfMass.mult(this.mass).add(body.pos.mult(body.mass)).div(totalMass);
                this.mass = totalMass;
            }
        }
        subdivide() {
            let s = this.box.size / 2;
            let x = this.box.x, y = this.box.y, z = this.box.z;
            this.children = [
                new OctreeNode(new BBox(x,y,z,s)), new OctreeNode(new BBox(x+s,y,z,s)),
                new OctreeNode(new BBox(x,y+s,z,s)), new OctreeNode(new BBox(x+s,y+s,z,s)),
                new OctreeNode(new BBox(x,y,z+s,s)), new OctreeNode(new BBox(x+s,y,z+s,s)),
                new OctreeNode(new BBox(x,y+s,z+s,s)), new OctreeNode(new BBox(x+s,y+s,z+s,s))
            ];
        }
        insertIntoChildren(body) {
            for(let i=0; i<8; i++) this.children[i].insert(body);
        }
    }