const Renderer = {
        canvas: null, ctx: null, cameraRot: {x: 0, y: 0}, cameraPan: {x: 0, y: 0}, scale: 1e-9,
        isDragging: false, isPanDragging: false, lastMouse: {x: 0, y: 0},

        init: function() {
            this.canvas = document.getElementById('universe-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.resize();
            window.addEventListener('resize', () => this.resize());

            // Map global camera values structurally instead of loosely
            camera.rot = this.cameraRot;
            camera.pan = this.cameraPan;

            // Unified Pointer Events for Mobile and Desktop
            this.canvas.addEventListener('pointerdown', (e) => {
                this.isDragging = true;
                this.lastMouse = { x: e.clientX, y: e.clientY };
                this.canvas.setPointerCapture(e.pointerId);
            });

            window.addEventListener('pointerup', (e) => {
                this.isDragging = false;
                try { this.canvas.releasePointerCapture(e.pointerId); } catch(err) {}
            });

            window.addEventListener('pointermove', (e) => {
                if (this.isDragging) {
                    let dx = e.clientX - this.lastMouse.x;
                    let dy = e.clientY - this.lastMouse.y;
                    this.cameraRot.y += dx * 0.01;
                    this.cameraRot.x += dy * 0.01;
                    this.lastMouse = { x: e.clientX, y: e.clientY };
                }
            });

            this.canvas.addEventListener('wheel', (e) => {
                e.preventDefault();
                this.scale *= (e.deltaY > 0 ? 0.9 : 1.1);
            }, {passive: false});

            this.canvas.addEventListener('dblclick', (e) => {
                // Delegate to UI's create object
                UI.createObject();
            });
        },
        resize: function() {
            let r = this.canvas.parentElement.getBoundingClientRect();
            this.canvas.width = r.width;
            this.canvas.height = r.height;
        },
        draw: function() {
            this.ctx.fillStyle = "#000";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            let cx = this.canvas.width / 2 + this.cameraPan.x;
            let cy = this.canvas.height / 2 + this.cameraPan.y;
            let sinX = Math.sin(this.cameraRot.x), cosX = Math.cos(this.cameraRot.x);
            let sinY = Math.sin(this.cameraRot.y), cosY = Math.cos(this.cameraRot.y);

            let projObjs = Engine.objects.map(o => {
                let x1 = o.pos.x * cosY - o.pos.z * sinY;
                let z1 = o.pos.z * cosY + o.pos.x * sinY;
                let y2 = o.pos.y * cosX - z1 * sinX;
                let z2 = z1 * cosX + o.pos.y * sinX;
                return { obj: o, px: cx + x1 * this.scale, py: cy + y2 * this.scale, pz: z2, pr: Math.max(1.5, o.radius * this.scale) };
            });
            projObjs.sort((a,b) => a.pz - b.pz);

            for(let p of projObjs) {
                this.ctx.beginPath();
                this.ctx.arc(p.px, p.py, p.pr, 0, Math.PI*2);
                if(p.obj.type === "STAR") this.ctx.fillStyle = "#facc15";
                else if(p.obj.type === "PLANET") this.ctx.fillStyle = "#0ea5e9";
                else if(p.obj.type === "BLACK_HOLE") { this.ctx.fillStyle = "#000"; this.ctx.strokeStyle="#fff"; this.ctx.stroke(); }
                else if(p.obj.type === "GAS_CLOUD") this.ctx.fillStyle = "rgba(16, 185, 129, 0.5)";
                else this.ctx.fillStyle = "#aaa";
                this.ctx.fill();
            }
        }
    }