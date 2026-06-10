import { prisma } from '@/lib/prisma';
import { aiProvider } from '@/services/aiProvider';

const RESOURCE_TYPES = ['youtube', 'documentation', 'practice', 'article', 'mini-project', 'certification'] as const;
const DIFFICULTY_ORDER = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
const TOPIC_TEMPLATES = [
  'foundations',
  'setup and tooling',
  'core concepts',
  'syntax and structure',
  'data flow',
  'state management',
  'debugging',
  'testing',
  'performance',
  'accessibility',
  'security',
  'deployment',
  'automation',
  'project architecture',
  'component design',
  'api integration',
  'observability',
  'collaboration',
  'portfolio projects',
  'interview readiness',
  'advanced patterns',
  'optimization',
  'production workflows',
  'capstone build',
];

type RoadmapLike = {
  id: string;
  title: string;
  category: string;
  difficulty?: string | null;
  level?: string | null;
  description: string;
  requiredSkills?: string[];
  tags?: string[];
  learningStructure?: unknown;
};

type GeneratedResource = {
  resourceKey: string;
  roadmapId?: string;
  roadmapCategory: string;
  roadmapTitle?: string;
  skill: string;
  topic: string;
  topicSlug: string;
  dayNumber?: number;
  resourceType: string;
  difficulty: string;
  title: string;
  url: string;
  description: string;
  provider: string;
  estimatedMinutes: number;
  isOfficial: boolean;
  aiScore: number;
  source: string;
  tags: string[];
  metadata?: Record<string, unknown>;
};

type PersonalizationProfile = {
  careerGoal: string;
  completedTopics: string[];
  weakSkills: string[];
  assessmentWeaknesses: string[];
  assessmentStrengths: string[];
  skillSignal: string[];
};

type ResourceBlueprint = {
  title: string;
  description: string;
  url: string;
  provider: string;
  estimatedMinutes: number;
  isOfficial: boolean;
};

