import React, { useEffect, useState } from 'react';
import { reviewTheme } from '../data/theme';

interface ClickLockOverlayProps {
  // Returns the target's viewport rect, or null if not yet located.
  anchor: () => DOMRect | null;
  onOutsideClick?: () => void;
  // Px padding around the target rect (the "hole")
  pad?: number;
}

const Z = 98000;
const DIM = 'rgba(31,30,27,0.32)';

export const ClickLockOverlay: React.FC<ClickLockOverlayProps> = ({ anchor, onOutsideClick, pad = 8 }) => {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      setRect(anchor());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [anchor]);

  const handleBlock = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onOutsideClick?.();
  };

  if (!rect) {
    // No target yet — full screen dim, still blocks clicks
    return (
      <div
        onClick={handleBlock}
        style={{
          position: 'fixed',
          inset: 0,
          background: DIM,
          zIndex: Z,
          cursor: 'not-allowed',
        }}
      />
    );
  }

  // Compute the 4 surrounding strips that leave a transparent hole at the target.
  const top = Math.max(0, rect.top - pad);
  const bottom = Math.min(window.innerHeight, rect.bottom + pad);
  const left = Math.max(0, rect.left - pad);
  const right = Math.min(window.innerWidth, rect.right + pad);

  return (
    <>
      {/* Top strip */}
      <div onClick={handleBlock} style={stripStyle({ left: 0, top: 0, width: '100vw', height: top })} />
      {/* Bottom strip */}
      <div onClick={handleBlock} style={stripStyle({ left: 0, top: bottom, width: '100vw', height: `calc(100vh - ${bottom}px)` as any })} />
      {/* Left strip */}
      <div onClick={handleBlock} style={stripStyle({ left: 0, top, width: left, height: bottom - top })} />
      {/* Right strip */}
      <div onClick={handleBlock} style={stripStyle({ left: right, top, width: `calc(100vw - ${right}px)` as any, height: bottom - top })} />

      {/* Spotlight ring around the hole */}
      <div
        style={{
          position: 'fixed',
          top,
          left,
          width: right - left,
          height: bottom - top,
          border: `2px solid ${reviewTheme.accent}`,
          borderRadius: 8,
          pointerEvents: 'none',
          boxShadow: `0 0 0 4px rgba(217,119,87,0.25)`,
          zIndex: Z + 1,
          animation: 'review-pulse 1.6s ease-in-out infinite',
        }}
      />
    </>
  );
};

const stripStyle = (rest: React.CSSProperties): React.CSSProperties => ({
  position: 'fixed',
  background: DIM,
  zIndex: Z,
  cursor: 'not-allowed',
  ...rest,
});
