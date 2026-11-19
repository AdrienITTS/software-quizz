import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  devtools: { enabled: true },

  modules: ['@nuxt/eslint'],

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: 'software-quizz',
      meta: [
        {
          name: 'description',
          content: 'Quiz de révision sur des concepts de développement logiciel.',
        },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        {
          rel: 'preload',
          as: 'font',
          type: 'font/woff2',
          href: '/fonts/inter-400.woff2',
          crossorigin: '',
        },
      ],
    },
  },

  nitro: {
    prerender: { routes: ['/', '/quiz'] },
  },

  eslint: {
    config: { stylistic: false },
  },

  typescript: {
    strict: true,
    nodeTsConfig: {
      include: ['../scripts/**/*', '../tests/**/*'],
      compilerOptions: {
        // Node runs the scripts by stripping types, which only supports erasable syntax.
        erasableSyntaxOnly: true,
        // Unit tests import app code, which reaches shared/ through this Nuxt alias.
        paths: { '#shared/*': ['../shared/*'] },
      },
    },
  },
})