const CURATED_RESOURCE_LIBRARY: Record<string, Partial<Record<typeof RESOURCE_TYPES[number], ResourceBlueprint>>> = {
  javascript: {
    youtube: {
      title: 'JavaScript in 100 Seconds',
      description: 'A concise visual overview of core JavaScript concepts.',
      url: 'https://www.youtube.com/results?search_query=javascript+fundamentals+official',
      provider: 'YouTube',
      estimatedMinutes: 25,
      isOfficial: false,
    },
    documentation: {
      title: 'MDN JavaScript Guide',
      description: 'Official JavaScript reference and learning guide.',
      url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
      provider: 'MDN',
      estimatedMinutes: 20,
      isOfficial: true,
    },
    practice: {
      title: 'freeCodeCamp JavaScript Challenges',
      description: 'Practice JavaScript with guided exercises and projects.',
      url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/',
      provider: 'freeCodeCamp',
      estimatedMinutes: 45,
      isOfficial: false,
    },
    article: {
      title: 'JavaScript Roadmap Article',
      description: 'A practical article on building strong JavaScript foundations.',
      url: 'https://javascript.info/',
      provider: 'Article',
      estimatedMinutes: 20,
      isOfficial: false,
    },
    'mini-project': {
      title: 'Build a Vanilla JS Todo App',
      description: 'Hands-on mini project to reinforce DOM and state handling.',
      url: 'https://github.com/search?q=vanilla+javascript+todo+app&type=repositories',
      provider: 'Project Brief',
      estimatedMinutes: 90,
      isOfficial: false,
    },
    certification: {
      title: 'JavaScript Certification Search',
      description: 'Certification pathways for validating JavaScript fluency.',
      url: 'https://www.coursera.org/search?query=javascript%20certification',
      provider: 'Certification',
      estimatedMinutes: 120,
      isOfficial: false,
    },
  },
  react: {
    youtube: {
      title: 'React Official Learn Videos',
      description: 'Practical React walkthroughs and component patterns.',
      url: 'https://www.youtube.com/results?search_query=react+official+learn',
      provider: 'YouTube',
      estimatedMinutes: 30,
      isOfficial: false,
    },
    documentation: {
      title: 'React Documentation',
      description: 'The official React learning docs.',
      url: 'https://react.dev/learn',
      provider: 'React Docs',
      estimatedMinutes: 20,
      isOfficial: true,
    },
    practice: {
      title: 'Frontend Mentor React Projects',
      description: 'Practice by building frontend components and pages.',
      url: 'https://www.frontendmentor.io/',
      provider: 'Frontend Mentor',
      estimatedMinutes: 45,
      isOfficial: false,
    },
    article: {
      title: 'React Patterns Article',
      description: 'Concise article for component composition and hooks.',
      url: 'https://react.dev/learn/thinking-in-react',
      provider: 'Article',
      estimatedMinutes: 25,
      isOfficial: true,
    },
    'mini-project': {
      title: 'Build a React Dashboard',
      description: 'Mini project to practice state, props, and UI composition.',
      url: 'https://github.com/search?q=react+dashboard+mini+project&type=repositories',
      provider: 'Project Brief',
      estimatedMinutes: 90,
      isOfficial: false,
    },
    certification: {
      title: 'React Certification Search',
      description: 'Certification pathways covering modern React skills.',
      url: 'https://www.coursera.org/search?query=react%20certification',
      provider: 'Certification',
      estimatedMinutes: 120,
      isOfficial: false,
    },
  },
  typescript: {
    documentation: {
      title: 'TypeScript Handbook',
      description: 'Official handbook for TypeScript types and tooling.',
      url: 'https://www.typescriptlang.org/docs/handbook/intro.html',
      provider: 'TypeScript Docs',
      estimatedMinutes: 20,
      isOfficial: true,
    },
    practice: {
      title: 'TypeScript Exercises',
      description: 'Practice types, interfaces, and generics.',
      url: 'https://www.typescriptlang.org/play',
      provider: 'TypeScript Playground',
      estimatedMinutes: 40,
      isOfficial: true,
    },
    youtube: {
      title: 'TypeScript Crash Course',
      description: 'A quick-start video for TypeScript fundamentals.',
      url: 'https://www.youtube.com/results?search_query=typescript+crash+course',
      provider: 'YouTube',
      estimatedMinutes: 30,
      isOfficial: false,
    },
    article: {
      title: 'TypeScript Deep Dive',
      description: 'A learning article for TypeScript patterns.',
      url: 'https://basarat.gitbook.io/typescript/',
      provider: 'Article',
      estimatedMinutes: 30,
      isOfficial: false,
    },
    'mini-project': {
      title: 'Build a Typed Todo App',
      description: 'Mini project to reinforce strong typing in real apps.',
      url: 'https://github.com/search?q=typescript+todo+app&type=repositories',
      provider: 'Project Brief',
      estimatedMinutes: 90,
      isOfficial: false,
    },
    certification: {
      title: 'TypeScript Certification Search',
      description: 'Certification pathways for TypeScript readiness.',
      url: 'https://www.coursera.org/search?query=typescript%20certification',
      provider: 'Certification',
      estimatedMinutes: 120,
      isOfficial: false,
    },
  },
  mongodb: {
    documentation: {
      title: 'MongoDB Manual',
      description: 'Official MongoDB documentation and examples.',
      url: 'https://www.mongodb.com/docs/manual/',
      provider: 'MongoDB Docs',
      estimatedMinutes: 20,
      isOfficial: true,
    },
    practice: {
      title: 'MongoDB University Practice',
      description: 'Hands-on database exercises and labs.',
      url: 'https://learn.mongodb.com/',
      provider: 'MongoDB University',
      estimatedMinutes: 45,
      isOfficial: true,
    },
  },
  testing: {
    documentation: {
      title: 'Testing Library Docs',
      description: 'Official docs for testing user-facing UI flows.',
      url: 'https://testing-library.com/docs/',
      provider: 'Testing Library',
      estimatedMinutes: 20,
      isOfficial: true,
    },
    practice: {
      title: 'Testing Practice Lab',
      description: 'Practice unit and integration testing exercises.',
      url: 'https://www.freecodecamp.org/learn/quality-assurance/',
      provider: 'freeCodeCamp',
      estimatedMinutes: 40,
      isOfficial: false,
    },
  },
  accessibility: {
    documentation: {
      title: 'MDN Accessibility Guide',
      description: 'Official accessibility documentation and patterns.',
      url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility',
      provider: 'MDN',
      estimatedMinutes: 20,
      isOfficial: true,
    },
  },
  cloud: {
    certification: {
      title: 'Cloud Certification Paths',
      description: 'Structured certification options for cloud skills.',
      url: 'https://cloud.google.com/learn/certification',
      provider: 'Certification',
      estimatedMinutes: 120,
      isOfficial: true,
    },
  },
};

