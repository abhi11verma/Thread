// Date + misc utilities

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function relativeTime(iso) {
  if (!iso) return '';
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 2)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'yesterday';
  if (days < 7)  return `${days}d ago`;
  return formatDate(iso);
}

export function dueLabel(due) {
  if (!due) return '';
  const t = today();
  if (due === t || due === 'today') return 'today';
  const d  = new Date(due);
  const now = new Date(t);
  const diff = Math.round((d - now) / 86400000);
  if (diff < 0)  return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff < 7)  return `in ${diff}d`;
  return formatDate(due);
}

export function isOverdue(due) {
  if (!due || due === 'today') return false;
  return new Date(due) < new Date(today());
}

export function isDueToday(due) {
  return due === today() || due === 'today';
}

export function isDueThisWeek(due) {
  if (!due || due === 'today') return false;
  const d = new Date(due);
  const now = new Date(today());
  const diff = Math.round((d - now) / 86400000);
  return diff > 0 && diff <= 7;
}

export function dayOfWeek() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
}

export function weekNumber() {
  const d = new Date();
  const firstDay = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - firstDay) / 86400000) + firstDay.getDay() + 1) / 7);
}

export function classNames(...args) {
  return args.filter(Boolean).join(' ');
}
