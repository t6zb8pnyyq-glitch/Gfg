const fs = require('fs');

const code = fs.readFileSync('src/core/universe.js', 'utf8');

function extractBlock(keyword) {
    const idx = code.indexOf(keyword);
    if(idx === -1) return '';

    let braces = 0;
    let started = false;
    let endIdx = idx;

    for(let i = idx; i < code.length; i++) {
        if(code[i] === '{') { braces++; started = true; }
        if(code[i] === '}') { braces--; }
        if(started && braces === 0) {
            endIdx = i;
            break;
        }
    }
    return code.substring(idx, endIdx + 1);
}

const blocks = {
    'CollisionEngine.js': extractBlock('const CollisionEngine = {'),
    'ElectromagneticEngine.js': extractBlock('const ElectromagneticEngine = {'),
    'Integrator.js': extractBlock('const Integrators = {'), // Fixed!
    'Simulation.js': extractBlock('const Engine = {'), // Fixed!
    'Labs.js': extractBlock('const Labs = {') // Fixed!
};

fs.writeFileSync('src/physics/CollisionEngine.js', blocks['CollisionEngine.js']);
fs.writeFileSync('src/physics/ElectromagneticEngine.js', blocks['ElectromagneticEngine.js']);
fs.writeFileSync('src/core/Integrator.js', blocks['Integrator.js']);
fs.writeFileSync('src/core/Simulation.js', blocks['Simulation.js']);
fs.writeFileSync('src/core/Labs.js', blocks['Labs.js']);
