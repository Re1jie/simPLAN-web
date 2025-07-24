/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Daftarkan keyframes untuk animasi blink
      keyframes: {
        blink: {
          '0%, 100%': { 
            backgroundColor: 'rgba(239, 68, 68, 0.2)', // bg-red-500/20
            boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.7)' // ring-2 ring-red-500
          },
          '50%': { 
            backgroundColor: 'rgba(239, 68, 68, 0.05)', 
            boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.175)' 
          },
        }
      },
      // Daftarkan animasi baru yang menggunakan keyframes di atas
      animation: {
        blink: 'blink 1.8s infinite',
      }
    },
  },
  plugins: [],
}

