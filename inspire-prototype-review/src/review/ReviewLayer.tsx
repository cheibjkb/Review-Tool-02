import React from 'react';
import { useReview } from './ReviewProvider';
import { FloatingBall } from './FloatingBall';
import { ExploreMode } from './modes/ExploreMode';
import { GuidedMode } from './modes/GuidedMode';
import { CompareDrawer } from './compare/CompareDrawer';

export const ReviewLayer: React.FC = () => {
  const { mode } = useReview();
  return (
    <>
      {mode === 'explore' && <ExploreMode />}
      {mode === 'guided' && <GuidedMode />}
      <CompareDrawer />
      <FloatingBall />
    </>
  );
};
