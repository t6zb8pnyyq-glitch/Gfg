const UI = {
    selectedId: null,
    init: function() {
        const tabs = [
            ["GRAVITY","중력/궤도"],["GALAXY","은하 N-body"],["SPH_FLUID","SPH 유체"],
            ["NUCLEAR","항성/핵"],["QUANTUM","양자"],["MHD","MHD"],
            ["RADIATION","복사수송"],["STELLAR","항성구조"],["GR","GR"],["COSMOLOGY","우주론"]
        ];
        const bar = document.getElementById("module-bar");
        if (!bar) throw new Error("module-bar missing");
        bar.replaceChildren(...tabs.map(([id,label]) => {
            const b=document.createElement("button");
            b.type="button"; b.id="btn-lab-"+id; b.className="lab-module";
            b.textContent=label;
            b.addEventListener("click",()=>Labs.loadLab(id),{passive:true});
            return b;
        }));
        this.updateInspector();
    },
    createObject: function() {
        const type = document.getElementById("type").value;
        const num=(id,fallback)=>{const v=Number(document.getElementById(id).value);return Number.isFinite(v)?v:fallback;};
        const mass=num("mass",1e24), rad=num("radius",6e6);
        if(!(mass>0)||!(rad>0)) throw new Error("mass/radius must be positive");
        const dist=1e8;
        const spawnPos=new Vec3(
            dist*Math.sin(Renderer.cameraRot.y),
            dist*Math.sin(-Renderer.cameraRot.x),
            -dist*Math.cos(Renderer.cameraRot.y)
        );
        const vel=new Vec3(num("vel_x",0),num("vel_y",0),num("vel_z",0));
        const body=new PhysicalBody("user-"+Date.now()+"-"+Engine.objects.length,type,mass,rad,spawnPos,vel);
        if(type==="STAR") body.temperature=5778;
        Engine.objects.push(body);
        this.selectedId=body.id;
        Diagnostics.initEnergy=null; Diagnostics.initialMomentum=null; Diagnostics.initialAngularMomentum=null;
        this.updateInspector();
        return body;
    },
    selectAtScreen: function(clientX,clientY) {
        const rect=Renderer.canvas.getBoundingClientRect();
        const x=clientX-rect.left,y=clientY-rect.top;
        let best=null,bestD=Infinity;
        for(const p of Renderer.projectObjects()){
            const d=Math.hypot(p.px-x,p.py-y);
            const hit=Math.max(10,p.pr);
            if(d<=hit&&d<bestD){best=p;bestD=d;}
        }
        this.selectedId=best?best.obj.id:null;
        this.updateInspector();
    },
    updateInspector: function() {
        const ins=document.getElementById("inspector-data");
        if(!ins||typeof Engine==="undefined") return;
        const o=this.selectedId?Engine.objects.find(x=>x.id===this.selectedId):Engine.objects[Engine.objects.length-1];
        if(!o){ins.textContent="선택된 객체 없음";return;}
        const fmt=(v,u)=>Number.isFinite(v)?v.toExponential(6)+" "+u:"—";
        ins.innerHTML="<b>Target: "+o.id+" ("+o.type+")</b><br>"+
          "Mass: "+fmt(o.mass,"kg")+"<br>Radius: "+fmt(o.radius,"m")+"<br>"+
          "Temperature: "+fmt(o.temperature,"K")+"<br>Luminosity: "+fmt(o.luminosity,"W");
    },
    showAudit: function() {
        const results=Validator.runAllTests(true)||[];
        let html="<h4>과학적 검증 프레임워크</h4><ul style='list-style:none;padding:0'>";
        let allPass=results.length>0;
        for(const r of results){
            const pass=r.status==="PASS",warn=r.status==="WARNING";
            if(!pass&&!warn) allPass=false;
            const tag=pass?"[PASS]":warn?"[WARNING]":"[FAIL]";
            html+="<li style='margin-bottom:8px;border-bottom:1px solid #333;padding-bottom:4px'>"+
              "<b>"+tag+"</b> "+r.name+"<br><span style='font-size:11px;color:#aaa'>Error: "+
              (Number.isFinite(r.error)?r.error.toExponential(3):String(r.error))+" | Tol: "+r.tolerance+"</span></li>";
        }
        html+="</ul><div style='color:"+(allPass?"#10b981":"#ef4444")+"'>"+
          (allPass?"등록된 검증 항목 PASS":"검증 실패 또는 미완료 항목 존재")+"</div>";
        document.getElementById("validation-results").innerHTML=html;
        document.getElementById("validation-modal").style.display="block";
    }
};