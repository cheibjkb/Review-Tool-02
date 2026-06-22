import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Modal, Button } from '@douyinfe/semi-ui';
import { IconAlertTriangle } from '@douyinfe/semi-icons';
import ShowcaseModal from '../components/ShowcaseModal';
import IframeBase, { IframeAnchor, IframeAnchorRect } from './IframeBase';

// All prototype layouts are pinned to a fixed 1440×900 base, centred in the
// viewport. The Showcase config modal sits inside this base at (312, bottom 8).
// Earlier we tried various responsive schemes — they kept producing edge cases
// where the modal drifted away from the right-side bound-items panel. Pinning
// everything to fixed coordinates avoids the entire class of bug.
const BASE_W = 1440;
const BASE_H = 900;
const MODAL_W = 600;
const MODAL_H = 640;
const MODAL_LEFT_IN_BASE = 312;
const MODAL_BOTTOM_IN_BASE = 8;
// SVG export's viewBox — used only to map hotspot coordinates onto the 1440-wide
// rendered SVG (slight horizontal compression of ~1.1%, visually invisible).
const SELECT_SVG_W = 1456;
const SELECT_SVG_H = 900;
const SELECT_HOTSPOTS: ReadonlyArray<{ id: string; reviewAnchor?: string; x: number; y: number; w: number; h: number; kind: 'edit' | 'delete' }> = [
  { id: 'bind-edit-1', x: 1335, y: 460, w: 22, h: 28, kind: 'edit' },
  { id: 'bind-delete-1', x: 1361, y: 460, w: 22, h: 28, kind: 'delete' },
  { id: 'bind-edit-2', reviewAnchor: 'success-edit-icon', x: 1335, y: 508, w: 22, h: 28, kind: 'edit' },
  { id: 'bind-delete-2', reviewAnchor: 'success-delete-icon', x: 1361, y: 508, w: 22, h: 28, kind: 'delete' },
];

