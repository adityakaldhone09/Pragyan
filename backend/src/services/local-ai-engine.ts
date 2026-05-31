import { careerCatalog, getCareerByRole } from '@/data/careerCatalog';

type Intent = 'mentor' | 'roadmap' | 'daily-plan' | 'quiz' | 'interview' | 'career' | 'generic';

function normalize(value: string) {
  return String(value || '').toLowerCase();
}

function extractValue(prompt: string, label: string) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = prompt.match(new RegExp(`${escaped}\\s*:\\s*(.+)`, 'i'));
  return match?.[1]?.trim() || '';
}

function extractUserMessage(prompt: string) {
  return extractValue(prompt, 'User message');
}

function inferIntent(prompt: string): Intent {
  const text = normalize(prompt);

  if (text.includes('todaygoal') || text.includes('estimatedminutes') || text.includes('daily plan')) return 'daily-plan';
  if (text.includes('questions') && text.includes('correctindex')) return 'quiz';
  if (text.includes('mock interview') || text.includes('technical questions') || text.includes('behavioral questions') || text.includes('hr questions')) return 'interview';
  if (text.includes('roadmap') && (text.includes('day-wise') || text.includes('daily tasks') || text.includes('learning sequence'))) return 'roadmap';
  if (text.includes('career') || text.includes('salary') || text.includes('skill explanation') || text.includes('growth path')) return 'career';
  if (text.includes('mentor') || text.includes('coaching') || text.includes('pragyan ai career mentor')) return 'mentor';

  return 'generic';
}

function makeMentorReply(prompt: string) {
  const message = extractUserMessage(prompt);
  const weakSkills = extractValue(prompt, 'Weak skills');
  const currentDay = extractValue(prompt, 'Current day');

  return [
    'Here is the practical next step:',
    '',
    weakSkills ? `- Focus first on: ${weakSkills}` : '- Pick one skill gap and close it today.',
    currentDay ? `- Keep the current roadmap day on track: Day ${currentDay}.` : '- Keep the current roadmap moving forward.',
    '- Build one small artifact and review it immediately.',
    '- End with a 3-question self-check before stopping.',
    '',
    `Based on your message: ${message || 'stay consistent and keep the work small and concrete.'}`,
  ].join('\n');
}

function makeCareerReply(prompt: string) {
  const role = extractValue(prompt, 'Selected Role') || extractValue(prompt, 'Target career') || extractValue(prompt, 'Career') || extractValue(prompt, 'Current top career context');
  const career = getCareerByRole(role) || careerCatalog.find((entry) => normalize(entry.role) === normalize(role || ''));

  if (!career) {
    return 'Career insight: focus on the selected role, its core skills, and one portfolio project that proves those skills in practice.';
  }

  return [
    `Role: ${career.role}`,
    `Difficulty: ${career.difficulty}`,
    `Salary range: ${career.salaryRange}`,
    '',
    'Growth path:',
    `- Strengthen: ${career.requiredSkills.slice(0, 3).join(', ')}`,
    `- Build: ${career.recommendedProjects[0] || 'one role-specific project'}`,
    `- Apply with confidence once you can explain: ${career.requiredSkills.slice(0, 4).join(', ')}`,
  ].join('\n');
}

function makeRoadmapReply(prompt: string) {
  const role = extractValue(prompt, 'Role') || extractValue(prompt, 'Target career') || extractValue(prompt, 'Roadmap title');
  const level = extractValue(prompt, 'Level') || extractValue(prompt, 'Mentor level') || 'Beginner';

  return [
    `Roadmap for ${role || 'your target role'} (${level}):`,
    '- Week 1: fundamentals and setup',
    '- Week 2: hands-on practice',
    '- Week 3: small project build',
    '- Week 4: review, quiz, and improve',
    '',
    'Daily pattern:',
    '1. Learn one concept',
    '2. Practice it once',
    '3. Review with a quiz',
    '4. Ship one small artifact',
  ].join('\n');
}

