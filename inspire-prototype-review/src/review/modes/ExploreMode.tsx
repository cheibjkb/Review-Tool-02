import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { findAnnotationsForRoute, ChangeType } from '../data/annotations';
import { Hotspot } from '../overlay/Hotspot';
import { reviewTheme, changeTypeColor, changeTypeLabel } from '../data/theme';

// 改动说明 mode: colored dots on every annotation + bottom-right legend.
export const ExploreMode: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setTick((x) => x + 1), 100);
    return () => clearTimeout(t);
  }, [searchParams, location.pathname]);

  const anns = findAnnotationsForRoute(searchParams, location.pathname);
  const counts = useMemo(() => {
    const c: Record<ChangeType, number> = { NEW: 0, MODIFIED: 0, KEPT: 0 };
    anns.forEach((a) => { c[a.changeType] += 1; });
    return c;
  }, [anns]);

  return (
    <>
      {anns.map((a) => (
        <Hotspot key={`${a.id}-${tick}`} annotation={a} variant="dot" />
      ))}
      <Legend counts={counts} total={anns.length} />
    </>
  );
};

const Legend: React.FC<{ counts: Record<ChangeType, number>; total: number }> = ({ counts, total }) => {
  const items: Array<{ t: ChangeType; label: string }> = [
    { t: 'NEW', label: '新增' },
    { t: 'MODIFIED', label: '修改' },
    { t: 'KEPT', label: '保留' },
  ];
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: 24,
        padding: '8px 14px',
        background: reviewTheme.ink,
        color: '#fff',
        fontFamily: reviewTheme.fontSans,
        fontSize: 12,
        borderRadius: 999,
        zIndex: 99800,
        boxShadow: reviewTheme.shadowSm,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span style={{ fontFamily: reviewTheme.fontMono, fontSize: 11, opacity: 0.75 }}>本页 {total} 个改动</span>
      <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.18)' }} />
      {items.map((it) => (
        <LegendItem key={it.t} type={it.t} label={it.label} count={counts[it.t]} />
      ))}
    </div>
  );
};

const LegendItem: React.FC<{ type: ChangeType; label: string; count: number }> = ({ type, label, count }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        opacity: count > 0 ? 1 : 0.45,
        cursor: 'default',
        position: 'relative',
      }}
    >
      <span
        style={{
          display: 'inline-block',
          width: 9,
          height: 9,
          borderRadius: '50%',
          background: changeTypeColor(type),
          boxShadow: hovered ? `0 0 0 2px rgba(255,255,255,0.4)` : 'none',
          transition: 'box-shadow 0.15s',
        }}
      />
      <span>{label}</span>
      <span style={{ fontFamily: reviewTheme.fontMono, fontSize: 11, opacity: 0.85 }}>{count}</span>
      {hovered && (
        <span
          style={{
            position: 'absolute',
            bottom: 28,
            left: 0,
            background: reviewTheme.surfaceCard,
            color: reviewTheme.ink,
            border: `1px solid ${reviewTheme.border}`,
            borderRadius: 6,
            padding: '6px 10px',
            fontSize: 11,
            fontFamily: reviewTheme.fontSans,
            boxShadow: reviewTheme.shadow,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {changeTypeLabel(type)} = {tipFor(type)}
        </span>
      )}
    </span>
  );
};

const tipFor = (t: ChangeType): string => {
  switch (t) {
    case 'NEW': return '本期新增的能力，老版本没有';
    case 'MODIFIED': return '老版本有，但本期改了交互/逻辑';
    case 'KEPT': return '老版本能力保留，未做改动';
  }
};
