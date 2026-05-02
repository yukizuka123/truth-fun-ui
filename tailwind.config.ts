import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Shantell Sans', 'cursive'],
        body: ['Caveat', 'cursive'],
        mono: ['Courier Prime', 'monospace'],
        ui: ['DM Sans', 'sans-serif'],
      },
      colors: {
        bg: 'var(--bg)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-card': 'var(--bg-card)',
        'bg-dark-section': 'var(--bg-dark-section)',
        ink: 'var(--ink)',
        'ink-light': 'var(--ink-light)',
        'ink-muted': 'var(--ink-muted)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        'accent-blue': 'var(--accent-blue)',
        'accent-green': 'var(--accent-green)',
        'accent-red': 'var(--accent-red)',
        'accent-yellow': 'var(--accent-yellow)',
        'accent-purple': 'var(--accent-purple)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        wobble: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-1deg)' },
          '75%': { transform: 'rotate(1deg)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scramble: {
          '0%': { content: '" "' },
          '10%': { content: '"9"' },
          '20%': { content: '"4"' },
          '30%': { content: '"7"' },
          '40%': { content: '"2"' },
          '50%': { content: '"1"' },
          '60%': { content: '"8"' },
          '70%': { content: '"5"' },
          '80%': { content: '"3"' },
          '90%': { content: '"6"' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        draw: {
          '0%': { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
        drawLine: {
          '0%': { 'stroke-dashoffset': '100' },
          '100%': { 'stroke-dashoffset': '0' },
        },
        blink: {
          '0%, 49%, 100%': { opacity: '1' },
          '50%, 99%': { opacity: '0' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-2px)' },
          '75%': { transform: 'translateX(2px)' },
        },
        tickUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(-16px)', opacity: '0' },
        },
        progressFill: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        wobble: 'wobble 0.5s ease-in-out',
        marquee: 'marquee 30s linear infinite',
        fadeInUp: 'fadeInUp 0.6s ease-out',
        pulse: 'pulse 2s ease-in-out infinite',
        draw: 'draw 2s ease-out forwards',
        blink: 'blink 1s step-end infinite',
        shake: 'shake 0.3s ease-in-out',
      },
      boxShadow: {
        'sketch': '3px 3px 0px var(--ink)',
        'sketch-lg': '6px 6px 0px var(--ink)',
      },
      zIndex: {
        '100': '100',
      },
    },
  },
  plugins: [],
}
export default config
