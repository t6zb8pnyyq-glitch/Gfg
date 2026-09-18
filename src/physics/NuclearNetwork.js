const NuclearNetwork = {
    // Analytic stellar-rate approximations in SI. They are deliberately exposed as
    // approximations, not tabulated laboratory cross sections.
    ppEnergyRate(rho,T,X) {
        const T6=Math.max(T,1)/1e6;
        const ergPerGramPerSecond=2.4e4*rho/1e3*X*X*Math.pow(T6,-2/3)*Math.exp(-33.8*Math.pow(T6,-1/3));
        return Math.max(0,ergPerGramPerSecond*1e-4);
    },

    cnoEnergyRate(rho,T,X,Zcno=0.01) {
        const T6=Math.max(T,1)/1e6;
        const ergPerGramPerSecond=8.7e27*rho/1e3*X*Zcno*Math.pow(T6,-2/3)*Math.exp(-152.28*Math.pow(T6,-1/3));
        return Math.max(0,ergPerGramPerSecond*1e-4);
    },

    tripleAlphaEnergyRate(rho,T,Y) {
        const T8=Math.max(T,1)/1e8;
        const ergPerGramPerSecond=5.1e8*(rho/1e5)**2*Y**3*T8**-3*Math.exp(-44.027/T8);
        return Math.max(0,ergPerGramPerSecond*1e-4);
    },

    rates(rho,T,comp) {
        return {
            pp:this.ppEnergyRate(rho,T,comp.X),
            cno:this.cnoEnergyRate(rho,T,comp.X,comp.Z),
            tripleAlpha:this.tripleAlphaEnergyRate(rho,T,comp.Y)
        };
    },

    hydrogenBurning(rho,T,comp,dt) {
        const rates=this.rates(rho,T,comp);
        const q=0.007*PhysicsConstants.c**2;
        const burned=Math.min(comp.X,Math.max(0,(rates.pp+rates.cno)*dt/q));
        return {
            rates,
            dX:-burned,
            dY:burned,
            energy:burned*rho*q
        };
    }
};
