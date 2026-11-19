<script setup lang="ts">
import { concepts, questions } from '~/data/quiz-data'
import { QUIZ_LENGTH, quizTags } from '~/utils/quiz'

const tags = quizTags(concepts)
</script>

<template>
  <div class="space-y-10">
    <section class="space-y-4">
      <h1 class="font-display text-3xl font-bold text-navy sm:text-4xl">
        Révise les concepts du développement logiciel
      </h1>
      <p class="text-lg text-muted">
        {{ concepts.length }} concepts et {{ questions.length }} questions sur l'architecture, le
        craft, le back et le reste. Une partie compte {{ QUIZ_LENGTH }} questions, avec la
        correction après chaque réponse.
      </p>
      <NuxtLink
        to="/quiz"
        class="inline-block rounded-lg bg-accent px-5 py-3 font-semibold text-white hover:opacity-90 dark:text-bg"
      >
        Lancer un quiz mélangé
      </NuxtLink>
    </section>

    <section class="space-y-4" aria-labelledby="themes">
      <h2 id="themes" class="font-display text-xl font-bold text-navy">Par thème</h2>
      <ul class="grid gap-3 sm:grid-cols-2">
        <li v-for="{ tag, conceptCount } in tags" :key="tag">
          <NuxtLink
            :to="{ path: '/quiz', query: { tag } }"
            class="flex items-baseline justify-between rounded-lg border border-line bg-surface px-4 py-3 hover:border-accent"
          >
            <span class="font-semibold text-navy">{{ tag }}</span>
            <span class="text-sm text-muted">
              {{ conceptCount }} concept{{ conceptCount > 1 ? 's' : '' }}
            </span>
          </NuxtLink>
        </li>
      </ul>
    </section>
  </div>
</template>
