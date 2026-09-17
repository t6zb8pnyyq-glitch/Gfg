class BBox {
        constructor(x, y, z, size) {
            this.x=x; this.y=y; this.z=z; this.size=size;
        }
        contains(pos) {
            return pos.x >= this.x && pos.x < this.x+this.size &&
                   pos.y >= this.y && pos.y < this.y+this.size &&
                   pos.z >= this.z && pos.z < this.z+this.size;
        }
    }