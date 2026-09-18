import os

MODULES_ORDER = [
    "vendor/astronomy-engine.min.js",
    "src/math/Vec3.js",
    "src/physics/Constants.js",
    "src/physics/EphemerisEngine.js",
    "src/physics/PeriodicTable.js",
    "src/physics/PhysicalBody.js",
    "src/physics/gravity/BBox.js",
    "src/physics/gravity/OctreeNode.js",
    "src/physics/gravity/GravityEngine.js",
    "src/physics/CollisionEngine.js",
    "src/physics/ElectromagneticEngine.js",
    "src/physics/FluidEngine.js",
    "src/physics/EOS.js",
    "src/physics/ThermodynamicsEngine.js",
    "src/physics/NuclearNetwork.js",
    "src/physics/RadiationTransport.js",
    "src/physics/MHD1D.js",
    "src/physics/GRGeodesic.js",
    "src/physics/StellarStructure.js",
    "src/physics/NuclearEngine.js",
    "src/physics/RelativityEngine.js",
    "src/physics/QuantumEngine.js",
    "src/physics/CosmologyEngine.js",
    "src/core/Integrator.js",
    "src/core/Diagnostics.js",
    "src/core/Validator.js",
    "src/core/Labs.js",
    "src/render/Renderer.js",
    "src/ui/UI.js",
    "src/core/Simulation.js"
]

