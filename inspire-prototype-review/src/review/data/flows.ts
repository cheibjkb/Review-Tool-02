export interface FlowStep {
  instruction: string;
  hint?: string;
  targetUrl: string;
  highlightAnnotationId: string;
  expectedSearch?: Record<string, string>;
  /**
   * Disable ClickLockOverlay for this step. Use sparingly — only when the
   * intended interaction requires clicks outside the highlighted anchor (e.g.
   * Semi UI's DatePicker pops up a calendar that floats outside the anchor's
   * bounding box, so the strict lock would block the user from picking dates).
   */
  disableClickLock?: boolean;
  /**
   * Optional chips rendered inside the step bubble that let the reviewer
   * copy-paste a UID or one-click jump to the URL that simulates that UID
   * having been entered. Used on the UID input step.
   */
  uidQuickFill?: QuickFillUid[];
}

export interface QuickFillUid {
  value: string;
  label: string;
  targetUrl: string;
}

/** Both complete flows surface the same pair of test UIDs at their UID step. */
export const TEST_UIDS: QuickFillUid[] = [
  { value: '1111111111', label: '有绑定项', targetUrl: '/?modal=showcase&uid=1111111111&state=found&tab=select' },
  { value: '2222222222', label: '绑定为空', targetUrl: '/?modal=showcase&uid=2222222222&state=not-found&tab=create' },
];

// 'complete' flows walk a full user journey end-to-end (UID → result). 'other'
// flows are situational follow-ups (edit / delete) that assume the user is already
// in a success state. FlowPicker renders them in two distinct sections.
export type FlowCategory = 'complete' | 'other';

export interface Flow {
  id: string;
  index: number;
  category: FlowCategory;
  title: string;
  summary: string;
  est: string;
  steps: FlowStep[];
}

