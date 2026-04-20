import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './store/AppContext.jsx';
import DirectoryPicker from './DirectoryPicker.jsx';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './components/Dashboard.jsx';
import ThreadView from './components/ThreadView.jsx';
import AllThreadsView from './components/AllThreadsView.jsx';
import TodayView from './components/TodayView.jsx';
import FollowupsView from './components/FollowupsView.jsx';
import PeopleView from './components/PeopleView.jsx';
import NewThreadModal from './components/NewThreadModal.jsx';
import AddRitualModal from './components/AddRitualModal.jsx';
import SearchModal from './components/SearchModal.jsx';
import ScratchView from './components/ScratchView.jsx';
import ArchiveView from './components/ArchiveView.jsx';

function AppShell() {
  const { dirHandle, section, loading } = useApp();

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('thread-theme');
    if (saved && ['warm', 'light', 'cool', 'dark'].includes(saved)) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'warm';
  });
  const [showNewThread, setShowNewThread] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [showAddRitual, setShowAddRitual] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove('dark', 'light', 'cool');
    if (theme !== 'warm') document.documentElement.classList.add(theme);
    localStorage.setItem('thread-theme', theme);
  }, [theme]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowSearch(s => !s);
        return;
      }
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'n' || e.key === 'N') { setNewThreadTitle(''); setShowNewThread(true); }
      if (e.key === 'Escape') { setShowNewThread(false); setShowAddRitual(false); setShowSearch(false); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function openNewThread(prefill = '') {
    setNewThreadTitle(prefill);
    setShowNewThread(true);
  }

  if (!dirHandle) return <DirectoryPicker />;

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--paper)',
        color: 'var(--ink)',
      }}
    >
      <Sidebar
        theme={theme}
        setTheme={setTheme}
        onNewThread={() => openNewThread()}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {section === 'dashboard' && <Dashboard onNewThread={title => openNewThread(title)} onSearch={() => setShowSearch(true)} />}
        {section === 'thread'    && <ThreadView />}
        {section === 'today'     && <TodayView />}
        {section === 'threads'   && <AllThreadsView onNewThread={() => openNewThread()} />}
        {section === 'fu'        && <FollowupsView />}
        {section === 'people'    && <PeopleView />}
        {section === 'scratch'   && <ScratchView />}
        {section === 'cal'       && <StubView label="Calendar" note="Coming soon — shows threads and follow-ups by due date." />}
        {section === 'arch'      && <ArchiveView />}
      </div>

      {showNewThread && <NewThreadModal initialTitle={newThreadTitle} onClose={() => setShowNewThread(false)} />}
      {showAddRitual && <AddRitualModal onClose={() => setShowAddRitual(false)} />}
      {showSearch && <SearchModal onClose={() => setShowSearch(false)} onNewThread={title => openNewThread(title)} />}
    </div>
  );
}

function StubView({ label, note }) {
  return (
    <main style={{ flex: 1, padding: '40px 28px', background: 'var(--paper)', overflowY: 'auto' }}>
      <h1 className="font-sketch" style={{ margin: '0 0 10px', fontWeight: 400, fontSize: 26 }}>{label}</h1>
      <div className="placeholder">{note}</div>
    </main>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
