import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useReview } from '../ReviewProvider';
import { flows, findFlow } from '../data/flows';
import { findAnnotationById } from '../data/annotations';
import { ClickLockOverlay } from '../overlay/ClickLockOverlay';
import { FloatingCard, makeAnchorFn } from '../overlay/FloatingCard';
import { reviewTheme } from '../data/theme';

// Match policy: target URL's path equals current path AND all target query params exist
// (with matching values) in current. Extra params in current are allowed.
const urlMatches = (current: string, target: string): boolean => {
  const [cPath, cQ = ''] = current.split('?');
  const [tPath, tQ = ''] = target.split('?');
  if (cPath !== tPath) return false;
  if (!tQ) return true;
  const cParams = new URLSearchParams(cQ);
  const tParams = new URLSearchParams(tQ);
  for (const [k, v] of tParams) {
    if (cParams.get(k) !== v) return false;
  }
  return true;
};

export const GuidedMode: React.FC = () => {
  const {
    currentFlowId,
    setCurrentFlowId,
    currentStepIndex,
    setCurrentStepIndex,
    completedFlows,
    markFlowCompleted,
    flowPickerOpen,
    setFlowPickerOpen,
    recentlyCompletedFlowId,
    setRecentlyCompletedFlowId,
    setMode,
    setCompareOpen,
    setPanelOpen,
  } = useReview();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [hint, setHint] = useState<string | null>(null);

  const flow = currentFlowId ? findFlow(currentFlowId) : null;
  const step = flow ? flow.steps[currentStepIndex] : null;
  const justClickedNavRef = React.useRef(false);

  useEffect(() => {
    if (!step) return;
    if (!justClickedNavRef.current) return;
    justClickedNavRef.current = false;
    const current = `${location.pathname}${location.search}`;
    if (current !== step.targetUrl) navigate(step.targetUrl, { replace: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepIndex, currentFlowId]);

  // Auto-advance & auto-complete:
  //   - Scan only steps from currentStepIndex forward, so loose-matching early
  //     steps (e.g. step 0 with targetUrl '/' matches any '/...' URL) can't drag
  //     the user backward to a stale "startup" bubble after they took the final
  //     action of the flow.
  //   - If we're already on the LAST step and no step at-or-after current still
  //     matches, the user has performed the final action and the URL moved past
  //     the flow → mark the flow completed so the FlowPicker can surface instead
  //     of leaving a stale bubble on screen.
  //   - prevLocRef gate prevents Prev/Restart from triggering a "stale-render"
  //     reverse-advance: those button handlers change currentStepIndex BEFORE
  //     the navigation effect has updated location, and we'd otherwise read the
  //     old URL with the new index and undo the click.
  const prevLocRef = useRef('');
  useEffect(() => {
    if (!flow) return;
    const current = `${location.pathname}${location.search}`;
    if (prevLocRef.current === current) return;
    prevLocRef.current = current;

    let bestHigher = -1;
    for (let i = currentStepIndex; i < flow.steps.length; i++) {
      if (urlMatches(current, flow.steps[i].targetUrl)) {
        if (i > bestHigher) bestHigher = i;
      }
    }
    const isLastStep = currentStepIndex === flow.steps.length - 1;
    if (isLastStep && bestHigher < 0) {
      markFlowCompleted(flow.id);
      setRecentlyCompletedFlowId(flow.id);
      setCurrentStepIndex(0);
      setCurrentFlowId(null);
      return;
    }
    if (bestHigher > currentStepIndex) {
      setCurrentStepIndex(bestHigher);
    }
  }, [location.pathname, location.search, flow?.id, currentStepIndex, setCurrentStepIndex, markFlowCompleted, setRecentlyCompletedFlowId, setCurrentFlowId]);

  useEffect(() => {
    if (!flow) return;
    const current = `${location.pathname}${location.search}`;
    const onAnyStep = flow.steps.some((s) => urlMatches(current, s.targetUrl));
    if (onAnyStep) {
      setHint(null);
      return;
    }
    const tShow = setTimeout(() => {
      setHint('当前位置不在引导路径上，可点 ← Prev 回上一步');
    }, 600);
    const tHide = setTimeout(() => setHint(null), 4600);
    return () => {
      clearTimeout(tShow);
      clearTimeout(tHide);
    };
  }, [location.pathname, location.search, flow?.id]);

  const handlePickFlow = (id: string) => {
    setCurrentFlowId(id);
    setCurrentStepIndex(0);
    justClickedNavRef.current = true;
    setFlowPickerOpen(false);
    setRecentlyCompletedFlowId(null);
  };

  // Closing the "no current flow" picker drops the user back to the default
  // 改动说明 (explore) mode — the home page of the review experience — rather
  // than exiting reviews entirely. To fully exit they can use 关闭走查.
  const handleClosePickerEmpty = () => {
    setMode('explore');
    setPanelOpen(false);
    setCompareOpen(false);
    setFlowPickerOpen(false);
    setCurrentFlowId(null);
    setCurrentStepIndex(0);
    setRecentlyCompletedFlowId(null);
  };

  if (!flow) {
    return (
      <FlowPicker
        onPick={handlePickFlow}
        completed={completedFlows}
        onClose={handleClosePickerEmpty}
        completedFlowId={recentlyCompletedFlowId}
      />
    );
  }

  const isLast = currentStepIndex === flow.steps.length - 1;
  const isFirst = currentStepIndex === 0;
  const highlightAnn = step?.highlightAnnotationId ? findAnnotationById(step.highlightAnnotationId) : null;
  const annVisibleHere = highlightAnn ? highlightAnn.match(searchParams, location.pathname) : false;
  const anchorFn = highlightAnn && annVisibleHere ? makeAnchorFn(highlightAnn.locate) : null;

  const onPrev = () => {
    justClickedNavRef.current = true;
    setCurrentStepIndex(currentStepIndex - 1);
  };
  const onNext = () => {
    if (isLast) {
      markFlowCompleted(flow.id);
      setRecentlyCompletedFlowId(flow.id);
      setCurrentStepIndex(0);
      setCurrentFlowId(null);
      navigate('/');
      // FlowPicker will appear (no current flow) with a completion banner
    } else {
      justClickedNavRef.current = true;
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };
  const onRestart = () => {
    justClickedNavRef.current = true;
    setCurrentStepIndex(0);
  };
  const onExit = () => {
    setCurrentFlowId(null);
    setCurrentStepIndex(0);
    navigate('/');
  };

  return (
    <>
      {/* Strict lock: only the highlighted target can be clicked. A step may
          opt out via `disableClickLock` when its intended interaction needs
          clicks outside the anchor — currently only the DatePicker step. */}
      {anchorFn && !step?.disableClickLock && (
        <ClickLockOverlay
          anchor={anchorFn}
          onOutsideClick={() => {
            setHint('只能点击高亮区域。要自由操作请退出引导');
            setTimeout(() => setHint(null), 1800);
          }}
        />
      )}

      {anchorFn ? (
        <FloatingCard anchor={anchorFn} preferSide="auto" width={300} zIndex={98700}>
          <StepBubble
            flow={flow}
            step={step!}
            stepIndex={currentStepIndex}
            isFirst={isFirst}
            isLast={isLast}
            onPrev={onPrev}
            onNext={onNext}
            onRestart={onRestart}
            onExit={onExit}
            onQuickFill={(url) => { justClickedNavRef.current = true; navigate(url); }}
          />
        </FloatingCard>
      ) : (
        <FallbackBubble
          flow={flow}
          step={step!}
          stepIndex={currentStepIndex}
          isFirst={isFirst}
          isLast={isLast}
          onPrev={onPrev}
          onNext={onNext}
          onRestart={onRestart}
          onExit={onExit}
          onQuickFill={(url) => { justClickedNavRef.current = true; navigate(url); }}
        />
      )}

      {flowPickerOpen && (
        <FlowPicker
          onPick={handlePickFlow}
          completed={completedFlows}
          onClose={() => setFlowPickerOpen(false)}
          completedFlowId={null}
        />
      )}

      {hint && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: reviewTheme.ink,
            color: '#fff',
            padding: '10px 16px',
            borderRadius: 8,
            zIndex: 99000,
            fontFamily: reviewTheme.fontSans,
            fontSize: 13,
            boxShadow: reviewTheme.shadow,
          }}
        >
          {hint}
        </div>
      )}
    </>
  );
};

