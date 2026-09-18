const ThermoEngine = {
    gamma: 5/3,
    cvPerMass(body) {
        const mu = EOS.meanMolecularWeight(body.composition || {X:0.73,Y:0.25,Z:0.02}, true);
        return 1.5 * PhysicsConstants.k_B / (mu * EOS.atomicMassUnit);
    },
    updateTemperature(objects) {
        for (const o of objects) {
            if (!(o.mass > 0)) continue;
            const cv = this.cvPerMass(o);
            if (!(o.internalEnergy > 0)) {
                o.internalEnergy = Math.max(0, o.mass * cv * Math.max(o.temperature, 2.73));
            }
            o.temperature = Math.max(2.73, o.internalEnergy / (o.mass * cv));
            o.updateDensity();
            o.sph_pressure = EOS.pressure(o.density, o.temperature, o.composition);
        }
    },
    computeRadiation(dt, objects) {
        if (!(dt >= 0)) throw new Error("Negative thermodynamic timestep");
        const sigma = PhysicsConstants.sigma_sb;
        for (const o of objects) {
            if (!(o.radius > 0) || !(o.temperature >= 0)) continue;
            const area = 4 * Math.PI * o.radius * o.radius;
            const blackbody = sigma * area * Math.pow(o.temperature,4);
            o.luminosity = Number.isFinite(blackbody) ? blackbody : 0;
            const emitted = Math.min(o.internalEnergy, o.luminosity * dt);
            o.radiatedEnergy = (o.radiatedEnergy || 0) + emitted;
            o.internalEnergy = Math.max(0, o.internalEnergy - emitted);
        }
    }
};
function kBPressure(T,rho) {
    const kB=1.380649e-23, mp=1.67262192369e-27, mu=0.61;
    return kB*T/(mu*mp);
}