export interface LearningResourceFilters {
  roadmapId?: string;
  category?: string;
  skill?: string;
  topic?: string;
  type?: string;
  difficulty?: string;
  dayNumber?: number;
  query?: string;
  page?: number;
  limit?: number;
}

export interface LearningResourceHistoryInput {
  resourceId: string;
  roadmapId?: string;
  completed?: boolean;
  progressPercent?: number;
  notes?: string;
  source?: string;
}

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

function normalizeDifficulty(value?: string | null) {
  const normalized = String(value || '').toLowerCase();
  return DIFFICULTY_ORDER.includes(normalized as (typeof DIFFICULTY_ORDER)[number]) ? normalized : 'beginner';
}

function resolveDifficultyBand(roadmap: RoadmapLike) {
  return normalizeDifficulty(roadmap.difficulty || roadmap.level);
}

function getSkills(roadmap: RoadmapLike) {
  const skills = [roadmap.category, ...(roadmap.requiredSkills || []), ...(roadmap.tags || [])]
    .map((item) => String(item || '').trim())
    .filter(Boolean);

  return Array.from(new Set(skills));
}

function getLearningStructure(roadmap: RoadmapLike) {
  if (!Array.isArray(roadmap.learningStructure)) {
    return [] as Array<{ day?: number; focus?: string; tasks?: string[]; deliverable?: string }>;
  }

  return roadmap.learningStructure as Array<{ day?: number; focus?: string; tasks?: string[]; deliverable?: string }>;
}

function buildTopicPlan(roadmap: RoadmapLike) {
  const skills = getSkills(roadmap);
  const learningStructure = getLearningStructure(roadmap);
  const dayCount = Math.max(learningStructure.length || 0, 5);
  const focusWords = learningStructure.map((item) => item.focus).filter(Boolean).map(String);
  const baseSeeds = Array.from(
    new Set([
      roadmap.title,
      roadmap.category,
      ...skills,
      ...focusWords,
      ...TOPIC_TEMPLATES.map((template) => `${roadmap.category} ${template}`),
    ])
  );

  return baseSeeds.slice(0, 25).map((topic, index) => ({
    topic: titleCase(topic),
    topicSlug: slugify(topic),
    skill: skills[index % Math.max(skills.length, 1)] || roadmap.category,
    dayNumber: (index % dayCount) + 1,
  }));
}

function buildUrl(type: typeof RESOURCE_TYPES[number], topic: string, roadmapTitle: string, skill: string) {
  const query = encodeURIComponent(`${topic} ${roadmapTitle} ${skill}`.trim());

  switch (type) {
    case 'youtube':
      return `https://www.youtube.com/results?search_query=${query}`;
    case 'documentation':
      return resolveDocumentationUrl(topic, skill, roadmapTitle);
    case 'practice':
      return resolvePracticeUrl(topic, skill);
    case 'article':
      return `https://dev.to/search?q=${query}`;
    case 'mini-project':
      return `https://github.com/search?q=${query}+mini+project&type=repositories`;
    case 'certification':
      return resolveCertificationUrl(topic, skill);
    default:
      return `https://www.google.com/search?q=${query}`;
  }
}

function resolveDocumentationUrl(topic: string, skill: string, roadmapTitle: string) {
  const normalized = `${topic} ${skill} ${roadmapTitle}`.toLowerCase();

  if (normalized.includes('react')) return 'https://react.dev/learn';
  if (normalized.includes('typescript')) return 'https://www.typescriptlang.org/docs/';
  if (normalized.includes('javascript')) return 'https://developer.mozilla.org/en-US/docs/Web/JavaScript';
  if (normalized.includes('html') || normalized.includes('css') || normalized.includes('accessibility')) {
    return 'https://developer.mozilla.org/en-US/';
  }
  if (normalized.includes('node') || normalized.includes('express')) return 'https://nodejs.org/en/docs';
  if (normalized.includes('mongodb')) return 'https://www.mongodb.com/docs/';
  if (normalized.includes('prisma')) return 'https://www.prisma.io/docs';
  if (normalized.includes('testing')) return 'https://testing-library.com/docs/';
  return `https://www.google.com/search?q=site%3Aofficial+docs+${encodeURIComponent(topic)}`;
}

