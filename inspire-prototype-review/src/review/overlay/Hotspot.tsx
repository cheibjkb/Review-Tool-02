import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Annotation } from '../data/annotations';
import { reviewTheme, changeTypeColor, changeTypeLabel } from '../data/theme';
import { useReview } from '../ReviewProvider';

interface HotspotProps {
  annotation: Annotation;
  variant: 'dot' | 'ring';
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
  visible: boolean;
}

const locateRect = (a: Annotation): Rect | null => {
  const loc = a.locate();
  if (loc.selector) {
    const el = document.querySelector(loc.selector) as HTMLElement | null;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top, left: r.left, width: r.width, height: r.height, visible: r.width > 0 && r.height > 0 };
  }
  if (loc.rect) {
    const vw = window.innerWidth, vh = window.innerHeight;
    return {
      top: (loc.rect.topPct / 100) * vh,
      left: (loc.rect.leftPct / 100) * vw,
      width: (loc.rect.widthPct / 100) * vw,
      height: (loc.rect.heightPct / 100) * vh,
      visible: true,
    };
  }
  return null;
};

const DOT_SIZE = 8;
const POPUP_W = 280;
const VIEWPORT_PAD = 12;

// Soft tint of the change-type color for the benefit block background.
const tintBg = (hex: string): string => {
  // Parse #RRGGBB -> rgba with low alpha
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return 'rgba(217,119,87,0.10)';
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return `rgba(${r},${g},${b},0.10)`;
};

export const Hotspot: React.FC<HotspotProps> = ({ annotation, variant }) => {
  const [rect, setRect] = useState<Rect | null>(null);
  const [hovered, setHovered] = useState(false);
  const rafRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const { openCompare } = useReview();
  const navigate = useNavigate();

  const cancelClose = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimerRef.current = window.setTimeout(() => setHovered(false), 180);
  };
  const onEnter = () => {
    cancelClose();
    setHovered(true);
  };

  useEffect(() => () => cancelClose(), []);

  useEffect(() => {
    let prevSig = '';
    const tick = () => {
      const r = locateRect(annotation);
      const sig = r ? `${Math.round(r.top)}|${Math.round(r.left)}|${Math.round(r.width)}|${Math.round(r.height)}|${r.visible}` : 'null';
      if (sig !== prevSig) {
        prevSig = sig;
        setRect(r);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [annotation]);

  if (!rect || !rect.visible) return null;

  const color = changeTypeColor(annotation.changeType);
  const label = changeTypeLabel(annotation.changeType);

  if (variant === 'ring') {
    return (
      <div
        style={{
          position: 'fixed',
          top: rect.top - 4,
          left: rect.left - 4,
          width: rect.width + 8,
          height: rect.height + 8,
          border: `2px solid ${color}`,
          borderRadius: 8,
          pointerEvents: 'none',
          zIndex: 90000,
          boxShadow: `0 0 0 4px ${reviewTheme.accentSoft}`,
          animation: 'review-pulse 1.6s ease-in-out infinite',
        }}
      />
    );
  }

  // Dot variant — placed just OUTSIDE the target's top-right corner so it never covers text.
  const dotTop = rect.top - DOT_SIZE / 2;
  const dotLeft = rect.left + rect.width - DOT_SIZE / 2;

  // Smart popup position — avoid the target rect and viewport edges.
  const vw = window.innerWidth, vh = window.innerHeight;
  const popupH = 180; // approx, will autosize
  let popLeft = rect.right ? rect.right + 12 : rect.left + rect.width + 12;
  let popTop = rect.top;
  // If popup would overflow right edge, place it to the left of target.
  if (popLeft + POPUP_W + VIEWPORT_PAD > vw) {
    popLeft = rect.left - 12 - POPUP_W;
  }
  // If still off-screen left, place below.
  if (popLeft < VIEWPORT_PAD) {
    popLeft = Math.max(VIEWPORT_PAD, Math.min(vw - POPUP_W - VIEWPORT_PAD, rect.left));
    popTop = rect.top + rect.height + 8;
  }
  // Clamp top within viewport.
  popTop = Math.max(VIEWPORT_PAD, Math.min(vh - popupH - VIEWPORT_PAD, popTop));

  return (
    <>
      <div
        onMouseEnter={onEnter}
        onMouseLeave={scheduleClose}
        style={{
          position: 'fixed',
          top: dotTop,
          left: dotLeft,
          width: DOT_SIZE,
          height: DOT_SIZE,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 0 2px ${reviewTheme.surfaceCard}`,
          cursor: 'pointer',
          zIndex: 90000,
          animation: 'review-pulse-dot 1.8s ease-in-out infinite',
        }}
      />
      {hovered && (
        <div
          onMouseEnter={onEnter}
          onMouseLeave={scheduleClose}
          style={{
            position: 'fixed',
            top: popTop,
            left: popLeft,
            width: POPUP_W,
            background: reviewTheme.surfaceCard,
            color: reviewTheme.ink,
            border: `1px solid ${reviewTheme.border}`,
            borderRadius: reviewTheme.radius,
            boxShadow: reviewTheme.shadow,
            padding: 12,
            zIndex: 95000,
            fontFamily: reviewTheme.fontSans,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span
              style={{
                fontFamily: reviewTheme.fontMono,
                fontSize: 10,
                padding: '1px 6px',
                background: color,
                color: '#fff',
                borderRadius: 3,
                letterSpacing: 0.5,
              }}
            >
              {label}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{annotation.title}</span>
          </div>
          <div
            style={{
              padding: '8px 10px',
              background: tintBg(color),
              borderRadius: 6,
              fontSize: 12,
              color: reviewTheme.ink,
              lineHeight: 1.55,
            }}
          >
            {annotation.painPoint}
          </div>
          {annotation.quickFillUids && annotation.quickFillUids.length > 0 && (
            <div style={{ marginTop: 8, padding: '6px 8px', background: reviewTheme.surfaceAlt, borderRadius: 6, fontSize: 11 }}>
              {annotation.quickFillUids.map((q) => (
                <div key={q.value} style={{ display: 'flex', alignItems: 'center', gap: 6, lineHeight: 1.6 }}>
                  <code style={{ userSelect: 'text', fontFamily: reviewTheme.fontMono, fontSize: 12, color: reviewTheme.ink }}>{q.value}</code>
                  <button
                    onClick={() => navigate(q.targetUrl)}
                    style={{
                      padding: '1px 6px',
                      background: reviewTheme.accent,
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 10,
                      fontFamily: reviewTheme.fontSans,
                    }}
                  >
                    使用
                  </button>
                  <span style={{ color: reviewTheme.inkMute }}>{q.label}</span>
                </div>
              ))}
            </div>
          )}
          {annotation.beforeAnchor && (
            <button
              onClick={() => openCompare(annotation.id)}
              style={{
                marginTop: 10,
                padding: '4px 10px',
                background: 'transparent',
                color: reviewTheme.accent,
                border: `1px solid ${reviewTheme.accent}`,
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 11,
                fontFamily: reviewTheme.fontSans,
              }}
            >
              ⇄ 对比改造前
            </button>
          )}
        </div>
      )}
    </>
  );
};
