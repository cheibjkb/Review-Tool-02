import React, { useEffect, useRef, useCallback } from 'react';

export interface IframeAnchor {
  id: string;
  finders: ((doc: Document) => HTMLElement | null)[];
}

export interface IframeAnchorRect {
  id: string;
  rect: { left: number; top: number; width: number; height: number };
}

interface IframeBaseProps {
  src: string;
  width: number;
  height: number;
  anchors: IframeAnchor[];
  onAnchorsReady: (rects: IframeAnchorRect[]) => void;
}

// CSS to inject into every iframe — freezes all animations & spinners.
// The captured pages have loading indicators (e.g. "Sufficient" badge) that animate
// forever because the React app is no longer driving them. We just freeze visually.
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
  /* The "Sufficient" badge in the captured HTML sits next to an infinite
     semi-icon-spinning loader. The static prototype shouldn't show a perpetual
     loading state, so hide the spinner entirely (the badge text still reads). */
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

const IframeBase: React.FC<IframeBaseProps> = ({ src, width, height, anchors, onAnchorsReady }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const anchorsRef = useRef(anchors);
  const lastSigRef = useRef<string>('');
  anchorsRef.current = anchors;

  const probe = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    let doc: Document | null = null;
    try {
      doc = iframe.contentDocument;
    } catch {
      return;
    }
    if (!doc || !doc.body || doc.body.childElementCount === 0) return;

    injectFreezeCss(doc);

    // Anchor rects are returned in iframe-content (and therefore inner-container)
    // coordinates. The caller positions hotspots absolutely inside the same inner
    // container, so they scroll along with the base instead of staying glued to
    // the viewport.
    const rects: IframeAnchorRect[] = [];
    for (const anchor of anchorsRef.current) {
      let el: HTMLElement | null = null;
      for (const finder of anchor.finders) {
        try {
          el = finder(doc);
          if (el) break;
        } catch { /* ignore */ }
      }
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          rects.push({
            id: anchor.id,
            rect: {
              left: r.left,
              top: r.top,
              width: r.width,
              height: r.height,
            },
          });
        }
      }
    }

    const sig = rects
      .map((r) => `${r.id}:${Math.round(r.rect.left)},${Math.round(r.rect.top)},${Math.round(r.rect.width)},${Math.round(r.rect.height)}`)
      .join('|');
    if (sig !== lastSigRef.current) {
      lastSigRef.current = sig;
      onAnchorsReady(rects);
    }
  }, [onAnchorsReady]);

  // Probe every animation frame — don't wait for onLoad, since captured pages
  // may have hanging network requests that delay load events arbitrarily.
  useEffect(() => {
    let raf: number;
    const tick = () => {
      probe();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [probe]);

  // Reset signature on src change so parent gets a fresh callback when the new page loads.
  useEffect(() => {
    lastSigRef.current = '';
    onAnchorsReady([]);
  }, [src, onAnchorsReady]);

  return (
    <iframe
      ref={iframeRef}
      src={src}
      style={{
        width,
        height,
        border: 'none',
        display: 'block',
        background: '#fff',
        pointerEvents: 'none',
      }}
      title="prototype base"
    />
  );
};

export default IframeBase;
