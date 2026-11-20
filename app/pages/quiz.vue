<script setup lang="ts">
import { concepts, questionIds, questions } from '~/data/quiz-data'
import { dueQuestionIds } from '~/utils/progress'
import { buildQuiz, buildReviewQuiz, type QuizItem } from '~/utils/quiz'

const route = useRoute()
const isReview = computed(() => route.query.mode === 'revision')
const tag = computed(() => (typeof route.query.tag === 'string' ? route.query.tag : undefined))
const title = computed(() => (isReview.value ? 'Révision' : (tag.value ?? 'Quiz mélangé')))
useHead({ title: () => `${title.value} · software-quizz` })

const { answer, finishSession, current: currentProgress } = useProgress()

const items = ref<QuizItem[] | null>(null)
const results = ref<boolean[]>([])
const position = ref(0)
const currentItem = computed(() => items.value?.[position.value])

function start() {
  items.value = isReview.value
    ? buildReviewQuiz(
        questions,
        concepts,
        dueQuestionIds(currentProgress(), questionIds, new Date()),
        Math.random,
      )
    : buildQuiz(questions, concepts, { tag: tag.value }, Math.random)
  results.value = []
  position.value = 0
}

function onAnswer(item: QuizItem, isRight: boolean) {
  results.value.push(isRight)
  answer(item.id, isRight)
}

function onNext() {
  position.value++
  if (!items.value || position.value < items.value.length) return
  finishSession({
    finishedAt: new Date().toISOString(),
    label: title.value,
    score: results.value.filter(Boolean).length,
    total: items.value.length,
  })
}

// The draw happens in the browser: the pre-rendered page is the same for every visitor.
onMounted(start)
watch([tag, isReview], start)
</script>

<template>
  <p v-if="items === null" class="text-muted">Préparation du quiz…</p>

  <div v-else-if="items.length === 0" class="space-y-4">
    <h1 class="font-display text-2xl font-bold text-navy">
      {{ isReview ? 'Rien à revoir pour l’instant' : 'Aucune question pour ce thème' }}
    </h1>
    <NuxtLink to="/" class="text-accent underline underline-offset-2">Retour à l’accueil</NuxtLink>
  </div>

  <div v-else-if="currentItem" class="space-y-6">
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
      :key="currentItem.id"
      :item="currentItem"
      :is-last="position === items.length - 1"
      @answer="onAnswer(currentItem, $event)"
      @next="onNext"
    />
  </div>

  <QuizResult v-else :items="items" :results="results" @replay="start" />
</template>
