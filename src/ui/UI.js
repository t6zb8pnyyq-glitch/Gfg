const UI = {
    selectedId: null,
    init: function() {
        const tabs = [["__CREATOR__","생성기"],["__INSPECTOR__","진단"],["GRAVITY","중력/궤도"],["GALAXY","은하 N-body"],["SPH_FLUID","SPH 유체"],["NUCLEAR","항성/핵"],["QUANTUM","양자"],["MHD","MHD"],["RADIATION","복사수송"],["STELLAR","항성구조"],["GR","GR"],["COSMOLOGY","우주론"]];
        const bar=document.getElementById("module-bar"); if(!bar) throw new Error("module-bar missing");
        bar.replaceChildren(...tabs.map(([id,label])=>{const b=document.createElement("button");b.type="button";b.id=id.startsWith("__")?"btn-"+id.slice(2).toLowerCase():"btn-lab-"+id;b.className=id.startsWith("__")?"mobile-drawer-btn":"lab-module";b.textContent=label;if(id==="__CREATOR__")b.addEventListener("click",()=>this.togglePanel("creator"));else if(id==="__INSPECTOR__")b.addEventListener("click",()=>this.togglePanel("inspector"));else b.addEventListener("click",()=>Labs.loadLab(id));return b;}));
        this.updateInspector();
    },
    screenToWorld:function(clientX,clientY,depth=0){
        const r=Renderer.canvas.getBoundingClientRect(),px=clientX-r.left,py=clientY-r.top,w=Renderer.canvas.clientWidth||r.width||1,h=Renderer.canvas.clientHeight||r.height||1;
        const x1=(px-(w/2+Renderer.cameraPan.x))/Renderer.scale,y2=(py-(h/2+Renderer.cameraPan.y))/Renderer.scale;
        const sx=Math.sin(Renderer.cameraRot.x),cx=Math.cos(Renderer.cameraRot.x),sy=Math.sin(Renderer.cameraRot.y),cy=Math.cos(Renderer.cameraRot.y);
        const y=y2*cx+depth*sx,z1=-y2*sx+depth*cx;
        return new Vec3(x1*cy+z1*sy,y,-x1*sy+z1*cy);
    },
    createObject:function(clientX=null,clientY=null){
        const type=(document.getElementById("type")||{value:"PLANET"}).value,num=(id,f)=>{const e=document.getElementById(id),v=Number(e&&e.value);return Number.isFinite(v)?v:f;};
        const mass=num("mass",5.972e24),rad=num("radius",6.371e6);if(!(mass>0)||!(rad>0))throw new Error("mass/radius must be positive");
        let p;if(Number.isFinite(clientX)&&Number.isFinite(clientY))p=this.screenToWorld(clientX,clientY,0);else{const r=Renderer.canvas.getBoundingClientRect();p=this.screenToWorld(r.left+r.width/2,r.top+r.height/2,0);}
        const body=new PhysicalBody("user-"+Date.now()+"-"+Engine.objects.length,type,mass,rad,p,new Vec3(num("vel_x",0),num("vel_y",0),num("vel_z",0)));
        if(type==="STAR")body.temperature=5778;
        Engine.objects.push(body);this.selectedId=body.id;Diagnostics.initEnergy=null;Diagnostics.initialMomentum=null;Diagnostics.initialAngularMomentum=null;Diagnostics.begin(Engine.objects);this.updateInspector();return body;
    },
    handleCanvasTap:function(clientX,clientY){
        const r=Renderer.canvas.getBoundingClientRect(),x=clientX-r.left,y=clientY-r.top;let best=null,bestD=Infinity;
        for(const p of Renderer.projectObjects()){const d=Math.hypot(p.px-x,p.py-y),hit=Math.max(12,p.pr+6);if(d<=hit&&d<bestD){best=p;bestD=d;}}
        if(best){this.selectedId=best.obj.id;this.updateInspector();return{action:"select",object:best.obj};}
        return{action:"create",object:this.createObject(clientX,clientY)};
    },
    selectAtScreen:function(clientX,clientY){const r=Renderer.canvas.getBoundingClientRect(),x=clientX-r.left,y=clientY-r.top;let best=null,bestD=Infinity;for(const p of Renderer.projectObjects()){const d=Math.hypot(p.px-x,p.py-y),hit=Math.max(12,p.pr+6);if(d<=hit&&d<bestD){best=p;bestD=d;}}this.selectedId=best?best.obj.id:null;this.updateInspector();},
    syncModelControls:function(){document.querySelectorAll("[data-model]").forEach(e=>{e.checked=Engine.activeModels.includes(e.dataset.model);});},
    toggleModel:function(name,enabled){Engine.setModel(name,enabled);this.syncModelControls();},
    updateInspector:function(){const ins=document.getElementById("inspector-data");if(!ins||typeof Engine==="undefined")return;const o=this.selectedId?Engine.objects.find(x=>x.id===this.selectedId):Engine.objects[Engine.objects.length-1];if(!o){ins.textContent="선택된 객체 없음";return;}const f=(v,u)=>Number.isFinite(v)?v.toExponential(6)+" "+u:"—";ins.innerHTML="<b>Target: "+o.id+" ("+o.type+")</b><br>Mass: "+f(o.mass,"kg")+"<br>Radius: "+f(o.radius,"m")+"<br>Position: ["+f(o.pos.x,"m")+", "+f(o.pos.y,"m")+", "+f(o.pos.z,"m")+"]<br>Velocity: ["+f(o.vel.x,"m/s")+", "+f(o.vel.y,"m/s")+", "+f(o.vel.z,"m/s")+"]<br>Temperature: "+f(o.temperature,"K")+"<br>Luminosity: "+f(o.luminosity,"W");},
    togglePanel:function(which){const el=document.getElementById(which==="creator"?"creator-panel":"inspector-panel");if(!el)return;const open=el.dataset.open==="true";el.dataset.open=open?"false":"true";el.style.transform=which==="creator"?(open?"translateX(-105%)":"translateX(0)"):(open?"translateX(105%)":"translateX(0)");},
    showAudit:function(){const results=Validator.runAllTests(true)||[];let html="<h4>과학적 검증 프레임워크</h4><ul style='list-style:none;padding:0'>",allPass=results.length>0;for(const r of results){const pass=r.status==="PASS",warn=r.status==="WARNING";if(!pass)allPass=false;html+="<li><b>"+(pass?"[PASS]":warn?"[WARNING]":"[FAIL]")+"</b> "+r.name+"<br><span style='font-size:11px;color:#aaa'>Error: "+(Number.isFinite(r.error)?r.error.toExponential(3):String(r.error))+" | Tol: "+r.tolerance+"</span></li>"}html+="</ul><div>"+(allPass?"등록된 검증 항목 PASS":"검증 실패 또는 미완료 항목 존재")+"</div>";document.getElementById("validation-results").innerHTML=html;document.getElementById("validation-modal").style.display="block";}
};