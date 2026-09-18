const Engine={
    objects:[],time:0,dt:21600,paused:false,status:"STABLE",integratorType:"verlet",gravityAlgorithm:"DIRECT",
    activeModels:["Gravity","Collision","Nuclear","Thermodynamics"],minDt:1e-6,maxDt:3.154e12,adaptiveDt:false,adaptiveTolerance:1e-8,maxAdaptiveAttempts:8,safety:.1,_acceptedDt:21600,_adaptiveError:0,
    getAccelerations(objs){
        const a=objs.map(()=>new Vec3());
        if(this.activeModels.includes("Gravity")){const g=GravityEngine.computeAccelerations(objs,this.gravityAlgorithm==="BARNES_HUT");for(let i=0;i<objs.length;i++)a[i]=a[i].add(g[i]);}
        if(this.activeModels.includes("Relativity")){const g=RelativityEngine.computeSchwarzschildPrecession(objs);for(let i=0;i<objs.length;i++)a[i]=a[i].add(g[i]);}
        if(this.activeModels.includes("Electromagnetic")){const g=ElectromagneticEngine.computeAccelerations(objs);for(let i=0;i<objs.length;i++)a[i]=a[i].add(g[i]);}
        if(this.activeModels.includes("Fluid")){const g=FluidEngine.computeAccelerations(objs);for(let i=0;i<objs.length;i++){const fg=g.get(objs[i]);if(fg)a[i]=a[i].add(fg);}}
        return a;
    },
    validateState(){
        for(const o of this.objects){
            if(!o.isFiniteState()) throw new Error("비유한/잘못된 객체 상태: "+o.id);
            if(o.vel.magSq()>=PhysicsConstants.c**2) throw new Error("광속 초과: "+o.id);
            if(o.composition && Math.abs((o.composition.X||0)+(o.composition.Y||0)+(o.composition.Z||0)-1)>1e-10) throw new Error("조성 보존 실패: "+o.id);
        }
    },
    step(){
        if(this.status==="FAILED"||this.paused)return;
        const snapshot=this.objects.map(o=>o.clone()),oldTime=this.time,oldDt=this.dt;
        try{
            this.validateState();
            if(!(this.dt>0&&Number.isFinite(this.dt)&&this.dt>=this.minDt&&this.dt<=this.maxDt))throw new Error("잘못된 timestep");
            const t=String(this.integratorType).toLowerCase();
            if(t==="euler"){ this._acceptedDt=this.dt; Integrators.eulerSemiImplicit(this.objects,this.dt,this.getAccelerations(this.objects)); }
            else if(t==="verlet"){ this._acceptedDt=this.dt; Integrators.verlet(this.objects,this.dt,obs=>this.getAccelerations(obs)); }\n            else if(t==="leapfrog"){ this._acceptedDt=this.dt; Integrators.leapfrogKDK(this.objects,this.dt,obs=>this.getAccelerations(obs)); }\n            else if(t==="yoshida4"){ this._acceptedDt=this.dt; Integrators.yoshida4(this.objects,this.dt,obs=>this.getAccelerations(obs)); }
            else if(t==="rk4"){
                if(this.adaptiveDt){
                    const r=Integrators.rk4Adaptive(this.objects,this.dt,obs=>this.getAccelerations(obs),this.adaptiveTolerance,this.minDt,this.maxAdaptiveAttempts);
                    this.dt=Math.min(this.maxDt,r.nextDt);
                    this._acceptedDt=r.acceptedDt;
                    this._adaptiveError=r.error;
                }else{
                    Integrators.rk4(this.objects,this.dt,obs=>this.getAccelerations(obs));
                    this._acceptedDt=this.dt;
                    this._adaptiveError=0;
                }
            }
            else throw new Error("알 수 없는 integrator: "+this.integratorType);
            const acceptedDt=this._acceptedDt||this.dt;
            if(this.activeModels.includes("Fluid"))FluidEngine.updateInternalEnergy(this.objects,acceptedDt);
            if(this.activeModels.includes("Nuclear"))NuclearEngine.computeFusion(acceptedDt,this.objects);
            if(this.activeModels.includes("Collision"))CollisionEngine.checkAndResolve(this.objects);
            if(this.activeModels.includes("Thermodynamics")){ThermoEngine.updateTemperature(this.objects);ThermoEngine.computeRadiation(this._acceptedDt||this.dt,this.objects);}
            this.validateState();
            this.time+=this._acceptedDt||this.dt;
            Diagnostics.update(this.objects);UI.updateInspector();
        }catch(err){
            this.objects=snapshot;
            this.time=oldTime;this.dt=oldDt;
            this.status="FAILED";this.paused=true;this.lastError=err&&err.message?err.message:String(err);
            this.syncPauseButton();this.updateFailureUI();throw err;
        }
    },
    togglePause(){
        if(this.status==="FAILED"){this.status="STABLE";this.paused=false;this.lastError="";Diagnostics.begin(this.objects);}
        else this.paused=!this.paused;
        this.syncPauseButton();
    },
    resetFailure(){this.status="STABLE";this.paused=false;this.lastError="";Diagnostics.begin(this.objects);this.syncPauseButton();},
    syncPauseButton(){const b=document.getElementById("btn-pause");if(b)b.innerText=this.paused?"재개 (RESUME)":"일시정지 (PAUSE)";},
    updateFailureUI(){const s=document.getElementById("diag-status");if(s){s.innerText="FAILED: "+(this.lastError||"unknown");s.className="val fail";}},
    setModel(name,enabled){const i=this.activeModels.indexOf(name);if(enabled&&i<0)this.activeModels.push(name);if(!enabled&&i>=0)this.activeModels.splice(i,1);},
    loop(){requestAnimationFrame(()=>this.loop());if(!this.paused){try{this.step();}catch(_){}}Renderer.draw();}
};
