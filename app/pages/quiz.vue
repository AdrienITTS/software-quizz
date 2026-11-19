<script setup lang="ts">
import { concepts, questions } from '~/data/quiz-data'
import { buildQuiz, type QuizItem } from '~/utils/quiz'

const route = useRoute()
const tag = computed(() => (typeof route.query.tag === 'string' ? route.query.tag : undefined))
const title = computed(() => tag.value ?? 'Quiz mélangé')
useHead({ title: () => `${title.value} · software-quizz` })

const items = ref<QuizItem[] | null>(null)
const results = ref<boolean[]>([])
const position = ref(0)
const current = computed(() => items.value?.[position.value])

function start() {
  items.value = buildQuiz(questions, concepts, { tag: tag.value }, Math.random)
  results.value = []
  position.value = 0
}

// The draw happens in the browser: the pre-rendered page is the same for every visitor.
onMounted(start)
watch(tag, start)
</script>

<template>
  <p v-if="items === null" class="text-muted">Préparation du quiz…</p>

  <div v-else-if="items.length === 0" class="space-y-4">
    <h1 class="font-display text-2xl font-bold text-navy">Aucune question pour ce thème</h1>
    <NuxtLink to="/" class="text-accent underline underline-offset-2"
      >Choisir un autre thème</NuxtLink
    >
  </div>

  <div v-else-if="current" class="space-y-6">
    <div class="space-y-2">
      <p class="text-sm text-muted">
        {{ title }} · Question {{ position + 1 }} sur {{ items.length }}
      </p>
      <div
        class="h-1.5 overflow-hidden rounded-full bg-line"
        role="progressbar"
        :aria-valuenow="position + 1"
        aria-valuemin="1"
        :aria-valuemax="items.length"
        aria-label="Progression du quiz"
      >
        <div
          class="h-full bg-accent transition-[width]"
          :style="{ width: `${((position + 1) / items.length) * 100}%` }"
        />
      </div>
    </div>

    <QuizQuestion
      :key="current.id"
      :item="current"
      :is-last="position === items.length - 1"
      @answer="results.push($event)"
      @next="position++"
    />
  </div>

  <QuizResult v-else :items="items" :results="results" @replay="start" />
</template>
