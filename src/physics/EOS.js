const EOS = {
    radiationConstant: 4*PhysicsConstants.sigma_sb/PhysicsConstants.c,
    atomicMassUnit: 1.66053906660e-27,

    meanMolecularWeight(comp={X:0.73,Y:0.25,Z:0.02}, ionized=true) {
        const X=comp.X??0, Y=comp.Y??0, Z=comp.Z??0;
        if(ionized) return 1/Math.max(1e-30,2*X+0.75*Y+0.5*Z);
        return 1/Math.max(1e-30,X/2+Y/4+Z/16);
    },

    idealGasPressure(rho,T,mu) {
        return rho*PhysicsConstants.k_B*T/(mu*this.atomicMassUnit);
    },

    radiationPressure(T) { return this.radiationConstant*T**4/3; },

    pressure(rho,T,comp) {
        const mu=this.meanMolecularWeight(comp,true);
        return this.idealGasPressure(rho,T,mu)+this.radiationPressure(T);
    },

    specificInternalEnergy(rho,T,comp) {
        const mu=this.meanMolecularWeight(comp,true);
        return 1.5*PhysicsConstants.k_B*T/(mu*this.atomicMassUnit)+this.radiationConstant*T**4/rho;
    },

    soundSpeed(rho,T,comp) {
        const mu=this.meanMolecularWeight(comp,true);
        const p=this.pressure(rho,T,comp);
        return Math.sqrt(Math.max(0,(5/3)*p/rho));
    },

    kramersOpacity(rho,T,X=0.73,Z=0.02) {
        const Tg=Math.max(T,1);
        return 4.0e25*(Z*(1+X))*rho*Tg**-3.5;
    },

    electronScatteringOpacity(X=0.73) { return 0.2*(1+X); },

    opacity(rho,T,comp={X:0.73,Y:0.25,Z:0.02}) {
        return Math.max(0,this.electronScatteringOpacity(comp.X)+this.kramersOpacity(rho,T,comp.X,comp.Z));
    }
};
