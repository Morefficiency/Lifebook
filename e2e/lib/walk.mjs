/**
 * The shared walk: consent → vision → goals → pairs → friction → map, and then
 * optionally the whole of act two.
 *
 * Written because three separate scripts had drifted copies of the same forty
 * lines, and a change to a button label meant fixing it in three places.
 */

export const DEFAULT_VISIONS = [
  ['Health & Body', 'I train four mornings a week and it is not a negotiation.', 5],
  ['Work & Craft', 'I do work I would do anyway, and my name on it means something.', 5],
  ['Money', 'Six months of runway in the bank and I stop checking the balance.', 4],
  ['Love & Partnership', 'Two evenings a week are ours, with no laptop in the room.', 4],
  ['Mind & Learning', 'I read something hard every week and can hold my own on it.', 3],
  ['Family & Parenting', 'My kids get me, not my phone. I call my parents because I want to.', 4],
  ['Social Life', 'Four people I could call at 2am, and they would not be surprised.', 2],
];

export const DEFAULT_SCORES = {
  'Health & Body': 3, 'Work & Craft': 4, 'Money': 2, 'Love & Partnership': 8,
  'Mind & Learning': 5, 'Family & Parenting': 6, 'Social Life': 7,
};

export async function consent(page, base) {
  await page.goto(base, { waitUntil: 'networkidle' });
  if (await page.locator('#access-code').count()) await page.fill('#access-code', 'COHERENCE-V1');
  await page.locator('input[type=checkbox]').nth(0).click();
  await page.locator('input[type=checkbox]').nth(1).click();
  await page.getByRole('button', { name: /^Start with the life you want/ }).click();
  await page.waitForURL('**/vision');
}

export async function writeVisions(page, list = DEFAULT_VISIONS) {
  for (const [name, text, imp] of list) {
    const head = page.getByRole('button', { name: new RegExp('^' + name) }).first();
    if ((await head.getAttribute('aria-expanded')) !== 'true') await head.click();
    await page.locator('textarea[id^="vision-"]').first().fill(text);
    await page.locator('button[aria-pressed]').filter({ hasText: new RegExp(`^${imp}$`) }).first().click();
    await head.click();
    await page.waitForTimeout(60);
  }
}

/** Goals, the fifteen pair ratings, and every heat slider the ratings produce. */
export async function shortForm(page) {
  await page.getByRole('button', { name: 'See your vision board' }).click();
  await page.waitForURL('**/board');
  await page.getByRole('link', { name: 'Now the ten-minute part' }).click();
  await page.waitForURL('**/goals');
  await page.getByRole('heading', { name: 'What you are actually doing' }).waitFor();

  for (let i = 0; i < 3; i++) {
    await page.locator('main .flex-wrap button').nth(0).click();
    await page.waitForTimeout(80);
  }
  for (const t of ['stop letting admin pile up', 'see my parents more often', 'sleep seven hours']) {
    await page.locator('#new-goal').fill(t);
    await page.getByRole('button', { name: 'Add striving' }).click();
    await page.waitForTimeout(60);
  }

  await page.getByRole('button', { name: 'Rate how they interact' }).click();
  await page.waitForURL('**/pairs');
  await page.locator('[role=progressbar]').waitFor();
  for (const k of [1, 2, 4, 5, 3, 1, 4, 2, 5, 1, 3, 4, 2, 1, 5]) await page.keyboard.press(String(k));

  await page.waitForURL('**/friction', { timeout: 10000 });
  let heats = 0;
  while (page.url().includes('/friction') && heats < 20) {
    await page.locator('#friction').fill(String([8, 3, 10, 5, 7, 2][heats % 6]));
    const last = await page.getByRole('button', { name: 'Show me the map' }).count();
    await page.getByRole('button', { name: last ? 'Show me the map' : 'Continue' }).click();
    heats += 1;
    await page.waitForTimeout(80);
  }
  await page.waitForURL('**/mirror', { timeout: 10000 });
}

/** Current → reflect → self-image → becoming → blueprint. */
export async function actTwo(page, { visions = DEFAULT_VISIONS, scores = DEFAULT_SCORES } = {}) {
  await page.goto(page.url().replace(/#.*$/, '#/current'));
  await page.waitForURL('**/current');
  await page.getByRole('heading', { name: 'The life you have' }).waitFor();

  for (let i = 0; i < visions.length; i++) {
    const heading = await page.locator('main h2').first().innerText();
    await page.locator('#current-score').fill(String(scores[heading] ?? 4));
    await page.locator('#current-desc').fill(`Honest description of where ${heading} actually is right now.`);
    await page.getByRole('button', {
      name: i < visions.length - 1 ? 'Next area' : 'Done — what shapes this?',
    }).click();
    await page.waitForTimeout(150);
  }

  await page.waitForURL('**/reflect', { timeout: 10000 });
  let k = 0;
  while (page.url().includes('/reflect') && k < 22) {
    const multi = await page.getByText('Choose as many as are true.').count();
    const opts = page.locator('main button[aria-pressed]');
    const n = await opts.count();
    if (n > 0) await opts.nth(k % Math.max(1, n - 1)).click();
    if (multi > 0) {
      const next = page.getByRole('button', { name: /^(Next|Done)$/ });
      if (await next.count()) await next.first().click();
    }
    k += 1;
    await page.waitForTimeout(80);
  }

  await page.waitForURL('**/self-image', { timeout: 10000 });
  for (let i = 0; i < 3; i++) {
    await page.locator('button:text("Yes, that is mine")').first().click();
    await page.waitForTimeout(180);
  }
  await page.getByRole('button', { name: 'Who would I have to be instead?' }).click();
  await page.waitForURL('**/becoming');
  await page.waitForTimeout(400);

  const blanks = page.locator('textarea[id^="identity-"]');
  for (let i = 0; i < (await blanks.count()); i++) {
    const v = await blanks.nth(i).inputValue();
    if (!v.trim()) {
      await blanks.nth(i).fill('I am someone who takes the good version for himself.');
      await blanks.nth(i).blur();
    }
  }
  await page.getByRole('button', { name: 'Build the programme' }).click();
  await page.waitForURL('**/blueprint');
  await page.waitForTimeout(500);
}
