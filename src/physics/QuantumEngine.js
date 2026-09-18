const QuantumEngine={
    _solveTridiagonalComplex(aRe,aIm,bRe,bIm,cRe,cIm,dRe,dIm){
        const n=dRe.length,cr=new Float64Array(n),ci=new Float64Array(n),dr=new Float64Array(n),di=new Float64Array(n),den=(x,y)=>x*x+y*y,div=(xr,xi,yr,yi)=>{const q=den(yr,yi);if(q===0)throw new Error("Singular complex tridiagonal pivot");return[(xr*yr+xi*yi)/q,(xi*yr-xr*yi)/q]};
        cr[0]=n>1?div(cRe[0],cIm[0],bRe[0],bIm[0])[0]:0;ci[0]=n>1?div(cRe[0],cIm[0],bRe[0],bIm[0])[1]:0;[dr[0],di[0]]=div(dRe[0],dIm[0],bRe[0],bIm[0]);
        for(let i=1;i<n;i++){const pr=aRe[i]*cr[i-1]-aIm[i]*ci[i-1],pi=aRe[i]*ci[i-1]+aIm[i]*cr[i-1],br=bRe[i]-pr,bi=bIm[i]-pi,qr=aRe[i]*dr[i-1]-aIm[i]*di[i-1],qi=aRe[i]*di[i-1]+aIm[i]*dr[i-1],rr=dRe[i]-qr,ri=dIm[i]-qi;if(i<n-1)[cr[i],ci[i]]=div(cRe[i],cIm[i],br,bi);[dr[i],di[i]]=div(rr,ri,br,bi)}
        const xr=new Float64Array(n),xi=new Float64Array(n);xr[n-1]=dr[n-1];xi[n-1]=di[n-1];for(let i=n-2;i>=0;i--){const pr=cr[i]*xr[i+1]-ci[i]*xi[i+1],pi=cr[i]*xi[i+1]+ci[i]*xr[i+1];xr[i]=dr[i]-pr;xi[i]=di[i]-pi}return{re:xr,im:xi};
    },
    normalize(re,im,dx){let n=0;for(let i=0;i<re.length;i++)n+=re[i]*re[i]+im[i]*im[i];n=Math.sqrt(n*dx);if(!Number.isFinite(n)||n===0)throw new Error("Quantum normalization failed");for(let i=0;i<re.length;i++){re[i]/=n;im[i]/=n}},
    norm(re,im,dx){let n=0;for(let i=0;i<re.length;i++)n+=re[i]*re[i]+im[i]*im[i];return n*dx},
    solve1DSchrodinger(V,dx,dt,steps,m){
        const N=V.length;if(N<3||!(dx>0)||!(dt>0)||!(steps>=0)||!(m>0)||!V.every(Number.isFinite))throw new Error("Invalid quantum solver parameters");
        const h=PhysicsConstants.h_bar,re=new Float64Array(N),im=new Float64Array(N),x0=(N-1)*.25,sigma=Math.max(2,N/20);for(let i=1;i<N-1;i++)re[i]=Math.exp(-Math.pow(i-x0,2)/(2*sigma*sigma));this.normalize(re,im,dx);
        const n=N-2,t=h*h/(2*m*dx*dx),ar=new Float64Array(n),ai=new Float64Array(n),br=new Float64Array(n),bi=new Float64Array(n),cr=new Float64Array(n),ci=new Float64Array(n),dr=new Float64Array(n),di=new Float64Array(n);
        for(let step=0;step<steps;step++){for(let j=0;j<n;j++){const i=j+1,H=2*t+V[i];ar[j]=0;ai[j]=-dt*t/(2*h);br[j]=1;bi[j]=dt*H/(2*h);cr[j]=0;ci[j]=-dt*t/(2*h);const hr=-t*re[i-1]+H*re[i]-t*re[i+1],hi=-t*im[i-1]+H*im[i]-t*im[i+1];dr[j]=re[i]+dt*hi/(2*h);di[j]=im[i]-dt*hr/(2*h)}const sol=this._solveTridiagonalComplex(ar,ai,br,bi,cr,ci,dr,di);re.fill(0);im.fill(0);for(let j=0;j<n;j++){re[j+1]=sol.re[j];im[j+1]=sol.im[j]}this.normalize(re,im,dx)}
        return{re,im,norm:this.norm(re,im,dx),method:"Crank-Nicolson",boundary:"Dirichlet psi=0"};
    },
    eigenvalues1D(V,dx,m,count=4){
        const N=V.length;if(N<4||!(dx>0&&m>0)||!V.every(Number.isFinite))throw new Error("Invalid eigenvalue problem");
        const n=N-2,k=PhysicsConstants.h_bar**2/(2*m*dx**2),diag=new Float64Array(n),off=-k;
        let lo=Infinity,hi=-Infinity;
        for(let i=0;i<n;i++){diag[i]=2*k+V[i+1];lo=Math.min(lo,diag[i]-(i?Math.abs(off):0)-(i<n-1?Math.abs(off):0));hi=Math.max(hi,diag[i]+(i?Math.abs(off):0)+(i<n-1?Math.abs(off):0))}
        const sturm=(x)=>{let count=0,p=1;for(let i=0;i<n;i++){const q=diag[i]-x-(i?p===0?1e-300:(off*off)/p:0);if(q<0)count++;p=q}return count};
        const out=[];
        for(let target=1;target<=Math.min(count,n);target++){
            let a=lo,b=hi;
            for(let iter=0;iter<90;iter++){const mid=.5*(a+b);if(sturm(mid)>=target)b=mid;else a=mid}
            out.push(.5*(a+b));
        }
        return out;
    },
    tunnelingTransmission(V,dx,m,energy){
        const E=energy,k=PhysicsConstants.h_bar,k2=2*m*(E-Math.max(...V));if(!(E>=Math.min(...V)))throw new Error("Energy below potential domain");
        const barrier=V.map(v=>Math.max(0,v-E));let integral=0;for(let i=0;i<barrier.length-1;i++)integral+=.5*(Math.sqrt(2*m*barrier[i])+Math.sqrt(2*m*barrier[i+1]))*dx;
        return Math.exp(-2*integral/k);
    }
};