interface BubbleProps {
  flow: ReturnType<typeof findFlow>;
  step: NonNullable<ReturnType<typeof findFlow>>['steps'][number];
  stepIndex: number;
  isFirst: boolean;
  isLast: boolean;
  onPrev: () => void;
  onNext: () => void;
  onRestart: () => void;
  onExit: () => void;
  onQuickFill: (targetUrl: string) => void;
}

const StepBubble: React.FC<BubbleProps> = ({ flow, step, stepIndex, isFirst, isLast, onPrev, onNext, onRestart, onExit, onQuickFill }) => (
  <div style={{ padding: 14 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
      <span style={{ fontFamily: reviewTheme.fontMono, fontSize: 10, color: reviewTheme.inkSoft, letterSpacing: 0.5 }}>
        FLOW {flow!.index} · STEP {stepIndex + 1}/{flow!.steps.length}
      </span>
      <div style={{ flex: 1 }} />
      <button
        onClick={onRestart}
        disabled={isFirst}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: isFirst ? 'not-allowed' : 'pointer',
          color: isFirst ? reviewTheme.inkSoft : reviewTheme.inkMute,
          fontSize: 11,
          padding: 0,
          lineHeight: 1,
        }}
        title="回到第一步"
      >
        ↺ 重来
      </button>
      <button
        onClick={onExit}
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: reviewTheme.inkMute, fontSize: 14, padding: 0, lineHeight: 1 }}
        title="退出"
      >
        ×
      </button>
    </div>
    <div style={{ fontSize: 13, fontWeight: 600, color: reviewTheme.ink, marginBottom: 4, lineHeight: 1.5 }}>
      👉 {step.instruction}
    </div>
    {step.hint && (
      <div style={{ fontSize: 11, color: reviewTheme.accentDeep, marginBottom: 8, lineHeight: 1.5 }}>{step.hint}</div>
    )}
    {step.uidQuickFill && step.uidQuickFill.length > 0 && (
      <div style={{ marginTop: 8, padding: '6px 8px', background: reviewTheme.surfaceAlt, borderRadius: 4, fontSize: 11 }}>
        {step.uidQuickFill.map((q) => (
          <div key={q.value} style={{ display: 'flex', alignItems: 'center', gap: 6, lineHeight: 1.6 }}>
            <code style={{ userSelect: 'text', fontFamily: reviewTheme.fontMono, fontSize: 12, color: reviewTheme.ink }}>{q.value}</code>
            <button
              onClick={() => onQuickFill(q.targetUrl)}
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
    <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
      <button
        disabled={isFirst}
        onClick={onPrev}
        style={{
          padding: '5px 10px',
          background: 'transparent',
          color: isFirst ? reviewTheme.inkSoft : reviewTheme.ink,
          border: `1px solid ${reviewTheme.border}`,
          borderRadius: 6,
          cursor: isFirst ? 'not-allowed' : 'pointer',
          fontSize: 12,
        }}
      >
        ← Prev
      </button>
      <button
        onClick={onNext}
        style={{
          padding: '5px 12px',
          background: reviewTheme.accent,
          color: '#fff',
          border: `1px solid ${reviewTheme.accent}`,
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {isLast ? '完成 ✓' : 'Next →'}
      </button>
    </div>
  </div>
);

// Renders the step bubble at a fixed bottom-center spot when there's no live element to anchor to.
const FallbackBubble: React.FC<BubbleProps> = (p) => (
  <div
    style={{
      position: 'fixed',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 300,
      background: reviewTheme.surfaceCard,
      border: `1px solid ${reviewTheme.border}`,
      borderRadius: reviewTheme.radius,
      boxShadow: reviewTheme.shadow,
      zIndex: 98500,
      fontFamily: reviewTheme.fontSans,
    }}
  >
    <StepBubble {...p} />
  </div>
);

const FlowPicker: React.FC<{
  onPick: (id: string) => void;
  completed: string[];
  onClose: (() => void) | null;
  completedFlowId: string | null;
}> = ({ onPick, completed, onClose, completedFlowId }) => {
  const completedFlow = completedFlowId ? findFlow(completedFlowId) : null;
  const nextFlow = flows.find((f) => !completed.includes(f.id));
  return (
    <div
      style={{
        position: 'fixed',
        top: '12%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 480,
        background: reviewTheme.surface,
        border: `1px solid ${reviewTheme.border}`,
        borderRadius: reviewTheme.radius,
        boxShadow: reviewTheme.shadow,
        padding: 20,
        zIndex: 98000,
        fontFamily: reviewTheme.fontSans,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ fontFamily: reviewTheme.fontMono, fontSize: 12, color: reviewTheme.inkMute }}>
          GUIDED REVIEW
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: reviewTheme.inkMute, fontSize: 16, padding: 0, lineHeight: 1 }}
          >
            ×
          </button>
        )}
      </div>
      {completedFlow && (
        <div
          style={{
            marginTop: 8,
            marginBottom: 12,
            padding: '10px 12px',
            background: reviewTheme.accentSoft,
            borderLeft: `3px solid ${reviewTheme.accent}`,
            borderRadius: reviewTheme.radiusSm,
            fontSize: 13,
            color: reviewTheme.ink,
            lineHeight: 1.5,
          }}
        >
          <div style={{ fontWeight: 600 }}>✓ 已完成「{completedFlow.title}」</div>
          {nextFlow ? (
            <div style={{ fontSize: 12, color: reviewTheme.inkMute, marginTop: 2 }}>
              建议接下来评审「{nextFlow.title}」，点下方任意流程开始
            </div>
          ) : (
            <div style={{ fontSize: 12, color: reviewTheme.inkMute, marginTop: 2 }}>
              全部 {flows.length} 条流程都走完了 — 可以点任意一条再走一遍
            </div>
          )}
        </div>
      )}
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 14, color: reviewTheme.ink }}>
        {completedFlow ? '继续选下一条' : `选一条流程评审（共 ${flows.length} 条 · 约 6 分钟）`}
      </div>
      <FlowGroup
        label="完整路径"
        flows={flows.filter((f) => f.category === 'complete')}
        completed={completed}
        onPick={onPick}
      />
      <FlowGroup
        label="其他情况"
        flows={flows.filter((f) => f.category === 'other')}
        completed={completed}
        onPick={onPick}
      />
    </div>
  );
};

