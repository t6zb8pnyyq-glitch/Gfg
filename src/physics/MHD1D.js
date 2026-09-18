const MHD1D={
    gamma:5/3,
    flux(U,Bx){
        const[rho,mx,my,mz,E,By,Bz]=U;
        if(!(rho>0)||!U.every(Number.isFinite)) throw new Error("Invalid MHD conservative state");
        const vx=mx/rho,vy=my/rho,vz=mz/rho,B2=Bx*Bx+By*By+Bz*Bz,v2=vx*vx+vy*vy+vz*vz;
        const p=(this.gamma-1)*(E-.5*rho*v2-.5*B2/PhysicsConstants.mu_0);
        if(!(p>0)||!Number.isFinite(p)) throw new Error("Non-positive MHD pressure");
        const pt=p+B2/(2*PhysicsConstants.mu_0),vdB=vx*Bx+vy*By+vz*Bz;
        return[mx,mx*vx+p+(By*By+Bz*Bz-Bx*Bx)/(2*PhysicsConstants.mu_0),my*vx-By*Bx/PhysicsConstants.mu_0,mz*vx-Bz*Bx/PhysicsConstants.mu_0,(E+pt)*vx-Bx*vdB/PhysicsConstants.mu_0,By*vx-Bx*vy,Bz*vx-Bx*vz];
    },
    fastSpeed(U,Bx){
        const[rho,mx,my,mz,E,By,Bz]=U,v2=(mx*mx+my*my+mz*mz)/(rho*rho),B2=Bx*Bx+By*By+Bz*Bz;
        const p=(this.gamma-1)*(E-.5*rho*v2-.5*B2/PhysicsConstants.mu_0);
        if(!(rho>0&&p>0)) throw new Error("Invalid MHD state for wave speed");
        const a2=this.gamma*p/rho,va2=B2/(PhysicsConstants.mu_0*rho),term=a2+va2,disc=Math.max(0,term*term-4*a2*Bx*Bx/(PhysicsConstants.mu_0*rho));
        return Math.sqrt(Math.max(0,.5*(term+Math.sqrt(disc))));
    },
    cflDt(U,dx,Bx,cfl=.4){
        if(!(dx>0&&cfl>0&&cfl<=1)) throw new Error("Invalid CFL parameters");
        let s=0;for(const u of U)s=Math.max(s,Math.abs(u[1]/u[0])+this.fastSpeed(u,Bx));
        if(!(s>0)) return Infinity;
        return cfl*dx/s;
    },
    rusanovFlux(L,R,Bx){
        const fL=this.flux(L,Bx),fR=this.flux(R,Bx),s=Math.max(Math.abs(L[1]/L[0])+this.fastSpeed(L,Bx),Math.abs(R[1]/R[0])+this.fastSpeed(R,Bx));
        return fL.map((x,i)=>.5*(x+fR[i])-.5*s*(R[i]-L[i]));
    },
    step(U,dx,dt,Bx,cfl=.4){
        if(!Array.isArray(U)||U.length<3) throw new Error("MHD grid too small");
        const maxDt=this.cflDt(U,dx,Bx,cfl);
        if(dt>maxDt*(1+1e-12)) throw new Error("MHD CFL violation: dt="+dt+" > "+maxDt);
        const N=U.length,F=new Array(N+1);
        F[0]=this.flux(U[0],Bx);
        for(let i=0;i<N-1;i++)F[i+1]=this.rusanovFlux(U[i],U[i+1],Bx);
        F[N]=this.flux(U[N-1],Bx);
        const out=U.map(u=>u.slice());
        for(let i=0;i<N;i++){for(let k=0;k<7;k++)out[i][k]-=dt/dx*(F[i+1][k]-F[i][k]);this.flux(out[i],Bx);}
        return out;
    }
};