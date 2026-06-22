import React, { useEffect, useRef, useState } from 'react';
import { reviewTheme } from '../data/theme';

interface FloatingCardProps {
  // Selector or rect provider for the anchor element
  anchor: () => DOMRect | null;
  // Preferred side
  preferSide?: 'right' | 'left' | 'top' | 'bottom' | 'auto';
  width?: number;
  offset?: number;
  zIndex?: number;
  children: React.ReactNode;
}

const VIEWPORT_PAD = 12;

export const FloatingCard: React.FC<FloatingCardProps> = ({
  anchor,
  preferSide = 'auto',
  width = 320,
  offset = 12,
  zIndex = 95000,
  children,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: width, h: 240 });

  useEffect(() => {
    let raf: number;
    const tick = () => {
      const a = anchor();
      const cardH = ref.current ? ref.current.offsetHeight : 240;
      const cardW = ref.current ? ref.current.offsetWidth : width;
      setSize({ w: cardW, h: cardH });
      if (a) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        // Try right
        const rightFits = a.right + offset + cardW <= vw - VIEWPORT_PAD;
        const leftFits = a.left - offset - cardW >= VIEWPORT_PAD;
        const bottomFits = a.bottom + offset + cardH <= vh - VIEWPORT_PAD;
        const topFits = a.top - offset - cardH >= VIEWPORT_PAD;

        let side = preferSide;
        if (side === 'auto') {
          if (rightFits) side = 'right';
          else if (leftFits) side = 'left';
          else if (bottomFits) side = 'bottom';
          else if (topFits) side = 'top';
          else side = 'right';
        }

        let top = 0;
        let left = 0;
        switch (side) {
          case 'right':
            left = a.right + offset;
            top = a.top + a.height / 2 - cardH / 2;
            break;
          case 'left':
            left = a.left - offset - cardW;
            top = a.top + a.height / 2 - cardH / 2;
            break;
          case 'top':
            left = a.left + a.width / 2 - cardW / 2;
            top = a.top - offset - cardH;
            break;
          case 'bottom':
            left = a.left + a.width / 2 - cardW / 2;
            top = a.bottom + offset;
            break;
        }
        // clamp
        top = Math.max(VIEWPORT_PAD, Math.min(vh - cardH - VIEWPORT_PAD, top));
        left = Math.max(VIEWPORT_PAD, Math.min(vw - cardW - VIEWPORT_PAD, left));
        setPos({ top, left });
      } else {
        setPos(null);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [anchor, preferSide, offset, width]);

  if (!pos) return null;

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width,
        background: reviewTheme.surfaceCard,
        color: reviewTheme.ink,
        border: `1px solid ${reviewTheme.border}`,
        borderRadius: reviewTheme.radius,
        boxShadow: reviewTheme.shadow,
        zIndex,
        fontFamily: reviewTheme.fontSans,
      }}
    >
      {children}
    </div>
  );
};

// helper: turn an annotation locate spec into a getBoundingClientRect-like rect provider
export const makeAnchorFn = (locate: () => { selector?: string; rect?: any }): (() => DOMRect | null) => {
  return () => {
    const loc = locate();
    if (loc.selector) {
      const el = document.querySelector(loc.selector) as HTMLElement | null;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return null;
      return r;
    }
    return null;
  };
};
