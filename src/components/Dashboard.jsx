import { useApp } from '../store/AppContext.jsx';
import { Card, CardHead, DueSection, DashFU, Decision } from './atoms/Card.jsx';
import { IconSearch, IconChev } from './atoms/Icons.jsx';
import { dayOfWeek, weekNumber, isOverdue, isDueToday, isDueThisWeek, relativeTime } from '../lib/utils.js';

export default function Dashboard({ onNewThread, onSearch }) {
  const { threads, updateBlock, getAllFollowups, getAllDecisions, getAllQuestions } = useApp();

  const allFU = getAllFollowups();
  const overdueFU = allFU.filter(f => f.state !== 'closed' && isOverdue(f.due));
  const todayFU   = allFU.filter(f => isDueToday(f.due) && !isOverdue(f.due));
  const weekFU    = allFU.filter(f => isDueThisWeek(f.due));
  const laterFU   = allFU.filter(f => !isOverdue(f.due) && !isDueToday(f.due) && !isDueThisWeek(f.due));
  const waitingFU = allFU.filter(f => f.state === 'waiting');

  const allDecisions = getAllDecisions();
  const allQuestions = getAllQuestions();

  const driftingThreads = threads
    .filter(t => {
      if (t.blocks.length === 0) return false;
      const last = t.blocks[t.blocks.length - 1].date;
      if (!last) return false;
      const diff = (Date.now() - new Date(last)) / 86400000;
      return diff >= 5;
    })
    .slice(0, 4);

  const openLoops = allFU.length;
  const threadCount = threads.length;

  function handleCheck(fu) {
    const next = fu.state === 'open' ? 'checked' : fu.state === 'checked' ? 'open' : fu.state;
    updateBlock(fu.threadId, fu.id, { state: next });
  }

  return (
    <main
      style={{
        flex: 1, minWidth: 0, overflowY: 'auto',
        padding: '28px 36px 48px',
        background: 'var(--paper)',
      }}
    >
      {/* ── Header ── */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div className="kicker" style={{ marginBottom: 4 }}>
            {dayOfWeek()} · week {weekNumber()}
          </div>
          <button
            className="btn btn-ghost"
            style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={onSearch}
            title="Search (⌘K)"
          >
            <IconSearch size={15} />
            <span className="font-mono" style={{ fontSize: 11, color: 'var(--ink-soft)' }}>⌘K</span>
          </button>
        </div>
        <h1 className="font-sketch" style={{ margin: '0', fontWeight: 400, fontSize: 28, letterSpacing: 0.3 }}>
          On you right now{' '}
          <span className="font-hand" style={{ color: 'var(--ink-soft)', fontSize: 24 }}>
            — {openLoops} open loops across {threadCount} threads.
          </span>
        </h1>
      </div>

      {/* ── Two-column body ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 20 }}>

        {/* LEFT — Due card */}
        <Card>
          <CardHead
            title="Due"
            kicker="everything on me, by when"
            right={
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn btn-soft" style={{ padding: '2px 8px', fontSize: 11 }}>all</button>
              </div>
            }
          />

          {overdueFU.length > 0 && (
            <DueSection label="Overdue" tone="warn" count={overdueFU.length}>
              {overdueFU.map(fu => (
                <DashFU
                  key={fu.id} fu={fu} thread={fu.threadTitle}
                  stale onOpen={() => openThread(fu.threadId)}
                  onCheck={() => handleCheck(fu)}
                />
              ))}
            </DueSection>
          )}

          {todayFU.length > 0 && (
            <DueSection label="Today" count={todayFU.length}>
              {todayFU.map(fu => (
                <DashFU key={fu.id} fu={fu} thread={fu.threadTitle} onOpen={() => openThread(fu.threadId)} onCheck={() => handleCheck(fu)} />
              ))}
            </DueSection>
          )}

          {weekFU.length > 0 && (
            <DueSection label="This week" count={weekFU.length}>
              {weekFU.map(fu => (
                <DashFU key={fu.id} fu={fu} thread={fu.threadTitle} onOpen={() => openThread(fu.threadId)} onCheck={() => handleCheck(fu)} />
              ))}
            </DueSection>
          )}

          {laterFU.length > 0 && (
            <DueSection label="Later" count={laterFU.length} last>
              {laterFU.map(fu => (
                <DashFU key={fu.id} fu={fu} thread={fu.threadTitle} onOpen={() => openThread(fu.threadId)} onCheck={() => handleCheck(fu)} />
              ))}
            </DueSection>
          )}

          {allFU.length === 0 && (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--ink-soft)', fontSize: 13 }}>
              No open follow-ups — all clear ✓
            </div>
          )}
        </Card>

        {/* RIGHT — Waiting + Reminders + Decisions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {waitingFU.length > 0 && (
            <Card>
              <CardHead title="Waiting on others" kicker="ask again?" />
              {waitingFU.map(fu => (
                <DashFU
                  key={fu.id} fu={fu} thread={fu.threadTitle}
                  stale={false}
                  onOpen={() => openThread(fu.threadId)}
                  onCheck={() => handleCheck(fu)}
                />
              ))}
            </Card>
          )}

          <Card>
            <CardHead title="Reminders" kicker="drifting threads · open questions" />

            {driftingThreads.length > 0 && (
              <>
                <div className="kicker" style={{ marginBottom: 4 }}>No touch in 5+ days</div>
                <div style={{ marginBottom: 12 }}>
                  {driftingThreads.map(t => {
                    const last = t.blocks[t.blocks.length - 1]?.date;
                    return (
                      <button
                        key={t.id}
                        onClick={() => openThread(t.id)}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          background: 'transparent', border: 'none',
                          padding: '6px 0', borderBottom: '1px dashed var(--line)',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 13.5 }}>{t.title}</span>
                          <IconChev size={12} />
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2 }}>
                          {last ? relativeTime(last) : 'no updates'} · {t.status}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {allQuestions.length > 0 && (
              <>
                <div className="kicker" style={{ marginBottom: 4 }}>Open questions</div>
                {allQuestions.slice(0, 4).map((q, i) => (
                  <div
                    key={q.id}
                    style={{
                      padding: '6px 0',
                      borderBottom: i < allQuestions.length - 1 ? '1px dashed var(--line)' : 'none',
                    }}
                  >
                    <div style={{ fontSize: 13.5, fontStyle: 'italic', color: 'var(--ink-2)' }}>
                      "{q.text}"
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2 }}>
                      {q.threadTitle}
                    </div>
                  </div>
                ))}
              </>
            )}

            {driftingThreads.length === 0 && allQuestions.length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--ink-soft)', padding: '8px 0' }}>Nothing needs attention right now.</div>
            )}
          </Card>

          {allDecisions.length > 0 && (
            <Card>
              <CardHead title="Recently landed" kicker="decisions shipped" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {allDecisions.slice(0, 5).map(d => (
                  <Decision
                    key={d.id}
                    text={d.text}
                    thread={d.threadTitle}
                    when={d.date}
                    onOpen={() => openThread(d.threadId)}
                  />
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 22, fontSize: 12, color: 'var(--ink-soft)' }}>
        <span className="font-mono">generated from</span>
        <span
          className="font-mono"
          style={{ fontSize: 11, padding: '2px 6px', border: '1px dashed var(--line-strong)', borderRadius: 4 }}
        >
          threads/*.md
        </span>
        <span>· no db · edit any block and this dashboard updates</span>
      </div>
    </main>
  );
}
