import { useEffect, useRef, useCallback } from 'react';

/**
 * Subtle parallax background with geometric shapes that respond to scroll.
 * Uses CSS transforms (GPU-accelerated) and requestAnimationFrame for 60fps.
 * Respects prefers-reduced-motion. Hidden on light theme via CSS class.
 */

interface ParallaxLayer {
  speed: number;       // parallax multiplier (0 = static, 1 = full scroll speed)
  elements: {
    shape: 'circle' | 'diamond' | 'ring' | 'dot';
    x: string;         // CSS left position
    y: number;         // initial top offset in px
    size: number;      // px
    opacity: number;
    color: string;
    blur?: number;
  }[];
}

const LAYERS: ParallaxLayer[] = [
  {
    speed: 0.03,
    elements: [
      { shape: 'circle', x: '8%', y: 120, size: 180, opacity: 0.04, color: '#D4AF37', blur: 40 },
      { shape: 'circle', x: '85%', y: 500, size: 220, opacity: 0.035, color: '#10B981', blur: 50 },
      { shape: 'circle', x: '45%', y: 900, size: 160, opacity: 0.03, color: '#D4AF37', blur: 35 },
    ],
  },
  {
    speed: 0.06,
    elements: [
      { shape: 'diamond', x: '15%', y: 300, size: 24, opacity: 0.08, color: '#D4AF37' },
      { shape: 'ring', x: '78%', y: 200, size: 40, opacity: 0.06, color: '#10B981' },
      { shape: 'dot', x: '60%', y: 700, size: 6, opacity: 0.12, color: '#D4AF37' },
      { shape: 'diamond', x: '92%', y: 1100, size: 18, opacity: 0.07, color: '#10B981' },
      { shape: 'dot', x: '25%', y: 1400, size: 5, opacity: 0.1, color: '#D4AF37' },
    ],
  },
  {
    speed: 0.1,
    elements: [
      { shape: 'dot', x: '20%', y: 180, size: 4, opacity: 0.15, color: '#D4AF37' },
      { shape: 'dot', x: '50%', y: 450, size: 3, opacity: 0.12, color: '#10B981' },
      { shape: 'ring', x: '35%', y: 600, size: 22, opacity: 0.06, color: '#D4AF37' },
      { shape: 'dot', x: '70%', y: 350, size: 5, opacity: 0.14, color: '#D4AF37' },
      { shape: 'dot', x: '88%', y: 800, size: 3, opacity: 0.1, color: '#10B981' },
      { shape: 'diamond', x: '42%', y: 1200, size: 12, opacity: 0.06, color: '#D4AF37' },
      { shape: 'dot', x: '12%', y: 1000, size: 4, opacity: 0.12, color: '#10B981' },
    ],
  },
];

function getShapeStyle(
  el: ParallaxLayer['elements'][0]
): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'absolute',
    left: el.x,
    top: el.y,
    width: el.size,
    height: el.size,
    opacity: el.opacity,
    willChange: 'transform',
    pointerEvents: 'none',
    filter: el.blur ? `blur(${el.blur}px)` : undefined,
  };

  switch (el.shape) {
    case 'circle':
      return { ...base, borderRadius: '50%', background: el.color };
    case 'diamond':
      return { ...base, background: el.color, transform: 'rotate(45deg)', borderRadius: '3px' };
    case 'ring':
      return {
        ...base,
        borderRadius: '50%',
        border: `1.5px solid ${el.color}`,
        background: 'transparent',
      };
    case 'dot':
      return { ...base, borderRadius: '50%', background: el.color };
    default:
      return base;
  }
}

export default function ParallaxBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const scrollYRef = useRef(0);
  const reducedMotion = useRef(false);

  const tick = useCallback(() => {
    if (reducedMotion.current || !containerRef.current) return;

    const layers = containerRef.current.children;
    for (let i = 0; i < layers.length; i++) {
      const speed = LAYERS[i]?.speed ?? 0;
      const offset = -(scrollYRef.current * speed);
      (layers[i] as HTMLElement).style.transform = `translate3d(0, ${offset}px, 0)`;
    }

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion.current = mq.matches;

    const handleMotionChange = (e: MediaQueryListEvent) => {
      reducedMotion.current = e.matches;
      if (e.matches) {
        cancelAnimationFrame(rafRef.current);
        // Reset transforms
        if (containerRef.current) {
          const layers = containerRef.current.children;
          for (let i = 0; i < layers.length; i++) {
            (layers[i] as HTMLElement).style.transform = 'translate3d(0, 0, 0)';
          }
        }
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    const handleScroll = () => {
      scrollYRef.current = window.scrollY;
    };

    mq.addEventListener('change', handleMotionChange);
    window.addEventListener('scroll', handleScroll, { passive: true });

    if (!reducedMotion.current) {
      rafRef.current = requestAnimationFrame(tick);
    }

    return () => {
      mq.removeEventListener('change', handleMotionChange);
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [tick]);

  return (
    <div
      ref={containerRef}
      className="parallax-bg"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {LAYERS.map((layer, li) => (
        <div
          key={li}
          style={{
            position: 'absolute',
            inset: 0,
            willChange: 'transform',
          }}
        >
          {layer.elements.map((el, ei) => (
            <div key={`${li}-${ei}`} style={getShapeStyle(el)} />
          ))}
        </div>
      ))}
    </div>
  );
}
