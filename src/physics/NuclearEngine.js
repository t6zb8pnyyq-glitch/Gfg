const NuclearEngine = {
        computeFusion: function(dt, objs) {
            for(let o of objs) {
                if(o.type !== "STAR") continue;
                // Core T estimation based on hydrostatic equilibrium
                let Tc = (PhysicsConstants.G * o.mass * PhysicsConstants.M_sun) / (PhysicsConstants.k_B * o.radius);
                o.temperature = Tc;

                // PP-Chain parameterized network (H -> He)
                if(Tc > 1.5e7 && o.composition.X > 0) {
                    let rate = 1e-5 * o.density * o.composition.X * o.composition.X * Math.pow(Tc / 1e6, 4);
                    let dm = rate * dt; // Mass fraction converted
                    if(dm > o.composition.X) dm = o.composition.X;
                    o.composition.X -= dm;
                    o.composition.Y += dm;

                    // Energy release: E = mc^2 (0.7% efficiency for H->He)
                    let energy = (dm * o.mass) * 0.007 * PhysicsConstants.c * PhysicsConstants.c;
                    o.luminosity = energy / dt; // Watts
                }

                // Triple-Alpha (He -> C)
                if(Tc > 1e8 && o.composition.Y > 0) {
                    let rate = 1e-10 * o.density * o.density * Math.pow(o.composition.Y, 3) * Math.exp(-4.4 / (Tc/1e8));
                    let dm = rate * dt;
                    if(dm > o.composition.Y) dm = o.composition.Y;
                    o.composition.Y -= dm;
                    o.composition.Z += dm; // "Metals"
                }
            }
        }
    }