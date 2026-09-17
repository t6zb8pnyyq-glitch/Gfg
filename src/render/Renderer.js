const Renderer = {
        canvas: null, ctx: null, cameraRot: {x: 0, y: 0}, cameraPan: {x: 0, y: 0}, scale: 1e-9,
        isDragging: false, isPanDragging: false, lastMouse: {x: 0, y: 0},

        init: function() {
            this.canvas = document.getElementById('sim-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.resize(); window.addEventListener('resize', () => this.resize());

            this.
    // Pointer and touch handling for mobile support
    canvas.addEventListener('pointerdown', (e) => {
        isDragging = true;
        lastMouse = { x: e.clientX, y: e.clientY };
        canvas.setPointerCapture(e.pointerId);
    });
    window.addEventListener('pointerup', (e) => {
        isDragging = false;
        canvas.releasePointerCapture(e.pointerId);
    });
    window.addEventListener('pointermove', (e) => {
        if (isDragging) {
            let dx = e.clientX - lastMouse.x;
            let dy = e.clientY - lastMouse.y;
            camera.rot.y += dx * 0.01;
            camera.rot.x += dy * 0.01;
            lastMouse = { x: e.clientX, y: e.clientY };
        }
    });

    // Allow double tap / double click to spawn object
    canvas.addEventListener('dblclick', (e) => {
        // Create an object approximately where tapped
        let type = document.getElementById('type').value;
        let mass = parseFloat(document.getElementById('mass').value) || 1e24;
        let radius = parseFloat(document.getElementById('radius').value) || 6000000;
        let dist = 1e8; // arbitrary placement distance
        let spawnPos = new Vec3(
            dist * Math.sin(camera.rot.y),
            dist * Math.sin(-camera.rot.x),
            -dist * Math.cos(camera.rot.y)
        );
        let b = new PhysicalBody(Date.now().toString(), type, mass, radius, spawnPos, new Vec3(0,0,0));
        if(type === 'star') b.temperature = 5778;
        engine.objects.push(b);
        updateInspector();
    });

    canvas.addEventListener('wheel', (e) => {
        camera.distance += e.deltaY * 1e8;
        if(camera.distance < 1e8) camera.distance = 1e8;
    });

    // Allow double tap / double click to spawn object at raycast intersection (mocked at depth)
    canvas.addEventListener('dblclick', (e) => {
        // Simple mapping from screen to world space approximation for creation
        let b = new Body(1e24, 6000000, 0, 0, 0, 0, 0, 0);
        bodies.push(b);
        updateInspector();
    });

            this.canvas.addEventListener('mousemove', (e) => {
                let dx = e.clientX - this.lastMouse.x; let dy = e.clientY - this.lastMouse.y;
                if(this.isDragging) { this.cameraRot.x -= dy * 0.01; this.cameraRot.y -= dx * 0.01; }
                if(this.isPanDragging) { this.cameraPan.x += dx; this.cameraPan.y += dy; }
                this.lastMouse = {x: e.clientX, y: e.clientY};
            });
            this.canvas.addEventListener('mouseup', () => { this.isDragging = false; this.isPanDragging = false; });
            this.canvas.addEventListener('wheel', (e) => { e.preventDefault(); this.scale *= (e.deltaY > 0 ? 0.9 : 1.1); });
            this.canvas.oncontextmenu = (e) => e.preventDefault();
        },
        resize: function() { let r = this.canvas.parentElement.getBoundingClientRect(); this.canvas.width = r.width; this.canvas.height = r.height; },
        draw: function() {
            this.ctx.fillStyle = "#000"; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            let cx = this.canvas.width / 2 + this.cameraPan.x; let cy = this.canvas.height / 2 + this.cameraPan.y;
            let sinX = Math.sin(this.cameraRot.x), cosX = Math.cos(this.cameraRot.x);
            let sinY = Math.sin(this.cameraRot.y), cosY = Math.cos(this.cameraRot.y);

            let projObjs = Engine.objects.map(o => {
                let x1 = o.pos.x * cosY - o.pos.z * sinY; let z1 = o.pos.z * cosY + o.pos.x * sinY;
                let y2 = o.pos.y * cosX - z1 * sinX; let z2 = z1 * cosX + o.pos.y * sinX;
                return { obj: o, px: cx + x1 * this.scale, py: cy + y2 * this.scale, pz: z2, pr: Math.max(1.5, o.radius * this.scale) };
            });
            projObjs.sort((a,b) => a.pz - b.pz);

            for(let p of projObjs) {
                this.ctx.beginPath(); this.ctx.arc(p.px, p.py, p.pr, 0, Math.PI*2);
                if(p.obj.type === "STAR") this.ctx.fillStyle = "#facc15"; // yellow
                else if(p.obj.type === "PLANET") this.ctx.fillStyle = "#0ea5e9";
                else if(p.obj.type === "BLACK_HOLE") { this.ctx.fillStyle = "#000"; this.ctx.strokeStyle="#fff"; this.ctx.stroke(); }
                else if(p.obj.type === "GAS_CLOUD") this.ctx.fillStyle = "rgba(16, 185, 129, 0.5)";
                else this.ctx.fillStyle = "#aaa";
                this.ctx.fill();
            }
        }
    }