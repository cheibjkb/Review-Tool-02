import React from 'react';

interface Props {
  state: string | null;
}

const ink = '#1F1E1B';
const inkMute = '#605C54';
const inkSoft = '#8A857A';
const surface = '#F7F4EE';
const surfaceAlt = '#EFEAE1';
const surfaceCard = '#FFFFFF';
const accent = '#D97757';
const border = 'rgba(31,30,27,0.12)';

const BackgroundFallback: React.FC<Props> = ({ state }) => {
  const isEmpty = !state;
  const isSelectSuccess = state === 'submit-select-success';
  const isCreateSuccess = state === 'submit-create-success';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: surface,
        fontFamily: '"Inter", -apple-system, sans-serif',
        color: ink,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* CDN notice */}
      <div
        style={{
          padding: '8px 16px',
          background: surfaceAlt,
          borderBottom: `1px solid ${border}`,
          fontSize: 12,
          color: inkMute,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: accent }} />
        无法访问内网 CDN 背景图（需 VPN），已用占位版式呈现 ·{' '}
        <b style={{ color: ink }}>所有评审热点和 Showcase 配置弹窗仍可正常交互</b>
      </div>

      {/* Fake top nav */}
      <div
        style={{
          height: 52,
          background: surfaceCard,
          borderBottom: `1px solid ${border}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: 16,
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 15 }}>TikTok Campaign Union Editor</div>
        <span style={{ fontSize: 12, color: inkSoft, fontFamily: 'ui-monospace, monospace' }}>
          / activityId=7648959768246209301
        </span>
        <div style={{ flex: 1 }} />
        <Pill>Draft</Pill>
        <Pill>Preview</Pill>
        <Pill accent>Save</Pill>
      </div>

      {/* Main 3-column workspace */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Left panel — editor tree */}
        <div
          style={{
            width: 240,
            background: surfaceCard,
            borderRight: `1px solid ${border}`,
            padding: 16,
            fontSize: 13,
          }}
        >
          <SectionLabel>Pages</SectionLabel>
          <TreeRow active>Home page</TreeRow>
          <TreeRow>Detail page</TreeRow>
          <TreeRow>Rewards page</TreeRow>
          <div style={{ height: 24 }} />
          <SectionLabel>Components</SectionLabel>
          <TreeRow indent>Banner</TreeRow>
          <TreeRow indent active>Showcase</TreeRow>
          <TreeRow indent>Button</TreeRow>
          <TreeRow indent>Reward Pool</TreeRow>
        </div>

        {/* Center — phone preview */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            position: 'relative',
          }}
        >
          <div
            style={{
              width: 320,
              height: 580,
              background: surfaceCard,
              borderRadius: 32,
              border: `1px solid ${border}`,
              boxShadow: '0 12px 40px rgba(31,30,27,0.08)',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ height: 24, background: surfaceAlt, borderRadius: 6 }} />
            <div style={{ height: 120, background: '#E8E2D6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: inkSoft, fontSize: 12 }}>
              Banner
            </div>

            {/* Showcase preview state */}
            {isEmpty && (
              <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 12, color: inkSoft, border: `1px dashed ${border}`, borderRadius: 8 }}>
                showcase 区域
                <br />
                <span style={{ color: inkMute }}>未配置</span>
              </div>
            )}
            {(isSelectSuccess || isCreateSuccess) && (
              <div
                style={{
                  padding: 12,
                  background: surfaceAlt,
                  borderRadius: 8,
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: accent }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: ink }}>Robert Fox</div>
                  <div style={{ color: inkMute, fontSize: 11 }}>
                    {isSelectSuccess ? 'LIVE: Gift Party-Lang Lang' : 'LIVE 2026/06/11 19:46'}
                  </div>
                </div>
                <span style={{ fontSize: 11, color: accent, fontWeight: 600 }}>SET REMINDER</span>
              </div>
            )}

            <div style={{ height: 60, background: surfaceAlt, borderRadius: 8 }} />
            <div style={{ height: 60, background: surfaceAlt, borderRadius: 8 }} />
          </div>

          {/* Visible hotspot label for + Add */}
          {isEmpty && (
            <div
              style={{
                position: 'absolute',
                top: '57%',
                left: '65%',
                width: '10%',
                height: '4%',
                pointerEvents: 'none',
                border: `1.5px dashed ${accent}`,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                color: accent,
                fontWeight: 600,
                background: 'rgba(217,119,87,0.06)',
              }}
            >
              + Add showcase
            </div>
          )}
          {(isSelectSuccess || isCreateSuccess) && (
            <>
              <div
                style={{
                  position: 'absolute',
                  top: '61%',
                  left: '91%',
                  width: '2%',
                  height: '6%',
                  pointerEvents: 'none',
                  border: `1.5px dashed ${accent}`,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  color: accent,
                }}
              >
                ✎
              </div>
              <div
                style={{
                  position: 'absolute',
                  top: '61%',
                  left: '93.5%',
                  width: '2%',
                  height: '6%',
                  pointerEvents: 'none',
                  border: `1.5px dashed ${accent}`,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  color: accent,
                }}
              >
                🗑
              </div>
            </>
          )}
        </div>

        {/* Right — property inspector hint */}
        <div
          style={{
            width: 320,
            background: surfaceCard,
            borderLeft: `1px solid ${border}`,
            padding: 16,
            fontSize: 13,
          }}
        >
          <SectionLabel>Properties</SectionLabel>
          <Field label="Component" value="Showcase" />
          <Field label="Style" value="Vertical" />
          <Field label="Visible" value="On" />
          <div
            style={{
              marginTop: 16,
              padding: 12,
              background: surfaceAlt,
              borderRadius: 8,
              fontSize: 12,
              color: inkMute,
              lineHeight: 1.55,
            }}
          >
            {isEmpty && '点击预览中央的虚线区域可打开 Showcase 配置弹窗。'}
            {isSelectSuccess && '已绑定 LIVE event。点击虚线区域可编辑或删除。'}
            {isCreateSuccess && '已创建 LIVE event。点击虚线区域可编辑或删除。'}
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      fontSize: 11,
      fontFamily: 'ui-monospace, monospace',
      color: inkSoft,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginBottom: 8,
    }}
  >
    {children}
  </div>
);

const TreeRow: React.FC<{ children: React.ReactNode; active?: boolean; indent?: boolean }> = ({
  children,
  active,
  indent,
}) => (
  <div
    style={{
      padding: '6px 8px',
      paddingLeft: indent ? 20 : 8,
      borderRadius: 4,
      fontSize: 13,
      color: active ? ink : inkMute,
      background: active ? surfaceAlt : 'transparent',
      fontWeight: active ? 600 : 400,
      marginBottom: 2,
    }}
  >
    {children}
  </div>
);

const Field: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${border}`, fontSize: 12 }}>
    <span style={{ color: inkMute }}>{label}</span>
    <span style={{ color: ink, fontFamily: 'ui-monospace, monospace' }}>{value}</span>
  </div>
);

const Pill: React.FC<{ children: React.ReactNode; accent?: boolean }> = ({ children, accent: isAccent }) => (
  <div
    style={{
      padding: '4px 12px',
      fontSize: 12,
      borderRadius: 6,
      border: `1px solid ${isAccent ? accent : border}`,
      background: isAccent ? accent : 'transparent',
      color: isAccent ? '#fff' : ink,
      fontWeight: isAccent ? 600 : 500,
      cursor: 'default',
    }}
  >
    {children}
  </div>
);

export default BackgroundFallback;
