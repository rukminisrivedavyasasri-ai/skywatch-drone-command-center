/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        command: {
          bg: "#0B1220",
          panel: "#111A2E",
          panelHover: "#16223B",
          card: "rgba(17, 26, 46, 0.75)",
          border: "rgba(255, 255, 255, 0.08)",
          borderGlow: "rgba(34, 211, 238, 0.3)",
        },
        tactical: {
          cyan: "#22D3EE",
          violet: "#8B5CF6",
          emerald: "#22C55E",
          amber: "#F59E0B",
          rose: "#EF4444",
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radarSweep 4s linear infinite',
      },
      keyframes: {
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      }
    },
  },
  plugins: [],
}