function resolvePracticeUrl(topic: string, skill: string) {
  const normalized = `${topic} ${skill}`.toLowerCase();

  if (normalized.includes('frontend') || normalized.includes('react') || normalized.includes('css')) {
    return 'https://www.frontendmentor.io/';
  }
  if (normalized.includes('testing')) return 'https://www.chaijs.com/';
  if (normalized.includes('javascript') || normalized.includes('typescript') || normalized.includes('node')) {
    return 'https://www.freecodecamp.org/';
  }
  if (normalized.includes('algorithms') || normalized.includes('data structure')) return 'https://leetcode.com/';
  return `https://www.google.com/search?q=${encodeURIComponent(topic)}+practice+site`;
}

function resolveCertificationUrl(topic: string, skill: string) {
  const normalized = `${topic} ${skill}`.toLowerCase();

  if (normalized.includes('cloud') || normalized.includes('aws')) return 'https://aws.amazon.com/certification/';
  if (normalized.includes('azure')) return 'https://learn.microsoft.com/credentials/certifications/';
  if (normalized.includes('google cloud') || normalized.includes('gcp')) return 'https://cloud.google.com/learn/certification';
  if (normalized.includes('security')) return 'https://www.isc2.org/certifications';
  if (normalized.includes('data')) return 'https://www.datacamp.com/certification';
  return `https://www.coursera.org/search?query=${encodeURIComponent(topic)}+certification`;
}

function buildResourceTitle(type: typeof RESOURCE_TYPES[number], topic: string) {
  const prefixes: Record<typeof RESOURCE_TYPES[number], string> = {
    youtube: 'Watch',
    documentation: 'Read',
    practice: 'Practice',
    article: 'Explore',
    'mini-project': 'Build',
    certification: 'Certify',
  };

  return `${prefixes[type]} ${topic}`;
}

function estimateMinutes(type: typeof RESOURCE_TYPES[number], difficulty: string) {
  const base = {
    youtube: 30,
    documentation: 20,
    practice: 40,
    article: 25,
    'mini-project': 90,
    certification: 120,
  }[type];

  const difficultyMultiplier = {
    beginner: 0.9,
    intermediate: 1,
    advanced: 1.15,
    expert: 1.3,
  }[difficulty as keyof Record<string, number>] || 1;

  return Math.round(base * difficultyMultiplier);
}

function buildResourceDescription(type: typeof RESOURCE_TYPES[number], topic: string, roadmapTitle: string) {
  switch (type) {
    case 'youtube':
      return `A focused video walkthrough for ${topic} inside ${roadmapTitle}.`;
    case 'documentation':
      return `Official documentation path to learn ${topic} with the current roadmap context.`;
    case 'practice':
      return `Hands-on exercises for practicing ${topic} before moving to the next milestone.`;
    case 'article':
      return `A concise article shortlist to reinforce ${topic} from another angle.`;
    case 'mini-project':
      return `Build a mini project around ${topic} to apply the roadmap concepts.`;
    case 'certification':
      return `A certification track that validates your progress for ${topic}.`;
    default:
      return `Learning resource for ${topic}.`;
  }
}