function makeInterviewReply(prompt: string) {
  const role = extractValue(prompt, 'Selected Role') || extractValue(prompt, 'Target role') || extractValue(prompt, 'Career');

  return [
    `Mock interview prep for ${role || 'the chosen role'}:`,
    '- Technical: explain the core stack and one tradeoff you made in a project.',
    '- Behavioral: describe a time you solved a difficult problem.',
    '- HR: explain why you want this role and how you handle feedback.',
    '- Practice: answer 3 questions aloud, then refine your weak spots.',
  ].join('\n');
}

function makeDailyPlanJson(prompt: string) {
  const roadmapTitle = extractValue(prompt, 'Roadmap title') || extractValue(prompt, 'Target career') || 'your roadmap';
  const currentFocus = extractValue(prompt, 'Current focus') || extractValue(prompt, 'Current topics') || roadmapTitle;
  const level = extractValue(prompt, 'Level') || 'Beginner';
  const availableTime = Number(extractValue(prompt, 'Available time in minutes')) || 120;

  return {
    todayGoal: currentFocus,
    estimatedMinutes: Math.min(availableTime, 120),
    tasks: [
      { type: 'learn', title: `Learn ${currentFocus}`, minutes: 30, details: 'Focus on the core concept and one clear example.' },
      { type: 'practice', title: `Practice ${currentFocus}`, minutes: 40, details: 'Apply the idea in a small hands-on exercise.' },
      { type: 'quiz', title: `Quiz on ${currentFocus}`, minutes: 15, details: 'Check recall before moving on.' },
      { type: 'revision', title: `Review ${roadmapTitle}`, minutes: 20, details: 'Revisit notes and tighten the weak spots.' },
    ],
    xpReward: Math.max(45, Math.min(95, Math.round(availableTime / 2))),
    level,
    rationale: 'Deterministic fallback plan generated locally because remote AI was unavailable.',
  };
}

function makeQuizJson(prompt: string) {
  const topic = extractValue(prompt, 'Current topic') || extractValue(prompt, 'Current Day') || extractValue(prompt, 'Roadmap title') || 'the current topic';

  return {
    questions: [
      {
        id: 'q1',
        question: `What is the main idea behind ${topic}?`,
        options: ['Core concept', 'Random fact', 'Bonus topic', 'Irrelevant detail'],
        correctIndex: 0,
        estimatedMinutes: 5,
        xp: 25,
      },
      {
        id: 'q2',
        question: `Which practice best improves mastery of ${topic}?`,
        options: ['Small project', 'Skipping revision', 'Avoiding practice', 'Only reading notes'],
        correctIndex: 0,
        estimatedMinutes: 5,
        xp: 25,
      },
      {
        id: 'q3',
        question: `What should you do after studying ${topic}?`,
        options: ['Revise and build something', 'Stop learning', 'Ignore weak points', 'Move randomly'],
        correctIndex: 0,
        estimatedMinutes: 5,
        xp: 25,
      },
    ],
  };
}

function makeGenericReply(prompt: string) {
  const message = extractUserMessage(prompt) || prompt.slice(0, 180);
  return [
    'Here is a practical next step:',
    '- Clarify the target role or topic.',
    '- Focus on one action you can complete today.',
    '- Review it and then move to the next small step.',
    '',
    `Context: ${message}`,
  ].join('\n');
}

export function generateLocalText(prompt: string) {
  switch (inferIntent(prompt)) {
    case 'mentor':
      return makeMentorReply(prompt);
    case 'roadmap':
      return makeRoadmapReply(prompt);
    case 'interview':
      return makeInterviewReply(prompt);
    case 'career':
      return makeCareerReply(prompt);
    default:
      return makeGenericReply(prompt);
  }
}

export function generateLocalJson(prompt: string) {
  switch (inferIntent(prompt)) {
    case 'daily-plan':
      return makeDailyPlanJson(prompt);
    case 'quiz':
      return makeQuizJson(prompt);
    case 'career':
      return {
        summary: makeCareerReply(prompt),
        insights: ['Focus on required skills', 'Build one portfolio project', 'Prepare simple interview stories'],
        skillGapAnalysis: ['Close the most important missing skill first', 'Turn weak areas into project work'],
        interviewPlan: ['Revise fundamentals', 'Practice mock questions', 'Run one timed practice session'],
      };
    case 'mentor':
      return { reply: makeMentorReply(prompt) };
    default:
      return { reply: makeGenericReply(prompt) };
  }
}