import { useEffect, useRef } from "react";

/**
 * Animated starfield canvas — deep-space parallax background
 * Renders 3 layers of stars at different speeds for depth illusion.
 */
export default function Starfield() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let w, h;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    // Create star layers
    const layers = [
      { count: 120, speed: 0.15, sizeMin: 0.4, sizeMax: 1.2, color: "rgba(148,163,184," },
      { count: 80,  speed: 0.35, sizeMin: 0.8, sizeMax: 1.8, color: "rgba(199,210,254," },
      { count: 40,  speed: 0.6,  sizeMin: 1.2, sizeMax: 2.5, color: "rgba(129,140,248," },
    ];

    const stars = layers.flatMap((layer) =>
      Array.from({ length: layer.count }, () => ({
        x: Math.random() * 2000,
        y: Math.random() * 2000,
        size: layer.sizeMin + Math.random() * (layer.sizeMax - layer.sizeMin),
        speed: layer.speed + Math.random() * 0.1,
        color: layer.color,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.01 + Math.random() * 0.03,
      }))
    );

    // Shooting stars
    const shootingStars = [];
    function maybeSpawnShootingStar() {
      if (Math.random() < 0.003 && shootingStars.length < 2) {
        shootingStars.push({
          x: Math.random() * w,
          y: Math.random() * h * 0.4,
          vx: 4 + Math.random() * 4,
          vy: 2 + Math.random() * 2,
          life: 1,
          decay: 0.015 + Math.random() * 0.01,
          length: 40 + Math.random() * 60,
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      // Draw stars
      for (const s of stars) {
        s.twinkle += s.twinkleSpeed;
        const alpha = 0.3 + Math.sin(s.twinkle) * 0.35 + 0.35;
        const sx = s.x % w;
        const sy = ((s.y += s.speed * 0.3)) % h;
        ctx.beginPath();
        ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
        ctx.fillStyle = s.color + alpha.toFixed(2) + ")";
        ctx.fill();
      }

      // Draw shooting stars
      maybeSpawnShootingStar();
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.x += ss.vx;
        ss.y += ss.vy;
        ss.life -= ss.decay;

        if (ss.life <= 0) {
          shootingStars.splice(i, 1);
          continue;
        }

        const grad = ctx.createLinearGradient(
          ss.x, ss.y,
          ss.x - ss.vx * (ss.length / ss.vx), ss.y - ss.vy * (ss.length / ss.vx)
        );
        grad.addColorStop(0, `rgba(255,255,255,${ss.life * 0.9})`);
        grad.addColorStop(1, `rgba(129,140,248,0)`);

        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(
          ss.x - ss.vx * (ss.length / ss.vx),
          ss.y - ss.vy * (ss.length / ss.vx)
        );
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        opacity: 0.7,
      }}
    />
  );
}
