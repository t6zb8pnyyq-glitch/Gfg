const Labs = {
        current: "GRAVITY",
        loadLab: function(labName) {
            this.current = labName;
            Engine.objects = []; Diagnostics.initEnergy = 0; Engine.time = 0;
            Engine.activeModels = ["Gravity", "Collision", "Thermodynamics"];
            document.querySelectorAll('.lab-module').forEach(b => b.classList.remove('active'));
            try { document.getElementById('btn-lab-'+labName).classList.add('active'); } catch(e) {}

            let info = "";
            if(labName === 'GALAXY') {
                info = "은하 N-Body 역학 (Barnes-Hut 트리 알고리즘 O(N log N) 사용).";
                Engine.gravityAlgorithm = "BARNES_HUT"; document.getElementById('sys-gravity').value = "BARNES_HUT";
                let smbhMass = 1e35;
                Engine.objects.push(new PhysicalBody("SMBH", "BLACK_HOLE", smbhMass, 1e9, new Vec3(), new Vec3())); // Central BH
                for(let i=0; i<300; i++) {
                    let r = 1e11 + Math.random()*1e12;
                    let theta = Math.random()*Math.PI*2;
                    let v = Math.sqrt(PhysicsConstants.G * smbhMass / r);
                    Engine.objects.push(new PhysicalBody("S"+i, "STAR", PhysicsConstants.M_sun, 1e8,
                        new Vec3(r*Math.cos(theta), 0, r*Math.sin(theta)),
                        new Vec3(-v*Math.sin(theta), 0, v*Math.cos(theta))));
                }
                Engine.dt = 1.0; Renderer.scale = 1e-10; // lower timestep to avoid numerical divergence of energy error.
            }
            else if(labName === 'GRAVITY') {
                info = "표준 N-Body 중력 (태양계 내부 근사).";
                Engine.gravityAlgorithm = "DIRECT"; document.getElementById('sys-gravity').value = "DIRECT";
                Engine.objects.push(new PhysicalBody("Sun", "STAR", PhysicsConstants.M_sun, 6.96e8, new Vec3(), new Vec3()));
                Engine.objects.push(new PhysicalBody("Earth", "PLANET", PhysicsConstants.M_earth, 6.37e6, new Vec3(PhysicsConstants.AU,0,0), new Vec3(0, 29780, 0)));
                Engine.dt = 3600; Renderer.scale = 1e-9;
            }
            else if(labName === 'SPH_FLUID') {
                info = "SPH (Smoothed Particle Hydrodynamics) 유체 동역학.";
                Engine.activeModels.push("Fluid", "Thermodynamics");
                for(let i=0; i<50; i++) {
                    Engine.objects.push(new PhysicalBody("G"+i, "GAS_CLOUD", 1e20, 1e5,
                        new Vec3((Math.random()-0.5)*1e6, (Math.random()-0.5)*1e6, 0), new Vec3()));
                }
                Engine.dt = 1; Renderer.scale = 1e-4;
            }
            else if(labName === 'NUCLEAR') {
                info = "항성 구조 및 핵융합 (PP-Chain Network). 온도와 밀도에 따른 수소 질량 분율 변화 확인.";
                Engine.activeModels.push("Nuclear", "Thermodynamics");
                let star = new PhysicalBody("Star", "STAR", PhysicsConstants.M_sun, 6.96e8, new Vec3(), new Vec3());
                Engine.objects.push(star);
                Engine.dt = 3.15e7 * 1e6; // 1 million years per step to see fusion
                Renderer.scale = 1e-9;
            }
            else if(labName === 'QUANTUM') {
                info = "1차원 양자 역학 (슈뢰딩거 방정식). 100 스텝 유한차분법(FD) 시뮬레이션 완료.";
                let V = new Float32Array(100).fill(0); V[50] = 100;
                let m_e = 9.109e-31;
                let q_res = QuantumEngine.solve1DSchrodinger(V, 0.1, 0.01, 100, m_e);
                info += `<br><br>[QUANTUM STATE]<br>Wavepacket Normalized Integration Complete.<br>Max Probability Amplitude: ${Math.max(...q_res.re).toExponential(3)}`;
            }
            else if(labName === 'MHD') {
                info = "1D ideal MHD conservative finite-volume laboratory (Rusanov flux).";
                Engine.activeModels = [];
                const N=64, dx=1e7, Bx=1e-3;
                const U=[];
                for(let i=0;i<N;i++){
                    const left=i<N/2, rho=left?1e-6:1.25e-6, p=left?1e5:1e4, vx=left?0:0, By=left?1e-3: -1e-3;
                    const E=p/(5/3-1)+0.5*rho*vx*vx+0.5*(Bx*Bx+By*By)/PhysicsConstants.mu_0;
                    const u=[rho,rho*vx,0,0,E,By,0]; u.Bx=Bx; U.push(u);
                }
                const evolved=MHD1D.step(U,dx,100, Bx);
                Diagnostics.mhdState=evolved;
                info += "<br><br>[MHD STATE]<br>64-cell conservative update completed.";
            }
            else if(labName === 'RADIATION') {
                info = "Grey radiative diffusion laboratory with optical-depth diagnostics.";
                Engine.activeModels = [];
                const N=64,T=new Float64Array(N),rho=new Float64Array(N),k=new Float64Array(N);
                for(let i=0;i<N;i++){T[i]=300+7000*Math.exp(-((i-N/2)/(N/6))**2);rho[i]=1e-4;k[i]=0.34;}
                const out=RadiationTransport.stepGreyDiffusion(T,rho,k,1e7,10);
                Diagnostics.radiationTemperature=out;
                info += "<br><br>[RADIATION STATE]<br>Grey diffusion step completed.";
            }
            else if(labName === 'STELLAR') {
                info = "1D hydrostatic stellar structure (EOS + opacity + analytic reaction-rate source terms).";
                Engine.activeModels = [];
                const model=StellarStructure.integrate({rho_c:1.6e5,T_c:1.5e7,Mmax:PhysicsConstants.M_sun,dm:PhysicsConstants.M_sun/4000});
                Diagnostics.stellarProfile=model.profile;
                info += "<br><br>[STELLAR STATE]<br>Integrated shells: "+model.profile.length+"<br>Enclosed mass: "+model.mass.toExponential(3)+" kg";
            }
            else if(labName === 'GR') {
                info = "Schwarzschild geodesic laboratory using proper-time equations.";
                Engine.activeModels = [];
                const M=PhysicsConstants.M_sun, r0=10*GRGeodesic.schwarzschildRadius(M);
                const state=[0,r0,0,PhysicsConstants.c,0,0.0001];
                let s=state; for(let i=0;i<100;i++) s=GRGeodesic.rk4(s,0.01,M);
                Diagnostics.grState=s;
                info += "<br><br>[GR STATE]<br>Geodesic integration completed; redshift factor: "+GRGeodesic.redshiftFactor(r0,M).toExponential(6);
            }
            else if(labName === 'COSMOLOGY') {
                info = "빅뱅 팽창 (프리드만 우주론). 척도 인자 a(t) 진화 확인 완료.";

                // H0 = 70 km/s/Mpc must be converted to s^-1.
                // We use the centralized PhysicsConstants.H0_s value.
                let history = CosmologyEngine.solveFriedmann(PhysicsConstants.H0_s, 0.3, 0.0, 0.7, PhysicsConstants.yr * 1e9, PhysicsConstants.yr * 1e7, 0.1);
                Diagnostics.cosmologyHistory = history;
                let lastScale = history[history.length-1].a;
                info += `<br><br>[COSMOLOGY STATE]<br>1B Years Integration Complete.<br>Scale Factor a(t=1Byr): ${lastScale.toFixed(4)}`;

            }

            let ins = document.getElementById('inspector-data');
            if(ins) {
                ins.innerHTML = `<b>모듈: ${labName}</b><br><p>${info}</p>
                <br><i>활성 엔진(Active Engines):</i><br> ${Engine.activeModels.join('<br>')}`;
            }
            document.getElementById('sys-dt').value = Engine.dt;
        }
    }