import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useReview } from '../ReviewProvider';
import { findAnnotationById, findAnnotationsForRoute, Annotation } from '../data/annotations';
import { reviewTheme, changeTypeColor, changeTypeLabel } from '../data/theme';

const BEFORE_FILES = {
  initial: '/before/home-initial.html',
  modal: '/before/modal-open.html',
  submitted: '/before/submitted.html',
};
const SRC_VIEWPORT_W = 1920;
const SRC_VIEWPORT_H = 1200;

const REGION_SELECTORS: Record<string, string[]> = {
  modal: ['.semi-sidesheet-inner', '.semi-sidesheet-content'],
  submitted: ['.showcaseItemsList', '.showcase-list-container'],
  initial: ['.showcaseItemsList', '.showcase-list-container'],
};

const REGION_LABEL: Record<keyof typeof BEFORE_FILES, string> = {
  initial: '改造前 · Showcase 列表',
  modal: '改造前 · Showcase 配置弹窗',
  submitted: '改造前 · 提交成功态',
};

// Short clarifier shown under the label for cases where the old version's flow
// doesn't 1:1 map to the new version. Keeps reviewers from being puzzled by
// "why does the BEFORE shot look like the create flow when I'm reviewing bind?"
const REGION_HINT: Partial<Record<keyof typeof BEFORE_FILES, string>> = {
  submitted: '旧版只有「创建新 LIVE event」一种提交流程,下图为该流程提交后的页面。',
};

const pickBeforeFile = (search: URLSearchParams): { src: string; key: keyof typeof BEFORE_FILES } => {
  const isModalOpen = search.get('modal') === 'showcase';
  const state = search.get('state') || '';
  if (isModalOpen) return { src: BEFORE_FILES.modal, key: 'modal' };
  if (state === 'submit-select-success' || state === 'submit-create-success') return { src: BEFORE_FILES.submitted, key: 'submitted' };
  return { src: BEFORE_FILES.initial, key: 'initial' };
};

const ZOOMED_W = 460;
const ZOOMED_H = 320;

const FREEZE_CSS = `
  *, *::before, *::after {
    animation-duration: 0.001s !important;
    animation-delay: 0s !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001s !important;
  }
  .semi-spin-children::before, .semi-spin-icon, .semi-spin .semi-icon-spin {
    animation: none !important;
    opacity: 0 !important;
  }
  .semi-icon-spinning {
    display: none !important;
  }
`;

const injectFreezeCss = (doc: Document) => {
  if (!doc.head) return;
  if (doc.head.querySelector('[data-review-freeze]')) return;
  const style = doc.createElement('style');
  style.setAttribute('data-review-freeze', '1');
  style.textContent = FREEZE_CSS;
  doc.head.appendChild(style);
};

const tintBg = (hex: string): string => {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return 'rgba(217,119,87,0.10)';
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return `rgba(${r},${g},${b},0.10)`;
};

