/** @type {import('tailwindcss').Config} */
export default {
  // Enables class-based dark mode
  darkMode: "class", 
  
  // Add paths to all of your files that use Tailwind classes
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  
  theme: {
    extend: {
      // Defines your color palette by referencing the CSS variables
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        chart: {
            1: 'hsl(var(--chart-1))',
            2: 'hsl(var(--chart-2))',
            3: 'hsl(var(--chart-3))',
            4: 'hsl(var(--chart-4))',
            5: 'hsl(var(--chart-5))',
        },
      },
      // Defines border radius based on your --radius variable
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: `calc(var(--radius) - 4px)`,
      },
      // Defines custom font families
      fontFamily: {
        sans: ["'Source Sans Pro'", "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },
      // Defines custom box shadows for classes like `shadow-lexiclaire`
      boxShadow: {
        'lexiclaire': '0px 4px 12px rgba(0, 0, 0, 0.05)',
        'lexiclaire-hover': '0px 12px 32px rgba(0, 0, 0, 0.12)',
      },
      // Defines custom background images for classes like `bg-grid-pattern`
      backgroundImage: {
        'grid-pattern': "radial-gradient(circle at 1px 1px, hsl(var(--primary) / 0.15) 1px, transparent 0)",
        'dots-pattern': "radial-gradient(circle at 2px 2px, hsl(var(--foreground) / 0.3) 1px, transparent 0)",
        'gradient-text': 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)',
      },
      // Defines keyframes for your custom animations
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-glow": {
            "0%, 100%": { boxShadow: "0 0 20px hsl(var(--secondary) / 0.3)" },
            "50%": { boxShadow: "0 0 30px hsl(var(--secondary) / 0.6)" },
        },
      },
      // Creates animation utilities like `animate-float`
      animation: {
        float: "float 3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
    },
  },
  
  plugins: [
    
  ],
}