// Design note: where a step requires URL params that the prototype's element clicks
// don't set (e.g. `time=filled` — the DatePicker needs manual interaction), the step
// instruction tells the user "点 Next →" so the bubble's Next button programmatically
// navigates to that URL. This avoids dead-ends.
export const flows: Flow[] = [
  {
    id: 'flow-bind-existing',
    index: 1,
    category: 'complete',
    title: '绑定已有 LIVE event（主路径）',
    summary: '老版无法绑现有 event，本次新增主路径：输 LIVE creator UID → 选已有 event → 提交。',
    est: '约 2 分钟',
    steps: [
      { instruction: '点 + Add showcase 打开配置弹窗', targetUrl: '/', highlightAnnotationId: 'home-add-hotspot' },
      { instruction: '在 LIVE creator UID 输入框里输入 1111111111(模拟能查到的 creator)', targetUrl: '/?modal=showcase', highlightAnnotationId: 'uid-input', uidQuickFill: TEST_UIDS },
      { instruction: '点 Existing LIVE Event 切到「绑已有」分支', targetUrl: '/?modal=showcase&uid=1111111111&state=found&tab=select', highlightAnnotationId: 'event-tab-existing' },
      { instruction: '点第一张卡片右上角 ⌃ 展开看 event 详情', targetUrl: '/?modal=showcase&uid=1111111111&state=found&tab=select', highlightAnnotationId: 'event-card-expand' },
      { instruction: '点第一张卡片任意位置选中（卡片整体作为热区）', targetUrl: '/?modal=showcase&uid=1111111111&state=found&tab=select&expanded=1', highlightAnnotationId: 'event-card-1-body' },
      { instruction: '点 Submit 完成绑定', targetUrl: '/?modal=showcase&uid=1111111111&state=found&tab=select&selected=1&expanded=1', highlightAnnotationId: 'submit-button' },
    ],
  },
  {
    // The old standalone "create new" flow was a strict subset of this one (which
    // also ends in a create submission), so we collapsed them. This is now the only
    // complete flow that exercises the create branch.
    id: 'flow-not-found',
    index: 2,
    category: 'complete',
    title: 'LIVE creator 没有可绑 event → 转 create',
    summary: '查不到 event 时的兜底链路：输 UID → 看到自动切到 create → 切回去看空状态 → 切回 create 填表 → 提交。',
    est: '约 1 分钟',
    // URL aliasing note: visiting the bind empty state and clicking New LIVE Event
    // brings the URL back to state=not-found&tab=create — which would otherwise
    // alias with the post-UID-input state and let the auto-advance jump straight
    // to "set time range", silently skipping the empty-state demonstration. The
    // tab switch from empty→create therefore stamps `from=empty` in the URL
    // (see ShowcaseModal.handleTabChange) and steps 4–6 below require that marker.
    steps: [
      {
        instruction: '点 + Add showcase 打开配置弹窗',
        targetUrl: '/',
        highlightAnnotationId: 'home-add-hotspot',
      },
      {
        instruction: '在 LIVE creator UID 输入框里输入 2222222222(模拟查不到 event 的 creator)',
        targetUrl: '/?modal=showcase',
        highlightAnnotationId: 'uid-input',
        uidQuickFill: TEST_UIDS,
      },
      {
        instruction: '系统自动切到 New LIVE Event 创建界面（兜底逻辑）— 现在点 Existing LIVE Event 切回去看「无可绑 event」空状态',
        targetUrl: '/?modal=showcase&uid=2222222222&state=not-found&tab=create',
        highlightAnnotationId: 'event-tab-existing',
      },
      {
        instruction: '这就是 creator 没有可绑 event 时的空状态。点 New LIVE Event 切回创建表单',
        targetUrl: '/?modal=showcase&uid=2222222222&state=empty&tab=select',
        highlightAnnotationId: 'event-tab-create',
      },
      {
        instruction: '回到 create 表单。点 LIVE time range 调出日历,选好开始/结束时间(选完后自动进入下一步)',
        targetUrl: '/?modal=showcase&uid=2222222222&state=not-found&tab=create&from=empty',
        highlightAnnotationId: 'time-range',
        // DatePicker's calendar popup floats outside the time-range anchor's
        // bounding box, so ClickLockOverlay would swallow clicks on dates.
        disableClickLock: true,
      },
      {
        instruction: '点 Submit 完成创建',
        targetUrl: '/?modal=showcase&uid=2222222222&state=not-found&tab=create&from=empty&time=filled',
        highlightAnnotationId: 'submit-button',
      },
    ],
  },
  {
    id: 'flow-edit',
    index: 3,
    category: 'other',
    title: '编辑已绑定 event',
    summary: '在成功态点击编辑图标 → 重新打开 modal 预填上次配置。',
    est: '约 30 秒',
    steps: [
      { instruction: '点 ✎ 编辑图标', targetUrl: '/?state=submit-select-success&uid=1111111111&selected=1', highlightAnnotationId: 'success-edit-icon' },
      { instruction: '完成 — 编辑态已预填上次配置', targetUrl: '/?modal=showcase&state=submit-select-success&uid=1111111111&selected=1&expanded=1', highlightAnnotationId: 'submit-button' },
    ],
  },
  {
    id: 'flow-delete',
    index: 4,
    category: 'other',
    title: '删除已绑定 event',
    summary: '点删除 → 二次确认 → 回到空 Home。',
    est: '约 30 秒',
    steps: [
      { instruction: '点 🗑 删除图标', targetUrl: '/?state=submit-create-success&uid=1111111111&time=filled', highlightAnnotationId: 'success-delete-icon' },
      { instruction: '在确认窗口点红色 Delete 完成删除', targetUrl: '/?state=submit-create-success&uid=1111111111&time=filled&delete_confirm=true', highlightAnnotationId: 'delete-confirm-button' },
    ],
  },
];

export const findFlow = (id: string) => flows.find((f) => f.id === id);