export const CompareDrawer: React.FC = () => {
  const { compareOpen, setCompareOpen, compareAnnotationId, comparePos, setComparePos, compareOpenSignal } = useReview();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [zoomed, setZoomed] = useState(false);
  const [pulse, setPulse] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Pulse the card border whenever `openCompare` is triggered (even if the window is already open).
  useEffect(() => {
    if (compareOpenSignal === 0) return;
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 500);
    return () => clearTimeout(t);
  }, [compareOpenSignal]);

  // Drag state
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);

  const onPointerDownHeader = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, baseX: comparePos.x, baseY: comparePos.y };
  };
  const onPointerMoveHeader = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const cardW = cardRef.current?.offsetWidth ?? ZOOMED_W + 28;
    const cardH = cardRef.current?.offsetHeight ?? 400;
    const nx = Math.max(8, Math.min(window.innerWidth - cardW - 8, dragRef.current.baseX + dx));
    const ny = Math.max(8, Math.min(window.innerHeight - cardH - 8, dragRef.current.baseY + dy));
    setComparePos({ x: nx, y: ny });
  };
  const onPointerUpHeader = (e: React.PointerEvent) => {
    try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {}
    dragRef.current = null;
  };

  if (!compareOpen) return null;

  // Pick the annotation to highlight in the card. The compare window FOLLOWS the user as
  // they navigate — pin to the originally-clicked annotation only while it is still on
  // the current route; otherwise fall back to the first annotation for the current state.
  const here = findAnnotationsForRoute(searchParams, location.pathname);
  const explicit = compareAnnotationId ? findAnnotationById(compareAnnotationId) : null;
  const explicitStillHere = explicit ? here.some((a) => a.id === explicit.id) : false;
  const ann: Annotation | null = (explicitStillHere ? explicit : null) || here[0] || null;

  const beforeInfo = pickBeforeFile(searchParams);

  return (
    <>
      <div
        ref={cardRef}
        style={{
          position: 'fixed',
          left: comparePos.x,
          top: comparePos.y,
          width: ZOOMED_W + 28,
          background: reviewTheme.surfaceCard,
          border: `1px solid ${pulse ? reviewTheme.accent : reviewTheme.border}`,
          borderRadius: reviewTheme.radius,
          boxShadow: pulse ? `0 0 0 3px ${reviewTheme.accentSoft}, ${reviewTheme.shadow}` : reviewTheme.shadow,
          zIndex: 99500,
          fontFamily: reviewTheme.fontSans,
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      >
        <CompareContent
          ann={ann}
          beforeSrc={beforeInfo.src}
          regionKey={beforeInfo.key}
          onClose={() => setCompareOpen(false)}
          onZoom={() => setZoomed(true)}
          onDragStart={onPointerDownHeader}
          onDragMove={onPointerMoveHeader}
          onDragEnd={onPointerUpHeader}
        />
      </div>
      {zoomed && (
        <ZoomedView
          beforeSrc={beforeInfo.src}
          regionKey={beforeInfo.key}
          onClose={() => setZoomed(false)}
        />
      )}
    </>
  );
};

const CompareContent: React.FC<{
  ann: Annotation | null;
  beforeSrc: string;
  regionKey: keyof typeof BEFORE_FILES;
  onClose: () => void;
  onZoom: () => void;
  onDragStart: (e: React.PointerEvent) => void;
  onDragMove: (e: React.PointerEvent) => void;
  onDragEnd: (e: React.PointerEvent) => void;
}> = ({ ann, beforeSrc, regionKey, onClose, onZoom, onDragStart, onDragMove, onDragEnd }) => {
  const color = ann ? changeTypeColor(ann.changeType) : reviewTheme.inkMute;
  const label = ann ? changeTypeLabel(ann.changeType) : '对比';

  return (
    <div>
      {/* Draggable header */}
      <div
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px 8px 14px',
          cursor: 'grab',
          userSelect: 'none',
          borderBottom: `1px solid ${reviewTheme.border}`,
          touchAction: 'none',
        }}
      >
        <span style={{ fontSize: 14, color: reviewTheme.inkMute }}>⋮⋮</span>
        <span style={{ fontFamily: reviewTheme.fontMono, fontSize: 11, color: reviewTheme.inkMute }}>对比改造前 · 可拖动</span>
        <div style={{ flex: 1 }} />
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: reviewTheme.inkMute, fontSize: 16, padding: 0, lineHeight: 1 }}
        >
          ×
        </button>
      </div>

      <div style={{ padding: 14 }}>
        {ann ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span
                style={{
                  fontFamily: reviewTheme.fontMono,
                  fontSize: 10,
                  padding: '2px 8px',
                  background: color,
                  color: '#fff',
                  borderRadius: 3,
                  letterSpacing: 0.5,
                }}
              >
                {label}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{ann.title}</span>
            </div>
            <div
              style={{
                padding: '10px 12px',
                background: tintBg(color),
                borderRadius: 6,
                fontSize: 13,
                color: reviewTheme.ink,
                lineHeight: 1.6,
                marginBottom: 10,
              }}
            >
              {ann.painPoint}
            </div>
            {ann.prdQuote && <PrdDisclosure quote={ann.prdQuote} />}
          </>
        ) : (
          <div style={{ fontSize: 12, color: reviewTheme.inkMute, marginBottom: 10 }}>
            当前页面没有标注的改动点，下面是同一阶段的老版界面快照。
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: REGION_HINT[regionKey] ? 2 : 6 }}>
          <span style={{ fontSize: 11, fontFamily: reviewTheme.fontMono, color: reviewTheme.inkMute }}>{REGION_LABEL[regionKey]}</span>
          <button
            onClick={onZoom}
            style={{
              padding: '3px 8px',
              background: 'transparent',
              color: reviewTheme.accent,
              border: `1px solid ${reviewTheme.accent}`,
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 11,
              fontFamily: reviewTheme.fontSans,
            }}
          >
            ⤢ 放大查看
          </button>
        </div>
        {REGION_HINT[regionKey] && (
          <div style={{ fontSize: 11, color: reviewTheme.inkMute, marginBottom: 6, lineHeight: 1.4 }}>
            {REGION_HINT[regionKey]}
          </div>
        )}
        <BeforeCrop src={beforeSrc} regionKey={regionKey} width={ZOOMED_W} height={ZOOMED_H} onClick={onZoom} />
      </div>
    </div>
  );
};

