import { onSettled } from 'solid-js';

/** Decorative drifting-particle network behind the auth pages. Client-only (runs after hydration). */
export default function ParticleCanvas() {
  let canvas!: HTMLCanvasElement;

  onSettled(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const isDark = () => document.documentElement.classList.contains('dark');
    const rgb = () => (isDark() ? '56, 189, 248' : '3, 105, 161');
    const boost = () => (isDark() ? 1 : 2.5);
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      r: Math.random() * 2 + 1.5,
      a: Math.random() * 0.5 + 0.2,
    }));

    let raf = 0;
    const frame = () => {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${rgb()}, ${Math.min(0.15 * boost(), 0.5) * (1 - dist / 100)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
      for (const p of particles) {
        p.x = (p.x + p.vx + width) % width;
        p.y = (p.y + p.vy + height) % height;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb()}, ${Math.min(p.a * boost(), 1)})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    };
    frame();

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
    };
  });

  return <canvas ref={canvas} aria-hidden="true" class="absolute inset-0 h-full w-full opacity-70" />;
}
