import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReview, ReviewMode } from './ReviewProvider';
import { reviewTheme } from './data/theme';

const modeMeta: Record<Exclude<ReviewMode, 'off'>, { icon: string; title: string }> = {
  explore: { icon: '🔍', title: '改动说明' },
  guided: { icon: '🧭', title: '路径引导' },
};

export const FloatingBall: React.FC = () => {
  const {
    mode, setMode,
    panelOpen, setPanelOpen,
    compareOpen, openCompare, setCompareOpen,
    flowPickerOpen, setFlowPickerOpen,
    setCurrentFlowId, setCurrentStepIndex,
    resetFlowProgress, setRecentlyCompletedFlowId,
  } = useReview();
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleReset = () => {
    navigate('/', { replace: true });
    resetFlowProgress();
    setCurrentFlowId(null);
    setCurrentStepIndex(0);
    setCompareOpen(false);
    setFlowPickerOpen(false);
    setRecentlyCompletedFlowId(null);
    setPanelOpen(false);
  };

  useEffect(() => {
    if (!panelOpen) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(t)) {
        if ((t as HTMLElement).closest?.('[data-review-fb]')) return;
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [panelOpen, setPanelOpen]);

  const inReview = mode !== 'off';
  const currentLabel = mode === 'off' ? '走查模式' : modeMeta[mode].title;
  const currentIcon = mode === 'off' ? '?' : modeMeta[mode].icon;

  return (
    <>
      {/* Rail at top-right — out of the way of bottom-anchored step bubbles */}
      <div
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          zIndex: 99999,
          fontFamily: reviewTheme.fontSans,
        }}
      >
        {mode === 'guided' && (
          <Pill
            fb="flowpicker"
            active={flowPickerOpen}
            onClick={() => setFlowPickerOpen(!flowPickerOpen)}
            icon="📑"
            label="评审路径"
          />
        )}

        {inReview && (
          <ToggleSwitch
            fb="compare"
            on={compareOpen}
            onClick={() => (compareOpen ? setCompareOpen(false) : openCompare())}
            icon="⇄"
            label="对比改造前"
          />
        )}

        {inReview && (
          <Pill
            fb="reset"
            onClick={handleReset}
            icon="↻"
            label="重置"
          />
        )}

        <Pill
          fb="main"
          active={mode !== 'off'}
          accent={mode !== 'off'}
          onClick={() => setPanelOpen(!panelOpen)}
          icon={currentIcon}
          label={currentLabel}
        />
      </div>

      {panelOpen && (
        <div
          ref={panelRef}
          data-review-fb="panel"
          style={{
            position: 'fixed',
            top: 64,
            right: 16,
            width: 240,
            background: reviewTheme.surface,
            color: reviewTheme.ink,
            border: `1px solid ${reviewTheme.border}`,
            borderRadius: reviewTheme.radius,
            boxShadow: reviewTheme.shadow,
            padding: 12,
            zIndex: 99999,
            fontFamily: reviewTheme.fontSans,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontFamily: reviewTheme.fontMono, color: reviewTheme.inkMute }}>选择走查模式</div>
            <button
              onClick={() => setPanelOpen(false)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: reviewTheme.inkMute, fontSize: 14, padding: 0, lineHeight: 1 }}
            >
              ×
            </button>
          </div>

          {(['explore', 'guided'] as const).map((m) => (
            <ModeOption
              key={m}
              active={mode === m}
              icon={modeMeta[m].icon}
              title={modeMeta[m].title}
              onClick={() => { setMode(m); setPanelOpen(false); }}
            />
          ))}
        </div>
      )}
    </>
  );
};

interface PillProps {
  fb: string;
  onClick: () => void;
  icon: string;
  label: string;
  active?: boolean;
  accent?: boolean;
}

const Pill: React.FC<PillProps> = ({ fb, onClick, icon, label, active, accent }) => (
  <button
    data-review-fb={fb}
    onClick={onClick}
    style={{
      height: 36,
      padding: '0 12px',
      borderRadius: 18,
      background: accent ? reviewTheme.accent : active ? reviewTheme.accentSoft : reviewTheme.surfaceCard,
      color: accent ? '#fff' : reviewTheme.ink,
      border: `1px solid ${accent ? reviewTheme.accent : active ? reviewTheme.accent : reviewTheme.borderStrong}`,
      boxShadow: reviewTheme.shadowSm,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontFamily: reviewTheme.fontSans,
      fontSize: 13,
      fontWeight: 600,
      transition: 'background 0.15s',
    }}
  >
    <span style={{ fontSize: 15, lineHeight: 1 }}>{icon}</span>
    <span>{label}</span>
  </button>
);

interface ToggleProps {
  fb: string;
  onClick: () => void;
  icon: string;
  label: string;
  on: boolean;
}

const ToggleSwitch: React.FC<ToggleProps> = ({ fb, onClick, icon, label, on }) => (
  <button
    data-review-fb={fb}
    onClick={onClick}
    title={on ? '点击关闭对比' : '点击打开对比'}
    style={{
      height: 36,
      padding: '0 4px 0 12px',
      borderRadius: 18,
      background: on ? reviewTheme.accent : reviewTheme.surfaceCard,
      color: on ? '#fff' : reviewTheme.ink,
      border: `1px solid ${on ? reviewTheme.accent : reviewTheme.borderStrong}`,
      boxShadow: reviewTheme.shadowSm,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontFamily: reviewTheme.fontSans,
      fontSize: 13,
      fontWeight: 600,
      transition: 'background 0.15s',
    }}
  >
    <span style={{ fontSize: 15, lineHeight: 1 }}>{icon}</span>
    <span>{label}</span>
    {/* Toggle knob: track + handle that slides */}
    <span
      style={{
        position: 'relative',
        width: 28,
        height: 16,
        borderRadius: 8,
        background: on ? 'rgba(255,255,255,0.45)' : reviewTheme.surfaceAlt,
        transition: 'background 0.15s',
        marginLeft: 2,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: on ? 14 : 2,
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
          transition: 'left 0.15s',
        }}
      />
    </span>
  </button>
);

const ModeOption: React.FC<{
  active: boolean;
  icon: string;
  title: string;
  onClick: () => void;
}> = ({ active, icon, title, onClick }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%',
      textAlign: 'left',
      padding: '8px 10px',
      marginBottom: 4,
      background: active ? reviewTheme.accentSoft : 'transparent',
      color: reviewTheme.ink,
      border: active ? `1px solid ${reviewTheme.accent}` : `1px solid transparent`,
      borderRadius: reviewTheme.radiusSm,
      cursor: 'pointer',
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      fontFamily: reviewTheme.fontSans,
    }}
    onMouseEnter={(e) => {
      if (!active) (e.currentTarget as HTMLButtonElement).style.background = reviewTheme.surfaceAlt;
    }}
    onMouseLeave={(e) => {
      if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
    }}
  >
    <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{icon}</span>
    <span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>
  </button>
);
