const Diagnostics = {
    initEnergy: null,
    initialMomentum: null,
    initialAngularMomentum: null,

    getKineticEnergy(objects) {
        return objects.reduce((sum, o) => sum + 0.5 * o.mass * o.vel.magSq(), 0);
    },

    getPotentialEnergy(objects) {
        let u = 0;
        for (let i = 0; i < objects.length; i++) {
            for (let j = i + 1; j < objects.length; j++) {
                const r = objects[i].pos.sub(objects[j].pos).mag();
                if (r > 0) u -= PhysicsConstants.G * objects[i].mass * objects[j].mass / r;
            }
        }
        return u;
    },

    getTotalMomentum(objects) {
        return objects.reduce((sum, o) => sum.add(o.vel.mult(o.mass)), new Vec3());
    },

    getAngularMomentum(objects) {
        return objects.reduce((sum, o) => sum.add(o.pos.cross(o.vel.mult(o.mass))), new Vec3());
    },

    begin(objects) {
        this.initEnergy = this.getKineticEnergy(objects) + this.getPotentialEnergy(objects);
        this.initialMomentum = this.getTotalMomentum(objects);
        this.initialAngularMomentum = this.getAngularMomentum(objects);
    },

    relativeError(value, reference, floor = 1e-300) {
        return Math.abs(value - reference) / Math.max(Math.abs(reference), floor);
    },

    vectorRelativeError(v, ref, floor = 1e-300) {
        return v.sub(ref).mag() / Math.max(ref.mag(), floor);
    },

    sample(objects) {
        const totalE = this.getKineticEnergy(objects) + this.getPotentialEnergy(objects);
        const mom = this.getTotalMomentum(objects);
        const ang = this.getAngularMomentum(objects);
        return {
            energy: totalE,
            energyRelativeError: this.initEnergy == null ? 0 : this.relativeError(totalE, this.initEnergy),
            momentumRelativeError: this.initialMomentum == null ? 0 : this.vectorRelativeError(mom, this.initialMomentum),
            angularMomentumRelativeError: this.initialAngularMomentum == null ? 0 : this.vectorRelativeError(ang, this.initialAngularMomentum)
        };
    },

    update(objects) {
        if (this.initEnergy == null && objects.length) this.begin(objects);
        const s = this.sample(objects);
        const finite = [s.energy, s.energyRelativeError, s.momentumRelativeError, s.angularMomentumRelativeError].every(Number.isFinite);
        const statusEl = document.getElementById('diag-status');
        const energyEl = document.getElementById('diag-energy');
        const errEl = document.getElementById('diag-e-err');
        const momEl = document.getElementById('diag-mom');
        if (energyEl) energyEl.innerText = Number(s.energy).toExponential(6) + " J";
        if (errEl) errEl.innerText = (s.energyRelativeError * 100).toExponential(6) + " %";
        if (momEl) momEl.innerText = (momEl.dataset && momEl.dataset.vector === "true")
            ? s.momentumRelativeError.toExponential(6)
            : this.getTotalMomentum(objects).mag().toExponential(6);
        if (statusEl) {
            if (!finite) {
                statusEl.innerText = "FAIL (비유한값)";
                statusEl.className = "val fail";
                Engine.status = "FAILED";
            } else if (s.energyRelativeError > 1e-2) {
                statusEl.innerText = "WARNING (오차)";
                statusEl.className = "val warn";
            } else {
                statusEl.innerText = "STABLE";
                statusEl.className = "val pass";
            }
        }
        return s;
    }
};
