import { useEffect } from 'react';
import { useApp } from './store/AppContext.jsx';
import { IconFolder } from './components/atoms/Icons.jsx';

export default function DirectoryPicker() {
  const { pickDirectory, tryRestore, loading } = useApp();

  useEffect(() => {
    tryRestore();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 12, background: 'var(--paper)',
        }}
      >
        <div className="font-sketch" style={{ fontSize: 28 }}>Thread</div>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Loading…</div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 24,
        background: 'var(--paper)',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div className="font-sketch" style={{ fontSize: 42, letterSpacing: 0.5, marginBottom: 4 }}>Thread</div>
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: '0 0 6px' }}>
          Thread-based work management. No database — just markdown files.
        </p>
        <p style={{ fontSize: 13, color: 'var(--ink-faint)', margin: 0 }}>
          Your notes live in <span className="font-mono" style={{ fontSize: 12 }}>threads/*.md</span> in the folder you choose.
        </p>
      </div>

      <button
        className="btn btn-primary"
        style={{ padding: '10px 24px', fontSize: 15 }}
        onClick={pickDirectory}
      >
        <IconFolder size={16} /> Choose folder
      </button>

      <div style={{ fontSize: 11, color: 'var(--ink-faint)', textAlign: 'center', maxWidth: 320 }}>
        Works in Chrome and Edge. The folder permission is saved so you won't be asked again.
      </div>
    </div>
  );
}
