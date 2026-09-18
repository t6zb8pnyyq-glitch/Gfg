const UI = {
        init: function() {
            let tabs = ['GRAVITY', 'GALAXY', 'SPH_FLUID', 'NUCLEAR', 'QUANTUM', 'COSMOLOGY'];
            let html = "";
            for(let t of tabs) { html += `<button id="btn-lab-${t}" class="lab-btn" onclick="Labs.loadLab('${t}')">${t}</button>`; }
            document.getElementById('module-bar').innerHTML = html;
        },
        createObject: function() {
            let type = document.getElementById('type').value;
            let mass = parseFloat(document.getElementById('mass').value) || 1e24;
            let rad = parseFloat(document.getElementById('radius').value) || 6e6;
            let vx = parseFloat(document.getElementById('vel_x').value) || 0;
            let vy = parseFloat(document.getElementById('vel_y').value) || 0;
            let vz = parseFloat(document.getElementById('vel_z').value) || 0;

            // Spawn distance from camera center (mocked placement)
            let dist = 1e8;
            let spawnPos = new Vec3(
                dist * Math.sin(camera.rot.y),
                dist * Math.sin(-camera.rot.x),
                -dist * Math.cos(camera.rot.y)
            );

            let vel = new Vec3(vx, vy, vz);
            let body = new PhysicalBody(Date.now().toString(), type, mass, rad, spawnPos, vel);
            if (type === 'STAR') body.temperature = 5778;

            Engine.objects.push(body);
            Diagnostics.initEnergy = 0;
            this.updateInspector();
        },
        updateInspector: function() {
            let ins = document.getElementById('inspector-data');
            if(Engine.objects.length === 0) {
                ins.innerHTML = "선택된 객체 없음";
                return;
            }
            let o = Engine.objects[Engine.objects.length - 1]; // just show last created
            ins.innerHTML = `<b>Target: ${o.id} (${o.type})</b><br>
            Mass: ${o.mass.toExponential(3)} kg<br>
            Radius: ${o.radius.toExponential(3)} m<br>
            Temperature: ${o.temperature.toExponential(3)} K<br>
            Luminosity: ${o.luminosity.toExponential(3)} W`;
        },
        showAudit: function() {
            let results = Validator.runAllTests(true);
            if(!results) results = [];
            let html = "<h4>과학적 검증 프레임워크 결과 (Validation Results)</h4><ul style='list-style:none; padding:0;'>";
            let allPass = true;
            for(let r of results) {
                let isPass = r.status === 'PASS';
                let isWarn = r.status === 'WARNING';
                let tag = isPass ? "<span style='color:#10b981; font-weight:bold;'>[PASS]</span>" :
                         (isWarn ? "<span style='color:#f59e0b; font-weight:bold;'>[WARNING]</span>" : "<span style='color:#ef4444; font-weight:bold;'>[FAIL]</span>");
                if(!isPass && r.status !== 'NOT APPLICABLE') allPass = false;

                html += `<li style='margin-bottom:8px; border-bottom:1px solid #333; padding-bottom:4px;'>
                    ${tag} <b>${r.name}</b><br>
                    <span style='font-size:11px; color:#aaa;'>오차율(Error): ${(r.error*100).toExponential(2)}% | 임계값(Tol): ${r.tolerance}</span>
                </li>`;
            }
            html += "</ul>";
            if(allPass && results.length > 0) html += "<div style='color:#10b981; margin-top:10px;'>모든 검증을 통과했습니다. (NASA-Grade 10/10)</div>";
            else html += "<div style='color:#f59e0b; margin-top:10px;'>시스템이 불완전하거나 검증 중입니다. (INCOMPLETE)</div>";

            document.getElementById('validation-results').innerHTML = html;
            document.getElementById('validation-modal').style.display = 'block';
        }
    }