function normalizeForLibrary(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function findCuratedBlueprint(skill: string, topic: string, type: typeof RESOURCE_TYPES[number]) {
  const normalizedSkill = normalizeForLibrary(skill);
  const normalizedTopic = normalizeForLibrary(topic);

  const candidateKeys = [
    normalizedSkill,
    normalizedTopic,
    ...normalizedSkill.split(' '),
    ...normalizedTopic.split(' '),
  ].filter(Boolean);

  for (const key of candidateKeys) {
    const entry = CURATED_RESOURCE_LIBRARY[key];
    if (entry?.[type]) {
      return entry[type] as ResourceBlueprint;
    }
  }

  return null;
}

function buildCuratedResource(
  roadmap: RoadmapLike,
  topicNode: { topic: string; topicSlug: string; skill: string; dayNumber: number },
  resourceType: typeof RESOURCE_TYPES[number],
  resourceIndex: number
) {
  const curated = findCuratedBlueprint(topicNode.skill, topicNode.topic, resourceType);
  if (!curated) {
    return null;
  }

  const difficulty = resolveDifficultyBand(roadmap);
  const scoreBoost = Math.max(0, 96 - resourceIndex * 3);

  return {
    resourceKey: `${roadmap.id}:${topicNode.topicSlug}:${resourceType}`,
    roadmapId: roadmap.id,
    roadmapCategory: roadmap.category,
    roadmapTitle: roadmap.title,
    skill: topicNode.skill,
    topic: topicNode.topic,
    topicSlug: topicNode.topicSlug,
    dayNumber: topicNode.dayNumber,
    resourceType,
    difficulty,
    title: curated.title,
    url: curated.url,
    description: curated.description,
    provider: curated.provider,
    estimatedMinutes: curated.estimatedMinutes,
    isOfficial: curated.isOfficial,
    aiScore: scoreBoost,
    source: 'curated',
    tags: Array.from(new Set([roadmap.category, topicNode.skill, topicNode.topicSlug, resourceType, 'curated'].filter(Boolean))),
    metadata: {
      source: 'curated',
      roadmapDifficulty: difficulty,
    },
  } satisfies GeneratedResource;
}

function buildResourceCandidates(roadmap: RoadmapLike) {
  const difficulty = resolveDifficultyBand(roadmap);
  const topicPlan = buildTopicPlan(roadmap);
  const roadmapTitle = roadmap.title;
  const roadmapSkills = getSkills(roadmap);

  return topicPlan.flatMap((topicNode, index) => {
    return RESOURCE_TYPES.map((resourceType, resourceIndex) => {
      const scoreBoost = Math.max(0, 100 - index * 2 - resourceIndex * 3);
      const skill = topicNode.skill || roadmap.category;
      const topic = topicNode.topic;
      const curated = buildCuratedResource(roadmap, topicNode, resourceType, resourceIndex);
      if (curated) {
        return curated;
      }

      const provider = resourceType === 'youtube'
        ? 'YouTube'
        : resourceType === 'documentation'
          ? 'Official Docs'
          : resourceType === 'practice'
            ? 'Practice Site'
            : resourceType === 'article'
              ? 'Article'
              : resourceType === 'mini-project'
                ? 'Project Brief'
                : 'Certification';

      return {
        resourceKey: `${roadmap.id}:${topicNode.topicSlug}:${resourceType}`,
        roadmapId: roadmap.id,
        roadmapCategory: roadmap.category,
        roadmapTitle,
        skill,
        topic,
        topicSlug: topicNode.topicSlug,
        dayNumber: topicNode.dayNumber,
        resourceType,
        difficulty,
        title: buildResourceTitle(resourceType, topic),
        url: buildUrl(resourceType, topic, roadmapTitle, skill),
        description: buildResourceDescription(resourceType, topic, roadmapTitle),
        provider,
        estimatedMinutes: estimateMinutes(resourceType, difficulty),
        isOfficial: resourceType === 'documentation' || resourceType === 'certification',
        aiScore: scoreBoost,
        source: 'ai-generated',
        tags: Array.from(new Set([roadmap.category, ...roadmapSkills, topicNode.topicSlug, resourceType].filter(Boolean))),
        metadata: {
          source: 'ai-generated',
          roadmapDifficulty: difficulty,
        },
      } satisfies GeneratedResource;
    });
  });
}

async function getPersonalizationProfile(userId?: string, roadmapId?: string): Promise<PersonalizationProfile> {
  if (!userId) {
    return {
      careerGoal: '',
      completedTopics: [],
      weakSkills: [],
      assessmentWeaknesses: [],
      assessmentStrengths: [],
      skillSignal: [],
    };
  }

  const [user, history, latestAssessment] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { interests: true, preferences: true, skills: true, experience: true, experienceType: true, education: true },
    }),
    prisma.resourceLearningHistory.findMany({
      where: { userId, ...(roadmapId ? { roadmapId } : {}) },
      include: { resource: true },
    }),
    prisma.assessmentResult.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const completedTopics = history.filter((entry) => entry.completed).map((entry) => entry.resource.topic);
  const weakSkills = Array.from(new Set([
    ...(user?.preferences || []),
    ...(user?.interests || []),
    ...(latestAssessment?.weaknesses || []),
  ].map((item) => String(item).trim()).filter(Boolean)));

  const assessmentStrengths = Array.isArray(latestAssessment?.strengths) ? latestAssessment.strengths : [];
  const assessmentWeaknesses = Array.isArray(latestAssessment?.weaknesses) ? latestAssessment.weaknesses : [];
  const skillSignal = Array.from(new Set([
    ...(user?.skills || []),
    ...(user?.interests || []),
    ...(latestAssessment?.suggestedCareers || []),
  ].map((item) => String(item).trim()).filter(Boolean)));
  const careerGoal = latestAssessment?.suggestedCareers?.[0] || user?.experience || user?.experienceType || user?.education || '';

  return {
    careerGoal: String(careerGoal || ''),
    completedTopics,
    weakSkills,
    assessmentWeaknesses,
    assessmentStrengths,
    skillSignal,
  };
}

