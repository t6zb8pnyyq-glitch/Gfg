const UI={
    selectedId:null,
    init(){
        const tabs=[["__CREATOR__","생성기"],["__INSPECTOR__","진단"],["GRAVITY","중력/궤도"],["GALAXY","은하 N-body"],["SPH_FLUID","SPH 유체"],["NUCLEAR","항성/핵"],["QUANTUM","양자"],["MHD","MHD"],["RADIATION","복사수송"],["STELLAR","항성구조"],["GR","GR"],["COSMOLOGY","우주론"]];
        const bar=document.getElementById("module-bar");if(!bar)throw new Error("module-bar missing");
        bar.replaceChildren(...tabs.map(([id,label])=>{const b=document.createElement("button");b.type="button";b.id=id.startsWith("__")?"btn-"+id.slice(2).toLowerCase():"btn-lab-"+id;b.className=id.startsWith("__")?"mobile-drawer-btn":"lab-module";b.textContent=label;
            b.addEventListener("click",()=>id.startsWith("__")?this.togglePanel(id==="__CREATOR__"?"creator":"inspector"):Labs.loadLab(id));return b;}));
        this.syncModelControls();this.updateInspector();
    },
    screenToWorld(clientX,clientY,depth=0){
        const r=Renderer.canvas.getBoundingClientRect(),px=clientX-r.left,py=clientY-r.top,w=Renderer.canvas.clientWidth||r.width||1,h=Renderer.canvas.clientHeight||r.height||1;
        const sx=Math.sin(Renderer.cameraRot.x),cx=Math.cos(Renderer.cameraRot.x),sy=Math.sin(Renderer.cameraRot.y),cy=Math.cos(Renderer.cameraRot.y);
        const x=(px-w/2-Renderer.cameraPan.x)/Renderer.scale,y2=(py-h/2-Renderer.cameraPan.y)/Renderer.scale;
        const y=y2*cx+depth*sx,z=-y2*sx+depth*cx;
        return new Vec3(x*cy+z*sy,y,-x*sy+z*cy);
    },
    findReferenceStar(){
        return Engine.objects.filter(o=>o.type==="STAR"||o.type==="BLACK_HOLE").sort((a,b)=>b.mass-a.mass)[0]||null;
    },
    circularOrbitVelocity(bodyPos,center){
        const rvec=bodyPos.sub(center.pos),r=rvec.mag();
        if(!(r>0)||!(center.mass>0)) return new Vec3();
        const mu=PhysicsConstants.G*(center.mass);
        const speed=Math.sqrt(mu/r);
        let normal=new Vec3(0,0,1),tangent=normal.cross(rvec).normalize();
        if(tangent.magSq()<1e-24)tangent=new Vec3(0,1,0).cross(rvec).normalize();
        return center.vel.add(tangent.mult(speed));
    },
    safePlacementAround(center,radius){
        const minGap=center.radius+radius;
        const preferred=Math.max(PhysicsConstants.AU,10*minGap);
        return center.pos.add(new Vec3(preferred,0,0));
    },
    validatePlacement(pos,radius,ignoreId=null){
        for(const o of Engine.objects){
            if(o.id===ignoreId)continue;
            if(pos.sub(o.pos).mag()<radius+o.radius) return {ok:false,object:o};
        }
        return {ok:true};
    },
    createObject(clientX=null,clientY=null){
        const type=(document.getElementById("type")||{value:"PLANET"}).value;
        const num=(id,f)=>{const e=document.getElementById(id),v=Number(e&&e.value);return Number.isFinite(v)?v:f;};
        const mass=num("mass",5.9722e24),rad=num("radius",6.371e6);
        if(!(mass>0)||!(rad>0))throw new Error("질량과 반지름은 0보다 커야 합니다.");
        const ref=this.findReferenceStar();
        let p,v;
        const hasScreen=Number.isFinite(clientX)&&Number.isFinite(clientY);
        if(hasScreen){p=this.screenToWorld(clientX,clientY,0);v=ref?this.circularOrbitVelocity(p,ref):new Vec3();}
        else if(type==="PLANET"&&ref){p=this.safePlacementAround(ref,rad);v=this.circularOrbitVelocity(p,ref);}
        else {const r=Renderer.canvas.getBoundingClientRect();p=this.screenToWorld(r.left+r.width/2,r.top+r.height/2,0);v=new Vec3(num("vel_x",0),num("vel_y",0),num("vel_z",0));}
        const placement=this.validatePlacement(p,rad);
        if(!placement.ok){this.selectedId=placement.object.id;this.updateInspector();return placement.object;}
        const body=new PhysicalBody("user-"+Date.now()+"-"+Engine.objects.length,type,mass,rad,p,v);
        if(type==="STAR")body.temperature=5778;
        Engine.objects.push(body);this.selectedId=body.id;Engine.status="STABLE";Engine.paused=false;Engine.syncPauseButton();Diagnostics.begin(Engine.objects);this.updateInspector();return body;
    },
    handleCanvasTap(clientX,clientY){
        const r=Renderer.canvas.getBoundingClientRect(),x=clientX-r.left,y=clientY-r.top;
        let best=null,bestD=Infinity;
        for(const q of Renderer.projectObjects()){const d=Math.hypot(q.px-x,q.py-y),hit=Math.max(14,q.pr+8);if(d<=hit&&d<bestD){best=q;bestD=d;}}
        if(best){this.selectedId=best.obj.id;this.updateInspector();return{action:"select",object:best.obj};}
        return{action:"create",object:this.createObject(clientX,clientY)};
    },
    selectAtScreen(clientX,clientY){const r=Renderer.canvas.getBoundingClientRect();let best=null,bestD=Infinity;for(const q of Renderer.projectObjects()){const d=Math.hypot(q.px-(clientX-r.left),q.py-(clientY-r.top)),hit=Math.max(14,q.pr+8);if(d<=hit&&d<bestD){best=q;bestD=d;}}this.selectedId=best?best.obj.id:null;this.updateInspector();},
    syncModelControls(){document.querySelectorAll("[data-model]").forEach(e=>e.checked=Engine.activeModels.includes(e.dataset.model));},
    toggleModel(name,enabled){Engine.setModel(name,enabled);this.syncModelControls();},
    updateInspector(){
        const ins=document.getElementById("inspector-data");if(!ins||typeof Engine==="undefined")return;
        const o=this.selectedId?Engine.objects.find(x=>x.id===this.selectedId):Engine.objects[Engine.objects.length-1];
        if(!o){ins.textContent="선택된 객체 없음";return;}
        const f=(v,u)=>Number.isFinite(v)?v.toExponential(5)+" "+u:"—";
        ins.innerHTML="<b>"+o.type+"</b><br>Mass: "+f(o.mass,"kg")+"<br>Radius: "+f(o.radius,"m")+"<br>Position: ["+f(o.pos.x,"m")+", "+f(o.pos.y,"m")+", "+f(o.pos.z,"m")+"]<br>Velocity: ["+f(o.vel.x,"m/s")+", "+f(o.vel.y,"m/s")+", "+f(o.vel.z,"m/s")+"]<br>Temperature: "+f(o.temperature,"K");
    },
    togglePanel(which){const el=document.getElementById(which==="creator"?"creator-panel":"inspector-panel");if(!el)return;el.dataset.open=el.dataset.open==="true"?"false":"true";},
    showAudit(){const results=Validator.runAllTests(true)||[];let html="<h4>과학적 검증</h4><ul style='list-style:none;padding:0'>",all=results.length>0;for(const r of results){const p=r.status==="PASS";if(!p)all=false;html+="<li><b>"+(p?"[PASS]":"[FAIL]")+"</b> "+r.name+"<br><small>Error: "+(Number.isFinite(r.error)?r.error.toExponential(3):String(r.error))+" | Tol: "+r.tolerance+"</small></li>"}html+="</ul><b>"+(all?"모든 등록 검증 PASS":"실패/미완료 검증 존재")+"</b>";document.getElementById("validation-results").innerHTML=html;document.getElementById("validation-modal").style.display="block";}
};
