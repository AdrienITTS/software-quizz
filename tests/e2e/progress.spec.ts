import { expect, test, type Page } from '@playwright/test'

const STORAGE_KEY = 'software-quizz:progress'

async function playMixedQuiz(page: Page) {
  await page.goto('/quiz')
  for (let question = 1; question <= 10; question++) {
    await page.locator('article li button').first().click()
    await page
      .getByRole('button', { name: question === 10 ? 'Voir le score' : 'Question suivante' })
      .click()
  }
  await expect(page.getByRole('heading', { name: /^\d+ \/ 10$/ })).toBeVisible()
}

/** Moves every review date four days back: past the 3 days a first right answer waits. */
async function travelFourDaysLater(page: Page) {
  await page.evaluate((key) => {
    const progress = JSON.parse(localStorage.getItem(key) ?? '{}')
    for (const card of Object.values<{ due: string }>(progress.cards)) {
      card.due = new Date(Date.parse(card.due) - 4 * 24 * 60 * 60 * 1000).toISOString()
    }
    localStorage.setItem(key, JSON.stringify(progress))
  }, STORAGE_KEY)
}

test('a new visitor sees no progress', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Par thème' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Ta progression' })).toHaveCount(0)
})

test('the home page shows the progress after a quiz', async ({ page }) => {
  await playMixedQuiz(page)

  await page.goto('/')

  const panel = page.getByRole('region', { name: 'Ta progression' })
  await expect(panel.getByText(/^10 questions vues sur \d+\. Rien à revoir/)).toBeVisible()
  await expect(panel.getByRole('listitem')).toHaveCount(1)
  await expect(panel.getByRole('listitem')).toContainText('Quiz mélangé')
})

test('the questions come back for review once they are due', async ({ page }) => {
  await playMixedQuiz(page)
  await travelFourDaysLater(page)

  await page.goto('/')
  await page.getByRole('link', { name: 'Réviser' }).click()

  await expect(page).toHaveTitle('Révision · software-quizz')
  await expect(page.getByText(/^Révision · Question 1 sur 10$/)).toBeVisible()
})

test('a review with nothing due says so', async ({ page }) => {
  await page.goto('/quiz?mode=revision')

  await expect(page.getByRole('heading', { name: 'Rien à revoir pour l’instant' })).toBeVisible()
})

test('the visitor can erase the progress', async ({ page }) => {
  await playMixedQuiz(page)
  await page.goto('/')
  page.once('dialog', (dialog) => dialog.accept())

  await page.getByRole('button', { name: 'L’effacer' }).click()

  await expect(page.getByRole('heading', { name: 'Ta progression' })).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Ta progression' })).toHaveCount(0)
})

test('unreadable saved progress does not break the site', async ({ page }) => {
  await page.goto('/')
  await page.evaluate((key) => localStorage.setItem(key, '{not json'), STORAGE_KEY)

  await page.reload()
  await page.getByRole('link', { name: 'Lancer un quiz mélangé' }).click()

  await expect(page.getByText('Question 1 sur 10')).toBeVisible()
})
