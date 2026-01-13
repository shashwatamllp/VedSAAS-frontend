/**
 * Brain Animation (The "Artificial Civilization" Core)
 * Renders a rotating 3D dot sphere on the landing page canvas.
 */
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('brain-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const body = document.body; // Needed for theme check

    let points = [];
    // Initialize points on a sphere
    for (let i = 0; i < 150; i++) {
        const theta = Math.acos(2 * Math.random() - 1);
        const phi = Math.sqrt(150 * Math.PI) * theta;
        const r = 100;
        points.push({
            x: r * Math.sin(theta) * Math.cos(phi),
            y: r * Math.sin(theta) * Math.sin(phi),
            z: r * Math.cos(theta)
        });
    }

    let rot = 0;

    function animate() {
        // Clear logic
        ctx.clearRect(0, 0, 300, 300);

        const cx = 150, cy = 150;
        rot += 0.005;

        // Theme check inside the loop to react to live changes
        const isLight = body.classList.contains('light-mode');
        // Cyan in Dark Mode, Deep Blue in Light Mode
        const color = isLight ? '#0066cc' : '#00f0ff';

        points.forEach(p => {
            // Rotation Matrix (Y-axis)
            let x = p.x * Math.cos(rot) - p.z * Math.sin(rot);
            let z = p.x * Math.sin(rot) + p.z * Math.cos(rot);

            // Perspective projection
            let scale = 300 / (300 + z);

            ctx.fillStyle = color;
            // Opacity based on depth (fog effect)
            ctx.globalAlpha = Math.max(0.1, (z + 100) / 200);

            ctx.beginPath();
            ctx.arc(cx + x * scale, cy + p.y * scale, 1.5 * scale, 0, Math.PI * 2);
            ctx.fill();
        });

        requestAnimationFrame(animate);
    }

    animate();
});
