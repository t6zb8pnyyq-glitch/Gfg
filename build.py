import os

MODULES_ORDER = [
    "src/math/Vec3.js",
    "src/physics/Constants.js",
    "src/physics/PeriodicTable.js",
    "src/physics/PhysicalBody.js",
    "src/physics/gravity/BBox.js",
    "src/physics/gravity/OctreeNode.js",
    "src/physics/gravity/GravityEngine.js",
    "src/physics/CollisionEngine.js",
    "src/physics/ElectromagneticEngine.js",
    "src/physics/FluidEngine.js",
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
    <title>NASA급 통합 전산 물리학 연구소</title>
    <style>
"""

    with open("src/css/style.css", "r") as f:
        css = f.read()

    html_mid = """
    </style>
</head>
<body>
    <div id="layout-container">
        <div id="module-bar">
            <span class="lab-module active" onclick="Labs.loadLab('SOLAR_SYSTEM')">중력/궤도 역학 (Solar)</span>
            <span class="lab-module" onclick="Labs.loadLab('GALAXY')">은하 시뮬레이션 (Galaxy)</span>
            <span class="lab-module" onclick="Labs.loadLab('SPH_FLUID')">유체역학/SPH</span>
            <span class="lab-module" onclick="Labs.loadLab('NUCLEAR_STAR')">항성/핵물리학</span>
            <span class="lab-module" onclick="Labs.loadLab('QUANTUM_RELATIVITY')">양자/상대성 (Test)</span>
        </div>

        <div id="viewport-container">
            <canvas id="universe-canvas"></canvas>
            <div id="diagnostics-overlay">초기화 중...</div>
            <div id="mobile-joystick" style="display:none; position:absolute; bottom:20px; left:20px; width:100px; height:100px; background:rgba(255,255,255,0.1); border-radius:50%; pointer-events:none;"></div>
        </div>

        <div id="creator-panel" class="side-panel">
            <h3>생성기 (Creator)</h3>
            <label>객체 유형</label>
            <select id="type">
                <option value="PLANET">행성 (Planet)</option>
                <option value="STAR">항성 (Star)</option>
                <option value="BLACK_HOLE">블랙홀 (Black Hole)</option>
                <option value="GAS_CLOUD">가스 구름 (Gas)</option>
            </select>
            <label>질량 (kg)</label>
            <input type="number" id="mass" value="5.972e24">
            <label>반지름 (m)</label>
            <input type="number" id="radius" value="6371000">
            <label>속도 X (m/s)</label>
            <input type="number" id="vel_x" value="0">
            <label>속도 Y (m/s)</label>
            <input type="number" id="vel_y" value="0">
            <label>속도 Z (m/s)</label>
            <input type="number" id="vel_z" value="0">
            <button onclick="UI.createObject()">생성 (CREATE)</button>
            <hr>
            <p style="font-size:10px; color:#aaa;">* 모바일: 화면을 더블 탭하여 생성 가능</p>
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
            <button id="btn-pause" onclick="Engine.togglePause()">일시정지 (PAUSE)</button>
            <label>적분기:</label>
            <select id="integrator" onchange="Engine.integratorType = this.value">
                <option value="rk4">Runge-Kutta 4 (정밀)</option>
                <option value="verlet">Velocity Verlet (안정)</option>
                <option value="euler">Semi-Implicit Euler</option>
            </select>
            <label>가속기:</label>
            <select id="sys-gravity" onchange="Engine.gravityAlgorithm = this.value">
                <option value="BARNES_HUT">Barnes-Hut O(N log N)</option>
                <option value="DIRECT">Direct O(N²)</option>
            </select>
            <label>타임스텝(dt):</label>
            <input type="number" id="sys-dt" value="1.0" style="width:60px;" onchange="Engine.dt = parseFloat(this.value)">
            <button id="btn-audit" onclick="UI.showAudit()">검증 (AUDIT)</button>
        </div>
    </div>

    <div id="validation-modal" style="display:none; position:absolute; top:10%; left:20%; width:60%; height:80%; background:#1e1e1e; border:2px solid var(--border); z-index:1000; padding:20px; overflow-y:auto;">
        <h2>과학적 검증 프레임워크 결과</h2>
        <div id="validation-results"></div>
        <button onclick="document.getElementById('validation-modal').style.display='none'" style="margin-top:20px;">닫기</button>
    </div>

    <script>
    let canvas, ctx;
    let isDragging = false;
    let lastMouse = {x:0, y:0};
    let camera = { distance: 1e9, rot: {x: 0, y: 0} };
"""

    js = ""
    for mod in MODULES_ORDER:
        with open(mod, "r") as f:
            js += f.read() + "\n\n"

    init_call = "\nwindow.onload = () => { UI.init(); Renderer.init(); Labs.loadLab('SOLAR_SYSTEM'); Engine.loop(); };\n"

    html_footer = """
    </script>
</body>
</html>
"""

    with open(output_file, "w") as f:
        f.write(html_header + css + html_mid + js + init_call + html_footer)

    print(f"Successfully built {output_file} from {len(MODULES_ORDER)} modules.")

if __name__ == "__main__":
    build_universe_creator()
