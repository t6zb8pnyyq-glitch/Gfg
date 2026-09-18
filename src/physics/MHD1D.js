const MHD1D = {
    gamma:5/3,

    flux(U) {
        const [rho,mx,my,mz,E,By,Bz]=U;
        const vx=mx/rho, vy=my/rho, vz=mz/rho;
        const Bx=U.Bx;
        const B2=Bx*Bx+By*By+Bz*Bz;
        const v2=vx*vx+vy*vy+vz*vz;
        const p=Math.max(0,(this.gamma-1)*(E-0.5*rho*v2-0.5*B2/PhysicsConstants.mu_0));
        const pt=p+B2/(2*PhysicsConstants.mu_0);
        const vdotB=vx*Bx+vy*By+vz*Bz;
        return [
            mx,
            mx*vx+p+ (By*By+Bz*Bz-Bx*Bx)/(2*PhysicsConstants.mu_0),
            my*vx-By*Bx/PhysicsConstants.mu_0,
            mz*vx-Bz*Bx/PhysicsConstants.mu_0,
            (E+pt)*vx-Bx*vdotB/PhysicsConstants.mu_0,
            By*vx-Bx*vy,
            Bz*vx-Bx*vz
        ];
    },

    fastSpeed(U) {
        const [rho,mx,my,mz,E,By,Bz]=U, Bx=U.Bx;
        const vx=mx/rho, v2=(mx*mx+my*my+mz*mz)/(rho*rho);
        const B2=Bx*Bx+By*By+Bz*Bz;
        const p=Math.max(0,(this.gamma-1)*(E-0.5*rho*v2-0.5*B2/PhysicsConstants.mu_0));
        const a2=this.gamma*p/rho, va2=B2/(PhysicsConstants.mu_0*rho);
        const term=a2+va2, disc=Math.max(0,term*term-4*a2*Bx*Bx/(PhysicsConstants.mu_0*rho));
        return Math.sqrt(0.5*(term+Math.sqrt(disc)));
    },

    rusanovFlux(L,R,Bx) {
        L=Object.assign([],L,{Bx}); R=Object.assign([],R,{Bx});
        const fL=this.flux(L),fR=this.flux(R);
        const s=Math.max(Math.abs(L[1]/L[0])+this.fastSpeed(L),Math.abs(R[1]/R[0])+this.fastSpeed(R));
        return fL.map((x,i)=>0.5*(x+fR[i])-0.5*s*(R[i]-L[i]));
    },

    step(U,dx,dt,Bx) {
        const n=U.length, F=new Array(n-1);
        for(let i=0;i<n-1;i++)F[i]=this.rusanovFlux(U[i],U[i+1],Bx);
        const out=U.map(u=>u.slice());
        for(let i=1;i<n-1;i++)for(let k=0;k<7;k++)out[i][k]-=dt/dx*(F[i][k]-F[i-1][k]);
        for(const u of out)u.Bx=Bx;
        return out;
    }
};
