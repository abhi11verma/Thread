import { useApp } from '../store/AppContext.jsx';
import { Tag } from './atoms/Chips.jsx';
import { IconPlus } from './atoms/Icons.jsx';

export default function AllThreadsView({ onNewThread }) {
  const { threads, openThread } = useApp();

  return (
    <main style={{ flex: 1, padding: '22px 28px 40px', background: 'var(--paper)', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
        <h1 className="font-sketch" style={{ margin: 0, fontWeight: 400, fontSize: 26 }}>All threads</h1>
        <button className="btn btn-primary" onClick={onNewThread}>
          <IconPlus size={12} /> New thread
        </button>
      </div>

      {threads.length === 0 && (
        <div className="placeholder" style={{ padding: 24, textAlign: 'center' }}>
          No threads yet. Create your first one →
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        {threads.length > 0 && (
          <thead>
            <tr style={{ borderBottom: '1px solid var(--line)' }}>
              {['Title', 'Kind', 'Tags', 'Open', 'Waiting', 'Last updated'].map(h => (
                <th
                  key={h}
                  className="kicker"
                  style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 400 }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {threads.map(t => {
            const openCount = t.blocks.filter(b => b.type === 'FOLLOWUP' && (b.state === 'open' || b.state === 'waiting')).length;
            const waitCount = t.blocks.filter(b => b.type === 'FOLLOWUP' && b.state === 'waiting').length;
            const lastBlock = t.blocks[t.blocks.length - 1];
            return (
              <tr
                key={t.id}
                style={{ borderBottom: '1px dashed var(--line)', cursor: 'pointer' }}
                onClick={() => openThread(t.id)}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--paper-3)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                <td style={{ padding: '8px 8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 8, color: t.status === 'active' ? 'var(--ink)' : 'var(--ink-faint)' }}>●</span>
                    {t.title}
                  </div>
                </td>
                <td style={{ padding: '8px 8px' }} className="font-mono">{t.kind}</td>
                <td style={{ padding: '8px 8px' }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {t.tags.map(x => <Tag key={x} t={x} />)}
                  </div>
                </td>
                <td style={{ padding: '8px 8px' }} className="font-mono">{openCount || '—'}</td>
                <td style={{ padding: '8px 8px', color: 'var(--warn)' }} className="font-mono">
                  {waitCount > 0 ? waitCount : ''}
                </td>
                <td style={{ padding: '8px 8px', color: 'var(--ink-soft)' }} className="font-mono">
                  {lastBlock?.date || t.created?.slice(0, 10) || '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}
