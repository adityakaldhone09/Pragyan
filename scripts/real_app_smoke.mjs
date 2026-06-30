import { chromium } from 'playwright-core';

const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const stamp = Date.now();
const email = `real-smoke-${stamp}@example.com`;
const password = 'Password123!';
const projectTitle = `Context Beacon Project ${stamp}`;
const certificateTitle = `Context Beacon Certificate ${stamp}`;

const results = [];

function record(name, ok, details = '') {
  results.push({ name, ok, details });
  const status = ok ? 'PASS' : 'FAIL';
  console.log(`${status} ${name}${details ? ` - ${details}` : ''}`);
}

function expect(name, condition, details = '') {
  record(name, Boolean(condition), details);
  if (!condition) {
    throw new Error(`${name} failed${details ? `: ${details}` : ''}`);
  }
}

async function browserApi(page, path, options = {}) {
  return page.evaluate(async ({ path, options }) => {
    const session = JSON.parse(localStorage.getItem('pragyan_auth_session') || 'null');
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
    };
    const response = await fetch(`/api${path}`, {
      method: options.method || 'GET',
      credentials: 'include',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const text = await response.text();
    let parsed;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = { raw: text };
    }
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}: ${text}`);
    }
    return parsed && typeof parsed === 'object' && 'data' in parsed ? parsed.data : parsed;
  }, { path, options });
}

async function sendChat(page, message, context = {}) {
  return browserApi(page, '/ai/chat', {
    method: 'POST',
    body: { message, history: [], context },
  });
}

async function run() {
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
  });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  page.setDefaultTimeout(45_000);

  try {
    await page.goto(`${appUrl}/auth?mode=signup`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Sign up' }).click();
    await page.locator('input[name="fullName"]').fill('Real Smoke Tester');
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.getByRole('button', { name: /Create account/ }).click();
    await page.waitForURL('**/dashboard', { timeout: 60_000 });
    const session = await page.evaluate(() => JSON.parse(localStorage.getItem('pragyan_auth_session') || 'null'));
    expect('Real login/signup page auth', session?.user?.email === email && Boolean(session?.accessToken), email);

    await page.goto(`${appUrl}/ai-counselor`, { waitUntil: 'networkidle' });
    await page.getByTestId('input-chat').fill('/roadmap help me continue my current roadmap');
    await page.getByTestId('button-send').click();
    await page.waitForSelector('[data-testid="message-2"]', { timeout: 60_000 });
    const slashText = await page.locator('[data-testid="message-1"], [data-testid="message-2"]').allTextContents();
    expect('Slash commands work', slashText.join(' ').toLowerCase().includes('/roadmap'), slashText.join(' ').slice(0, 160));

    const actionButton = page.getByRole('button', { name: /Continue your roadmap|Action/i }).first();
    await actionButton.waitFor({ timeout: 30_000 });
    await actionButton.click();
    await page.waitForURL('**/roadmap', { timeout: 30_000 });
    record('AI Action Cards work', page.url().includes('/roadmap'), page.url());

    await page.goto(`${appUrl}/ai-counselor`, { waitUntil: 'networkidle' });
    await page.getByTestId('input-chat').fill('/teach JavaScript closures with definition, syntax, code example, common mistake, and practice task');
    await page.getByTestId('button-send').click();
    const noteButton = page.locator('[data-testid^="button-download-notes-"]').first();
    await noteButton.waitFor({ timeout: 60_000 });
    const noteButtonTestId = await noteButton.getAttribute('data-testid');
    const noteIndex = noteButtonTestId?.split('-').at(-1) || '2';
    await noteButton.click();
    const downloadPromise = page.waitForEvent('download', { timeout: 60_000 });
    await page.getByTestId(`download-notes-text-${noteIndex}`).click();
    const download = await downloadPromise;
    record('Download Notes still works', Boolean(download.suggestedFilename()), download.suggestedFilename());

    const questions = await browserApi(page, '/assessment/questions');
    const answers = {};
    for (const question of questions.slice(0, 8)) {
      const id = question.id || question.questionText || question.question;
      answers[id] = question.options?.[0] || 'Hands-on projects';
    }
    await browserApi(page, '/assessment/submit-legacy', { method: 'POST', body: { answers } });
    const aiMemory = await browserApi(page, '/ai/memory');
    const recommendationHistory = await browserApi(page, '/ai/memory/recommendations');
    expect(
      'Assessment updates AI memory',
      Boolean(aiMemory?.profileData) && recommendationHistory.some((item) => item.source === 'assessment'),
      `history=${recommendationHistory.length}`
    );

    await browserApi(page, '/assessment/hybrid/parse-resume', {
      method: 'POST',
      body: {
        resumeText: 'Real Smoke Tester. Education: B.Tech Computer Science. Experience: frontend internship. Skills: React, TypeScript, Node.js, MongoDB, AI mentoring systems.',
      },
    });
    const memoryAfterResume = await browserApi(page, '/ai/memory');
    expect('Resume upload updates AI context', memoryAfterResume?.profileData?.resume?.hasResume, JSON.stringify(memoryAfterResume?.profileData?.resume || {}));

    const roadmaps = await browserApi(page, '/roadmaps?limit=1');
    const roadmap = Array.isArray(roadmaps) ? roadmaps[0] : roadmaps?.data?.[0];
    expect('Roadmap catalog available', Boolean(roadmap?.id), roadmap?.title || '');
    await browserApi(page, '/roadmaps/progress', {
      method: 'POST',
      body: {
        roadmapId: roadmap.id,
        completedTasks: ['smoke-task-1'],
        completedDays: ['smoke-day-1'],
        progressPercentage: 100,
        currentDay: 1,
      },
    });
    const roadmapAdvice = await sendChat(page, 'What should I do after completing my roadmap? Mention my current progress percentage.', { roadmapTitle: roadmap.title });
    expect('Roadmap completion updates recommendations', /100/.test(roadmapAdvice.reply || ''), (roadmapAdvice.reply || '').slice(0, 220));

    await browserApi(page, '/profile/builder/projects', {
      method: 'POST',
      body: {
        title: projectTitle,
        description: 'A smoke-test project proving immediate AI context invalidation.',
        techStack: ['React', 'TypeScript'],
        highlights: ['Context update verification'],
        featured: true,
      },
    });
    const projectAdvice = await sendChat(page, 'Which project should I highlight in my AI advice? Mention the exact project name.');
    expect('Project creation appears in AI advice', (projectAdvice.reply || '').includes(projectTitle), (projectAdvice.reply || '').slice(0, 260));

    await browserApi(page, '/profile/builder/certifications', {
      method: 'POST',
      body: {
        title: certificateTitle,
        issuer: 'Pragyan Smoke Institute',
        credentialId: `CERT-${stamp}`,
        description: 'Smoke credential for AI context verification.',
      },
    });
    const certAdvice = await sendChat(page, 'Which certificate should I include in my AI advice? Mention the exact certificate name.');
    expect('Certificate creation appears in AI advice', (certAdvice.reply || '').includes(certificateTitle), (certAdvice.reply || '').slice(0, 260));

    const immediateAdvice = await sendChat(page, 'List my latest project and certificate from context exactly.');
    expect(
      'Cache invalidation works immediately after updates',
      (immediateAdvice.reply || '').includes(projectTitle) && (immediateAdvice.reply || '').includes(certificateTitle),
      (immediateAdvice.reply || '').slice(0, 320)
    );
  } finally {
    await browser.close();
  }

  console.log('\nSMOKE_RESULTS_JSON=' + JSON.stringify(results));
}

run().catch((error) => {
  console.error(error);
  console.log('\nSMOKE_RESULTS_JSON=' + JSON.stringify(results));
  process.exit(1);
});
