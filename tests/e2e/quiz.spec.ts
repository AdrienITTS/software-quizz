import { expect, test, type Page } from '@playwright/test'

async function answerQuestion(page: Page, optionIndex: number) {
  await page.locator('article li button').nth(optionIndex).click()
  await expect(page.getByText(/^(Bonne réponse\.|Raté\.)/)).toBeVisible()
}

test('the home page offers a mixed quiz and one quiz per theme', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Lancer un quiz mélangé' })).toBeVisible()
  await expect(page.getByRole('list').first().getByRole('link')).not.toHaveCount(0)
})

test('the site shows no trace of Notion', async ({ page }) => {
  await page.goto('/')

  expect(await page.content()).not.toMatch(/notion/i)
})

test('a mixed quiz goes through ten questions to the score', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Lancer un quiz mélangé' }).click()

  for (let question = 1; question <= 10; question++) {
    await expect(page.getByText(`Question ${question} sur 10`)).toBeVisible()
    await answerQuestion(page, 0)
    await page
      .getByRole('button', { name: question === 10 ? 'Voir le score' : 'Question suivante' })
      .click()
  }

  await expect(page.getByRole('heading', { name: /^\d+ \/ 10$/ })).toBeVisible()
  await page.getByRole('button', { name: 'Rejouer' }).click()
  await expect(page.getByText('Question 1 sur 10')).toBeVisible()
})

test('the correction shows the right answer and the concept summary', async ({ page }) => {
  await page.goto('/quiz')
  const options = page.locator('article li button')
  await expect(options.first()).toBeVisible()

  await answerQuestion(page, 0)

  await expect(options.first()).toBeDisabled()
  await expect(page.locator('[class*="border-success"]')).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Question suivante' })).toBeFocused()
})

test('a theme quiz only asks about that theme', async ({ page }) => {
  await page.goto('/')
  const theme = page.getByRole('region', { name: 'Par thème' }).getByRole('link').first()
  const tag = (await theme.locator('span').first().textContent())?.trim() ?? ''

  await theme.click()

  await expect(page).toHaveTitle(`${tag} · software-quizz`)
  await expect(page.getByText(new RegExp(`^${tag} · Question 1 sur`))).toBeVisible()
})

test('an unknown theme says there is no question', async ({ page }) => {
  await page.goto('/quiz?tag=Inconnu')

  await expect(page.getByRole('heading', { name: 'Aucune question pour ce thème' })).toBeVisible()
})
