const Labs = {
    current:"GRAVITY",
    loadLab:function(labName){
        this.current=labName; Engine.objects=[]; Diagnostics.initEnergy=null; Diagnostics.initialMomentum=null; Diagnostics.initialAngularMomentum=null; Engine.time=0; Engine.status="STABLE"; Engine.paused=false;
        Engine.activeModels=["Gravity","Collision","Nuclear","Thermodynamics"];
        document.querySelectorAll(".lab-module").forEach(b=>b.classList.remove("active"));
        try{document.getElementById("btn-lab-"+labName).classList.add("active")}catch(e){}
        let info="";
        if(labName==="SOLAR_SYSTEM"){
            Engine.activeModels=["Gravity","Collision","Thermodynamics"];
            if(!EphemerisEngine.available()) throw new Error("Astronomy Engine unavailable");
            EphemerisEngine.seedSolarSystem(Engine.objects,0);
            Engine.gravityAlgorithm="DIRECT"; document.getElementById("sys-gravity").value="DIRECT";
            Engine.dt=21600; Renderer.scale=1e-9;
            info="Astronomy Engine 기준 J2000 태양계 초기조건을 SI 단위로 변환하여 Newtonian N-body로 전파합니다. 초기조건의 기준은 천체력이며 이후 운동은 본 엔진이 계산합니다.";
            info+="<br><br>[INITIAL STATE]<br>Objects: "+Engine.objects.length+"<br>Frame: J2000 barycentric<br>t=J2000";
        } else if(labName==="GALAXY"){
            info="은하 N-Body 역학 (Barnes-Hut 트리 알고리즘 O(N log N) 사용)."; Engine.gravityAlgorithm="BARNES_HUT"; document.getElementById("sys-gravity").value="BARNES_HUT";
            const smbhMass=1e35; Engine.objects.push(new PhysicalBody("SMBH","BLACK_HOLE",smbhMass,1e9,new Vec3(),new Vec3()));
            for(let i=0;i<300;i++){const r=1e11+Math.random()*1e12,theta=Math.random()*Math.PI*2,v=Math.sqrt(PhysicsConstants.G*smbhMass/r);Engine.objects.push(new PhysicalBody("S"+i,"STAR",PhysicsConstants.M_sun,1e8,new Vec3(r*Math.cos(theta),0,r*Math.sin(theta)),new Vec3(-v*Math.sin(theta),0,v*Math.cos(theta))));}
            Engine.dt=1; Renderer.scale=1e-10;
        } else if(labName==="GRAVITY"){
            info="표준 N-body 중력 (태양계 내부 근사)."; Engine.gravityAlgorithm="DIRECT"; document.getElementById("sys-gravity").value="DIRECT";
            Engine.objects.push(new PhysicalBody("Sun","STAR",PhysicsConstants.M_sun,6.96e8,new Vec3(),new Vec3()));
            Engine.objects.push(new PhysicalBody("Earth","PLANET",PhysicsConstants.M_earth,6.37e6,new Vec3(PhysicsConstants.AU,0,0),new Vec3(0,29780,0))); Engine.dt=21600; Renderer.scale=1e-9;
        } else if(labName==="SPH_FLUID"){
            info="SPH 유체역학."; Engine.activeModels=["Fluid","Thermodynamics"];
            for(let i=0;i<50;i++) Engine.objects.push(new PhysicalBody("G"+i,"GAS_CLOUD",1e20,1e5,new Vec3((Math.random()-.5)*1e6,(Math.random()-.5)*1e6,0),new Vec3()));
            Engine.dt=1; Renderer.scale=1e-4;
        } else if(labName==="NUCLEAR"){
            info="항성 구조 및 핵융합 (PP/CNO 반응률 모델)."; Engine.activeModels=["Nuclear","Thermodynamics"];
            Engine.objects.push(new PhysicalBody("Star","STAR",PhysicsConstants.M_sun,6.96e8,new Vec3(),new Vec3())); Engine.dt=3.15e7*1e6; Renderer.scale=1e-9;
        } else if(labName==="QUANTUM"){
            info="1차원 시간의존/고유값 슈뢰딩거 방정식 (Crank-Nicolson + Jacobi eigensolver, Dirichlet 경계).";
            const N=128,V=new Float64Array(N); V[62]=1e-18;V[63]=1e-18;V[64]=1e-18;V[65]=1e-18;V[66]=1e-18;
            const q=QuantumEngine.solve1DSchrodinger(V,1e-10,1e-20,100,9.1093837015e-31);
            const eig=QuantumEngine.eigenvalues1D(V,1e-10,9.1093837015e-31,4); info+="<br><br>[QUANTUM STATE]<br>Norm: "+q.norm.toExponential(6)+"<br>Eigenvalues: "+eig.map(x=>x.toExponential(4)).join(", ")+" J<br>Method: "+q.method;
        } else if(labName==="MHD"){
            info="1D ideal MHD conservative finite-volume laboratory (Rusanov flux + CFL control)."; Engine.activeModels=[];
            const N=64,dx=1e7,Bx=1e-3,U=[];
            for(let i=0;i<N;i++){const left=i<N/2,rho=left?1e-6:1.25e-6,p=left?1e5:1e4,By=left?1e-3:-1e-3,E=p/(5/3-1)+.5*(Bx*Bx+By*By)/PhysicsConstants.mu_0;U.push([rho,0,0,0,E,By,0]);}
            const dt=Math.min(100,MHD1D.cflDt(U,dx,Bx)*.5),evolved=MHD1D.step(U,dx,dt,Bx); Diagnostics.mhdState=evolved;
            info+="<br><br>[MHD STATE]<br>64-cell conservative update completed.<br>CFL dt: "+dt.toExponential(3)+" s";
        } else if(labName==="RADIATION"){
            info="Grey radiative diffusion laboratory with optical-depth diagnostics."; Engine.activeModels=[];
            const N=64,T=new Float64Array(N),rho=new Float64Array(N),k=new Float64Array(N); for(let i=0;i<N;i++){T[i]=300+7000*Math.exp(-(((i-N/2)/(N/6))**2));rho[i]=1e-4;k[i]=.34;}
            Diagnostics.radiationTemperature=RadiationTransport.stepGreyDiffusion(T,rho,k,1e7,10); info+="<br><br>[RADIATION STATE]<br>Grey diffusion step completed.";
        } else if(labName==="STELLAR"){
            info="1D hydrostatic stellar structure (EOS + opacity + reaction-rate source terms)."; Engine.activeModels=[];
            const model=StellarStructure.integrate({rho_c:1.6e5,T_c:1.5e7,Mmax:PhysicsConstants.M_sun,dm:PhysicsConstants.M_sun/4000}); Diagnostics.stellarProfile=model.profile;
            info+="<br><br>[STELLAR STATE]<br>Integrated shells: "+model.profile.length+"<br>Enclosed mass: "+model.mass.toExponential(3)+" kg<br>Luminosity: "+model.luminosity.toExponential(3)+" W";
        } else if(labName==="GR"){
            info="Schwarzschild timelike + null geodesic laboratory with invariant checks."; Engine.activeModels=[];
            const M=PhysicsConstants.M_sun,r0=10*GRGeodesic.schwarzschildRadius(M),A=1-GRGeodesic.schwarzschildRadius(M)/r0,state=[0,r0,0,1/Math.sqrt(A),0,0.0001];
            let s=state;for(let i=0;i<100;i++)s=GRGeodesic.rk4(s,1,M);const nullState=[0,r0,0,1/(1-GRGeodesic.schwarzschildRadius(M)/r0),1,0];let ns=nullState;for(let i=0;i<100;i++)ns=GRGeodesic.rk4Null(ns,1,M);Diagnostics.grState={timelike:s,null:ns,nullInvariant:GRGeodesic.nullNormalization(ns,M)};info+="<br><br>[GR STATE]<br>Timelike geodesic integration completed; redshift factor: "+GRGeodesic.redshiftFactor(r0,M).toExponential(6);
        } else if(labName==="EPHEMERIS"){
            Engine.activeModels=[];
            const available=EphemerisEngine.available();
            info="검증된 태양계 천체력 기준 모듈. Astronomy Engine의 J2000 barycentric 상태벡터를 SI 단위로 변환합니다.";
            if(available){
                const states=EphemerisEngine.solarSystem(Engine.time);
                Diagnostics.ephemerisState=states;
                info+="<br><br>[EPHEMERIS STATE]<br>Provider: Astronomy Engine<br>Reference: J2000 / barycentric<br>Earth r: "+states.find(s=>s.name==="Earth").pos.mag().toExponential(6)+" m<br>Earth v: "+states.find(s=>s.name==="Earth").vel.mag().toExponential(6)+" m/s<br>Bodies: "+states.length;
            }else{
                info+="<br><br>[EPHEMERIS STATE]<br>외부 런타임 의존성 없이 동작하도록 vendored bundle을 포함해야 합니다. 현재 provider unavailable.";
            }
        } else if(labName==="COSMOLOGY"){
            info="빅뱅 팽창 (프리드만 우주론).";Engine.activeModels=[];
            const history=CosmologyEngine.solveFriedmann(PhysicsConstants.H0_s,.3,0,.7,PhysicsConstants.yr*1e9,PhysicsConstants.yr*1e7,.1);Diagnostics.cosmologyHistory=history;
            info+="<br><br>[COSMOLOGY STATE]<br>1 Byr integration complete.<br>Scale Factor: "+history[history.length-1].a.toFixed(4);
        }
        const ins=document.getElementById("inspector-data");if(ins)ins.innerHTML="<b>모듈: "+labName+"</b><br><p>"+info+"</p><br><i>활성 엔진:</i><br>"+Engine.activeModels.join("<br>");
        const dt=document.getElementById("sys-dt");if(dt)dt.value=Engine.dt;
    }
};