/**
 * src/physics/ThermoEngine.js
 *
 * Handles macroscopic thermodynamics including heat transfer,
 * temperature updates from internal energy, and radiation (Stefan-Boltzmann).
 */
const ThermoEngine = {
    // Specific heat capacities [J / (kg K)]
    cv_gas: 3.15e3, // Approximation for hydrogen gas
    cv_rock: 800,   // Approximation for planetary material
    cv_star: 1e4,   // Approximation for plasma

    updateTemperature: function(objects) {
        for(let o of objects) {
            let cv = this.cv_rock;
            if(o.type === 'GAS_CLOUD') cv = this.cv_gas;
            if(o.type === 'STAR') cv = this.cv_star;
            if(o.type === 'BLACK_HOLE') continue; // Handled by Relativity

            // Absolute temperature T = U / (m * c_v)
            if(o.internalEnergy < 0) o.internalEnergy = 0;
            let temp = o.internalEnergy / (o.mass * cv);

            // Apply CMB floor (2.73 K)
            o.temperature = Math.max(2.73, temp);
        }
    },

    computeRadiation: function(dt, objects) {
        // Blackbody radiation via Stefan-Boltzmann Law: P = A * sigma * T^4
        for(let o of objects) {
            if(o.type === 'BLACK_HOLE') continue;

            let area = 4 * Math.PI * Math.pow(o.radius, 2);
            o.luminosity = area * PhysicsConstants.sigma_sb * Math.pow(o.temperature, 4);

            // Radiative cooling: Energy lost = Luminosity * dt
            let eLost = o.luminosity * dt;
            o.internalEnergy -= eLost;
            if(o.internalEnergy < 0) o.internalEnergy = 0;
        }
    }
};
