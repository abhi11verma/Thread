import { useApp } from '../store/AppContext.jsx';
import { FollowupLine } from './atoms/Chips.jsx';
import { IconChev } from './atoms/Icons.jsx';
import { dayOfWeek, isDueToday, isOverdue } from '../lib/utils.js';

export default function TodayView() {
  const { threads, getAllFollowups, openThread, updateBlock } = useApp();

  const allFU = getAllFollowups();
  const dueTodayFU = allFU.filter(f => isDueToday(f.due) || isOverdue(f.due));
  const touchedToday = threads
    .filter(t => {
      const last = t.blocks[t.blocks.length - 1]?.date;
      return last && last.slice(0, 10) === new Date().toISOString().slice(0, 10);
    })
    .slice(0, 8);

  function toggle(fu) {
    const next = { open: 'checked', checked: 'open', waiting: 'checked', closed: 'open' }[fu.state] || 'open';
    updateBlock(fu.threadId, fu.id, { state: next });
  }

  return (
    <main style={{ flex: 1, padding: 'var(--content-pad-y) var(--content-pad-x) 40px', background: 'var(--paper)', overflowY: 'auto' }}>
      <h1 className="font-sketch" style={{ margin: '0 0 20px', fontWeight: 400, fontSize: 26 }}>
        Today · {dayOfWeek()} {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </h1>

      <div className="kicker" style={{ marginBottom: 6 }}>Due today{dueTodayFU.length > 0 ? ` · ${dueTodayFU.length}` : ''}</div>
      {dueTodayFU.length === 0 && (
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 16 }}>Nothing due today — ✓</div>
      )}
      <div style={{ marginBottom: 20 }}>
        {dueTodayFU.map((fu, i) => (
          <FollowupLine key={fu.id || i} fu={fu} compact onToggle={() => toggle(fu)} />
        ))}
      </div>

      <div className="kicker" style={{ marginBottom: 6 }}>Threads touched today</div>
      {touchedToday.length === 0 && (
        <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>No threads updated today.</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {touchedToday.map(t => (
          <button
            key={t.id}
            onClick={() => openThread(t.id)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '7px 0', borderBottom: '1px dashed var(--line)',
              background: 'transparent', border: 'none', cursor: 'pointer',
              width: '100%', textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 13.5, color: 'var(--ink)' }}>{t.title}</span>
            <IconChev size={12} />
          </button>
        ))}
      </div>
    </main>
  );
}
