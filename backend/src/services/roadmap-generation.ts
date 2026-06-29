import { prisma } from '@/lib/prisma';
import { roadmapService } from '@/services/roadmap';
import { getCareerByRole } from '@/data/careerCatalog';

type ResourceType = 'documentation' | 'video' | 'practice' | 'quiz' | 'project';

interface BlueprintStage {
  name: string;
  topics: string[];
  project: string;
  milestone: string;
}

interface RoadmapBlueprint {
  key: string;
  title: string;
  category: string;
  careerPath: string;
  description: string;
  icon: string;
  requiredSkills: string[];
  stages: BlueprintStage[];
}

interface GeneratedResource {
  title: string;
  provider: string;
  type: ResourceType;
  url: string;
  estimatedMinutes: number;
  description: string;
}

interface GeneratedDay {
  day: number;
  focus: string;
  dailyTopics: string[];
  tasks: string[];
  resources: GeneratedResource[];
  deliverable: string;
  xp: number;
  estimatedHours: number;
  completed: boolean;
}

const BLUEPRINTS: RoadmapBlueprint[] = [
  {
    key: 'frontend',
    title: 'Frontend Developer Roadmap',
    category: 'Frontend Development',
    careerPath: 'Frontend Developer',
    description: 'An adaptive path from web fundamentals to production-ready frontend engineering with portfolio projects.',
    icon: '🖥️',
    requiredSkills: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Accessibility', 'Performance', 'API Integration'],
    stages: [
      {
        name: 'Foundations',
        topics: ['HTML semantics', 'CSS basics', 'responsive layouts', 'JavaScript basics', 'Git workflow'],
        project: 'Responsive landing page',
        milestone: 'Build a polished landing page with accessible structure and responsive layout.',
      },
      {
        name: 'Core UI',
        topics: ['DOM interaction', 'forms and validation', 'TypeScript basics', 'component thinking', 'React foundations'],
        project: 'Interactive UI builder',
        milestone: 'Build a component-driven interface with stateful user interactions.',
      },
      {
        name: 'Applied Frontend',
        topics: ['API integration', 'state management', 'routing', 'testing', 'performance optimization'],
        project: 'Frontend dashboard',
        milestone: 'Ship a data-driven dashboard with API data and strong UX polish.',
      },
      {
        name: 'Portfolio Sprint',
        topics: ['design systems', 'deployment', 'accessibility audits', 'interview practice', 'portfolio storytelling'],
        project: 'Portfolio capstone',
        milestone: 'Package the learning journey into a portfolio-ready capstone and deploy it.',
      },
    ],
  },
  {
    key: 'software',
    title: 'Software Engineer Roadmap',
    category: 'Software Development',
    careerPath: 'Software Engineer',
    description: 'A progressive software engineering journey covering programming, APIs, databases, testing, and deployment.',
    icon: '⚙️',
    requiredSkills: ['Programming', 'JavaScript', 'Node.js', 'APIs', 'Databases', 'Testing', 'Deployment', 'System Design'],
    stages: [
      {
        name: 'Programming Core',
        topics: ['programming mindset', 'JavaScript fundamentals', 'functions and modules', 'data structures', 'debugging'],
        project: 'Command-line utility',
        milestone: 'Write small programs confidently and debug them without dependency on templates.',
      },
      {
        name: 'Web Foundations',
        topics: ['HTML structure', 'CSS layout', 'responsive design', 'DOM events', 'TypeScript basics'],
        project: 'Developer portfolio',
        milestone: 'Create a responsive personal portfolio that demonstrates clean structure and styling.',
      },
      {
        name: 'Backend & Data',
        topics: ['Node.js fundamentals', 'REST APIs', 'MongoDB basics', 'authentication', 'error handling'],
        project: 'REST API service',
        milestone: 'Build a secure API that serves real application data and handles common failures.',
      },
      {
        name: 'Production Readiness',
        topics: ['testing', 'deployment', 'observability', 'system design', 'interview preparation'],
        project: 'Full-stack capstone',
        milestone: 'Launch a production-style capstone and present the architecture clearly.',
      },
    ],
  },
  {
    key: 'data',
    title: 'Data Scientist Roadmap',
    category: 'Data Science',
    careerPath: 'Data Scientist',
    description: 'A practical data science roadmap that starts with Python and SQL and ends with machine learning projects.',
    icon: '📊',
    requiredSkills: ['Python', 'SQL', 'Statistics', 'Data Analysis', 'Machine Learning', 'Visualization', 'Model Evaluation', 'Communication'],
    stages: [
      {
        name: 'Data Foundations',
        topics: ['Python basics', 'SQL fundamentals', 'statistics basics', 'data cleaning', 'Jupyter notebooks'],
        project: 'Exploratory data report',
        milestone: 'Analyze a small dataset and explain the findings clearly.',
      },
      {
        name: 'Analysis Skills',
        topics: ['NumPy', 'Pandas', 'visualization', 'feature engineering', 'storytelling with data'],
        project: 'Insight dashboard',
        milestone: 'Turn raw data into visuals and structured decision-making insights.',
      },
      {
        name: 'Machine Learning',
        topics: ['regression', 'classification', 'model evaluation', 'cross-validation', 'hyperparameters'],
        project: 'Prediction model',
        milestone: 'Train and evaluate a real model with clean metrics and interpretation.',
      },
      {
        name: 'Portfolio Build',
        topics: ['capstone project', 'experimentation', 'presentation', 'GitHub portfolio', 'interview prep'],
        project: 'End-to-end ML capstone',
        milestone: 'Package the full learning journey into a portfolio-ready machine learning case study.',
      },
    ],
  },
  {
    key: 'cyber',
    title: 'Cybersecurity Engineer Roadmap',
    category: 'Cybersecurity',
    careerPath: 'Cybersecurity Engineer',
    description: 'A security-first roadmap that builds networking, Linux, web security, and defensive thinking step by step.',
    icon: '🛡️',
    requiredSkills: ['Networking', 'Linux', 'Web Security', 'OWASP', 'Scripting', 'Threat Analysis', 'Incident Response', 'Logging'],
    stages: [
      {
        name: 'Security Foundations',
        topics: ['networking basics', 'Linux commands', 'web fundamentals', 'security mindset', 'Python scripting'],
        project: 'Security notes pack',
        milestone: 'Understand the attack surface and learn the environment security engineers work in.',
      },
      {
        name: 'Web Defense',
        topics: ['OWASP top risks', 'authentication security', 'input validation', 'session handling', 'vulnerability scanning'],
        project: 'Web security checklist',
        milestone: 'Audit common web risks and explain how they are mitigated.',
      },
      {
        name: 'Defensive Operations',
        topics: ['logs and monitoring', 'incident response', 'threat modeling', 'security automation', 'hardening systems'],
        project: 'Incident response drill',
        milestone: 'Practice defensive response with a realistic security workflow.',
      },
      {
        name: 'Capstone Security',
        topics: ['security reporting', 'lab writeups', 'portfolio', 'certification prep', 'interview readiness'],
        project: 'Security audit capstone',
        milestone: 'Showcase a real defensive security report with practical recommendations.',
      },
    ],
  },
  {
    key: 'ai',
    title: 'AI Engineer Roadmap',
    category: 'Artificial Intelligence',
    careerPath: 'AI Engineer',
    description: 'A hands-on AI roadmap that moves from Python and data work to machine learning systems and deployment.',
    icon: '🤖',
    requiredSkills: ['Python', 'SQL', 'Data Prep', 'Machine Learning', 'LLM Workflows', 'Model Serving', 'Evaluation', 'Deployment'],
    stages: [
      {
        name: 'AI Foundations',
        topics: ['Python basics', 'SQL fundamentals', 'data preprocessing', 'statistics basics', 'Git workflow'],
        project: 'Data prep notebook',
        milestone: 'Prepare clean datasets and understand the pipeline from raw data to model input.',
      },
      {
        name: 'Core ML',
        topics: ['supervised learning', 'feature engineering', 'model evaluation', 'classification', 'regression'],
        project: 'ML prediction app',
        milestone: 'Train a usable model and explain the metrics that matter.',
      },
      {
        name: 'AI Systems',
        topics: ['LLM prompting', 'retrieval basics', 'APIs for AI', 'model serving', 'monitoring'],
        project: 'AI assistant service',
        milestone: 'Build a small AI-powered tool with clean prompts and observable outputs.',
      },
      {
        name: 'Capstone Delivery',
        topics: ['deployment', 'latency tradeoffs', 'evaluation', 'portfolio', 'interview preparation'],
        project: 'AI capstone project',
        milestone: 'Ship an end-to-end AI project and describe the engineering tradeoffs.',
      },
    ],
  },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeLevel(level: string) {
  const normalized = String(level || '').toLowerCase();

  if (normalized.includes('advanced') || normalized.includes('expert') || normalized.includes('senior')) {
    return 'advanced';
  }

  if (normalized.includes('intermediate') || normalized.includes('mid')) {
    return 'intermediate';
  }

  return 'beginner';
}

function resolveBlueprint(careerGoal: string): RoadmapBlueprint {
  const normalized = careerGoal.toLowerCase();

  if (/(data scientist|data science|analytics|machine learning)/.test(normalized)) return BLUEPRINTS[2];
  if (/(cyber|security|ethical hacking|pentest)/.test(normalized)) return BLUEPRINTS[3];
  if (/(ai engineer|ai|ml engineer|machine learning engineer)/.test(normalized)) return BLUEPRINTS[4];
  if (/(frontend|front-end|ui developer|ux|ui\/ux)/.test(normalized)) return BLUEPRINTS[0];
  if (/(backend|back-end|api developer|server engineer)/.test(normalized)) return BLUEPRINTS[1];
  if (/(software engineer|full stack|fullstack|developer|programmer)/.test(normalized)) return BLUEPRINTS[1];

  return BLUEPRINTS[1];
}

function getDayCount(level: string) {
  switch (normalizeLevel(level)) {
    case 'advanced':
      return 45;
    case 'intermediate':
      return 60;
    default:
      return 90;
  }
}

function allocateDays(totalDays: number, stages: number) {
  const weights = [0.25, 0.3, 0.25, 0.2].slice(0, stages);
  const raw = weights.map((weight) => Math.max(1, Math.floor(totalDays * weight)));
  let remainder = totalDays - raw.reduce((sum, value) => sum + value, 0);

  let index = 0;
  while (remainder > 0) {
    raw[index % raw.length] += 1;
    remainder -= 1;
    index += 1;
  }

  return raw;
}

function resolveTheoryUrl(topic: string, blueprintKey: string) {
  const normalized = `${topic} ${blueprintKey}`.toLowerCase();

  if (normalized.includes('html') || normalized.includes('responsive')) return 'https://www.w3schools.com/html/html_intro.asp';
  if (normalized.includes('css') || normalized.includes('layout') || normalized.includes('design')) return 'https://www.w3schools.com/css/css_intro.asp';
  if (normalized.includes('react')) return 'https://www.w3schools.com/REACT/DEFAULT.ASP';
  if (normalized.includes('typescript')) return 'https://www.w3schools.com/typescript/index.php';
  if (normalized.includes('javascript') || normalized.includes('dom') || normalized.includes('events')) return 'https://www.w3schools.com/js/js_intro.asp';
  if (normalized.includes('node') || normalized.includes('backend') || normalized.includes('api') || normalized.includes('express')) return 'https://www.w3schools.com/nodejs/nodejs_intro.asp';
  if (normalized.includes('sql') || normalized.includes('data') || normalized.includes('analytics')) return 'https://www.w3schools.com/sql/sql_intro.asp';
  if (normalized.includes('python') || normalized.includes('ml') || normalized.includes('machine learning') || normalized.includes('ai')) return 'https://www.w3schools.com/python/python_intro.asp';
  if (normalized.includes('git')) return 'https://www.w3schools.com/git/default.asp';
  if (normalized.includes('security') || normalized.includes('cyber')) return 'https://www.w3schools.com/cybersecurity/index.php';

  return 'https://www.w3schools.com/';
}

function resolveQuizUrl(topic: string, blueprintKey: string) {
  const normalized = `${topic} ${blueprintKey}`.toLowerCase();

  if (normalized.includes('python') || normalized.includes('data') || normalized.includes('analytics')) return 'https://www.w3schools.com/quiztest/quiztest.asp?qtest=PYTHON';
  if (normalized.includes('sql') || normalized.includes('database')) return 'https://www.w3schools.com/quiztest/quiztest.asp?qtest=SQL';
  if (normalized.includes('html')) return 'https://www.w3schools.com/quiztest/quiztest.asp?qtest=HTML';
  if (normalized.includes('css') || normalized.includes('layout') || normalized.includes('design')) return 'https://www.w3schools.com/quiztest/quiztest.asp?qtest=CSS';

  return 'https://www.w3schools.com/quiztest/quiztest.asp?qtest=JS';
}

function resolvePracticeUrl(topic: string, blueprintKey: string) {
  const normalized = `${topic} ${blueprintKey}`.toLowerCase();

  if (normalized.includes('data') || normalized.includes('python') || normalized.includes('ml')) return 'https://www.kaggle.com/learn';
  if (normalized.includes('security') || normalized.includes('cyber')) return 'https://tryhackme.com/';
  if (normalized.includes('ai') || normalized.includes('llm')) return 'https://colab.research.google.com/';
  return 'https://www.w3schools.com/tryit/';
}

function resolveVideoResource(topic: string, blueprint: RoadmapBlueprint, level: string) {
  const search = encodeURIComponent(`${topic} ${blueprint.title} ${level} tutorial freecodecamp traversy`);

  return {
    title: `${titleCase(topic)} for ${blueprint.title}`,
    provider: 'YouTube',
    type: 'video' as const,
    url: `https://www.youtube.com/results?search_query=${search}`,
    estimatedMinutes: normalizeLevel(level) === 'advanced' ? 60 : 45,
    description: `Trusted video walkthrough for ${topic}.`,
  };
}

function buildGeneratedDay(blueprint: RoadmapBlueprint, level: string, dayNumber: number, stage: BlueprintStage, stageDayNumber: number, stageDayCount: number): GeneratedDay {
  const topic = stage.topics[(stageDayNumber - 1) % stage.topics.length];
  const supportTopic = stage.topics[stageDayNumber % stage.topics.length] || stage.topics[0];
  const projectDay = stageDayNumber === stageDayCount || dayNumber % 7 === 0;
  const deliverable = projectDay ? stage.project : `Notes + one practical implementation for ${titleCase(topic)}`;
  const xp = projectDay ? 80 : stage.name === 'Foundations' ? 50 : 60;

  const resources: GeneratedResource[] = [
    {
      title: `${titleCase(topic)} - W3Schools`,
      provider: 'W3Schools',
      type: 'documentation' as const,
      url: resolveTheoryUrl(topic, blueprint.key),
      estimatedMinutes: 25,
      description: `Theory and reference for ${topic}.`,
    },
    resolveVideoResource(topic, blueprint, level),
    {
      title: `Practice ${titleCase(topic)}`,
      provider: blueprint.key === 'data' ? 'Kaggle' : blueprint.key === 'cyber' ? 'TryHackMe' : blueprint.key === 'ai' ? 'Google Colab' : 'W3Schools',
      type: 'practice' as const,
      url: resolvePracticeUrl(topic, blueprint.key),
      estimatedMinutes: 35,
      description: `Hands-on practice to reinforce ${topic}.`,
    },
    {
      title: `Quick quiz: ${titleCase(topic)}`,
      provider: 'W3Schools',
      type: 'quiz' as const,
      url: resolveQuizUrl(topic, blueprint.key),
      estimatedMinutes: 10,
      description: `Mini quiz to test understanding of ${topic}.`,
    },
  ];

  if (projectDay) {
    resources.push({
      title: stage.project,
      provider: 'Pragyan',
      type: 'project',
      url: `https://github.com/search?q=${encodeURIComponent(stage.project)}+project&type=repositories`,
      estimatedMinutes: 120,
      description: stage.milestone,
    });
  }

  return {
    day: dayNumber,
    focus: stage.name,
    dailyTopics: [topic, supportTopic, stage.project],
    tasks: [
      `Study ${titleCase(topic)} theory`,
      `Complete one guided practice task for ${titleCase(supportTopic)}`,
      `Answer a mini quiz on ${titleCase(topic)}`,
      ...(projectDay ? [`Build ${stage.project}`] : [`Revise yesterday's notes`]),
    ],
    resources,
    deliverable,
    xp,
    estimatedHours: projectDay ? 3 : 2,
    completed: false,
  };
}

function buildMilestones(blueprint: RoadmapBlueprint) {
  const milestones: Array<{
    week: number;
    title: string;
    description: string;
    modules: Array<{ title: string; completed?: boolean }>;
  }> = [];

  blueprint.stages.forEach((stage, index) => {
    milestones.push({
      week: index + 1,
      title: `${stage.name} Milestone`,
      description: stage.milestone,
      modules: stage.topics.slice(0, 4).map((topic) => ({ title: titleCase(topic), completed: false })),
    });
  });

  return milestones;
}

function buildProgression(blueprint: RoadmapBlueprint) {
  return blueprint.stages.map((stage, index) => ({
    stage: index === 0 ? 'beginner' : index === 1 ? 'intermediate' : index === 2 ? 'advanced' : 'expert',
    title: stage.name,
    description: stage.milestone,
  }));
}

function buildResourceRecords(roadmapId: string, roadmapCategory: string, roadmapTitle: string, level: string, days: GeneratedDay[]) {
  const records: Array<Record<string, unknown>> = [];

  days.forEach((day) => {
    day.resources.forEach((resource) => {
      const primaryTopic = day.dailyTopics[0] || day.focus;
      records.push({
        resourceKey: `${roadmapId}:${day.day}:${resource.type}:${slugify(`${primaryTopic}-${resource.title}`)}`,
        roadmapId,
        roadmapCategory,
        roadmapTitle,
        skill: primaryTopic,
        topic: primaryTopic,
        topicSlug: slugify(primaryTopic),
        dayNumber: day.day,
        resourceType: resource.type,
        difficulty: normalizeLevel(level),
        source: resource.provider === 'W3Schools' ? 'curated' : 'generated',
        title: resource.title,
        url: resource.url,
        description: resource.description,
        provider: resource.provider,
        estimatedMinutes: resource.estimatedMinutes,
        isOfficial: resource.provider === 'W3Schools',
        aiScore: resource.provider === 'W3Schools' ? 0.96 : 0.88,
        tags: [roadmapCategory, roadmapTitle, resource.type, primaryTopic],
        metadata: {
          day: day.day,
          deliverable: day.deliverable,
          estimatedHours: day.estimatedHours,
          stage: day.focus,
        },
      });
    });
  });

  return records;
}

function buildRoadmapInput(blueprint: RoadmapBlueprint, level: string, days: GeneratedDay[]) {
  return {
    title: blueprint.title,
    category: blueprint.category,
    careerPath: blueprint.careerPath,
    difficulty: normalizeLevel(level),
    description: `${blueprint.description} Personalized for ${normalizeLevel(level)} learners with day-by-day progression, projects, and W3Schools theory references.`,
    level: normalizeLevel(level),
    duration: `${days.length} Days`,
    icon: blueprint.icon,
    estimatedHours: days.length * 2,
    requiredSkills: blueprint.requiredSkills,
    learningStructure: days,
    milestones: buildMilestones(blueprint),
    progression: buildProgression(blueprint),
    tags: Array.from(new Set([blueprint.key, blueprint.category, blueprint.careerPath, normalizeLevel(level), ...blueprint.requiredSkills])),
  };
}

export class RoadmapGenerationService {
  async generatePersonalizedRoadmap(userId: string, careerGoal: string, skillLevel: string) {
    const blueprint = resolveBlueprint(careerGoal);
    const catalogEntry = getCareerByRole(careerGoal);
    const enrichedBlueprint: RoadmapBlueprint = catalogEntry
      ? {
          ...blueprint,
          title: `${catalogEntry.role} Roadmap`,
          careerPath: catalogEntry.role,
          requiredSkills: Array.from(new Set([...blueprint.requiredSkills, ...catalogEntry.requiredSkills])),
        }
      : blueprint;
    const normalizedLevel = normalizeLevel(skillLevel);
    const totalDays = getDayCount(normalizedLevel);
    const stageDayCounts = allocateDays(totalDays, enrichedBlueprint.stages.length);

    const learningDays: GeneratedDay[] = [];
    let dayNumber = 1;

    enrichedBlueprint.stages.forEach((stage, stageIndex) => {
      const stageDays = stageDayCounts[stageIndex] || 1;
      for (let stageDay = 1; stageDay <= stageDays; stageDay += 1) {
        learningDays.push(buildGeneratedDay(enrichedBlueprint, normalizedLevel, dayNumber, stage, stageDay, stageDays));
        dayNumber += 1;
      }
    });

    const roadmapInput = buildRoadmapInput(enrichedBlueprint, normalizedLevel, learningDays);
    const existingRoadmap = await prisma.roadmap.findFirst({
      where: {
        careerPath: enrichedBlueprint.careerPath,
        difficulty: normalizedLevel,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const roadmap = existingRoadmap
      ? await prisma.roadmap.update({
          where: { id: existingRoadmap.id },
          data: roadmapInput as any,
        })
      : await prisma.roadmap.create({
          data: roadmapInput as any,
        });

    const resourceRecords = buildResourceRecords(roadmap.id, roadmap.category, roadmap.title, normalizedLevel, learningDays);

    await prisma.learningResource.deleteMany({ where: { roadmapId: roadmap.id } });
    if (resourceRecords.length) {
      await prisma.learningResource.createMany({ data: resourceRecords as any });
    }

    await prisma.userRoadmap.upsert({
      where: {
        userId_roadmapId: {
          userId,
          roadmapId: roadmap.id,
        },
      },
      update: {
        started: true,
        completed: false,
      },
      create: {
        userId,
        roadmapId: roadmap.id,
        started: true,
        completed: false,
        progress: 0,
      },
    });

    return roadmapService.getRoadmapById(roadmap.id);
  }
}

export const roadmapGenerationService = new RoadmapGenerationService();