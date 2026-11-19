import {
  emptyProgress,
  parseProgress,
  recordAnswer,
  recordSession,
  type Progress,
  type QuizSession,
} from '~/utils/progress'

const STORAGE_KEY = 'software-quizz:progress'

// Shared by every page. Null until read from the browser: pre-rendered pages know nothing.
const progress = ref<Progress | null>(null)

/**
 * The visitor's progress, kept in localStorage. Storage errors (private browsing, full quota)
 * are logged and the quiz goes on with the progress in memory only.
 */
export function useProgress() {
  onMounted(current)

  return {
    // Read-only for callers: every change goes through save().
    progress: computed(() => progress.value),
    answer(questionId: string, isRight: boolean) {
      save(recordAnswer(current(), questionId, isRight, new Date()))
    },
    finishSession(session: QuizSession) {
      save(recordSession(current(), session))
    },
    reset() {
      save(emptyProgress())
    },
    current,
  }
}

function current(): Progress {
  progress.value ??= read()
  return progress.value
}

function read(): Progress {
  let raw: string | null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch (error) {
    console.warn('Progress storage is unavailable:', error)
    return emptyProgress()
  }

  const parsed = parseProgress(raw)
  if (parsed) return parsed
  console.warn('The saved progress is unreadable: starting over.')
  return emptyProgress()
}

function save(next: Progress) {
  progress.value = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch (error) {
    console.warn('Progress could not be saved:', error)
  }
}
