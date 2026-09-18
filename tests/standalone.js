const fs = require("fs");
const acorn = require("acorn");

const html = fs.readFileSync("universe_creator.html", "utf8");
const match = html.match(/<script>([\\s\\S]*)<\\/script>/);
if (!match) throw new Error("inline script not found");

const js = match[1];
if (js.includes("\\n")) throw new Error("literal backslash-n found in JavaScript");
acorn.parse(js, { ecmaVersion: "latest", sourceType: "script" });

const required = [
  'id="canvas"', 'id="create"', 'id="clear"', 'id="newSystem"',
  'id="pause"', 'id="step"', 'id="dt"', 'id="resetView"',
  'id="creator"', 'id="inspector"', 'id="diag"'
];
for (const id of required) {
  if (!html.includes(id)) throw new Error("missing UI node: " + id);
}

const ids = [...html.matchAll(/\\bid="([^"]+)"/g)].map(m => m[1]);
const duplicates = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
if (duplicates.length) throw new Error("duplicate DOM ids: " + duplicates.join(", "));

for (const marker of [
  "const Sim=",
  "class Body",
  "Velocity-Verlet",
  "PhysicsValidator",
  "AdvancedPhysics",
  "pointerdown",
  "pointermove",
  "pointerup",
  "pointercancel",
  "MAX_BODIES",
  "MAX_SPEED"
]) {
  if (!js.includes(marker)) throw new Error("missing core marker: " + marker);
}

console.log("Standalone artifact syntax/UI/core checks: PASS");
