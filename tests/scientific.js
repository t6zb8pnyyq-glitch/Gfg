const fs=require("fs"),vm=require("vm"),path=require("path");
const root=path.resolve(__dirname,"..");
const files=[
"src/math/Vec3.js","src/physics/Constants.js","src/physics/PeriodicTable.js","src/physics/PhysicalBody.js",
"src/physics/gravity/BBox.js","src/physics/gravity/OctreeNode.js","src/physics/gravity/GravityEngine.js",
"src/physics/CollisionEngine.js","src/physics/ElectromagneticEngine.js","src/physics/FluidEngine.js",
"src/physics/EOS.js","src/physics/NuclearNetwork.js","src/physics/RadiationTransport.js","src/physics/MHD1D.js",
"src/physics/GRGeodesic.js","src/physics/StellarStructure.js","src/physics/NuclearEngine.js","src/physics/RelativityEngine.js",
"src/physics/QuantumEngine.js","src/physics/CosmologyEngine.js","src/core/Integrator.js","src/core/Diagnostics.js","src/core/Validator.js"
];
const sandbox={console,Math,Float64Array,Float32Array,Map,Set,Array,Number,Date,Error,Infinity,performance:{now:()=>0},
document:{getElementById:()=>({innerText:"",className:"",dataset:{}})},Engine:{status:"STABLE"}};
vm.createContext(sandbox);
for(const f of files) vm.runInContext(fs.readFileSync(path.join(root,f),"utf8"),sandbox,{filename:f});
const results=sandbox.Validator.runAllTests(true);
console.log(JSON.stringify(results,null,2));
if(results.some(r=>r.status!=="PASS")) process.exit(1);
