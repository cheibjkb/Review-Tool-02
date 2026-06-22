export type ChangeType = 'NEW' | 'MODIFIED' | 'KEPT';
export type RouteMatcher = (search: URLSearchParams, pathname: string) => boolean;

import { TEST_UIDS, type QuickFillUid } from './flows';

export interface Annotation {
  id: string;
  title: string;
  changeType: ChangeType;
  /** ONE short sentence describing the benefit/result. No background, no reason. */
  painPoint: string;
  /** Optional PRD original text — hidden by default, exposed via disclosure. */
  prdQuote?: string;
  trigger?: string;
  notTrigger?: string;
  effect?: string;
  flows: string[];
  beforeAnchor?: 'modal-open' | 'modal-closed';
  guidedOnly?: boolean;
  /**
   * Test-fill chips surfaced in the explore-mode hover card so reviewers can
   * jump straight to "UID has been entered" without typing. Same shape as the
   * one used by guided-mode step bubbles (see flows.ts).
   */
  quickFillUids?: QuickFillUid[];
  match: RouteMatcher;
  locate: () => { selector?: string; rect?: { topPct: number; leftPct: number; widthPct: number; heightPct: number } };
}

const isModalOpen = (s: URLSearchParams) => s.get('modal') === 'showcase';
const stateIs = (s: URLSearchParams, v: string) => s.get('state') === v;
const tabIs = (s: URLSearchParams, v: string) => (s.get('tab') || 'select') === v;