function rankByPersonalization(
  resources: Array<{ id: string; title: string; topic: string; resourceType: string; difficulty: string; provider: string; url: string; aiScore: number; tags: string[]; dayNumber?: number | null }>,
  profile: PersonalizationProfile
) {
  const completedTopicSet = new Set(profile.completedTopics.map((item) => item.toLowerCase()));
  const weakSkillSet = new Set([...profile.weakSkills, ...profile.assessmentWeaknesses].map((item) => item.toLowerCase()));
  const goalTokens = profile.careerGoal.toLowerCase().split(/\s+/).filter(Boolean);

  return resources
    .map((resource, index) => {
      const resourceTokens = [resource.title, resource.topic, resource.provider, ...(resource.tags || [])]
        .join(' ')
        .toLowerCase();

      let score = resource.aiScore || Math.max(0, 100 - index * 2);
      if (completedTopicSet.has(resource.topic.toLowerCase())) score -= 25;
      if (goalTokens.some((token) => resourceTokens.includes(token))) score += 12;
      if ([...weakSkillSet].some((token) => resourceTokens.includes(token))) score += 15;
      if (profile.assessmentStrengths.some((token) => resourceTokens.includes(String(token).toLowerCase()))) score -= 6;
      if (resource.resourceType === 'documentation' || resource.resourceType === 'practice') score += 8;
      if (resource.resourceType === 'mini-project') score += 10;

      return {
        ...resource,
        dayNumber: resource.dayNumber,
        aiScore: score,
        aiReason: completedTopicSet.has(resource.topic.toLowerCase())
          ? 'Already completed, deprioritized'
          : weakSkillSet.size && [...weakSkillSet].some((token) => resourceTokens.includes(token))
            ? 'Targets a weak skill or assessment gap'
            : goalTokens.some((token) => resourceTokens.includes(token))
              ? 'Matches career goal signals'
              : 'General progression fit',
      };
    })
    .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
}

async function ensureRoadmapResources(roadmap: RoadmapLike) {
  const cached = await prisma.learningResource.findMany({
    where: { roadmapId: roadmap.id },
    orderBy: [{ aiScore: 'desc' }, { updatedAt: 'desc' }],
  });

  if (cached.length) {
    return cached;
  }

  const candidates = buildResourceCandidates(roadmap);
  await Promise.all(
    candidates.map((resource) =>
      prisma.learningResource.upsert({
        where: { resourceKey: resource.resourceKey },
        update: {
          roadmapCategory: resource.roadmapCategory,
          roadmapTitle: resource.roadmapTitle,
          skill: resource.skill,
          topic: resource.topic,
          topicSlug: resource.topicSlug,
          dayNumber: resource.dayNumber,
          resourceType: resource.resourceType,
          difficulty: resource.difficulty,
          title: resource.title,
          url: resource.url,
          description: resource.description,
          provider: resource.provider,
          estimatedMinutes: resource.estimatedMinutes,
          isOfficial: resource.isOfficial,
          aiScore: resource.aiScore,
          source: resource.source,
          tags: resource.tags,
          metadata: resource.metadata,
          roadmapId: roadmap.id,
        },
        create: resource,
      })
    )
  );

  return prisma.learningResource.findMany({ where: { roadmapId: roadmap.id } });
}

function buildAIResourcePrompt(params: {
  roadmap: RoadmapLike;
  userSkills: string[];
  resources: Array<{ id: string; title: string; topic: string; resourceType: string; difficulty: string; provider: string; url: string }>;
}) {
  return [
    'You are Pragyan AI resource recommender.',
    'Rank learning resources for the user using relevance, roadmap fit, and progression order.',
    'Return only valid JSON with the shape: { summary: string, ranked: [{ id, score, reason }] }',
    `Roadmap: ${params.roadmap.title} (${params.roadmap.category})`,
    `Difficulty: ${resolveDifficultyBand(params.roadmap)}`,
    `User skills: ${params.userSkills.join(', ') || 'None'}`,
    `Candidate resources: ${JSON.stringify(params.resources)}`,
  ].join('\n\n');
}

