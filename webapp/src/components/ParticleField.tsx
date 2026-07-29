import { useEffect, useRef } from 'react';

interface Particle {
  baseX: number;
  baseY: number;
  phase: number;
  speed: number;
}

const GOLD = [240, 169, 31];
const RED = [209, 56, 42];

export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    let pointer = { x: -999, y: -999 };
    let raf = 0;
    let setupRaf = 0;

    function setup() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        setupRaf = requestAnimationFrame(setup);
        return;
      }
      canvas.width = rect.width;
      canvas.height = rect.height;
      const cols = Math.round(rect.width / 60);
      const rows = Math.round(rect.height / 60);
      particles = [];
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          particles.push({
            baseX: (i + 0.5) * (canvas.width / cols),
            baseY: (j + 0.5) * (canvas.height / rows),
            phase: Math.random() * Math.PI * 2,
            speed: 0.3 + Math.random() * 0.3,
          });
        }
      }
      draw();
    }

    function onMove(e: PointerEvent | TouchEvent) {
      if (!canvas) return;
      const r = canvas.getBoundingClientRect();
      const t = 'touches' in e ? e.touches[0] : e;
      pointer = { x: t.clientX - r.left, y: t.clientY - r.top };
    }
    function onLeave() {
      pointer = { x: -999, y: -999 };
    }

    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('touchmove', onMove, { passive: true });
    canvas.addEventListener('touchend', onLeave);

    function draw() {
      if (!canvas || !ctx) return;
      const t = performance.now() / 1000;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        let x = p.baseX + Math.sin(t * p.speed + p.phase) * 8;
        let y = p.baseY + Math.cos(t * p.speed * 0.8 + p.phase) * 8;
        const dx = x - pointer.x;
        const dy = y - pointer.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.max(0, 1 - dist / 140);
        if (influence > 0) {
          const push = influence * 30;
          const ang = Math.atan2(dy, dx);
          x += Math.cos(ang) * push;
          y += Math.sin(ang) * push;
        }
        const r = Math.round(GOLD[0] + (RED[0] - GOLD[0]) * influence);
        const g = Math.round(GOLD[1] + (RED[1] - GOLD[1]) * influence);
        const b = Math.round(GOLD[2] + (RED[2] - GOLD[2]) * influence);
        const alpha = 0.3 + influence * 0.5;
        const radius = 1.8 + influence * 2.2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }

    function onResize() {
      cancelAnimationFrame(raf);
      setup();
    }

    window.addEventListener('resize', onResize);
    setup();

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(setupRaf);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('touchmove', onMove);
      canvas.removeEventListener('touchend', onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}