const PrdDisclosure: React.FC<{ quote: string }> = ({ quote }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 10 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'transparent',
          border: 'none',
          color: reviewTheme.inkMute,
          fontSize: 11,
          cursor: 'pointer',
          padding: 0,
          fontFamily: reviewTheme.fontSans,
        }}
      >
        {open ? '▾' : '▸'} PRD 原文
      </button>
      {open && (
        <div
          style={{
            marginTop: 6,
            padding: '8px 10px',
            background: reviewTheme.surfaceAlt,
            borderLeft: `2px solid ${reviewTheme.accent}`,
            fontSize: 11,
            color: reviewTheme.ink,
            fontFamily: reviewTheme.fontMono,
            lineHeight: 1.5,
          }}
        >
          {quote}
        </div>
      )}
    </div>
  );
};

// Given a 1D region (start, length) inside a scaled iframe and the wrapper's viewport
// length, decide where to position the iframe along that axis. Same math works for
// both X and Y axes. Two cases:
//   - Content fits in viewport (iframe content length <= viewport length): centre
//     the iframe inside the viewport, no scroll needed (initialScroll = 0).
//   - Content overflows: position the iframe so the region's centre lands at the
//     viewport centre when scrollLeft = initialScroll. iframeLeft is shifted to
//     be >= 0 so overflow:auto can scroll all the way to the iframe's leading edge.
const computeIframeOffset = (
  regionStart: number,
  regionLen: number,
  scale: number,
  viewportLen: number,
  srcLen: number,
): { iframeLeft: number; initialScroll: number } => {
  const iframeContentLen = srcLen * scale;
  if (iframeContentLen <= viewportLen) {
    return { iframeLeft: (viewportLen - iframeContentLen) / 2, initialScroll: 0 };
  }
  const regionCenterScaled = (regionStart + regionLen / 2) * scale;
  const idealLeft = viewportLen / 2 - regionCenterScaled;
  const shift = Math.max(0, -idealLeft);
  return { iframeLeft: idealLeft + shift, initialScroll: shift };
};

