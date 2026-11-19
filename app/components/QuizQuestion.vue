<script setup lang="ts">
import type { QuizItem } from '~/utils/quiz'

const props = defineProps<{ item: QuizItem; isLast: boolean }>()
const emit = defineEmits<{ answer: [isRight: boolean]; next: [] }>()

const selected = ref<number | null>(null)
const isRight = computed(() => selected.value === props.item.answerIndex)
const heading = useTemplateRef('heading')
const nextButton = useTemplateRef('nextButton')

// Keyboard and screen reader users land on the new question, then on the way forward.
onMounted(() => heading.value?.focus())

async function choose(index: number) {
  selected.value = index
  emit('answer', index === props.item.answerIndex)
  await nextTick()
  nextButton.value?.focus()
}

function optionClass(index: number): string {
  if (selected.value === null) return 'border-line bg-surface hover:border-accent'
  if (index === props.item.answerIndex) return 'border-success bg-success-tint'
  if (index === selected.value) return 'border-error bg-error-tint'
  return 'border-line bg-surface opacity-60'
}
</script>

<template>
  <article class="space-y-6">
    <div class="space-y-4">
      <h1
        ref="heading"
        tabindex="-1"
        class="font-display text-2xl font-bold text-navy focus:outline-none"
      >
        {{ item.prompt }}
      </h1>
      <blockquote v-if="item.quote" class="rounded-r-lg border-l-4 border-accent bg-tint px-4 py-3">
        {{ item.quote }}
      </blockquote>
    </div>

    <ul class="space-y-3">
      <li v-for="(option, index) in item.options" :key="option">
        <button
          type="button"
          class="flex w-full items-start justify-between gap-3 rounded-lg border-2 px-4 py-3 text-left break-words"
          :class="optionClass(index)"
          :disabled="selected !== null"
          @click="choose(index)"
        >
          <span>{{ option }}</span>
          <!-- A mark next to the color, for people who can't tell green from red. -->
          <span v-if="selected !== null && index === item.answerIndex" class="text-success">
            <span aria-hidden="true">✓</span><span class="sr-only">bonne réponse</span>
          </span>
          <span v-else-if="index === selected" class="text-error">
            <span aria-hidden="true">✗</span><span class="sr-only">ta réponse</span>
          </span>
        </button>
      </li>
    </ul>

    <div aria-live="polite">
      <div v-if="selected !== null" class="space-y-4 rounded-lg border border-line bg-surface p-4">
        <p class="font-semibold" :class="isRight ? 'text-success' : 'text-error'">
          {{ isRight ? 'Bonne réponse.' : 'Raté.' }}
          <span v-if="!isRight" class="sr-only">
            La bonne réponse : {{ item.options[item.answerIndex] }}
          </span>
        </p>
        <p class="text-sm">
          <span class="font-semibold text-navy">{{ item.concept.name }}</span>
          <span class="text-muted">&nbsp;: {{ item.concept.summary }}</span>
        </p>
        <button
          ref="nextButton"
          type="button"
          class="rounded-lg bg-accent px-5 py-2.5 font-semibold text-white hover:opacity-90 dark:text-bg"
          @click="emit('next')"
        >
          {{ isLast ? 'Voir le score' : 'Question suivante' }}
        </button>
      </div>
    </div>
  </article>
</template>
