const FluidEngine = {
    h: 1e6,
    gamma: 5 / 3,
    alphaViscosity: 1.0,
    betaViscosity: 2.0,
    epsilon: 1e-12,

    kernels: {
        poly6(r, h) {
            if (r < 0 || r >= h) return 0;
            const q = h*h - r*r;
            return 315 / (64 * Math.PI * Math.pow(h, 9)) * q*q*q;
        },
        gradSpiky(rVec, h) {
            const r = rVec.mag();
            if (r <= 0 || r >= h) return new Vec3();
            const c = -45 / (Math.PI * Math.pow(h, 6));
            return rVec.div(r).mult(c * Math.pow(h - r, 2));
        },
        lapViscosity(r, h) {
            if (r <= 0 || r >= h) return 0;
            return 45 / (Math.PI * Math.pow(h, 6)) * (h - r);
        }
    },

    computeState(objects) {
        const gas = objects.filter(o => o.type === "GAS_CLOUD");
        for (const i of gas) {
            let rho = 0;
            for (const j of gas) rho += j.mass * this.kernels.poly6(i.pos.sub(j.pos).mag(), this.h);
            i.sph_density = Math.max(rho, this.epsilon);
            const u = Math.max(0, i.internalEnergy / Math.max(i.mass, this.epsilon));
            i.sph_pressure = (this.gamma - 1) * i.sph_density * u;
        }
        return gas;
    },

    computeAccelerations(objects) {
        const gas = this.computeState(objects);
        const result = new Map();
        for (const i of gas) {
            let a = new Vec3();
            for (const j of gas) {
                if (i === j) continue;
                const rij = i.pos.sub(j.pos);
                const r = rij.mag();
                if (r <= 0 || r >= this.h) continue;

                const gradW = this.kernels.gradSpiky(rij, this.h);
                const pressure = -j.mass *
                    (i.sph_pressure / (i.sph_density*i.sph_density) +
                     j.sph_pressure / (j.sph_density*j.sph_density));
                a = a.add(gradW.mult(pressure / Math.max(i.sph_density, this.epsilon)));

                const vij = i.vel.sub(j.vel);
                const rv = rij.dot(vij);
                if (rv < 0) {
                    const mu = this.h * rv / (r*r + 0.01*this.h*this.h);
                    const cbar = 0.5 * (
                        Math.sqrt(Math.max(0, this.gamma * i.sph_pressure / i.sph_density)) +
                        Math.sqrt(Math.max(0, this.gamma * j.sph_pressure / j.sph_density))
                    );
                    const pi = (-this.alphaViscosity*cbar*mu + this.betaViscosity*mu*mu) /
                        Math.max(0.5*(i.sph_density+j.sph_density), this.epsilon);
                    a = a.add(gradW.mult(-j.mass * pi));
                }
            }
            result.set(i, a);
        }
        return result;
    },

    updateInternalEnergy(objects, dt) {
        const gas = this.computeState(objects);
        const du = new Map(gas.map(o => [o, 0]));
        for (const i of gas) {
            for (const j of gas) {
                if (i === j) continue;
                const rij = i.pos.sub(j.pos);
                const r = rij.mag();
                if (r <= 0 || r >= this.h) continue;
                const vij = i.vel.sub(j.vel);
                const gradW = this.kernels.gradSpiky(rij, this.h);
                const pressureWork = 0.5 * j.mass *
                    (i.sph_pressure/(i.sph_density*i.sph_density) +
                     j.sph_pressure/(j.sph_density*j.sph_density)) *
                    vij.dot(gradW);
                du.set(i, du.get(i) + pressureWork);

                const rv = rij.dot(vij);
                if (rv < 0) {
                    const mu = this.h * rv / (r*r + 0.01*this.h*this.h);
                    const cbar = 0.5 * (
                        Math.sqrt(Math.max(0, this.gamma*i.sph_pressure/i.sph_density)) +
                        Math.sqrt(Math.max(0, this.gamma*j.sph_pressure/j.sph_density))
                    );
                    const pi = (-this.alphaViscosity*cbar*mu + this.betaViscosity*mu*mu) /
                        Math.max(0.5*(i.sph_density+j.sph_density), this.epsilon);
                    du.set(i, du.get(i) + 0.5*j.mass*pi*vij.dot(gradW));
                }
            }
        }
        for (const o of gas) o.internalEnergy = Math.max(0, o.internalEnergy + du.get(o) * o.mass * dt);
    },

    computeSPH(objects) {
        this.computeState(objects);
        const acc = this.computeAccelerations(objects);
        for (const [o, a] of acc) o.acc = o.acc.add(a);
        return acc;
    }
};
