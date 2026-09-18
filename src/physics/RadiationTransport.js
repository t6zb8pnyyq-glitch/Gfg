const RadiationTransport={
    a:4*PhysicsConstants.sigma_sb/PhysicsConstants.c,
    opticalDepth(kappa,rho,ds){
        if(kappa<0||rho<0||ds<0) throw new Error("Negative optical-depth input");
        return kappa*rho*ds;
    },
    levermorePomraningLimiter(R){
        if(!(R>=0)||!Number.isFinite(R)) throw new Error("Invalid FLD gradient parameter");
        return (2+R)/(6+3*R+R*R);
    },
    fluxLimitedDiffusionFlux(E_left,E_right,kappa,rho,ds){
        if(!(E_left>=0&&E_right>=0&&kappa>=0&&rho>=0&&ds>0)) throw new Error("Invalid FLD state");
        const E=Math.max(1e-300,.5*(E_left+E_right));
        const grad=Math.abs(E_right-E_left)/ds;
        const R=grad/Math.max(kappa*rho*E,1e-300);
        const lambda=this.levermorePomraningLimiter(R);
        const D=PhysicsConstants.c*lambda/Math.max(kappa*rho,1e-300);
        const flux=-D*(E_right-E_left)/ds;
        return {flux,lambda,R,causalRatio:Math.abs(flux)/(PhysicsConstants.c*E)};
    },
    diffusionFlux(T_left,T_right,kappa,rho,ds){
        const T=Math.max(1,.5*(T_left+T_right)),D=PhysicsConstants.c/(3*Math.max(kappa*rho,1e-300));
        return -4*this.a*T**3*D*(T_right-T_left)/Math.max(ds,1e-300);
    },
    stepGreyDiffusion(T,rho,kappa,dx,dt){
        if(T.length<3||rho.length!==T.length||kappa.length!==T.length||!(dx>0&&dt>=0)) throw new Error("Invalid radiation grid");
        const out=Float64Array.from(T);
        for(let i=1;i<T.length-1;i++){
            const Dl=PhysicsConstants.c/(3*Math.max(kappa[i-1]*rho[i-1],1e-300)),Dr=PhysicsConstants.c/(3*Math.max(kappa[i]*rho[i],1e-300));
            const El=this.a*T[i]**4,Elp=this.a*T[i+1]**4,Elm=this.a*T[i-1]**4;
            const fluxR=-Dr*(Elp-El)/dx,fluxL=-Dl*(El-Elm)/dx,dEdt=-(fluxR-fluxL)/dx;
            const cv=Math.max(1e-30,4200*rho[i]);
            out[i]=Math.max(0,T[i]+dt*dEdt/cv);
        }
        out[0]=T[0];out[out.length-1]=T[T.length-1];
        return out;
    }
};