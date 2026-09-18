/**
 * EphemerisEngine — adapter around the vendored Astronomy Engine library.
 *
 * Astronomy Engine is MIT licensed and independently validated against
 * NOVAS/JPL Horizons at approximately 1 arcminute for its stated ephemeris scope.
 * We use it only for reference Solar-System ephemerides; it does NOT replace
 * the dynamical N-body integrator.
 */
const EphemerisEngine = {
    AU: PhysicsConstants.AU,
    DAY: PhysicsConstants.day,
    J2000_MS: Date.UTC(2000,0,1,12,0,0),

    bodyMap: {
        Sun: "Sun", Mercury: "Mercury", Venus: "Venus", Earth: "Earth",
        Mars: "Mars", Jupiter: "Jupiter", Saturn: "Saturn",
        Uranus: "Uranus", Neptune: "Neptune", Pluto: "Pluto"
    },

    available() {
        return typeof Astronomy !== "undefined" &&
            Astronomy && Astronomy.Body && typeof Astronomy.BaryState === "function";
    },

    dateFromSeconds(seconds) {
        if (!Number.isFinite(seconds)) throw new Error("Invalid ephemeris time");
        return new Date(this.J2000_MS + seconds * 1000);
    },

    barycentricState(name, seconds) {
        if (!this.available()) throw new Error("Astronomy Engine unavailable");
        const bodyName = this.bodyMap[name];
        if (!bodyName || !Astronomy.Body[bodyName]) throw new Error("Unsupported ephemeris body: "+name);
        const s = Astronomy.BaryState(Astronomy.Body[bodyName], this.dateFromSeconds(seconds));
        // Astronomy Engine returns AU and AU/day in J2000 equatorial coordinates.
        return {
            name,
            time: s.t,
            pos: new Vec3(s.x * this.AU, s.y * this.AU, s.z * this.AU),
            vel: new Vec3(
                s.vx * this.AU / this.DAY,
                s.vy * this.AU / this.DAY,
                s.vz * this.AU / this.DAY
            )
        };
    },

    solarSystem(seconds) {
        const names = Object.keys(this.bodyMap);
        return names.map(name => this.barycentricState(name, seconds));
    },

    earthStateErrorAgainstKepler(seconds) {
        const e = this.barycentricState("Earth", seconds);
        const r = e.pos.mag();
        const expected = this.AU;
        return Math.abs(r - expected) / expected;
    },

    status() {
        return {
            available: this.available(),
            provider: this.available() ? "Astronomy Engine" : "none",
            referenceFrame: "J2000 mean equator / barycentric",
            positionUnit: "m",
            velocityUnit: "m/s"
        };
    }
};
