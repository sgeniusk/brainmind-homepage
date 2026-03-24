/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,md,mdx}'],
  theme: {
    extend: {
      colors: {
        brain: 'var(--brain)',
        mind: 'var(--mind)',
        alert: 'var(--alert)',
        'bg-deep': 'var(--bg-deep)',
        'bg-mid': 'var(--bg-mid)',
        'bg-card': 'var(--bg-card)',
        txt: 'var(--text)',
        'txt-dim': 'var(--text-dim)',
        'txt-muted': 'var(--text-muted)',
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
