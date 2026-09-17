/**
 * src/physics/PhysicalBody.js
 *
 * The single canonical state representation for a physical entity in the Universe Creator.
 * All quantities MUST be in strict SI units.
 */
class PhysicalBody {
    constructor(id, type, mass, radius, pos, vel) {
        this.id = id;
        this.type = type; // e.g., 'star', 'planet', 'blackhole', 'gas'

        // --- Core Mechanical State ---
        this.mass = mass;                 // [kg]
        this.radius = radius;             // [m]
        this.pos = pos;                   // [m] (Vec3)
        this.vel = vel;                   // [m/s] (Vec3)
        this.acc = new Vec3();            // [m/s^2] (Vec3)

        // --- Rigid Body / Rotation ---
        this.spin = new Vec3();           // Angular velocity vector [rad/s]

        // --- Thermodynamics & Fluid State ---
        this.temperature = 2.73;          // Absolute temperature [K] (CMB default)
        this.internalEnergy = 0;          // Total internal energy [J]

        // Fluid/SPH specific
        this.sph_density = 0;             // Local SPH evaluated density [kg/m^3]
        this.sph_pressure = 0;            // Local SPH evaluated pressure [Pa]

        // Derived Mechanical properties (calculated on demand or initialized here)
        this.updateDensity();             // Sets this.density [kg/m^3] based on homogeneous spherical assumption

        // --- Nuclear & Chemical Composition ---
        // Mass fractions must sum to 1.0. X=Hydrogen, Y=Helium, Z=Metals
        this.composition = { X: 0.73, Y: 0.25, Z: 0.02 };

        // --- Electromagnetic ---
        this.charge = 0;                  // [C]
        this.magneticField = new Vec3();  // Intrinsic dipole moment / surface field proxy [T]

        // --- Radiation ---
        this.luminosity = 0;              // [W] (J/s)
    }

    updateDensity() {
        if (this.radius <= 0) {
            this.density = Infinity;
        } else {
            const volume = (4/3) * Math.PI * Math.pow(this.radius, 3);
            this.density = this.mass / volume; // [kg/m^3]
        }
    }

    // Clone creates a deep copy of the state vector for integrators (like RK4)
    clone() {
        let b = new PhysicalBody(
            this.id,
            this.type,
            this.mass,
            this.radius,
            this.pos.clone(),
            this.vel.clone()
        );
        b.acc = this.acc.clone();
        b.spin = this.spin.clone();
        b.temperature = this.temperature;
        b.internalEnergy = this.internalEnergy;
        b.density = this.density;
        b.sph_density = this.sph_density;
        b.sph_pressure = this.sph_pressure;
        b.composition = { ...this.composition };
        b.charge = this.charge;
        b.magneticField = this.magneticField.clone();
        b.luminosity = this.luminosity;
        return b;
    }
}
