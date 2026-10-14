/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#0a0d14',
          card: '#111726',
          panel: '#161f36',
          border: '#233052',
          neonCyan: '#00f0ff',
          neonPink: '#ff007f',
          neonPurple: '#a855f7',
          neonAmber: '#ffaa00',
          neonGreen: '#00ff88',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Orbitron', 'Rajdhani', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-short': 'bounce 0.6s ease infinite',
        'clash-left': 'clashLeft 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'clash-right': 'clashRight 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        clashLeft: {
          '0%': { transform: 'translateX(-80px) scale(0.8)', opacity: '0.2' },
          '70%': { transform: 'translateX(15px) scale(1.15)', opacity: '1' },
          '100%': { transform: 'translateX(0) scale(1)', opacity: '1' },
        },
        clashRight: {
          '0%': { transform: 'translateX(80px) scale(0.8)', opacity: '0.2' },
          '70%': { transform: 'translateX(-15px) scale(1.15)', opacity: '1' },
          '100%': { transform: 'translateX(0) scale(1)', opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { filter: 'drop-shadow(0 0 15px rgba(0, 240, 255, 0.4))' },
          '50%': { filter: 'drop-shadow(0 0 30px rgba(0, 240, 255, 0.85))' },
        },
      },
    },
  },
  plugins: [],
};
