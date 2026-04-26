import { useApp } from '../store/AppContext.jsx';
import { FollowupLine } from './atoms/Chips.jsx';
import { isOverdue, isDueToday, isDueThisWeek } from '../lib/utils.js';

export default function FollowupsView() {
  const { getAllFollowups, updateBlock, openThread } = useApp();
  const allFU = getAllFollowups().filter(f => f.state !== 'closed');

  const overdue  = allFU.filter(f => isOverdue(f.due));
  const today    = allFU.filter(f => isDueToday(f.due) && !isOverdue(f.due));
  const thisWeek = allFU.filter(f => isDueThisWeek(f.due));
  const later    = allFU.filter(f => !isOverdue(f.due) && !isDueToday(f.due) && !isDueThisWeek(f.due));

  function toggle(fu) {
    const next = { open: 'checked', checked: 'open', waiting: 'checked', closed: 'open' }[fu.state] || 'open';
    updateBlock(fu.threadId, fu.id, { state: next });
  }

  function Section({ label, items }) {
    if (items.length === 0) return null;
    return (
      <div style={{ marginBottom: 18 }}>
        <div className="kicker" style={{ marginBottom: 4 }}>{label} · {items.length}</div>
        {items.map((fu, i) => (
          <div key={fu.id || i}>
            <FollowupLine fu={fu} compact onToggle={() => toggle(fu)} />
            <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginBottom: 2, paddingLeft: 24 }}>
              <button
                onClick={() => openThread(fu.threadId)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)', textDecoration: 'underline dotted', fontSize: 11, padding: 0 }}
              >
                {fu.threadTitle}
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <main style={{ flex: 1, padding: 'var(--content-pad-y) var(--content-pad-x) 40px', background: 'var(--paper)', overflowY: 'auto' }}>
      <h1 className="font-sketch" style={{ margin: '0 0 20px', fontWeight: 400, fontSize: 26 }}>All follow-ups</h1>
      {allFU.length === 0 && (
        <div className="placeholder" style={{ textAlign: 'center', padding: 24 }}>No open follow-ups — all clear ✓</div>
      )}
      <Section label="Overdue" items={overdue} />
      <Section label="Today" items={today} />
      <Section label="This week" items={thisWeek} />
      <Section label="Later" items={later} />
    </main>
  );
}
