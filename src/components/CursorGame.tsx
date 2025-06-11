import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export function CursorGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const isClickedRef = useRef(false);

  const colors = ['#118DFF', '#3BA1FF', '#64B5FF', '#8DC9FF', '#B6DDFF'];

  const createParticle = (x: number, y: number, isClick: boolean): Particle => ({
    x,
    y,
    vx: (Math.random() - 0.5) * (isClick ? 10 : 2),
    vy: (Math.random() - 0.5) * (isClick ? 10 : 2),
    life: 1,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: isClick ? Math.random() * 4 + 2 : Math.random() * 2 + 1
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      
      // Add particles on mouse move
      if (!isClickedRef.current) {
        for (let i = 0; i < 2; i++) {
          particlesRef.current.push(createParticle(e.clientX, e.clientY, false));
        }
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      isClickedRef.current = true;
      // Create explosion effect
      for (let i = 0; i < 20; i++) {
        particlesRef.current.push(createParticle(e.clientX, e.clientY, true));
      }
    };

    const handleMouseUp = () => {
      isClickedRef.current = false;
    };

    const animate = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.02;

        if (particle.life <= 0) return false;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `${particle.color}${Math.floor(particle.life * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();

        return true;
      });

      requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    resizeCanvas();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}