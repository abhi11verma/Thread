# Thread

A local-first, file-based personal knowledge and relationship manager. Thread helps you track conversations, follow-ups, people, and daily notes — all stored as plain Markdown files on your own machine. No cloud, no accounts, no sync lock-in.

---

## Features

- **Threads** — Create and manage topic threads backed by Markdown files in a directory you choose.
- **Today view** — See everything due or active for the current day at a glance.
- **Follow-ups** — Track pending action items and outstanding replies across all threads.
- **People** — Maintain a lightweight CRM: link threads to people and surface relationship context.
- **Scratch** — A free-form scratchpad for quick notes that don't belong anywhere yet.
- **Archive** — Move finished threads out of your active view without deleting them.
- **Global search** — Fuzzy-search across all threads and notes instantly (`⌘K`).
- **Keyboard-first** — Press `N` to create a new thread, `Escape` to dismiss any modal.
- **Themes** — Four built-in themes: Warm (default), Light, Cool, and Dark.
- **Local filesystem** — Uses the browser File System Access API; your data stays on disk in plain `.md` files you can edit anywhere.

---

## Tech Stack

| Layer | Library |
|---|---|
| UI framework | React 18 |
| Build tool | Vite 6 |
| Styling | Tailwind CSS 3 |
| Component primitives | Radix UI |
| Icons | Lucide React |
| Command palette | cmdk |
| Markdown parsing | gray-matter |
| Date utilities | date-fns |
| ID generation | nanoid (local util) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A modern Chromium-based browser (Chrome, Edge, Arc) for File System Access API support

### Install & run

```bash
git clone git@github.com:abhi11verma/Thread.git
cd Thread
npm install
npm run dev
```

Open `http://localhost:5173` and pick a local folder to use as your Thread workspace. All data is written to that folder as Markdown files.

### Build for production

```bash
npm run build
npm run preview
```

---

## Project Structure

```
src/
  components/       # Feature views and modals
  store/            # App-wide state (Context + atoms)
  lib/              # File system, Markdown, and utility helpers
  App.jsx           # Root shell with routing logic
  main.jsx          # React entry point
index.html
vite.config.js
tailwind.config.js
```

---

## Contributors

| Name | GitHub |
|---|---|
| Abhishek Verma | [@abhi11verma](https://github.com/abhi11verma) |

---

## License

MIT
