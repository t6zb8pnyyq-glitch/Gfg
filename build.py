import os

MODULES_ORDER = [
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

HTML_HEAD = """<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<title>Universe Creator</title>
<style>
{css}
</style>
</head>
<body>
<div id="layout-container">
  <div id="module-bar"></div>
  <main id="viewport-container"><canvas id="universe-canvas"></canvas><div id="diagnostics-overlay"></div></main>
  <aside id="creator-panel" class="side-panel"></aside>
  <aside id="inspector-panel" class="side-panel"></aside>
  <footer id="control-bar"></footer>
</div>
<div id="validation-modal"></div>
<script>
"""

HTML_TAIL = """
window.addEventListener("DOMContentLoaded",function(){
  UI.init();
  Renderer.init();
  Labs.loadLab("GRAVITY");
  Engine.loop();
});
</script>
</body>
</html>
"""

def build_universe_creator():
    with open("src/css/style.css","r",encoding="utf-8") as f:
        css=f.read()
    html=HTML_HEAD.format(css=css)
    js=[]
    for mod in MODULES_ORDER:
        with open(mod,"r",encoding="utf-8") as f:
            js.append(f.read())
    html += "\n\n".join(js)
    html += HTML_TAIL
    if "\\n" in html:
        raise RuntimeError("Literal backslash-n leaked into generated HTML")
    if "exports." in html or "module.exports" in html or "require(" in html:
        raise RuntimeError("CommonJS dependency leaked into browser artifact")
    if html.count("<script>") != 1:
        raise RuntimeError("Expected exactly one inline script")
    with open("universe_creator.html","w",encoding="utf-8") as f:
        f.write(html)
    print("Built clean browser-only universe_creator.html")

if __name__=="__main__":
    build_universe_creator()
