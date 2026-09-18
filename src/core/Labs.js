const Labs = {
        current: "GRAVITY",
        loadLab: function(labName) {
            this.current = labName;
            Engine.objects = []; Diagnostics.initEnergy = 0; Engine.time = 0;
            Engine.activeModels = ["Gravity", "Collision"];
            document.querySelectorAll('.lab-btn').forEach(b => b.classList.remove('active'));
            document.getElementById('btn-lab-'+labName).classList.add('active');

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
                Engine.activeModels.push("Fluid");
                for(let i=0; i<50; i++) {
                    Engine.objects.push(new PhysicalBody("G"+i, "GAS_CLOUD", 1e20, 1e5,
                        new Vec3((Math.random()-0.5)*1e6, (Math.random()-0.5)*1e6, 0), new Vec3()));
                }
                Engine.dt = 1; Renderer.scale = 1e-4;
            }
            else if(labName === 'NUCLEAR') {
                info = "항성 구조 및 핵융합 (PP-Chain Network). 온도와 밀도에 따른 수소 질량 분율 변화 확인.";
                Engine.activeModels.push("Nuclear");
                let star = new PhysicalBody("Star", "STAR", PhysicsConstants.M_sun, 6.96e8, new Vec3(), new Vec3());
                Engine.objects.push(star);
                Engine.dt = 3.15e7 * 1e6; // 1 million years per step to see fusion
                Renderer.scale = 1e-9;
            }
            else if(labName === 'QUANTUM') {
                info = "1차원 양자 역학 (슈뢰딩거 방정식). 100 스텝 유한차분법(FD) 시뮬레이션 완료.";
                let V = new Float32Array(100).fill(0); V[50] = 100;
                let q_res = QuantumEngine.solve1DSchrodinger(V, 0.1, 0.01, 100);
            }
            else if(labName === 'COSMOLOGY') {
                info = "빅뱅 팽창 (프리드만 우주론). 척도 인자 a(t) 진화 확인 완료.";
                CosmologyEngine.solveFriedmann(70, 0.3, 0.0, 0.7, 1.0, 0.05);
            }

            document.getElementById('inspector-content').innerHTML = `<b>모듈: ${labName}</b><br><p>${info}</p>
            <br><i>활성 엔진(Active Engines):</i><br> ${Engine.activeModels.join('<br>')}`;
            document.getElementById('sys-dt').value = Engine.dt;
        }
    }