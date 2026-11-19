<template>
  <div class="flex min-h-dvh flex-col">
    <header class="border-b border-line bg-surface">
      <div class="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
        <NuxtLink to="/" class="font-display text-lg font-bold text-navy">software-quizz</NuxtLink>
      </div>
    </header>

    <main class="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:py-12">
      <NuxtPage />
    </main>

    <footer class="border-t border-line">
      <p class="mx-auto max-w-2xl px-4 py-6 text-sm text-muted">
        Un projet de
        <a href="https://adrienitts.com" class="text-accent underline-offset-2 hover:underline"
          >adrienitts.com</a
        >
      </p>
    </footer>
  </div>
</template>
