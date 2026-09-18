const StellarStructure = {
    G:PhysicsConstants.G,

    integrate({rho_c,T_c,Mmax=PhysicsConstants.M_sun,dm=Mmax/2000,composition={X:.73,Y:.25,Z:.02}}={}) {
        if(!(rho_c>0&&T_c>0&&dm>0))throw new Error("Invalid stellar central conditions");
        const profile=[];
        let m=dm, r=Math.cbrt(3*dm/(4*Math.PI*rho_c)), rho=rho_c, T=T_c;
        let P=EOS.pressure(rho,T,composition), L=dm*NuclearNetwork.rates(rho,T,composition).pp;
        for(let k=0;k<100000&&m<=Mmax;k++,m+=dm){
            const opacity=EOS.opacity(rho,T,composition);
            profile.push({m,r,rho,T,P,L,opacity});
            const dPdm=-this.G*m/(4*Math.PI*Math.max(r,1e-30)**4);
            const drdm=1/(4*Math.PI*Math.max(r,1e-30)**2*Math.max(rho,1e-300));
            const dLdm=NuclearNetwork.rates(rho,T,composition).pp;
            const dTdm=-3*opacity*L/(64*Math.PI**2*PhysicsConstants.sigma_sb/PhysicsConstants.c*PhysicsConstants.c*Math.max(r,1e-30)**4*Math.max(T,1));
            P+=dPdm*dm; r+=drdm*dm; L=Math.max(0,L+dLdm*dm);
            if(P<=0||!Number.isFinite(P)||!Number.isFinite(r)||r<=0)break;
            const mu=EOS.meanMolecularWeight(composition,true);
            rho=Math.max(1e-20,P*mu*EOS.atomicMassUnit/(PhysicsConstants.k_B*T));
            T=Math.max(2.73,T+dTdm*dm);
        }
        return {profile, mass:profile.length?profile[profile.length-1].m:0};
    }
};