async function rankResourcesWithAI(roadmap: RoadmapLike, userSkills: string[], resources: Array<{ id: string; title: string; topic: string; resourceType: string; difficulty: string; provider: string; url: string }>) {
  if (!resources.length) {
    return { summary: 'No resources available yet.', ranked: [] as Array<{ id: string; score: number; reason: string }> };
  }

  try {
    const raw = await aiProvider.generateJsonRaw(buildAIResourcePrompt({ roadmap, userSkills, resources }), { timeoutMs: 12_000 });
    const parsed = JSON.parse(raw) as { summary?: string; ranked?: Array<{ id: string; score?: number; reason?: string }> };

    if (Array.isArray(parsed.ranked) && parsed.ranked.length) {
      return {
        summary: typeof parsed.summary === 'string' ? parsed.summary : 'AI personalized the resource order.',
        ranked: parsed.ranked
          .map((entry) => ({
            id: String(entry.id),
            score: Number(entry.score ?? 0),
            reason: String(entry.reason || 'Recommended by AI'),
          }))
          .filter((entry) => entry.id),
      };
    }
  } catch (error) {
    console.warn('AI resource ranking failed; using deterministic ranking.', error);
  }

  return {
    summary: 'Resources ranked by roadmap fit and skill overlap.',
    ranked: resources.map((resource, index) => ({
      id: resource.id,
      score: Math.max(0, 100 - index * 2),
      reason: `Best fit for ${resource.topic} and ${resource.resourceType}.`,
    })),
  };
}

