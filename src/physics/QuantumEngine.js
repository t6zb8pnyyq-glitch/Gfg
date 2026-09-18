const QuantumEngine = {
    _solveTridiagonalComplex(aRe, aIm, bRe, bIm, cRe, cIm, dRe, dIm) {
        const n = dRe.length;
        const cr = new Float64Array(n), ci = new Float64Array(n);
        const dr = new Float64Array(n), di = new Float64Array(n);
        const den = (x,y) => x*x + y*y;
        const div = (xr,xi,yr,yi) => {
            const q = den(yr,yi);
            return [(xr*yr+xi*yi)/q, (xi*yr-xr*yi)/q];
        };
        [cr[0],ci[0]] = div(cRe[0],cIm[0],bRe[0],bIm[0]);
        [dr[0],di[0]] = div(dRe[0],dIm[0],bRe[0],bIm[0]);
        for(let i=1;i<n;i++){
            const pr=aRe[i]*cr[i-1]-aIm[i]*ci[i-1];
            const pi=aRe[i]*ci[i-1]+aIm[i]*cr[i-1];
            const br=bRe[i]-pr, bi=bIm[i]-pi;
            const qr=aRe[i]*dr[i-1]-aIm[i]*di[i-1];
            const qi=aRe[i]*di[i-1]+aIm[i]*dr[i-1];
            const rr=dRe[i]-qr, ri=dIm[i]-qi;
            [cr[i],ci[i]]=i<n-1?div(cRe[i],cIm[i],br,bi):[0,0];
            [dr[i],di[i]]=div(rr,ri,br,bi);
        }
        const xr=new Float64Array(n),xi=new Float64Array(n);
        xr[n-1]=dr[n-1];xi[n-1]=di[n-1];
        for(let i=n-2;i>=0;i--){
            const pr=cr[i]*xr[i+1]-ci[i]*xi[i+1];
            const pi=cr[i]*xi[i+1]+ci[i]*xr[i+1];
            xr[i]=dr[i]-pr;xi[i]=di[i]-pi;
        }
        return {re:xr,im:xi};
    },

    normalize(re, im, dx) {
        let norm=0;
        for(let i=0;i<re.length;i++) norm += re[i]*re[i]+im[i]*im[i];
        norm=Math.sqrt(norm*dx);
        if(!Number.isFinite(norm)||norm===0) throw new Error("Quantum normalization failed");
        for(let i=0;i<re.length;i++){re[i]/=norm;im[i]/=norm;}
    },

    norm(re, im, dx) {
        let n=0; for(let i=0;i<re.length;i++) n+=re[i]*re[i]+im[i]*im[i];
        return n*dx;
    },

    solve1DSchrodinger(V_array, dx, dt, steps, particleMass) {
        const N=V_array.length;
        if(N<3||!(dx>0)||!(dt>0)||!(steps>=0)||!(particleMass>0)) throw new Error("Invalid quantum solver parameters");
        const hbar=PhysicsConstants.h_bar, m=particleMass;
        const re=new Float64Array(N), im=new Float64Array(N);
        const x0=(N-1)*0.25, sigma=Math.max(2,N/20);
        for(let i=1;i<N-1;i++) re[i]=Math.exp(-Math.pow(i-x0,2)/(2*sigma*sigma));
        this.normalize(re,im,dx);

        // Crank-Nicolson: (I + i dt H / 2hbar) psi(n+1) =
        // (I - i dt H / 2hbar) psi(n), unconditionally stable for Hermitian H.
        const t=hbar*hbar/(2*m*dx*dx);
        for(let step=0;step<steps;step++){
            const ar=new Float64Array(N),ai=new Float64Array(N);
            const br=new Float64Array(N),bi=new Float64Array(N);
            const cr=new Float64Array(N),ci=new Float64Array(N);
            const dr=new Float64Array(N),di=new Float64Array(N);
            for(let i=1;i<N-1;i++){
                const hdiag=2*t+V_array[i];
                ar[i]=0; ai[i]=-dt*(-t)/(2*hbar);
                br[i]=1; bi[i]=dt*hdiag/(2*hbar);
                cr[i]=0; ci[i]=-dt*(-t)/(2*hbar);
                const oldR=(1-dt*hdiag*0/(2*hbar))*re[i];
                const oldI=(1-dt*hdiag/(2*hbar))*im[i];
                const off=dt*(-t)/(2*hbar);
                dr[i]=oldR + off*im[i-1] + off*im[i+1];
                di[i]=oldI - off*re[i-1] - off*re[i+1];
            }
            // Correct RHS directly from H: psi - i*dt/(2hbar) H psi.
            for(let i=1;i<N-1;i++){
                const hR=-t*re[i-1]+(2*t+V_array[i])*re[i]-t*re[i+1];
                const hI=-t*im[i-1]+(2*t+V_array[i])*im[i]-t*im[i+1];
                dr[i]=re[i]+dt*hI/(2*hbar);
                di[i]=im[i]-dt*hR/(2*hbar);
            }
            const sol=this._solveTridiagonalComplex(ar,ai,br,bi,cr,ci,dr,di);
            re.set(sol.re);im.set(sol.im);
            re[0]=re[N-1]=im[0]=im[N-1]=0;
            this.normalize(re,im,dx);
        }
        return {re,im,norm:this.norm(re,im,dx),method:"Crank-Nicolson",boundary:"Dirichlet psi=0"};
    }
};
