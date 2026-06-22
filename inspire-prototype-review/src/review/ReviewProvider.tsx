import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

export type ReviewMode = 'off' | 'explore' | 'guided';

export interface ReviewState {
  mode: ReviewMode;
  setMode: (m: ReviewMode) => void;

  compareOpen: boolean;
  setCompareOpen: (v: boolean) => void;
  compareAnnotationId: string | null;
  openCompare: (annotationId?: string) => void;
  comparePos: { x: number; y: number };
  setComparePos: (p: { x: number; y: number }) => void;
  /** Incremented every time openCompare is called — used by the card to flash a confirmation. */
  compareOpenSignal: number;

  panelOpen: boolean;
  setPanelOpen: (v: boolean) => void;

  flowPickerOpen: boolean;
  setFlowPickerOpen: (v: boolean) => void;

  // guided
  currentFlowId: string | null;
  setCurrentFlowId: (id: string | null) => void;
  currentStepIndex: number;
  setCurrentStepIndex: (i: number) => void;
  completedFlows: string[];
  markFlowCompleted: (id: string) => void;
  resetFlowProgress: () => void;
  recentlyCompletedFlowId: string | null;
  setRecentlyCompletedFlowId: (id: string | null) => void;
}

const Ctx = createContext<ReviewState | null>(null);
const LS_KEY = 'review-completed-flows-v1';

export const ReviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ReviewMode>('explore');
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareAnnotationId, setCompareAnnotationId] = useState<string | null>(null);
  const [comparePos, setComparePos] = useState<{ x: number; y: number }>({ x: 16, y: 64 });
  const [compareOpenSignal, setCompareOpenSignal] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [flowPickerOpen, setFlowPickerOpen] = useState(false);
  const [currentFlowId, setCurrentFlowId] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [recentlyCompletedFlowId, setRecentlyCompletedFlowId] = useState<string | null>(null);
  const [completedFlows, setCompletedFlows] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(completedFlows));
    } catch { /* ignore */ }
  }, [completedFlows]);

  const markFlowCompleted = useCallback((id: string) => {
    setCompletedFlows((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const resetFlowProgress = useCallback(() => setCompletedFlows([]), []);

  const openCompare = useCallback((annotationId?: string) => {
    setCompareAnnotationId(annotationId ?? null);
    setCompareOpen(true);
    setCompareOpenSignal((n) => n + 1);
  }, []);

  const value = useMemo<ReviewState>(
    () => ({
      mode,
      setMode,
      compareOpen,
      setCompareOpen,
      compareAnnotationId,
      openCompare,
      comparePos,
      setComparePos,
      compareOpenSignal,
      panelOpen,
      setPanelOpen,
      flowPickerOpen,
      setFlowPickerOpen,
      currentFlowId,
      setCurrentFlowId,
      currentStepIndex,
      setCurrentStepIndex,
      completedFlows,
      markFlowCompleted,
      resetFlowProgress,
      recentlyCompletedFlowId,
      setRecentlyCompletedFlowId,
    }),
    [mode, compareOpen, compareAnnotationId, comparePos, compareOpenSignal, panelOpen, flowPickerOpen, currentFlowId, currentStepIndex, completedFlows, recentlyCompletedFlowId, openCompare, markFlowCompleted, resetFlowProgress]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useReview = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useReview must be used inside ReviewProvider');
  return v;
};
