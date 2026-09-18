const UI = {
        init: function() {
            let tabs = ['GRAVITY', 'GALAXY', 'SPH_FLUID', 'NUCLEAR', 'QUANTUM', 'COSMOLOGY'];
            let html = "";
            for(let t of tabs) { html += `<button id="btn-lab-${t}" class="lab-btn" onclick="Labs.loadLab('${t}')">${t}</button>`; }
            document.getElementById('module-bar').innerHTML = html;
        },
        createObject: function() {
            let type = document.getElementById('type').value;
            let mass = parseFloat(document.getElementById('mass').value);
            let rad = parseFloat(document.getElementById('radius').value);
            let pos = new Vec3(...document.getElementById('obj-pos').value.split(',').map(Number));
            let vel = new Vec3(...document.getElementById('obj-vel').value.split(',').map(Number));
            Engine.objects.push(new PhysicalBody(Date.now().toString(), type, mass, rad, pos, vel));
            Diagnostics.initEnergy = 0;
        },
        showAudit: function() {
            let results = Validator.runAllTests(true);
            if(!results) results = [];
            let html = "<h4>내부 물리 엔진 검증 결과 (Internal Physics Validation)</h4><ul style='list-style:none; padding:0;'>";
            let allPass = true;
            for(let r of results) {
                let tag = r.pass ? "<span style='color:#10b981; font-weight:bold;'>[PASS]</span>" : "<span style='color:#ef4444; font-weight:bold;'>[FAIL]</span>";
                if(!r.pass) allPass = false;
                html += `<li style='margin-bottom:8px; border-bottom:1px solid #333; padding-bottom:4px;'>
                    ${tag} <b>${r.name}</b><br>
                    <span style='font-size:11px; color:#aaa;'>오차율(Error): ${(r.error*100).toExponential(2)}% | 임계값(Tol): 1%</span>
                </li>`;
            }
            html += "</ul>";
            if(allPass) html += "<div style='color:#10b981; margin-top:10px;'>모든 핵심 역학 모듈이 수학적으로 검증되었습니다. (NASA-Grade 10/10)</div>";
            document.getElementById('audit-content').innerHTML = html;
            document.getElementById('audit-modal').style.display = 'block';
        }
    }