export const annotations: Annotation[] = [
  {
    id: 'home-add-hotspot',
    title: '入口：+ Add showcase',
    changeType: 'KEPT',
    painPoint: '入口位置与老版一致。',
    flows: ['flow-bind-existing', 'flow-not-found'],
    beforeAnchor: 'modal-closed',
    match: (s, p) => p === '/' && !isModalOpen(s) && !s.get('state'),
    locate: () => ({ selector: '[data-review-anchor="home-add-hotspot"]' }),
  },
  {
    id: 'uid-input',
    title: 'LIVE creator UID 输入',
    changeType: 'MODIFIED',
    painPoint: '输入框沿用老版，但下游分支变成「绑已有 / 建新的」二选一。',
    trigger: '输入 1111111111 或 2222222222',
    effect: '1 秒 loading 后进入二选一界面',
    flows: ['flow-bind-existing', 'flow-not-found'],
    beforeAnchor: 'modal-open',
    quickFillUids: TEST_UIDS,
    match: (s) => isModalOpen(s) && (!s.get('state') || s.get('error') === 'true'),
    locate: () => ({ selector: '[data-review-anchor="uid-input"]' }),
  },
  {
    id: 'existing-event-radio',
    title: 'Existing / New LIVE Event 二选一',
    changeType: 'NEW',
    painPoint: '可直接绑定 LIVE 平台已有 event，不必每次重新创建。',
    prdQuote: '用户在输入 uid 后，会有 2 个 option：绑定已有 live event、创建新 event。',
    effect: '切换 tab 切换下游表单',
    flows: ['flow-bind-existing'],
    beforeAnchor: 'modal-open',
    match: (s) => isModalOpen(s) && (stateIs(s, 'found') || stateIs(s, 'not-found') || stateIs(s, 'empty')),
    locate: () => ({ selector: '.semi-radioGroup' }),
  },
  {
    id: 'uid-found-list',
    title: '已有 LIVE event 列表',
    changeType: 'NEW',
    painPoint: '点选代替粘贴链接，跳转链接自动绑好，杜绝失效和填错。',
    prdQuote: '根据用户输入的 uid，查询在线的、即将发生的 live event，返回列表供用户选择，一个活动只能绑定一个 live event。',
    trigger: '输入 1111111111 演示能查到的 creator',
    flows: ['flow-bind-existing'],
    match: (s) => isModalOpen(s) && stateIs(s, 'found') && tabIs(s, 'select'),
    locate: () => ({ selector: '[data-review-anchor="event-list"]' }),
  },
  {
    id: 'event-active-tag',
    title: 'Active 标签：标记正在进行中的 event',
    changeType: 'NEW',
    painPoint: '整个列表里至多只有一张卡片有 Active 标签 —— 就是当前正在直播的那一场。其它（即将开始 / 已结束）都没有这个 tag。',
    trigger: '该 event 处于「正在进行」状态',
    notTrigger: '即将开始、已结束等其它状态',
    effect: '卡片右上角显示绿色 "Active" 标签',
    flows: ['flow-bind-existing'],
    match: (s) => isModalOpen(s) && stateIs(s, 'found') && tabIs(s, 'select'),
    locate: () => ({ selector: '[data-review-anchor="event-card-1"]' }),
  },
  {
    id: 'event-time-format',
    title: 'event 时间格式精简',
    changeType: 'NEW',
    painPoint: '日期只出现一次，时间精确到分钟，节省卡片横向空间。格式：UTC+0 2025/01/14 10:00~12:00',
    flows: ['flow-bind-existing'],
    match: (s) => isModalOpen(s) && stateIs(s, 'found') && tabIs(s, 'select'),
    locate: () => ({ selector: '[data-review-anchor="event-time-format"]' }),
  },
  {
    id: 'event-card-1-body',
    title: '点卡片选中该 event',
    changeType: 'NEW',
    painPoint: '卡片整体作为选中热区。',
    trigger: '点卡片任意位置',
    notTrigger: '点右上角 ⌃ 只触发展开',
    flows: ['flow-bind-existing'],
    match: (s) => isModalOpen(s) && stateIs(s, 'found') && tabIs(s, 'select'),
    locate: () => ({ selector: '[data-review-anchor="event-card-1"]' }),
  },
  {
    id: 'event-card-expand',
    title: 'event 卡片展开看详情',
    changeType: 'NEW',
    painPoint: '看 Event id 和 description 确认是不是这一场。',
    trigger: '点卡片右上角 ⌃ 图标',
    effect: '展开 / 收起 Event id、Description',
    flows: ['flow-bind-existing'],
    match: (s) => isModalOpen(s) && stateIs(s, 'found') && tabIs(s, 'select'),
    locate: () => ({ selector: '[data-review-anchor="event-card-1-expand"]' }),
  },
  {
    id: 'submit-no-selection-error',
    title: '未选 event 提交报错',
    changeType: 'NEW',
    painPoint: '没选 event 时阻止提交并红字提示。',
    trigger: 'Select tab，未选任一卡片就点 Submit',
    effect: '顶部红字提示，不提交',
    flows: ['flow-bind-existing'],
    match: (s) => isModalOpen(s) && stateIs(s, 'found') && tabIs(s, 'select') && s.get('error') === 'submit',
    locate: () => ({ selector: '[data-review-anchor="submit-error"]' }),
  },
  {
    id: 'not-found-empty-state',
    title: 'UID 查不到的空状态',
    changeType: 'NEW',
    painPoint: 'UID 无可绑 event 时给出明确空状态而非空白列表。',
    trigger: '输入 2222222222 并切回 Select tab',
    effect: '展示插画 + 引导文案',
    flows: ['flow-not-found'],
    match: (s) => isModalOpen(s) && stateIs(s, 'empty') && tabIs(s, 'select'),
    locate: () => ({ selector: '[data-review-anchor="empty-state"]' }),
  },
  {
    id: 'create-form',
    title: 'Create LIVE Event 表单',
    changeType: 'KEPT',
    painPoint: '表单字段、校验与老版一致。',
    flows: ['flow-not-found'],
    beforeAnchor: 'modal-open',
    match: (s) => isModalOpen(s) && (stateIs(s, 'found') || stateIs(s, 'not-found')) && tabIs(s, 'create'),
    locate: () => ({ selector: '[data-review-anchor="create-form"]' }),
  },
  {
    // Guided-only anchor used by flow-not-found's "fill in LIVE time range" step.
    // The existing time-range-required annotation only matches when error=time-range
    // (i.e., after a failed submit), so it can't be used to anchor a bubble during
    // the normal create flow.
    id: 'time-range',
    title: 'LIVE time range 填写',
    changeType: 'KEPT',
    painPoint: '设置好 LIVE 起止时间(必填字段)。',
    guidedOnly: true,
    flows: ['flow-not-found'],
    match: (s) => isModalOpen(s) && tabIs(s, 'create'),
    locate: () => ({ selector: '[data-review-anchor="time-range"]' }),
  },
  {
    id: 'time-range-required',
    title: 'time range 必填校验',
    changeType: 'KEPT',
    painPoint: '校验呈现方式（红框 + 下方红字）沿用老版。',
    trigger: '不填 time range 就点 Submit',
    effect: 'DatePicker 红框 + "This field is required"',
    flows: ['flow-not-found'],
    beforeAnchor: 'modal-open',
    match: (s) => isModalOpen(s) && tabIs(s, 'create') && s.get('error') === 'time-range',
    locate: () => ({ selector: '[data-review-anchor="time-range"]' }),
  },
  {
    id: 'success-edit-icon',
    title: '编辑：查看 / 修改已提交配置',
    changeType: 'KEPT',
    painPoint: '上次提交的信息全部预填，可核对或继续修改。',
    trigger: '在成功态点 ✎',
    effect: '弹窗以预填态打开',
    flows: ['flow-edit'],
    match: (s) => s.get('state') === 'submit-select-success' || s.get('state') === 'submit-create-success',
    locate: () => ({ selector: '[data-review-anchor="success-edit-icon"]' }),
  },
  {
    id: 'success-delete-icon',
    title: '删除：增加二次确认窗口',
    changeType: 'MODIFIED',
    painPoint: '点 🗑 不直接删，先弹二次确认避免误操作。',
    trigger: '在成功态点 🗑',
    effect: '弹出 "Delete Current Configuration?" 确认窗口',
    flows: ['flow-delete'],
    match: (s) => (s.get('state') === 'submit-select-success' || s.get('state') === 'submit-create-success') && s.get('delete_confirm') !== 'true',
    locate: () => ({ selector: '[data-review-anchor="success-delete-icon"]' }),
  },
  {
    id: 'delete-confirm-modal',
    title: '删除二次确认弹窗',
    changeType: 'KEPT',
    painPoint: '弹窗视觉与文案沿用 Semi 默认 Modal 样式。',
    flows: ['flow-delete'],
    match: (s) => s.get('delete_confirm') === 'true',
    locate: () => ({ selector: '.semi-modal-body' }),
  },
  {
    id: 'submit-button',
    title: '提交按钮文案：OK → Submit',
    changeType: 'MODIFIED',
    painPoint: '在「无可绑 event」空状态下按钮置灰不可点 —— 没有可操作项可提交，引导用户先切到 New LIVE Event 创建。',
    flows: ['flow-bind-existing', 'flow-not-found'],
    beforeAnchor: 'modal-open',
    match: (s) => isModalOpen(s),
    locate: () => ({ selector: '[data-review-anchor="submit-button"]' }),
  },
  {
    id: 'event-tab-create',
    title: 'New LIVE Event 选项',
    changeType: 'MODIFIED',
    painPoint: '把原本的隐式创建变成显式 radio 选项，跟 Existing 并列。',
    guidedOnly: true,
    flows: ['flow-not-found'],
    match: (s) => isModalOpen(s) && (stateIs(s, 'found') || stateIs(s, 'not-found') || stateIs(s, 'empty')),
    locate: () => ({ selector: '[data-review-anchor="event-tab-create"]' }),
  },
  {
    id: 'event-tab-existing',
    title: 'Existing LIVE Event 选项',
    changeType: 'NEW',
    painPoint: '本期新增的「绑已有 event」分支入口。',
    guidedOnly: true,
    flows: ['flow-bind-existing', 'flow-not-found'],
    match: (s) => isModalOpen(s) && (stateIs(s, 'found') || stateIs(s, 'not-found') || stateIs(s, 'empty')),
    locate: () => ({ selector: '[data-review-anchor="event-tab-existing"]' }),
  },
  {
    id: 'delete-confirm-button',
    title: '确认删除按钮',
    changeType: 'KEPT',
    painPoint: '点了才真正清空 showcase 配置。',
    guidedOnly: true,
    flows: ['flow-delete'],
    match: (s) => s.get('delete_confirm') === 'true',
    locate: () => ({ selector: '.semi-modal-content .semi-button-danger, .semi-modal-content [style*="rgb(255, 93, 0)"]' }),
  },
];

export const findAnnotationsForRoute = (search: URLSearchParams, pathname: string) =>
  annotations.filter((a) => {
    if (a.guidedOnly) return false;
    try {
      return a.match(search, pathname);
    } catch {
      return false;
    }
  });

export const findAnnotationById = (id: string) => annotations.find((a) => a.id === id);
