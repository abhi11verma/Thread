/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        body: ['Inter', '-apple-system', 'Helvetica Neue', 'sans-serif'],
        display: ['Inter', '-apple-system', 'sans-serif'],
        sketch: ['Inter', '-apple-system', 'sans-serif'],
        hand: ['Inter', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SF Mono', 'monospace'],
      },
      colors: {
        paper: 'var(--paper)',
        'paper-2': 'var(--paper-2)',
        'paper-3': 'var(--paper-3)',
        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        'ink-soft': 'var(--ink-soft)',
        'ink-faint': 'var(--ink-faint)',
        line: 'var(--line)',
        'line-strong': 'var(--line-strong)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        warn: 'var(--warn)',
      },
    },
  },
  plugins: [],
}
