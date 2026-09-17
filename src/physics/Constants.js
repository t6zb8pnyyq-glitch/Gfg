/**
 * src/physics/Constants.js
 *
 * Centralized registry of physical constants in strict SI units.
 * As per M1 specification, all internal calculations MUST use these constants.
 * Conversion functions are provided for UI/diagnostic display only.
 */
const PhysicsConstants = {
    // Fundamental Constants
    G: 6.67430e-11,             // Gravitational constant [m^3 kg^-1 s^-2]
    c: 299792458,               // Speed of light in vacuum [m/s]
    h_bar: 1.054571817e-34,     // Reduced Planck constant [J s]
    k_B: 1.380649e-23,          // Boltzmann constant [J/K]
    e: 1.602176634e-19,         // Elementary charge [C]
    eps_0: 8.8541878128e-12,    // Vacuum permittivity [F/m]
    mu_0: 1.25663706212e-6,     // Vacuum permeability [N/A^2]
    sigma_sb: 5.670374419e-8,   // Stefan-Boltzmann constant [W m^-2 K^-4]

    // Astronomical Masses
    M_sun: 1.98847e30,          // Solar mass [kg]
    M_earth: 5.9722e24,         // Earth mass [kg]
    M_moon: 7.342e22,           // Moon mass [kg]

    // Astronomical Distances
    AU: 1.495978707e11,         // Astronomical Unit [m]
    pc: 3.085677581e16,         // Parsec [m]
    ly: 9.4607e15,              // Light-year [m]

    // Time conversions
    yr: 31557600,               // Julian year [s]
    day: 86400,                 // Day [s]

    // Hubble parameter
    // Represented in s^-1 for internal integration (H0 = 70 km/s/Mpc)
    H0_s: 2.2685e-18            // Hubble constant [s^-1]
};

const UnitConverter = {
    toAU: (meters) => meters / PhysicsConstants.AU,
    fromAU: (au) => au * PhysicsConstants.AU,
    toSolarMass: (kg) => kg / PhysicsConstants.M_sun,
    fromSolarMass: (sm) => sm * PhysicsConstants.M_sun,
    toYears: (seconds) => seconds / PhysicsConstants.yr,
    fromYears: (years) => years * PhysicsConstants.yr
};
