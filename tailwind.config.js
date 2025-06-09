/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#334155',
            h1: {
              color: '#1e293b',
              fontWeight: '800',
              marginBottom: '1.5rem'
            },
            h2: {
              color: '#1e293b',
              fontWeight: '700',
              marginTop: '2rem',
              marginBottom: '1rem'
            },
            h3: {
              color: '#1e293b',
              fontWeight: '600',
              marginTop: '1.5rem',
              marginBottom: '0.75rem'
            },
            'ul > li': {
              paddingLeft: '1.5rem',
              marginTop: '0.5rem',
              marginBottom: '0.5rem',
              '&::before': {
                backgroundColor: '#f97316',
                borderRadius: '50%'
              }
            },
            strong: {
              color: '#1e293b',
              fontWeight: '600'
            },
            code: {
              color: '#f97316',
              fontWeight: '500',
              backgroundColor: '#fff7ed',
              borderRadius: '0.25rem',
              padding: '0.125rem 0.25rem'
            },
            pre: {
              backgroundColor: '#1e293b',
              color: '#e2e8f0',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginTop: '1rem',
              marginBottom: '1rem',
              code: {
                backgroundColor: 'transparent',
                color: 'inherit',
                padding: '0'
              }
            }
          }
        }
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio')
  ],
};