const BeforeCrop: React.FC<{
  src: string;
  regionKey: keyof typeof BEFORE_FILES;
  width: number;
  height: number;
  onClick?: () => void;
  interactive?: boolean;
  zoom?: number;
  onWheelZoom?: (delta: number) => void;
}> = ({ src, regionKey, width, height, onClick, interactive, zoom = 0.7, onWheelZoom }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [crop, setCrop] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  // Find the region rect inside the iframe. Re-runs on src/region change but NOT on
  // zoom change — zoom-driven re-centering is handled by the next effect.
  useEffect(() => {
    setCrop(null);
    let raf: number;
    const tick = () => {
      const iframe = iframeRef.current;
      if (iframe) {
        try {
          const doc = iframe.contentDocument;
          if (doc && doc.body && doc.body.childElementCount > 0) {
            injectFreezeCss(doc);
            const selectors = REGION_SELECTORS[regionKey] || [];
            for (const sel of selectors) {
              const els = Array.from(doc.querySelectorAll<HTMLElement>(sel));
              for (const el of els) {
                const r = el.getBoundingClientRect();
                if (r.width > 50 && r.height > 50) {
                  const pad = 12;
                  setCrop({
                    left: Math.max(0, r.left - pad),
                    top: Math.max(0, r.top - pad),
                    width: r.width + pad * 2,
                    height: r.height + pad * 2,
                  });
                  return;
                }
              }
            }
          }
        } catch {/* ignore */}
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [src, regionKey]);

  // Center-anchored zoom: when the user clicks +/-, keep whatever point was at the
  // viewport center pinned there. Without this, the default transform-origin:top-left
  // makes content drift off to the bottom-right as you zoom in.
  const prevZoomRef = useRef<number>(zoom);
  useEffect(() => {
    if (!interactive) {
      prevZoomRef.current = zoom;
      return;
    }
    const wrapper = wrapperRef.current;
    const oldZoom = prevZoomRef.current;
    prevZoomRef.current = zoom;
    if (!wrapper || !crop || oldZoom === zoom) return;

    // Capture pre-render visual center in iframe content coords (using OLD geometry).
    const cw = wrapper.clientWidth;
    const ch = wrapper.clientHeight;
    const oldIframeLeft = computeIframeOffset(crop.left, crop.width, oldZoom, cw, SRC_VIEWPORT_W).iframeLeft;
    const oldIframeTop = computeIframeOffset(crop.top, crop.height, oldZoom, ch, SRC_VIEWPORT_H).iframeLeft;
    const cxIframe = (wrapper.scrollLeft + cw / 2 - oldIframeLeft) / oldZoom;
    const cyIframe = (wrapper.scrollTop + ch / 2 - oldIframeTop) / oldZoom;

    // After React commits the new transform/size, restore the visual center.
    const raf = requestAnimationFrame(() => {
      const w = wrapperRef.current;
      if (!w) return;
      const newIframeLeft = computeIframeOffset(crop.left, crop.width, zoom, cw, SRC_VIEWPORT_W).iframeLeft;
      const newIframeTop = computeIframeOffset(crop.top, crop.height, zoom, ch, SRC_VIEWPORT_H).iframeLeft;
      w.scrollLeft = cxIframe * zoom + newIframeLeft - cw / 2;
      w.scrollTop = cyIframe * zoom + newIframeTop - ch / 2;
    });
    return () => cancelAnimationFrame(raf);
  }, [zoom, crop, interactive]);

  // Initial centering: scroll so the region sits at viewport center when crop first
  // resolves or when the wrapper size changes.
  useEffect(() => {
    if (!interactive || !crop || !wrapperRef.current) return;
    const w = wrapperRef.current;
    const { initialScroll: ix } = computeIframeOffset(crop.left, crop.width, zoom, width, SRC_VIEWPORT_W);
    const { initialScroll: iy } = computeIframeOffset(crop.top, crop.height, zoom, height, SRC_VIEWPORT_H);
    w.scrollTo({ left: ix, top: iy, behavior: 'auto' });
    // Reset zoom anchor so the next +/- click is referenced against this fresh state.
    prevZoomRef.current = zoom;
    // Run only when crop FIRST resolves (or src changes), or wrapper size changes —
    // not when zoom changes (the prior effect handles that).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crop, interactive, width, height, src]);

  // Trackpad pinch (and Ctrl+wheel) → adjust zoom. The wheel event uses ctrlKey to
  // signal a pinch gesture on macOS. We swallow it so the page doesn't pan instead.
  useEffect(() => {
    if (!interactive || !onWheelZoom) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      onWheelZoom(-e.deltaY * 0.01);
    };
    wrapper.addEventListener('wheel', onWheel, { passive: false });
    return () => wrapper.removeEventListener('wheel', onWheel);
  }, [interactive, onWheelZoom]);

  if (interactive) {
    const scale = zoom;
    const effective = crop || { left: 0, top: 0, width: SRC_VIEWPORT_W, height: SRC_VIEWPORT_H };

    // Layout strategy: when iframe content overflows the viewport, position it so
    // the region's center lands on the viewport center (shift handles the case
    // where the ideal position would be negative). When content fits inside the
    // viewport, just centre the iframe — no scroll needed.
    const { iframeLeft } = computeIframeOffset(effective.left, effective.width, scale, width, SRC_VIEWPORT_W);
    const { iframeLeft: iframeTop } = computeIframeOffset(effective.top, effective.height, scale, height, SRC_VIEWPORT_H);
    const iframeContentW = SRC_VIEWPORT_W * scale;
    const iframeContentH = SRC_VIEWPORT_H * scale;
    // Scrollable area only grows beyond the viewport when iframe content overflows.
    // No artificial slack — scrollbars stay hidden when there's nothing to scroll to.
    const scrollW = Math.max(width, iframeLeft + iframeContentW);
    const scrollH = Math.max(height, iframeTop + iframeContentH);

    return (
      <div
        ref={wrapperRef}
        style={{
          width,
          height,
          overflow: 'auto',
          position: 'relative',
          border: `1px solid ${reviewTheme.border}`,
          borderRadius: 6,
          background: '#fff',
        }}
      >
        <iframe
          ref={iframeRef}
          src={src}
          sandbox="allow-same-origin"
          style={{
            position: 'absolute',
            left: iframeLeft,
            top: iframeTop,
            width: SRC_VIEWPORT_W,
            height: SRC_VIEWPORT_H,
            border: 'none',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            pointerEvents: 'auto',
            display: 'block',
          }}
          title="before snapshot"
        />
        <div style={{ width: scrollW, height: scrollH, pointerEvents: 'none' }} />
      </div>
    );
  }

  // Thumbnail: scale-to-fit the region.
  const effectiveCrop = crop || { left: 0, top: 0, width: SRC_VIEWPORT_W, height: SRC_VIEWPORT_H };
  const s = Math.min(width / effectiveCrop.width, height / effectiveCrop.height);

  return (
    <div
      onClick={onClick}
      style={{
        width,
        height,
        overflow: 'hidden',
        position: 'relative',
        border: `1px solid ${reviewTheme.border}`,
        borderRadius: 6,
        background: '#fff',
        cursor: onClick ? 'zoom-in' : 'default',
      }}
    >
      <iframe
        ref={iframeRef}
        src={src}
        sandbox="allow-same-origin"
        style={{
          position: 'absolute',
          width: SRC_VIEWPORT_W,
          height: SRC_VIEWPORT_H,
          left: -effectiveCrop.left * s + (width - effectiveCrop.width * s) / 2,
          top: -effectiveCrop.top * s + (height - effectiveCrop.height * s) / 2,
          border: 'none',
          transform: `scale(${s})`,
          transformOrigin: 'top left',
          pointerEvents: 'none',
        }}
        title="before snapshot"
      />
    </div>
  );
};

const ZoomedView: React.FC<{
  beforeSrc: string;
  regionKey: keyof typeof BEFORE_FILES;
  onClose: () => void;
}> = ({ beforeSrc, regionKey, onClose }) => {
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [zoom, setZoom] = useState(0.7);
  useEffect(() => {
    const fn = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const W = Math.floor(viewport.w * 0.78);
  const H = Math.floor(viewport.h * 0.78);

  // Floor so that at min zoom the iframe is at most exactly the window — never
  // smaller (which would leave dead grey space inside the frame).
  const minZoom = useMemo(() => {
    const z = Math.max(W / SRC_VIEWPORT_W, H / SRC_VIEWPORT_H);
    return Math.max(0.05, Math.ceil(z * 100) / 100);
  }, [W, H]);

  // Enforce min zoom on viewport resize so the iframe can't end up smaller than
  // the window after the user shrinks the browser.
  useEffect(() => {
    setZoom((z) => Math.max(z, minZoom));
  }, [minZoom]);

  const clampZoom = useCallback(
    (z: number) => Math.min(2.0, Math.max(minZoom, z)),
    [minZoom],
  );
  const stepZoom = useCallback(
    (delta: number) => setZoom((z) => clampZoom(+(z + delta).toFixed(2))),
    [clampZoom],
  );
  // Pinch / Ctrl+wheel handler. We don't round here — pinch should feel smooth.
  const onWheelZoom = useCallback(
    (delta: number) => setZoom((z) => clampZoom(+(z + delta).toFixed(3))),
    [clampZoom],
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(31,30,27,0.6)',
        zIndex: 99800,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: reviewTheme.surfaceCard,
          borderRadius: reviewTheme.radius,
          padding: 16,
          boxShadow: reviewTheme.shadow,
          fontFamily: reviewTheme.fontSans,
          color: reviewTheme.ink,
          width: W + 32,
          maxWidth: '92vw',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: REGION_HINT[regionKey] ? 4 : 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{REGION_LABEL[regionKey]}</span>
          {REGION_HINT[regionKey] && (
            <span style={{ fontSize: 11, color: reviewTheme.inkMute }}>· {REGION_HINT[regionKey]}</span>
          )}
          <div style={{ flex: 1 }} />
          <ZoomControls zoom={zoom} minZoom={minZoom} onStep={stepZoom} onReset={() => setZoom(clampZoom(0.7))} />
          <button
            onClick={onClose}
            style={{
              padding: '4px 10px',
              background: 'transparent',
              color: reviewTheme.inkMute,
              border: `1px solid ${reviewTheme.border}`,
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: reviewTheme.fontSans,
              marginLeft: 8,
            }}
          >
            × 关闭
          </button>
        </div>
        <BeforeCrop src={beforeSrc} regionKey={regionKey} width={W} height={H} interactive zoom={zoom} onWheelZoom={onWheelZoom} />
      </div>
    </div>
  );
};

const ZoomControls: React.FC<{ zoom: number; minZoom: number; onStep: (d: number) => void; onReset: () => void }> = ({ zoom, minZoom, onStep, onReset }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 0, border: `1px solid ${reviewTheme.border}`, borderRadius: 6, overflow: 'hidden' }}>
    <ZoomBtn onClick={() => onStep(-0.1)} disabled={zoom <= minZoom + 0.001}>−</ZoomBtn>
    <button
      onClick={onReset}
      title="重置缩放"
      style={{
        padding: '3px 10px',
        minWidth: 56,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: reviewTheme.ink,
        fontSize: 12,
        fontFamily: reviewTheme.fontMono,
      }}
    >
      {Math.round(zoom * 100)}%
    </button>
    <ZoomBtn onClick={() => onStep(0.1)} disabled={zoom >= 1.99}>+</ZoomBtn>
  </div>
);

const ZoomBtn: React.FC<{ onClick: () => void; disabled: boolean; children: React.ReactNode }> = ({ onClick, disabled, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      width: 28,
      height: 28,
      background: 'transparent',
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      color: disabled ? reviewTheme.inkSoft : reviewTheme.ink,
      fontSize: 16,
      fontFamily: reviewTheme.fontSans,
      lineHeight: 1,
    }}
  >
    {children}
  </button>
);