export class LearningResourceService {
  async listResources(filters: LearningResourceFilters) {
    if (filters.roadmapId) {
      const roadmap = await prisma.roadmap.findUnique({ where: { id: filters.roadmapId } });
      if (roadmap) {
        await ensureRoadmapResources(roadmap as RoadmapLike);
      }
    }

    const where: Record<string, unknown> = {};

    if (filters.roadmapId) where.roadmapId = filters.roadmapId;
    if (filters.category) where.roadmapCategory = filters.category;
    if (filters.skill) where.skill = { contains: filters.skill, mode: 'insensitive' };
    if (filters.topic) where.topic = { contains: filters.topic, mode: 'insensitive' };
    if (filters.type) where.resourceType = filters.type;
    if (filters.difficulty) where.difficulty = filters.difficulty;
    if (filters.dayNumber) where.dayNumber = filters.dayNumber;
    if (filters.query) {
      where.OR = [
        { title: { contains: filters.query, mode: 'insensitive' } },
        { description: { contains: filters.query, mode: 'insensitive' } },
        { topic: { contains: filters.query, mode: 'insensitive' } },
        { skill: { contains: filters.query, mode: 'insensitive' } },
        { tags: { hasSome: [filters.query] } },
      ];
    }

    const page = filters.page || 1;
    const limit = filters.limit || 24;

    const [resources, total] = await Promise.all([
      prisma.learningResource.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ aiScore: 'desc' }, { updatedAt: 'desc' }],
      }),
      prisma.learningResource.count({ where }),
    ]);

    return { resources, total, page, limit };
  }

  async getRoadmapRecommendations(roadmapId: string, userId?: string, refresh = false, dayNumber?: number) {
    const roadmap = await prisma.roadmap.findUnique({ where: { id: roadmapId } });
    if (!roadmap) {
      return null;
    }

    if (refresh) {
      await prisma.learningResource.deleteMany({ where: { roadmapId } });
    }

    const resources = await ensureRoadmapResources(roadmap as RoadmapLike);
    const filtered = typeof dayNumber === 'number' ? resources.filter((resource) => resource.dayNumber === dayNumber) : resources;

    const profile = await getPersonalizationProfile(userId, roadmapId);

    const aiRanking = await rankResourcesWithAI(roadmap as RoadmapLike, profile.skillSignal, filtered.map((resource) => ({
      id: resource.id,
      title: resource.title,
      topic: resource.topic,
      resourceType: resource.resourceType,
      difficulty: resource.difficulty,
      provider: resource.provider,
      url: resource.url,
    })));

    const rankMap = new Map(aiRanking.ranked.map((item) => [item.id, item]));
    const ordered = rankByPersonalization(
      [...filtered].map((resource) => ({
        ...resource,
        aiScore: rankMap.get(resource.id)?.score ?? resource.aiScore,
        aiReason: rankMap.get(resource.id)?.reason || undefined,
      })),
      profile
    )
      .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));

    const history = userId
      ? await prisma.resourceLearningHistory.findMany({
          where: { userId, roadmapId },
          include: { resource: true },
        })
      : [];

    const resourceIdToHistory = new Map(history.map((entry) => [entry.resourceId, entry]));

    const days = Array.from(new Map(ordered.map((resource) => [resource.dayNumber || 1, resource.dayNumber || 1])).values())
      .sort((a, b) => a - b)
      .map((day) => {
        const dayResources = ordered.filter((resource) => (resource.dayNumber || 1) === day);
        const completedCount = dayResources.filter((resource) => resourceIdToHistory.get(resource.id)?.completed).length;
        const totalCount = dayResources.length;

        return {
          dayNumber: day,
          focus: getLearningStructure(roadmap as RoadmapLike)[day - 1]?.focus || `Day ${day}`,
          resources: dayResources,
          completedCount,
          totalCount,
          progress: totalCount ? Math.round((completedCount / totalCount) * 100) : 0,
        };
      });

    const topicPlan = buildTopicPlan(roadmap as RoadmapLike);

    return {
      roadmap,
      resources: ordered,
      days,
      history,
      profile,
      ai: {
        enabled: true,
        provider: aiProvider.getRuntime().provider,
        used: aiRanking.ranked.length > 0,
        summary: aiRanking.summary,
      },
      totalTopics: topicPlan.length,
      topics: topicPlan.map((item) => item.topic),
    };
  }

  async upsertHistory(userId: string, input: LearningResourceHistoryInput) {
    const resource = await prisma.learningResource.findUnique({ where: { id: input.resourceId } });
    if (!resource) {
      throw new Error('Learning resource not found');
    }

    const result = await prisma.resourceLearningHistory.upsert({
      where: {
        userId_resourceId: {
          userId,
          resourceId: input.resourceId,
        },
      },
      update: {
        roadmapId: input.roadmapId || resource.roadmapId || undefined,
        completed: input.completed ?? false,
        progressPercent: input.progressPercent ?? (input.completed ? 100 : 0),
        notes: input.notes,
        source: input.source || 'manual',
        completedAt: input.completed ? new Date() : null,
      },
      create: {
        userId,
        resourceId: input.resourceId,
        roadmapId: input.roadmapId || resource.roadmapId || undefined,
        completed: input.completed ?? false,
        progressPercent: input.progressPercent ?? (input.completed ? 100 : 0),
        notes: input.notes,
        source: input.source || 'manual',
        completedAt: input.completed ? new Date() : null,
      },
      include: {
        resource: true,
      },
    });

    if (input.completed) {
      const today = new Date();
      const todayKey = today.toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = yesterday.toISOString().split('T')[0];

      const [todayEntry, yesterdayEntry, user] = await Promise.all([
        prisma.userDailyLearning.findUnique({
          where: { userId_date: { userId, date: todayKey } },
        }),
        prisma.userDailyLearning.findUnique({
          where: { userId_date: { userId, date: yesterdayKey } },
        }),
        prisma.user.findUnique({ where: { id: userId }, select: { streak: true } }),
      ]);

      const nextStreak = todayEntry
        ? user?.streak ?? 0
        : yesterdayEntry
          ? (user?.streak ?? 0) + 1
          : 1;

      await prisma.userDailyLearning.upsert({
        where: { userId_date: { userId, date: todayKey } },
        update: {
          tasksCompleted: { increment: 1 },
          xpEarned: { increment: Math.max(5, Math.round((input.progressPercent ?? 100) / 10)) },
        },
        create: {
          userId,
          date: todayKey,
          tasksCompleted: 1,
          xpEarned: Math.max(5, Math.round((input.progressPercent ?? 100) / 10)),
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: {
          streak: nextStreak,
          xp: { increment: Math.max(5, Math.round((input.progressPercent ?? 100) / 10)) },
        },
      });
    }

    return result;
  }

  async getHistory(userId: string, roadmapId?: string) {
    return prisma.resourceLearningHistory.findMany({
      where: {
        userId,
        ...(roadmapId ? { roadmapId } : {}),
      },
      include: {
        resource: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}

export const learningResourceService = new LearningResourceService();