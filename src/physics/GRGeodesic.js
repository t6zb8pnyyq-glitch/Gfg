const GRGeodesic={
 schwarzschildRadius(M){return 2*PhysicsConstants.G*M/(PhysicsConstants.c**2)},
 redshiftFactor(r,M){const A=1-this.schwarzschildRadius(M)/r;return A>0?Math.sqrt(A):0},
 properTimeRate(r,M){return this.redshiftFactor(r,M)},
 metric(r,M){const rs=this.schwarzschildRadius(M),A=1-rs/r;if(A<=0)throw new Error("Schwarzschild chart singular at/inside horizon");return[-A,1/A,r*r,r*r]},
 derivatives(s,M){
  const[t,r,phi,ut,ur,up]=s,rs=this.schwarzschildRadius(M),A=1-rs/r;if(r<=rs)throw new Error("Geodesic reached Schwarzschild horizon");
  const Ap=rs/(r*r);
  return[ut,ur,up,-Ap/(A)*ut*ur,-(A*Ap/2)*ut*ut+(Ap/(2*A))*ur*ur+A*r*up*up,-2*ur*up/r];
 },
 rk4(s,dt,M){const add=(a,b,f)=>a.map((x,i)=>x+f*b[i]),k1=this.derivatives(s,M),k2=this.derivatives(add(s,k1,dt/2),M),k3=this.derivatives(add(s,k2,dt/2),M),k4=this.derivatives(add(s,k3,dt),M);return s.map((x,i)=>x+dt*(k1[i]+2*k2[i]+2*k3[i]+k4[i])/6)}
};