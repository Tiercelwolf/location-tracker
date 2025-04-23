/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            500: 'var(--ion-color-primary)',
            600: 'var(--ion-color-primary-shade)',
            400: 'var(--ion-color-primary-tint)',
          },
          secondary: {
            500: 'var(--ion-color-secondary)',
          },
          success: {
            500: 'var(--ion-color-success)',
          },
          warning: {
            500: 'var(--ion-color-warning)',
          },
          danger: {
            500: 'var(--ion-color-danger)',
          },
        },
      },
    },
    plugins: [],
    // This is important to prevent conflicts with Ionic's CSS
    corePlugins: {
      preflight: false,
    },
  }