const FlowGroup: React.FC<{
  label: string;
  flows: typeof import('../data/flows').flows;
  completed: string[];
  onPick: (id: string) => void;
}> = ({ label, flows, completed, onPick }) => (
  <>
    <div
      style={{
        fontFamily: reviewTheme.fontMono,
        fontSize: 10,
        letterSpacing: 0.6,
        color: reviewTheme.inkSoft,
        margin: '4px 0 6px 2px',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </div>
    {flows.map((f) => {
      const done = completed.includes(f.id);
      return (
        <button
          key={f.id}
          onClick={() => onPick(f.id)}
          style={{
            display: 'flex',
            width: '100%',
            textAlign: 'left',
            background: reviewTheme.surfaceCard,
            border: `1px solid ${reviewTheme.border}`,
            borderRadius: reviewTheme.radiusSm,
            padding: '12px 14px',
            marginBottom: 8,
            cursor: 'pointer',
            alignItems: 'flex-start',
            gap: 12,
            fontFamily: reviewTheme.fontSans,
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = reviewTheme.surfaceAlt)}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = reviewTheme.surfaceCard)}
        >
          <span
            style={{
              fontFamily: reviewTheme.fontMono,
              fontSize: 13,
              color: done ? reviewTheme.keptColor : reviewTheme.inkMute,
              minWidth: 22,
            }}
          >
            {done ? '✓' : `${f.index}.`}
          </span>
          <span style={{ flex: 1 }}>
            <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: reviewTheme.ink }}>{f.title}</span>
            <span style={{ display: 'block', fontSize: 12, color: reviewTheme.inkMute, marginTop: 2, lineHeight: 1.5 }}>
              {f.summary}
            </span>
            <span
              style={{
                display: 'inline-block',
                marginTop: 4,
                fontSize: 11,
                fontFamily: reviewTheme.fontMono,
                color: reviewTheme.inkSoft,
              }}
            >
              {f.steps.length} 步 · {f.est}
            </span>
          </span>
          <span style={{ color: reviewTheme.inkMute, fontSize: 16 }}>▸</span>
        </button>
      );
    })}
  </>
);
