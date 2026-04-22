import { useState, useEffect, useRef } from 'react';
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
import RitualsView from './components/RitualsView.jsx';
import { applyTheme, findTheme, getActiveThemeKey } from './lib/theme.js';

function AppShell() {
  const { dirHandle, section, loading } = useApp();

  const [themeKey, setThemeKey] = useState(() => {
    const saved = getActiveThemeKey();
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'warm';
  });
  const [showNewThread, setShowNewThread] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [showAddRitual, setShowAddRitual] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('thread-sidebar-width');
    return saved ? parseInt(saved, 10) : 272;
  });
  const sidebarWidthRef = useRef(sidebarWidth);

  useEffect(() => {
    const theme = findTheme(themeKey) ?? findTheme('warm');
    applyTheme(theme);
    localStorage.setItem('thread-theme', themeKey);
  }, [themeKey]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowSearch(s => !s);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'n' || e.key === 'N')) { e.preventDefault(); setNewThreadTitle(''); setShowNewThread(true); return; }
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Escape') { setShowNewThread(false); setShowAddRitual(false); setShowSearch(false); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function openNewThread(prefill = '') {
    setNewThreadTitle(prefill);
    setShowNewThread(true);
  }

  function startSidebarDrag(e) {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidthRef.current;
    function onMove(e) {
      const next = Math.min(480, Math.max(180, startWidth + (e.clientX - startX)));
      sidebarWidthRef.current = next;
      setSidebarWidth(next);
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      localStorage.setItem('thread-sidebar-width', sidebarWidthRef.current.toString());
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
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
        themeKey={themeKey}
        setThemeKey={setThemeKey}
        onNewThread={() => openNewThread()}
        onAddRitual={() => setShowAddRitual(true)}
        width={sidebarWidth}
      />

      <div
        onMouseDown={startSidebarDrag}
        style={{
          width: 4,
          cursor: 'col-resize',
          flexShrink: 0,
          background: 'transparent',
          transition: 'background 0.15s',
          zIndex: 10,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.opacity = '0.35'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.opacity = '1'; }}
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
        {section === 'rituals'   && <RitualsView />}
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
