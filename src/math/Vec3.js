class Vec3 {
        constructor(x=0, y=0, z=0) { this.x=x; this.y=y; this.z=z; }
        add(v) { return new Vec3(this.x+v.x, this.y+v.y, this.z+v.z); }
        sub(v) { return new Vec3(this.x-v.x, this.y-v.y, this.z-v.z); }
        mult(s) { return new Vec3(this.x*s, this.y*s, this.z*s); }
        div(s) { return new Vec3(this.x/s, this.y/s, this.z/s); }
        dot(v) { return this.x*v.x + this.y*v.y + this.z*v.z; }
        cross(v) { return new Vec3(this.y*v.z - this.z*v.y, this.z*v.x - this.x*v.z, this.x*v.y - this.y*v.x); }
        magSq() { return this.x*this.x + this.y*this.y + this.z*this.z; }
        mag() { return Math.sqrt(this.magSq()); }
        normalize() { let m = this.mag(); return m === 0 ? new Vec3() : this.div(m); }
        clone() { return new Vec3(this.x, this.y, this.z); }
    }