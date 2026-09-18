const RadiationTransport = {
    a:4*PhysicsConstants.sigma_sb/PhysicsConstants.c,

    opticalDepth(kappa,rho,ds) { return Math.max(0,kappa*rho*ds); },

    diffusionFlux(T_left,T_right,kappa,rho,ds) {
        const T=Math.max(1,0.5*(T_left+T_right));
        const D=PhysicsConstants.c/(3*Math.max(kappa*rho,1e-300));
        return -4*this.a*T**3*D*(T_right-T_left)/Math.max(ds,1e-300);
    },

    stepGreyDiffusion(T,rho,kappa,dx,dt,emissionFn=()=>0) {
        if(T.length<3) throw new Error("Radiation grid requires >=3 cells");
        const out=Float64Array.from(T);
        for(let i=1;i<T.length-1;i++){
            const Dl=PhysicsConstants.c/(3*Math.max(kappa[i-1]*rho[i-1],1e-300));
            const Dr=PhysicsConstants.c/(3*Math.max(kappa[i]*rho[i],1e-300));
            const DlF=4*this.a*T[i]**3*Dl;
            const DrF=4*this.a*T[i]**3*Dr;
            const lap=(DrF*(T[i+1]-T[i])-DlF*(T[i]-T[i-1]))/(dx*dx);
            const net=lap+emissionFn(i,T[i]);
            out[i]=Math.max(0,T[i]+dt*net/(Math.max(rho[i],1e-300)*4200));
        }
        out[0]=T[0];out[T.length-1]=T[T.length-1];
        return out;
    }
};
