import React, { useEffect, useState } from 'react';

interface StageProps {
  width?: number;
  height?: number;
  children: React.ReactNode;
}

export const STAGE_W = 1440;
export const STAGE_H = 900;

const Stage: React.FC<StageProps> = ({ width = STAGE_W, height = STAGE_H, children }) => {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const compute = () => {
      const s = Math.min(window.innerWidth / width, window.innerHeight / height);
      setScale(s);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [width, height]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: '#EFEAE1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        data-review-stage
        style={{
          width,
          height,
          position: 'relative',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          flexShrink: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default Stage;
