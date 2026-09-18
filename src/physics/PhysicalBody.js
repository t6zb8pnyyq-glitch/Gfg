class PhysicalBody {
    constructor(id,type,mass,radius,pos,vel){
        if(!(mass>0) || !(radius>0) || !pos || !vel) throw new Error("Invalid body state");
        this.id=id; this.type=type; this.mass=mass; this.radius=radius;
        this.pos=pos; this.vel=vel; this.acc=new Vec3(); this.spin=new Vec3();
        this.temperature=2.73; this.internalEnergy=0; this.sph_density=0; this.sph_pressure=0;
        this.composition={X:0.73,Y:0.25,Z:0.02};
        this.charge=0; this.magneticField=new Vec3(); this.luminosity=0; this.radiatedEnergy=0;
        this.updateDensity();
    }
    updateDensity(){
        if(!(this.mass>0)||!(this.radius>0)||!Number.isFinite(this.mass)||!Number.isFinite(this.radius)){
            this.density=NaN; return;
        }
        this.density=this.mass/((4/3)*Math.PI*this.radius**3);
    }
    isFiniteState(){
        return Number.isFinite(this.mass)&&this.mass>0&&Number.isFinite(this.radius)&&this.radius>0&&
            [this.pos.x,this.pos.y,this.pos.z,this.vel.x,this.vel.y,this.vel.z].every(Number.isFinite);
    }
    clone(){
        const b=new PhysicalBody(this.id,this.type,this.mass,this.radius,this.pos.clone(),this.vel.clone());
        b.acc=this.acc.clone(); b.spin=this.spin.clone(); b.temperature=this.temperature;
        b.internalEnergy=this.internalEnergy; b.density=this.density; b.sph_density=this.sph_density;
        b.sph_pressure=this.sph_pressure; b.composition={...this.composition}; b.charge=this.charge;
        b.magneticField=this.magneticField.clone(); b.luminosity=this.luminosity; b.radiatedEnergy=this.radiatedEnergy;
        return b;
    }
}
