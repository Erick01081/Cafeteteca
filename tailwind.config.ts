import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        parchment: '#F4EEDF',
        surface: '#FFFCF5',
        ink: '#2B2118',
        inkmuted: '#6B5D4F',
        line: '#DDD2BA',
        roast: {
          50: '#F6ECE4',
          100: '#EAD5C4',
          300: '#C6905F',
          500: '#8A4B2E',
          600: '#733C23',
          700: '#582D1A'
        },
        cherry: {
          400: '#6E7F53',
          500: '#5B6B42',
          600: '#485535'
        },
        clay: '#B24C2A',
        danger: '#A3402D'
      },
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        body: ['"Work Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '14px'
      }
    }
  },
  plugins: []
};
export default config;