def build_universe_creator():
    output_file = "universe_creator.html"

    html_header = """<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Universe Creator — Scientific Computational Physics Laboratory</title>
    <style>
"""

    with open("src/css/style.css", "r") as f:
        css = f.read()

    html_mid = """
    </style>
</head>
<body>
    <div id="layout-container" style="touch-action:manipulation;">
        <div id="module-bar">
            <button type="button" class="mobile-drawer-btn" onclick="UI.togglePanel('creator')">생성기</button>
            <button type="button" class="mobile-drawer-btn" onclick="UI.togglePanel('inspector')">진단</button>
            <button type="button" id="btn-lab-GRAVITY" class="lab-module active" onclick="Labs.loadLab('GRAVITY')">중력/궤도</button>
            <button type="button" id="btn-lab-GALAXY" class="lab-module" onclick="Labs.loadLab('GALAXY')">은하 N-body</button>
            <button type="button" id="btn-lab-SPH_FLUID" class="lab-module" onclick="Labs.loadLab('SPH_FLUID')">SPH 유체</button>
            <button type="button" id="btn-lab-NUCLEAR" class="lab-module" onclick="Labs.loadLab('NUCLEAR')">항성/핵</button>
            <button type="button" id="btn-lab-QUANTUM" class="lab-module" onclick="Labs.loadLab('QUANTUM')">양자</button>
            <button type="button" id="btn-lab-MHD" class="lab-module" onclick="Labs.loadLab('MHD')">MHD</button>
            <button type="button" id="btn-lab-RADIATION" class="lab-module" onclick="Labs.loadLab('RADIATION')">복사수송</button>
            <button type="button" id="btn-lab-STELLAR" class="lab-module" onclick="Labs.loadLab('STELLAR')">항성구조</button>
            <button type="button" id="btn-lab-GR" class="lab-module" onclick="Labs.loadLab('GR')">GR</button>
            <button type="button" id="btn-lab-COSMOLOGY" class="lab-module" onclick="Labs.loadLab('COSMOLOGY')">우주론</button>
        </div>

        <div id="viewport-container">
            <canvas id="universe-canvas"></canvas>
            <div id="diagnostics-overlay">초기화 중...</div>
            <div id="mobile-joystick" style="display:none; position:absolute; bottom:20px; left:20px; width:100px; height:100px; background:rgba(255,255,255,0.1); border-radius:50%; pointer-events:none;"></div>
        </div>

        <div id="creator-panel" class="side-panel">
            <h3>창조주 — 객체 생성</h3>
            <label>객체 유형</label>
            <select id="type">
                <option value="PLANET">행성</option><option value="STAR">항성</option><option value="BLACK_HOLE">블랙홀</option><option value="GAS_CLOUD">가스 구름</option>
            </select>
            <label>질량 (kg)</label><input type="number" id="mass" value="5.9722e24">
            <label>반지름 (m)</label><input type="number" id="radius" value="6371000">
            <div class="orbit-help">행성은 항성이 있으면 위치에 따라 원형 궤도 속도를 자동 계산합니다. 빈 화면을 한 번 탭하면 그 위치에 생성됩니다.</div>
            <details><summary>직접 초기속도 — 고급</summary>
              <label>속도 X (m/s)</label><input type="number" id="vel_x" value="0">
              <label>속도 Y (m/s)</label><input type="number" id="vel_y" value="0">
              <label>속도 Z (m/s)</label><input type="number" id="vel_z" value="0">
            </details>
            <button onclick="UI.createObject()">객체 생성</button>
            <hr><h3>활성 물리 엔진</h3>
            <label class="model-row"><input type="checkbox" data-model="Gravity" checked onchange="UI.toggleModel('Gravity',this.checked)">중력 / N-body</label>
            <label class="model-row"><input type="checkbox" data-model="Collision" checked onchange="UI.toggleModel('Collision',this.checked)">충돌 / 병합</label>
            <label class="model-row"><input type="checkbox" data-model="Nuclear" checked onchange="UI.toggleModel('Nuclear',this.checked)">핵반응 / 핵융합</label>
            <label class="model-row"><input type="checkbox" data-model="Thermodynamics" checked onchange="UI.toggleModel('Thermodynamics',this.checked)">열역학 / 복사</label>
            <label class="model-row"><input type="checkbox" data-model="Fluid" onchange="UI.toggleModel('Fluid',this.checked)">SPH 유체</label>
            <label class="model-row"><input type="checkbox" data-model="Electromagnetic" onchange="UI.toggleModel('Electromagnetic',this.checked)">전자기력</label>
            <label class="model-row"><input type="checkbox" data-model="Relativity" onchange="UI.toggleModel('Relativity',this.checked)">상대론 보정</label>
        </div>

        <div id="inspector-panel" class="side-panel">
            <h3>물리 진단 (Diagnostics)</h3>
            <div id="inspector-data">선택된 객체 없음</div>
            <hr>
            <div id="diag-global">
                <div>에너지: <span id="diag-energy">0</span></div>
                <div>에너지 오차: <span id="diag-e-err">0</span></div>
                <div>총 운동량: <span id="diag-mom">0</span></div>
                <div>상태: <span id="diag-status">STABLE</span></div>
            </div>
        </div>

        <div id="control-bar">
            <button id="btn-pause" onclick="Engine.togglePause()">일시정지 (PAUSE)</button><button onclick="Engine.resetFailure()">실패 복구</button>
            <label>적분기:</label>
            <select id="integrator" onchange="Engine.integratorType = this.value">
                <option value="rk4">Runge-Kutta 4 (정밀)</option>
                <option value="verlet">Velocity Verlet (안정)</option>\n                <option value="leapfrog">Leapfrog KDK (symplectic)</option>\n                <option value="yoshida4">Yoshida 4 (symplectic)</option>
                <option value="euler">Semi-Implicit Euler</option>
            </select>
            <label>가속기:</label>
            <select id="sys-gravity" onchange="Engine.gravityAlgorithm = this.value">
                <option value="BARNES_HUT">Barnes-Hut O(N log N)</option>
                <option value="DIRECT">Direct O(N²)</option>
            </select>
            <label>타임스텝(dt):</label>
            <input type="number" id="sys-dt" value="1.0" style="width:60px;" onchange="Engine.dt = parseFloat(this.value)">\n            <label><input type="checkbox" id="adaptive-dt" onchange="Engine.adaptiveDt=this.checked" style="width:auto;">적응 dt</label>
            <button id="btn-audit" onclick="UI.showAudit()">검증 (AUDIT)</button>
        </div>
    </div>

    <div id="validation-modal" style="display:none; position:absolute; top:10%; left:20%; width:60%; height:80%; background:#1e1e1e; border:2px solid var(--border); z-index:1000; padding:20px; overflow-y:auto;">
        <h2>과학적 검증 프레임워크 결과</h2>
        <div id="validation-results"></div>
        <button onclick="document.getElementById('validation-modal').style.display='none'" style="margin-top:20px;">닫기</button>
    </div>

    <script>
    """

    js = ""
    for mod in MODULES_ORDER:
        with open(mod, "r") as f:
            src = f.read()
        if mod == "vendor/astronomy-engine.min.js":
            # Astronomy Engine's distributed bundle is CommonJS-compatible and
            # expects a global `exports` object. CodePen runs the artifact as
            # a browser script, so provide an isolated CommonJS shim and publish
            # the resulting API as window.Astronomy.
            js += "(function(global){\nvar exports = {};\n" + src + "\n" + "global.Astronomy = exports;\n})(window);\n\n"
        else:
            js += src + "\\n\\n"

    init_call = "\nwindow.addEventListener('DOMContentLoaded', () => { UI.init(); Renderer.init(); Labs.loadLab('GRAVITY'); Engine.loop(); });\n"

    html_footer = """
    </script>
</body>
</html>
"""

    artifact = html_header + css + html_mid + js + init_call + html_footer
    if "<script src=" in artifact or "<link " in artifact:
        raise RuntimeError("Standalone CodePen artifact contains an external runtime dependency")
    # The standalone browser artifact must never depend on an ambient CommonJS
    # `exports` binding. The only allowed occurrence is inside the explicit
    # Astronomy Engine compatibility shim above.
    if "exports =" not in artifact:
        raise RuntimeError("Astronomy Engine browser compatibility shim missing")
    import re
    cleaned = re.sub(r"\(function\(global\).*?global\.Astronomy = exports;\n\}\)\(window\);", "", artifact, flags=re.S)
    if "exports." in cleaned or "module.exports" in cleaned or "require(" in cleaned:
        raise RuntimeError("CommonJS runtime dependency leaked into standalone artifact")
    if artifact.count("<html") != 1 or artifact.count("</html>") != 1:
        raise RuntimeError("Invalid standalone HTML document")
    if artifact.count("<script>") != 1:
        raise RuntimeError("Expected exactly one inline runtime script")
    if "let camera =" in artifact or "camera.rot" in artifact:
        raise RuntimeError("Stale global camera dependency detected")
    if "Labs.loadLab('GRAVITY')" not in artifact:
        raise RuntimeError("Deterministic GRAVITY bootstrap missing")
    with open(output_file, "w") as f:
        f.write(artifact)

    print(f"Successfully built {output_file} from {len(MODULES_ORDER)} modules.")

if __name__ == "__main__":
    build_universe_creator()
