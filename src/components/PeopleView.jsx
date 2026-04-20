import { useApp } from '../store/AppContext.jsx';
import { Person } from './atoms/Chips.jsx';

export default function PeopleView() {
  const { getPeopleIndex, openThread } = useApp();
  const people = getPeopleIndex();

  return (
    <main style={{ flex: 1, padding: '22px 28px 40px', background: 'var(--paper)', overflowY: 'auto' }}>
      <h1 className="font-sketch" style={{ margin: '0 0 16px', fontWeight: 400, fontSize: 26 }}>
        People — what I owe / am owed
      </h1>

      {people.length === 0 && (
        <div className="placeholder" style={{ textAlign: 'center', padding: 24 }}>
          No people yet. Add @person mentions in follow-up blocks.
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        {people.length > 0 && (
          <thead>
            <tr style={{ borderBottom: '1px solid var(--line)' }}>
              {['Person', 'I owe them', 'They owe me', 'Last touched', 'Threads'].map(h => (
                <th key={h} className="kicker" style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 400 }}>{h}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {people.map(p => (
            <tr key={p.name} style={{ borderBottom: '1px dashed var(--line)' }}>
              <td style={{ padding: '8px 8px' }}><Person name={p.name} /></td>
              <td style={{ padding: '8px 8px' }} className="font-mono">
                {p.owe > 0
                  ? <span style={{ color: 'var(--ink)' }}>{p.owe} open →</span>
                  : <span style={{ color: 'var(--ink-faint)' }}>·</span>
                }
              </td>
              <td style={{ padding: '8px 8px' }} className="font-mono">
                {p.theyOwe > 0
                  ? <span style={{ color: 'var(--warn)' }}>{p.theyOwe} waiting ←</span>
                  : <span style={{ color: 'var(--ink-faint)' }}>·</span>
                }
              </td>
              <td style={{ padding: '8px 8px', color: 'var(--ink-soft)' }} className="font-mono">
                {p.lastTouched || '—'}
              </td>
              <td style={{ padding: '8px 8px', color: 'var(--ink-soft)', fontSize: 11 }}>
                {p.threads.join(', ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
