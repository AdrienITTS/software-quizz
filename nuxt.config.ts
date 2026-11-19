export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  devtools: { enabled: true },

  modules: ['@nuxt/eslint'],

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: 'software-quizz',
    },
  },

  eslint: {
    config: { stylistic: false },
  },

  typescript: {
    strict: true,
    nodeTsConfig: {
      include: ['../scripts/**/*', '../tests/**/*'],
      // Node runs the scripts by stripping types, which only supports erasable syntax.
      compilerOptions: { erasableSyntaxOnly: true },
    },
  },
})
