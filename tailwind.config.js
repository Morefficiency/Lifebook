/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // §15 Visual direction — observatory at night, instrument not toy.
        canvas: '#0B0E14',
        surface: '#121722',
        surface2: '#1A2130',
        bone: '#E8E3D8',
        // Muted bone kept above 4.5:1 on canvas for AA body text.
        muted: '#A8A399',
        fault: '#C43E3E',
        'fault-bright': '#E36B6B',
        facil: '#3E7C59',
        'facil-bright': '#63AE83',
        carry: '#C9A227',
        'carry-bright': '#E0BE4A',
        instrument: '#7BA3C4',
        'instrument-dim': '#40556B',
        hairline: '#2A3242',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      maxWidth: { measure: '68ch' },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'none' } },
        'pulse-soft': { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.55' } },
      },
      animation: {
        'fade-up': 'fade-up 320ms cubic-bezier(0.22,1,0.36,1) both',
        'pulse-soft': 'pulse-soft 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