// ---- Anchor finders: locate buttons in the captured HTML by walking its DOM ----
//
// Pick the first element with a non-zero bounding rect (i.e., the visible one).
const pickVisible = (els: NodeListOf<HTMLElement> | HTMLElement[]): HTMLElement | null => {
  for (const el of Array.from(els)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
};

// "+ Add" showcase button. The captured page has multiple matches (e.g. for hidden tabs)
// so we iterate all candidates and pick the visible one.
const findAddShowcaseBtn = (doc: Document): HTMLElement | null => {
  let el = pickVisible(doc.querySelectorAll<HTMLElement>('button.addShowcaseBtn, .addShowcaseBtn'));
  if (el) return el;
  // Fallback: any button with plus icon + text "Add" inside a showcase container.
  const buttons = Array.from(doc.querySelectorAll<HTMLElement>('button'));
  const candidates = buttons.filter((b) => {
    const txt = (b.textContent || '').trim();
    if (!/^\+?\s*Add$/i.test(txt)) return false;
    if (!b.querySelector('.semi-icon-plus, .semi-icon-plus_stroked, [aria-label="plus"]')) return false;
    let p: HTMLElement | null = b;
    for (let i = 0; i < 10 && p; i++) {
      const cls = typeof p.className === 'string' ? p.className.toLowerCase() : '';
      if (cls.includes('showcase')) return true;
      p = p.parentElement;
    }
    return false;
  });
  return pickVisible(candidates);
};

const findEditIcon = (doc: Document): HTMLElement | null => {
  let el = pickVisible(doc.querySelectorAll<HTMLElement>('.showcaseItem__actions-edit'));
  if (el) return el;
  const spans = Array.from(doc.querySelectorAll<HTMLElement>('.showcaseItem__actions [role="img"]'));
  return pickVisible(spans.filter((_, i) => i % 2 === 0));
};

const findDeleteIcon = (doc: Document): HTMLElement | null => {
  let el = pickVisible(doc.querySelectorAll<HTMLElement>('.showcaseItem__actions-delete'));
  if (el) return el;
  const spans = Array.from(doc.querySelectorAll<HTMLElement>('.showcaseItem__actions [role="img"]'));
  return pickVisible(spans.filter((_, i) => i % 2 === 1));
};

const Home: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isModalOpen = searchParams.get('modal') === 'showcase';
  const showDeleteConfirm = searchParams.get('delete_confirm') === 'true';
  const [anchorRects, setAnchorRects] = useState<IframeAnchorRect[]>([]);

  const handleDeleteClick = () => {
    const params = new URLSearchParams(searchParams);
    params.set('delete_confirm', 'true');
    setSearchParams(params);
  };
  const handleCancelDelete = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('delete_confirm');
    setSearchParams(params);
  };
  const handleConfirmDelete = () => setSearchParams(new URLSearchParams());
  const handleOpenModal = () => setSearchParams(new URLSearchParams({ modal: 'showcase' }));
  // Closing the modal: in edit mode (modal opened over a submitted base) we drop the
  // modal/tab/error/expanded keys but keep state+uid+selected so the underlying page
  // stays on its success state. Otherwise wipe everything back to the empty home.
  const handleCloseModal = () => {
    const editing = state === 'submit-select-success' || state === 'submit-create-success';
    if (!editing) { setSearchParams(new URLSearchParams()); return; }
    const next = new URLSearchParams();
    next.set('state', state!);
    if (uid) next.set('uid', uid);
    if (selected) next.set('selected', selected);
    setSearchParams(next);
  };

  const state = searchParams.get('state');
  const uid = searchParams.get('uid');
  const selected = searchParams.get('selected');

  // 'initial' = empty/home page, 'bind' = bound-via-select success (uses SVG mock),
  // 'create' = created-new success (uses HTML capture).
  const mode: 'initial' | 'bind' | 'create' =
    state === 'submit-select-success' ? 'bind'
    : state === 'submit-create-success' ? 'create'
    : 'initial';
  const isEmpty = mode === 'initial';
  const baseSrc =
    mode === 'initial' ? '/before/home-initial.html'
    : mode === 'bind' ? '/before/select.svg'
    : '/before/submitted.html';

  const anchors: IframeAnchor[] = useMemo(
    () =>
      mode === 'initial'
        ? [{ id: 'home-add-hotspot', finders: [findAddShowcaseBtn] }]
        : mode === 'create'
        ? [
            { id: 'success-edit-icon', finders: [findEditIcon] },
            { id: 'success-delete-icon', finders: [findDeleteIcon] },
          ]
        : [],
    [mode]
  );

  const onAnchors = useCallback((rects: IframeAnchorRect[]) => setAnchorRects(rects), []);

  const find = (id: string) => anchorRects.find((r) => r.id === id);
  const addRect = find('home-add-hotspot');
  const editRect = find('success-edit-icon');
  const deleteRect = find('success-delete-icon');

  // Vertical margin around the 1440×900 base container. Equal top and bottom for
  // perfect centring when the viewport is taller than the base; 0 when the
  // viewport is shorter so the user can scroll vertically to see everything.
  const [verticalMargin, setVerticalMargin] = useState(() => computeVerticalMargin());
  useEffect(() => {
    const onResize = () => setVerticalMargin(computeVerticalMargin());
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Edit keeps the success state in the URL — Home.tsx still renders the bound /
  // submitted base page, and ShowcaseModal recognises submit-X-success as "open
  // pre-filled in the matching tab". Without this, the base page would flash back
  // to home-initial (mode=initial) while the modal animated open.
  const handleEditClick = state === 'submit-select-success'
    ? () => setSearchParams(new URLSearchParams({
        modal: 'showcase',
        state: 'submit-select-success',
        uid: uid || '1111111111',
        selected: selected || '1',
        expanded: selected || '1',
      }))
    : () => setSearchParams(new URLSearchParams({
        modal: 'showcase',
        state: 'submit-create-success',
        uid: uid || '2222222222',
        time: 'filled',
      }));

  const bindScaleX = BASE_W / SELECT_SVG_W;
  const bindScaleY = BASE_H / SELECT_SVG_H;

  return (
    <div
      style={{
        width: '100vw',
        minHeight: '100vh',
        overflowX: 'hidden',
        overflowY: 'auto',
        backgroundColor: '#EFEAE1',
      }}
    >
      {/* Inner container: lives in document flow so it scrolls together with the
          modal and hotspots when the viewport is shorter than 900px. */}
      <div
        style={{
          position: 'relative',
          width: BASE_W,
          height: BASE_H,
          margin: `${verticalMargin}px auto`,
          overflow: 'hidden',
          background: '#C5CAD2',
        }}
      >
        {mode === 'bind' ? (
          <img
            src={baseSrc}
            alt="bound showcase prototype"
            style={{
              width: BASE_W,
              height: BASE_H,
              display: 'block',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        ) : (
          <IframeBase
            src={baseSrc}
            width={BASE_W}
            height={BASE_H}
            anchors={anchors}
            onAnchorsReady={onAnchors}
          />
        )}

        {/* Hotspots — inner-container relative; IframeBase now returns coords in
            the iframe content space, which equals inner-container space because
            the iframe is laid out at (0, 0) of the inner. */}
        {mode === 'initial' && addRect && (
          <TransparentHotspot anchor="home-add-hotspot" rect={addRect.rect} onClick={handleOpenModal} title="+ Add showcase" />
        )}
        {mode === 'create' && editRect && (
          <TransparentHotspot anchor="success-edit-icon" rect={editRect.rect} onClick={handleEditClick} title="编辑" />
        )}
        {mode === 'create' && deleteRect && (
          <TransparentHotspot anchor="success-delete-icon" rect={deleteRect.rect} onClick={handleDeleteClick} title="删除" />
        )}
        {mode === 'bind' && SELECT_HOTSPOTS.map((h) => (
          <TransparentHotspot
            key={h.id}
            anchor={h.reviewAnchor || h.id}
            rect={{
              left: h.x * bindScaleX,
              top: h.y * bindScaleY,
              width: h.w * bindScaleX,
              height: h.h * bindScaleY,
            }}
            onClick={h.kind === 'edit' ? handleEditClick : handleDeleteClick}
            title={h.kind === 'edit' ? '编辑' : '删除'}
          />
        ))}

        {/* Modal sits inside the inner container so it scrolls in lockstep with
            the base. Positions are inner-relative (left=312, bottom=8). */}
        <ShowcaseModal
          visible={isModalOpen}
          onClose={handleCloseModal}
          positionLeft={MODAL_LEFT_IN_BASE}
          positionTop={BASE_H - MODAL_BOTTOM_IN_BASE - MODAL_H}
        />
      </div>

      <Modal
        visible={showDeleteConfirm}
        onCancel={handleCancelDelete}
        closable={true}
        maskClosable={true}
        width={420}
        style={{ top: 160 }}
        title={
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <IconAlertTriangle style={{ color: '#FF7D00', fontSize: '24px', flexShrink: 0, marginTop: '2px' }} />
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#1C1F23', lineHeight: '24px' }}>Delete Current Configuration?</span>
          </div>
        }
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button theme="light" style={{ backgroundColor: '#F2F3F5', borderColor: 'transparent', color: '#1C1F23', fontWeight: 600, padding: '0 16px' }} onClick={handleCancelDelete}>Cancel</Button>
            <Button theme="solid" style={{ backgroundColor: '#FF5D00', borderColor: '#FF5D00', color: '#fff', fontWeight: 600, padding: '0 16px' }} onClick={handleConfirmDelete}>Delete</Button>
          </div>
        }
      >
        <div style={{ fontSize: '14px', color: '#4E5969', marginLeft: '32px', marginTop: '-4px', marginBottom: '8px' }}>Your edits will not be saved</div>
      </Modal>
    </div>
  );
};

interface HotspotProps {
  anchor: string;
  rect: { left: number; top: number; width: number; height: number };
  onClick: () => void;
  title: string;
}

// Equal top/bottom margin around the base container — produces vertical
// centring when the viewport is taller than BASE_H, and 0 when it is shorter so
// the page just scrolls.
const computeVerticalMargin = () => Math.max(0, (window.innerHeight - BASE_H) / 2);

const TransparentHotspot: React.FC<HotspotProps> = ({ anchor, rect, onClick, title }) => (
  <button
    data-review-anchor={anchor}
    onClick={onClick}
    title={title}
    aria-label={title}
    style={{
      // absolute so the hotspot scrolls with its inner-container parent, instead
      // of floating with the viewport while the base/modal scroll underneath
      position: 'absolute',
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      background: 'transparent',
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      outline: 'none',
      zIndex: 50,
    }}
  />
);

export default Home;
