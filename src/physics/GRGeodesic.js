const GRGeodesic = {
    schwarzschildRadius(M){return 2*PhysicsConstants.G*M/PhysicsConstants.c**2;},

    derivatives(s,M) {
        const [t,r,phi,ut,ur,up]=s;
        const rs=this.schwarzschildRadius(M), A=1-rs/r;
        if(!(r>rs)) throw new Error("Geodesic reached Schwarzschild horizon in this coordinate chart");
        const Ap=rs/(r*r);
        const Gt=Ap/(2*A), Grtt=0.5*A*Ap, Grr=-Ap/(2*A), Grp=-A*r, Gpr=1/r;
        return [ut,ur,up,
            -2*Gt*ut*ur,
            -Grtt*ut*ut-Grr*ur*ur-Grp*up*up,
            -2*Gpr*ur*up];
    },

    rk4(state,dt,M) {
        const add=(a,b,f)=>a.map((x,i)=>x+f*b[i]);
        const k1=this.derivatives(state,M);
        const k2=this.derivatives(add(state,k1,dt/2),M);
        const k3=this.derivatives(add(state,k2,dt/2),M);
        const k4=this.derivatives(add(state,k3,dt),M);
        return state.map((x,i)=>x+dt*(k1[i]+2*k2[i]+2*k3[i]+k4[i])/6);
    },

    redshiftFactor(r,M) {
        const A=1-this.schwarzschildRadius(M)/r;
        if(A<=0) return 0;
        return Math.sqrt(A);
    },

    properTimeRate(r,M) {
        return this.redshiftFactor(r,M);
    }
};
