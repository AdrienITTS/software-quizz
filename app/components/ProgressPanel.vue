<script setup lang="ts">
import { questionIds } from '~/data/quiz-data'
import { progressStats } from '~/utils/progress'

const { progress, reset } = useProgress()

const stats = computed(() =>
  progress.value ? progressStats(progress.value, questionIds, new Date()) : undefined,
)

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })

function confirmReset() {
  if (window.confirm('Effacer ta progression ? Elle n’est enregistrée que dans ce navigateur.')) {
    reset()
  }
}
</script>

<template>
  <section
    v-if="progress && stats && stats.seen > 0"
    class="space-y-5 rounded-lg border border-line bg-surface p-5"
    aria-labelledby="progress"
  >
    <div class="space-y-1">
      <h2 id="progress" class="font-display text-xl font-bold text-navy">Ta progression</h2>
      <p class="text-muted">
        {{ stats.seen }} questions vues sur {{ stats.total }}.
        {{
          stats.due === 0 ? 'Rien à revoir pour l’instant.' : `${stats.due} à revoir aujourd’hui.`
        }}
      </p>
    </div>

    <NuxtLink
      v-if="stats.due > 0"
      :to="{ path: '/quiz', query: { mode: 'revision' } }"
      class="inline-block rounded-lg bg-accent px-5 py-2.5 font-semibold text-white hover:opacity-90 dark:text-bg"
    >
      Réviser
    </NuxtLink>

    <div v-if="progress.sessions.length > 0" class="space-y-2">
      <h3 class="text-sm font-semibold text-navy">Dernières parties</h3>
      <ul class="divide-y divide-line text-sm">
        <li
          v-for="session in progress.sessions"
          :key="session.finishedAt"
          class="flex flex-wrap items-baseline justify-between gap-x-4 py-2"
        >
          <span class="text-ink">{{ session.label }}</span>
          <span class="text-muted">
            {{ dateFormat.format(new Date(session.finishedAt)) }} ·
            <span class="font-semibold text-navy"
              >{{ session.score }}&nbsp;/&nbsp;{{ session.total }}</span
            >
          </span>
        </li>
      </ul>
    </div>

    <p class="text-xs text-muted">
      Ta progression reste dans ce navigateur.
      <button type="button" class="text-accent underline underline-offset-2" @click="confirmReset">
        L’effacer
      </button>
    </p>
  </section>
</template>
