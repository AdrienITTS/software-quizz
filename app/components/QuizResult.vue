<script setup lang="ts">
import type { Concept } from '#shared/concept.type'
import type { QuizItem } from '~/utils/quiz'

const props = defineProps<{ items: QuizItem[]; results: boolean[] }>()
const emit = defineEmits<{ replay: [] }>()

const score = computed(() => props.results.filter(Boolean).length)
const missedConcepts = computed(() => {
  const missed = new Map<string, Concept>()
  props.items.forEach((item, index) => {
    if (!props.results[index]) missed.set(item.concept.slug, item.concept)
  })
  return [...missed.values()]
})

const heading = useTemplateRef('heading')
onMounted(() => heading.value?.focus())
</script>

<template>
  <section class="space-y-8">
    <div class="space-y-2">
      <h1
        ref="heading"
        tabindex="-1"
        class="font-display text-3xl font-bold text-navy focus:outline-none"
      >
        {{ score }} / {{ items.length }}
      </h1>
      <p class="text-muted">
        {{
          missedConcepts.length === 0 ? 'Sans faute.' : 'Les fiches à revoir sont juste en dessous.'
        }}
      </p>
    </div>

    <ul v-if="missedConcepts.length > 0" class="space-y-3" aria-label="Fiches à revoir">
      <li
        v-for="concept in missedConcepts"
        :key="concept.slug"
        class="rounded-lg border border-line bg-surface p-4"
      >
        <p class="font-semibold text-navy">{{ concept.name }}</p>
        <p class="text-sm text-muted">{{ concept.summary }}</p>
      </li>
    </ul>

    <div class="flex flex-wrap gap-3">
      <button type="button" class="btn-primary" @click="emit('replay')">Rejouer</button>
      <NuxtLink
        to="/"
        class="rounded-lg border border-line bg-surface px-5 py-2.5 font-semibold text-navy hover:border-accent"
      >
        Changer de thème
      </NuxtLink>
    </div>
  </section>
</template>
