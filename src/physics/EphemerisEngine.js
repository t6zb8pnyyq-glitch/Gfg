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

    seedSolarSystem(objects, seconds=0) {
        if(!this.available()) throw new Error("Astronomy Engine unavailable");
        const specs=[
            ["Sun","STAR",PhysicsConstants.M_sun,6.957e8],
            ["Mercury","PLANET",3.3011e23,2.4397e6],
            ["Venus","PLANET",4.8675e24,6.0518e6],
            ["Earth","PLANET",5.9722e24,6.371e6],
            ["Mars","PLANET",6.4171e23,3.3895e6],
            ["Jupiter","PLANET",1.8982e27,6.9911e7],
            ["Saturn","PLANET",5.6834e26,5.8232e7],
            ["Uranus","PLANET",8.6810e25,2.5362e7],
            ["Neptune","PLANET",1.02413e26,2.4622e7],
            ["Pluto","PLANET",1.303e22,1.1883e6]
        ];
        objects.length=0;
        for(const [name,type,mass,radius] of specs){
            const s=this.barycentricState(name,seconds);
            objects.push(new PhysicalBody(name,type,mass,radius,s.pos,s.vel));
        }
        return objects;
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
