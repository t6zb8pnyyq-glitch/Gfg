const NuclearEngine = {
        computeFusion: function(dt, objs) {
            for(let o of objs) {
                if(o.type !== "STAR") continue;
                // Core T estimation based on hydrostatic equilibrium (Ideal Gas approx)
                // T_c ~ (G * M * m_p) / (k_B * R)
                const m_p = 1.67262192e-27; // Proton mass [kg]
                let Tc = (PhysicsConstants.G * o.mass * m_p) / (PhysicsConstants.k_B * o.radius);

                // Update thermodynamic internal energy based on core temp
                // U = 3/2 N k_B T  where N = mass / m_p
                o.internalEnergy = 1.5 * (o.mass / m_p) * PhysicsConstants.k_B * Tc;
                o.temperature = Tc; // Core temperature

                // PP-Chain parameterized network (H -> He)
                if(Tc > 1.5e7 && o.composition.X > 0) {
                    let rate = 1e-5 * o.density * o.composition.X * o.composition.X * Math.pow(Tc / 1e6, 4);
                    let dm = rate * dt; // Mass fraction converted
                    if(dm > o.composition.X) dm = o.composition.X;
                    o.composition.X -= dm;
                    o.composition.Y += dm;

                    // Energy release: E = mc^2 (0.7% efficiency for H->He)
                    let energy = (dm * o.mass) * 0.007 * PhysicsConstants.c * PhysicsConstants.c;
                    o.internalEnergy += energy; // Add to thermodynamic pool
                }

                // Triple-Alpha (He -> C)
                if(Tc > 1e8 && o.composition.Y > 0) {
                    let rate = 1e-10 * o.density * o.density * Math.pow(o.composition.Y, 3) * Math.exp(-4.4 / (Tc/1e8));
                    let dm = rate * dt;
                    if(dm > o.composition.Y) dm = o.composition.Y;
                    o.composition.Y -= dm;
                    o.composition.Z += dm; // "Metals"

                    // Energy release (Triple-Alpha ~ 0.06% efficient)
                    let energy = (dm * o.mass) * 0.0006 * PhysicsConstants.c * PhysicsConstants.c;
                    o.internalEnergy += energy;
                }
            }
        }
    }