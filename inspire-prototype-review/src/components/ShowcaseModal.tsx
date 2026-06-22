import React, { useEffect, useState } from 'react';
import { Input, Button, RadioGroup, Radio, Select, DatePicker, Spin } from '@douyinfe/semi-ui';
import { useSearchParams } from 'react-router-dom';
import { IconClose, IconChevronDown, IconChevronUp, IconChevronLeft, IconChevronRight } from '@douyinfe/semi-icons';
import { IllustrationNoResult } from '@douyinfe/semi-illustrations';
import styles from './ShowcaseModal.module.scss';

interface ShowcaseModalProps {
  visible: boolean;
  onClose: () => void;
  /**
   * Override the modal's CSS position with absolute viewport coordinates.
   * The base CSS still pins the panel at right:360 / bottom:0 as a fallback
   * when the parent doesn't supply coordinates.
   */
  positionLeft?: number;
  positionTop?: number;
}

const ShowcaseModal: React.FC<ShowcaseModalProps> = ({ visible, onClose, positionLeft, positionTop }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // States
  const [uid, setUid] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<number[]>([]);
  const [timeRange, setTimeRange] = useState<any[]>([]);
  const [intro, setIntro] = useState('');
  
  // Derived state. When Home routes here from the success page via the Edit icon,
  // it preserves state=submit-X-success so the base page stays put — we translate
  // that to the matching modal display state + tab here so pre-fill works.
  const paramUid = searchParams.get('uid');
  const rawParamState = searchParams.get('state');
  const editingFromSelect = rawParamState === 'submit-select-success';
  const editingFromCreate = rawParamState === 'submit-create-success';
  const paramState = editingFromSelect || editingFromCreate ? 'found' : rawParamState;
  const paramError = searchParams.get('error');
  const paramTab = searchParams.get('tab') || (editingFromCreate ? 'create' : 'select');
  const paramSelected = searchParams.get('selected');
  const paramExpanded = searchParams.get('expanded');
  const paramTime = searchParams.get('time');

  const [localState, setLocalState] = useState<'initial' | 'found' | 'not-found'>('initial');
  const [viewTab, setViewTab] = useState<'select' | 'create'>('select');
  const [mainTab, setMainTab] = useState<'operations' | 'reference'>('operations');
  const [uidError, setUidError] = useState(false);
  const [showSubmitError, setShowSubmitError] = useState(false);
  const [timeRangeError, setTimeRangeError] = useState(false);

  useEffect(() => {
    if (visible) {
      if (paramUid) setUid(paramUid);
      if (paramState === 'found') setLocalState('found');
      else if (paramState === 'not-found' || paramState === 'empty') setLocalState('not-found');
      else setLocalState('initial');
      
      if (paramTab === 'create') setViewTab('create');
      else if (paramTab === 'select') setViewTab('select');
      else if (paramState === 'not-found') setViewTab('create');
      else setViewTab('select');
      
      if (paramError === 'submit') setShowSubmitError(true);
      else if (paramError === 'time-range') setTimeRangeError(true);
      else if (paramError === 'true') setUidError(true);
      else {
        setShowSubmitError(false);
        setUidError(false);
        setTimeRangeError(false);
      }
      
      if (paramSelected) setSelectedEvent(Number(paramSelected));
      else setSelectedEvent(null);
      
      if (paramExpanded) setExpandedEvents(paramExpanded.split(',').map(Number));
      else setExpandedEvents([]);

      if (paramTime === 'filled') {
        setTimeRange([new Date('2026-06-11T19:46:52'), new Date('2026-06-15T19:46:51')]);
      } else {
        setTimeRange([]);
      }
    } else {
      setUid('');
      setIntro('');
      setLocalState('initial');
      setViewTab('select');
      setUidError(false);
      setShowSubmitError(false);
      setTimeRangeError(false);
      setSelectedEvent(null);
      setExpandedEvents([]);
      setTimeRange([]);
    }
  }, [visible, paramUid, paramState, paramError, paramTab, paramSelected, paramExpanded, paramTime]);

  const isUidInvalid = uid.length > 0 && uid !== '1111111111' && uid !== '2222222222';

  const handleUidChange = (val: string) => {
    setUid(val);
    if (val === '1111111111' || val === '2222222222') {
      setUidError(false);
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        const newState = val === '1111111111' ? 'found' : 'not-found';
        const newTab = val === '1111111111' ? 'select' : 'create';
        setSearchParams(new URLSearchParams({
          modal: 'showcase',
          uid: val,
          state: newState,
          tab: newTab
        }));
      }, 1000);
    } else {
      if (val.length > 0 && val !== '1111111111' && val !== '2222222222') setUidError(true);
      else setUidError(false);
      setLocalState('initial');
      const newParams = new URLSearchParams();
      newParams.set('modal', 'showcase');
      if (val) newParams.set('uid', val);
      setSearchParams(newParams);
    }
  };

  const handleClearUser = () => {
    setUid('');
    setIntro('');
    setLocalState('initial');
    setSearchParams(new URLSearchParams({ modal: 'showcase' }));
  };

  const handleSubmit = () => {
    if (localState === 'initial' || !uid || isUidInvalid) {
      setUidError(true);
      const params = new URLSearchParams(searchParams);
      params.set('error', 'true');
      setSearchParams(params);
      return;
    }
    if (viewTab === 'select') {
      if (!selectedEvent) {
        setShowSubmitError(true);
        const params = new URLSearchParams(searchParams);
        params.set('error', 'submit');
        setSearchParams(params);
        return;
      } else {
        setSearchParams(new URLSearchParams({ 
          state: 'submit-select-success',
          uid: uid,
          selected: selectedEvent.toString()
        }));
        return;
      }
    }
    if (viewTab === 'create') {
      if (!timeRange || timeRange.length === 0) {
        setTimeRangeError(true);
        const params = new URLSearchParams(searchParams);
        params.set('error', 'time-range');
        setSearchParams(params);
        return;
      } else {
        setSearchParams(new URLSearchParams({ 
          state: 'submit-create-success',
          uid: uid,
          time: 'filled'
        }));
        return;
      }
    }
  };

  const handleTabChange = (e: any) => {
    const val = e.target.value;
    setViewTab(val);
    setShowSubmitError(false);
    setTimeRangeError(false);

    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', val);
    newParams.delete('error');
    if (localState === 'not-found') {
      if (val === 'select') {
        newParams.set('state', 'empty');
        newParams.delete('from');
      } else {
        newParams.set('state', 'not-found');
        // Stamp a marker so the not-found→create state coming BACK from the empty
        // bind state is distinguishable from the initial post-UID-input state.
        // flow-not-found's later steps key off this so they don't get skipped by
        // the auto-advance — see flows.ts comment.
        if (rawParamState === 'empty') newParams.set('from', 'empty');
      }
    }
    setSearchParams(newParams);
  };

  const renderSelectTab = () => {
    if (localState === 'not-found') {
      return (
        <div data-review-anchor="empty-state" style={{ textAlign: 'center', padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <IllustrationNoResult style={{ width: 160, height: 160, marginBottom: 16 }} />
          <div style={{ color: 'var(--semi-color-text-2)', fontSize: 14 }}>
            No available LIVE events to bind. Please create a new LIVE event.
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {showSubmitError && (
          <div data-review-anchor="submit-error" style={{ color: 'var(--semi-color-danger)', fontSize: 14, marginBottom: 12 }}>
            Please select a LIVE event or create a new one before submitting.
          </div>
        )}
        <div className={styles.radioCards} data-review-anchor="event-list">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => {
            const isSelected = selectedEvent === item;
            const isExpanded = expandedEvents.includes(item);
            
            const handleSelect = () => {
              if (isSelected) {
                return;
              } else {
                setSelectedEvent(item);
                setShowSubmitError(false);
                const params = new URLSearchParams(searchParams);
                params.set('selected', item.toString());
                params.delete('error');
                
                if (!expandedEvents.includes(item)) {
                  const newExpanded = [...expandedEvents, item];
                  setExpandedEvents(newExpanded);
                  params.set('expanded', newExpanded.join(','));
                }
                
                setSearchParams(params);
              }
            };

            return (
              <div
                key={item}
                className={`${styles.radioCard} ${isSelected ? styles.selectedCard : ''}`}
                onClick={handleSelect}
                data-review-anchor={`event-card-${item}`}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.cardMainInfo}>
                    <div className={styles.titleRow}>
                      <span className={styles.title}>
                        Gift Party-Lang Lang Birthday
                      </span>
                    </div>
                    <div className={styles.subtitle} data-review-anchor={item === 1 ? 'event-time-format' : undefined}>UTC+0 2025/01/14 10:00~12:00</div>
                  </div>

                  <div className={styles.cardRightActions}>
                    {item === 1 && <span className={styles.activeTag}>Active</span>}
                    <div
                      className={styles.expandIconWrapper}
                      data-review-anchor={`event-card-${item}-expand`}
                      onClick={(e) => {
                        e.stopPropagation();
                        const newExpanded = isExpanded ? expandedEvents.filter(x => x !== item) : [...expandedEvents, item];
                        setExpandedEvents(newExpanded);
                        const params = new URLSearchParams(searchParams);
                        if (newExpanded.length > 0) params.set('expanded', newExpanded.join(','));
                        else params.delete('expanded');
                        setSearchParams(params);
                      }}
                    >
                      {isExpanded ? <IconChevronUp /> : <IconChevronDown />}
                    </div>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className={styles.expandedDetails}>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Event id</span>
                      <span className={styles.detailValue}>78758954379008765</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Description</span>
                      <span className={styles.detailValue}>
                        Lang Lang ist einer der renommiertesten Pianisten der Welt und einer der einflussreichsten Botschafter der klassischen Musik
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCreateTab = () => (
    <div data-review-anchor="create-form" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div className={styles.formLabel}>
          LIVE creator username / LIVE video title <span className={styles.asterisk}>*</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Select 
            defaultValue="Nickname" 
            style={{ width: 140, backgroundColor: 'var(--semi-color-fill-0)' }} 
            optionList={[{value: 'Nickname', label: 'Nickname'}]} 
          />
          <Input 
            defaultValue="Janesmith"
            style={{ flex: 1, backgroundColor: 'var(--semi-color-fill-0)' }}
          />
        </div>
      </div>
      
      <div>
        <div className={styles.formLabel}>LIVE creator introduction</div>
        <Input 
          placeholder="Enter" 
          value={intro}
          onChange={setIntro}
          style={{ backgroundColor: 'var(--semi-color-fill-0)' }} 
        />
      </div>

      <div data-review-anchor="time-range">
        <div className={styles.formLabel}>
          LIVE time range(UTC+10) <span className={styles.asterisk}>*</span>
        </div>
        <div style={{
          border: timeRangeError ? '1px solid var(--semi-color-danger)' : '1px solid transparent',
          borderRadius: '4px',
          padding: 0,
          transition: 'border-color 0.2s'
        }}>
          <DatePicker
            type="dateTimeRange"
            // Time range sits near the bottom of the modal, so the default
            // downward calendar popup hides the Submit button. Opening upward
            // keeps Submit reachable while the picker is open.
            position="topLeft"
            style={{ width: '100%', backgroundColor: 'var(--semi-color-fill-0)' }}
            value={timeRange}
            onChange={(val) => {
              setTimeRange(val as any[]);
              setTimeRangeError(false);
              const params = new URLSearchParams(searchParams);
              params.delete('error');
              if (val && (val as any[]).length === 2) params.set('time', 'filled');
              else params.delete('time');
              setSearchParams(params);
            }}
          />
        </div>
        {timeRangeError && (
          <div className={styles.warningText} style={{ marginTop: 4 }}>This field is required</div>
        )}
        <div className={styles.hintText}>
          Please set the parameter within the campaign period (between 2026-06-08 19:46:52 and 2026-06-15 19:46:51) specified in the basic information. Inputs outside this period will not take effect
        </div>
      </div>
    </div>
  );

  if (!visible) return null;

  return (
    <>
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999,
          backgroundColor: 'transparent'
        }}
        onClick={onClose}
      />
      <div
        className={styles.panelContainer}
        // When the caller positions us (Home does for both the fixed-layout bind
        // mode and the HTML iframe modes), use position:absolute so the modal
        // scrolls inside the same inner container as the base image.
        style={positionLeft != null && positionTop != null
          ? { position: 'absolute', left: positionLeft, top: positionTop, right: 'auto', bottom: 'auto' }
          : undefined}
      >
        <div className={styles.panelHeader}>
        <span>Showcase config</span>
        <div className={styles.closeIcon} onClick={onClose}><IconClose /></div>
      </div>
      
      <div className={styles.panelBody}>
        <Spin spinning={isLoading} wrapperClassName={styles.spinContainer}>
          <div className={styles.fixedContent}>
            <div className={styles.mainTabSwitcher}>
              <div 
                className={`${styles.mainTabItem} ${mainTab === 'operations' ? styles.mainTabActive : ''}`}
                onClick={() => setMainTab('operations')}
              >
                Operations
              </div>
              <div 
                className={`${styles.mainTabItem} ${mainTab === 'reference' ? styles.mainTabActive : ''}`}
                onClick={() => setMainTab('reference')}
              >
                Reference
              </div>
            </div>

            {mainTab === 'operations' && (
              <>
                {localState === 'initial' || isUidInvalid ? (
                  <div style={{ paddingBottom: 16 }}>
                    <div className={styles.formLabel}>
                      LIVE creator UID <span className={styles.asterisk}>*</span>
                    </div>
                    <Input
                      placeholder="Enter"
                      value={uid}
                      onChange={handleUidChange}
                      className={(uidError || isUidInvalid) ? styles.warningControl : ''}
                      style={{ backgroundColor: 'var(--semi-color-fill-0)' }}
                      data-review-anchor="uid-input"
                    />
                    {(uidError || isUidInvalid) && (
                      <div className={styles.warningText}>Enter a valid LIVE creator UID</div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className={styles.userInfoBlock}>
                      <div className={styles.userInfoContent}>
                        <img src="https://picsum.photos/seed/robert/40/40" alt="avatar" className={styles.avatar} />
                        <div className={styles.userDetails}>
                          <div className={styles.userName}>Robert Fox</div>
                          <div className={styles.userId}>
                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.8 }}>
                              <path d="M2.5 3.5C2.5 2.94772 2.94772 2.5 3.5 2.5H10.5C11.0523 2.5 11.5 2.94772 11.5 3.5V10.5C11.5 11.0523 11.0523 11.5 10.5 11.5H3.5C2.94772 11.5 2.5 11.0523 2.5 10.5V3.5ZM3.5 3.5V10.5H10.5V3.5H3.5Z" fill="currentColor"/>
                              <path d="M4.5 5.5H6.5V6.5H4.5V5.5Z" fill="currentColor"/>
                              <path d="M4.5 7.5H9.5V8.5H4.5V7.5Z" fill="currentColor"/>
                            </svg>
                            5831594684198424
                          </div>
                        </div>
                      </div>
                      <div className={styles.userInfoClear} onClick={handleClearUser}>
                        <IconClose size="small" />
                      </div>
                    </div>

                    <RadioGroup type="radio" value={viewTab} onChange={handleTabChange} style={{ marginBottom: 16 }} data-review-anchor="event-tab-radiogroup">
                      <Radio value="select" data-review-anchor="event-tab-existing">Existing LIVE Event</Radio>
                      <Radio value="create" data-review-anchor="event-tab-create">New LIVE Event</Radio>
                    </RadioGroup>
                  </>
                )}
              </>
            )}
          </div>

          <div className={styles.scrollableContent}>
            {mainTab === 'operations' ? (
              !(localState === 'initial' || isUidInvalid) && (
                viewTab === 'select' ? renderSelectTab() : renderCreateTab()
              )
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--semi-color-text-2)' }}>Reference Content</div>
            )}
          </div>
        </Spin>
      </div>

      <div className={styles.panelFooter}>
        <div className={styles.pagination}>
          <div className={styles.icon}><IconChevronLeft /></div>
          <span>1/1</span>
          <div className={styles.icon}><IconChevronRight /></div>
        </div>
        <Button
          type="primary"
          theme="solid"
          disabled={localState === 'not-found' && viewTab === 'select'}
          onClick={handleSubmit}
          data-review-anchor="submit-button"
        >
          Submit
        </Button>
      </div>
    </div>
    </>
  );
};

export default ShowcaseModal;