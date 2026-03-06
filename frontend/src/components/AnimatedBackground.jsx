import React, { useEffect, useRef } from 'react';

const AnimatedBackground = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };
        window.addEventListener('resize', handleResize);

        // Particles
        const particles = Array.from({ length: 20 }, (_, i) => ({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 4 + 1,
            speedY: -(Math.random() * 0.8 + 0.2),
            speedX: (Math.random() - 0.5) * 0.5,
            color: i % 2 === 0 ? 'rgba(255, 153, 51, 0.4)' : 'rgba(19, 136, 8, 0.3)',
        }));

        // Orbs
        const orbs = [
            { x: width * 0.2, y: height * 0.2, r: 400, color: 'rgba(255,153,51,0.04)', dx: 0.3, dy: 0.2 },
            { x: width * 0.8, y: height * 0.8, r: 500, color: 'rgba(19,136,8,0.03)', dx: -0.2, dy: -0.3 },
            { x: width * 0.5, y: height * 0.5, r: 350, color: 'rgba(255,153,51,0.02)', dx: -0.1, dy: 0.4 },
        ];

        let rotationInfo = 0;

        const drawAshokaChakra = (x, y, radius, rotation, opacity = 0.05) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);
            ctx.strokeStyle = `rgba(0, 0, 128, ${opacity})`;
            ctx.lineWidth = radius * 0.04;

            // Outer rim
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.stroke();

            // 24 Spokes
            for (let i = 0; i < 24; i++) {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, -radius);
                ctx.stroke();
                ctx.rotate((Math.PI * 2) / 24);
            }
            ctx.restore();
        };

        const draw = () => {
            ctx.clearRect(0, 0, width, height);
            rotationInfo += 0.002;

            // Draw Orbs
            orbs.forEach(orb => {
                orb.x += orb.dx;
                orb.y += orb.dy;
                if (orb.x < -orb.r || orb.x > width + orb.r) orb.dx *= -1;
                if (orb.y < -orb.r || orb.y > height + orb.r) orb.dy *= -1;

                const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
                grad.addColorStop(0, orb.color);
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
                ctx.fill();
            });

            // Draw Chakras
            drawAshokaChakra(width * 0.85, height * 0.15, Math.min(width, height) * 0.25, rotationInfo * 0.5, 0.02);
            drawAshokaChakra(width * 0.1, height * 0.8, Math.min(width, height) * 0.15, -rotationInfo * 0.8, 0.03);
            drawAshokaChakra(width * 0.5, height * 0.5, Math.min(width, height) * 0.4, rotationInfo * 0.2, 0.015);

            // Draw Particles
            particles.forEach(p => {
                p.y += p.speedY;
                p.x += p.speedX;
                if (p.y < -50) {
                    p.y = height + 50;
                    p.x = Math.random() * width;
                }
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                pointerEvents: 'none'
            }}
        />
    );
};

export default AnimatedBackground;
