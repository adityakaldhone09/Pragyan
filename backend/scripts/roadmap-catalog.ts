export type RoadmapDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type RoadmapResourceType = 'documentation' | 'video' | 'practice';

export interface RoadmapLearningResource {
  title: string;
  provider: string;
  type: RoadmapResourceType;
  url: string;
  estimatedMinutes?: number;
}

export interface RoadmapLearningDay {
  day: number;
  focus: string;
  dailyTopics: string[];
  tasks: string[];
  resources: RoadmapLearningResource[];
  deliverable: string;
  xp: number;
}

export interface RoadmapMilestoneModule {
  title: string;
  completed?: boolean;
}

export interface RoadmapMilestone {
  week: number;
  title: string;
  description: string;
  modules: RoadmapMilestoneModule[];
}

export interface RoadmapProgressionStage {
  stage: RoadmapDifficulty;
  title: string;
  description: string;
}

export interface RoadmapCatalogEntry {
  title: string;
  category: string;
  careerPath: string;
  difficulty: RoadmapDifficulty;
  duration: string;
  requiredSkills: string[];
  description: string;
  icon: string;
  tags: string[];
  learningStructure: RoadmapLearningDay[];
  milestones: RoadmapMilestone[];
  progression: RoadmapProgressionStage[];
  estimatedHours: number;
}

type RoadmapCategoryDefinition = {
  category: string;
  icon: string;
  baseSkills: string[];
  topics: string[];
};

const DIFFICULTY_ORDER: RoadmapDifficulty[] = ['beginner', 'intermediate', 'advanced', 'expert'];
const STOP_WORDS = new Set(['and', 'for', 'the', 'to', 'with', 'in', 'on', 'of', 'roadmap', 'mastery', 'foundations', 'basics', 'systems', 'development']);

const CAREER_PATH_BY_CATEGORY: Record<string, string> = {
  'Frontend': 'Technology',
  'Backend': 'Technology',
  'Full Stack': 'Technology',
  'Programming Languages': 'Programming',
  'AI/ML': 'AI/ML',
  'Data Science': 'AI/ML',
  'Cybersecurity': 'Cybersecurity',
  'Mobile Development': 'Technology',
  'DevOps': 'Cloud',
  'Cloud Computing': 'Cloud',
  'Government Exams': 'Government Exams',
  'UI/UX': 'Creative Careers',
  'Linux': 'Technology',
  'Blockchain': 'Technology',
  'Game Development': 'Creative Careers',
  'Competitive Programming': 'Programming',
  'Product Management': 'Management',
  'Finance': 'Finance',
  'Digital Marketing': 'Creative Careers',
  'AR/VR & XR': 'Creative Careers',
};

const CATEGORY_PRACTICE_HUBS: Record<string, { provider: string; url: string }> = {
  Frontend: { provider: 'Frontend Mentor', url: 'https://www.frontendmentor.io/challenges' },
  Backend: { provider: 'Postman', url: 'https://www.postman.com/explore' },
  'Full Stack': { provider: 'freeCodeCamp', url: 'https://www.freecodecamp.org/learn/' },
  'Programming Languages': { provider: 'LeetCode', url: 'https://leetcode.com/problemset/' },
  'AI/ML': { provider: 'Kaggle', url: 'https://www.kaggle.com/learn' },
  'Data Science': { provider: 'Kaggle', url: 'https://www.kaggle.com/learn' },
  Cybersecurity: { provider: 'PortSwigger', url: 'https://portswigger.net/web-security' },
  'Mobile Development': { provider: 'Android Developers', url: 'https://developer.android.com/courses' },
  DevOps: { provider: 'AWS Training', url: 'https://explore.skillbuilder.aws/learn' },
  'Cloud Computing': { provider: 'AWS Training', url: 'https://explore.skillbuilder.aws/learn' },
  'Government Exams': { provider: 'UPSC', url: 'https://upsc.gov.in/' },
  'UI/UX': { provider: 'Figma', url: 'https://www.figma.com/resource-library/' },
  Linux: { provider: 'Linux Journey', url: 'https://linuxjourney.com/' },
  Blockchain: { provider: 'Ethereum', url: 'https://ethereum.org/en/developers/' },
  'Game Development': { provider: 'Unity Learn', url: 'https://learn.unity.com/' },
  'Competitive Programming': { provider: 'LeetCode', url: 'https://leetcode.com/problemset/' },
  'Product Management': { provider: 'Atlassian', url: 'https://www.atlassian.com/agile/product-management' },
  Finance: { provider: 'Investopedia', url: 'https://www.investopedia.com/' },
  'Digital Marketing': { provider: 'Google Skillshop', url: 'https://skillshop.withgoogle.com/' },
  'AR/VR & XR': { provider: 'Meta for Developers', url: 'https://developers.meta.com/horizon' },
};

const CATEGORY_DEFINITIONS: RoadmapCategoryDefinition[] = [
  {
    category: 'Frontend',
    icon: '🎨',
    baseSkills: ['HTML', 'CSS', 'JavaScript', 'Accessibility', 'React'],
    topics: [
      'HTML & Semantic Foundations',
      'CSS Layout Systems',
      'JavaScript Core Fluency',
      'TypeScript for Frontend',
      'React Fundamentals',
      'State Management Patterns',
      'Routing, Forms & Validation',
      'Testing UI Workflows',
      'Accessibility & UX Polish',
      'Performance Optimization',
      'Next.js Production Apps',
      'Design Systems & Theming',
      'Animation & Motion Design',
    ],
  },
  {
    category: 'Backend',
    icon: '⚙️',
    baseSkills: ['Node.js', 'Express', 'REST APIs', 'Databases', 'Authentication'],
    topics: [
      'Node.js Runtime Basics',
      'Express API Design',
      'RESTful Architecture',
      'Authentication & Sessions',
      'Database Modeling',
      'Prisma & MongoDB',
      'Validation & Error Handling',
      'Caching & Background Jobs',
      'Testing APIs',
      'Logging & Observability',
      'Security Hardening',
      'GraphQL & RPC',
      'Scalable Backend Systems',
    ],
  },
  {
    category: 'Full Stack',
    icon: '🧩',
    baseSkills: ['HTML', 'CSS', 'JavaScript', 'Node.js', 'React'],
    topics: [
      'Web App Foundations',
      'Frontend-Backend Data Flow',
      'Auth Flows & Sessions',
      'CRUD App Architecture',
      'Realtime Features',
      'File Upload Pipelines',
      'Search & Filtering',
      'Testing End-to-End',
      'Deployment Automation',
      'Payments & Billing',
      'Performance Tuning',
      'Multi-Tenant SaaS',
      'Full Stack Capstone',
    ],
  },
  {
    category: 'Programming Languages',
    icon: '⌨️',
    baseSkills: ['Syntax', 'Data Structures', 'Debugging', 'Testing', 'Problem Solving'],
    topics: [
      'Python Language Mastery',
      'Java Language Mastery',
      'C++ Systems Programming',
      'JavaScript Language Mastery',
      'TypeScript Language Mastery',
      'Go Concurrency',
      'Rust Ownership & Safety',
      'Kotlin App Development',
      'Swift App Development',
      'C# Ecosystem',
      'Ruby Productivity',
      'PHP Web Foundations',
      'Dart Language Mastery',
    ],
  },
  {
    category: 'AI/ML',
    icon: '🤖',
    baseSkills: ['Python', 'Statistics', 'Data Preparation', 'Model Evaluation', 'Machine Learning'],
    topics: [
      'ML Foundations',
      'Data Preparation',
      'Supervised Learning',
      'Unsupervised Learning',
      'Feature Engineering',
      'Model Evaluation',
      'Deep Learning',
      'NLP Systems',
      'Computer Vision',
      'Recommendation Systems',
      'MLOps Pipelines',
      'Prompt Engineering',
      'GenAI Applications',
    ],
  },
  {
    category: 'Data Science',
    icon: '📊',
    baseSkills: ['Python', 'SQL', 'Statistics', 'Visualization', 'Data Wrangling'],
    topics: [
      'Python Analytics',
      'Pandas Mastery',
      'Data Visualization',
      'Statistics for Data Science',
      'SQL for Analytics',
      'Data Cleaning & Wrangling',
      'Experiment Design',
      'Time Series Forecasting',
      'A/B Testing',
      'BI Dashboards',
      'Data Modeling',
      'Storytelling with Data',
      'Analytics Capstone',
    ],
  },
  {
    category: 'Cybersecurity',
    icon: '🔒',
    baseSkills: ['Networking', 'Linux', 'Threat Modeling', 'Cryptography', 'Incident Response'],
    topics: [
      'Networking Fundamentals',
      'Linux Security',
      'Web App Security',
      'Threat Modeling',
      'Cryptography Basics',
      'Identity & Access Management',
      'Cloud Security',
      'Incident Response',
      'Malware Analysis',
      'Penetration Testing',
      'Secure Coding',
      'SOC Operations',
      'Security Capstone',
    ],
  },
  {
    category: 'Mobile Development',
    icon: '📱',
    baseSkills: ['Kotlin', 'Swift', 'Flutter', 'React Native', 'API Integration'],
    topics: [
      'Android Kotlin Foundations',
      'iOS Swift Foundations',
      'Flutter UI Development',
      'React Native Apps',
      'Mobile State Management',
      'Offline-First Design',
      'API Integration',
      'Mobile Testing',
      'Push Notifications',
      'Maps & Location',
      'App Store Release',
      'Mobile Performance',
      'Mobile Capstone',
    ],
  },
  {
    category: 'DevOps',
    icon: '🚀',
    baseSkills: ['Linux', 'Git', 'Docker', 'CI/CD', 'Monitoring'],
    topics: [
      'Linux Automation',
      'Shell Scripting',
      'Git Workflows',
      'CI/CD Pipelines',
      'Docker Fundamentals',
      'Kubernetes Basics',
      'Infrastructure as Code',
      'Monitoring & Alerting',
      'Release Engineering',
      'Secrets Management',
      'Incident Response',
      'Platform Engineering',
      'DevOps Capstone',
    ],
  },
  {
    category: 'Cloud Computing',
    icon: '☁️',
    baseSkills: ['AWS', 'Azure', 'GCP', 'Networking', 'Cloud Security'],
    topics: [
      'Cloud Foundations',
      'AWS Core Services',
      'Azure Fundamentals',
      'GCP Foundations',
      'Networking & VPCs',
      'Serverless Architecture',
      'Containers in Cloud',
      'Identity & Governance',
      'Cost Optimization',
      'Reliability Engineering',
      'Cloud Security',
      'Hybrid Architecture',
      'Cloud Capstone',
    ],
  },
  {
    category: 'Government Exams',
    icon: '🏛️',
    baseSkills: ['Current Affairs', 'Answer Writing', 'Revision', 'Essay Writing', 'Time Management'],
    topics: [
      'UPSC Foundation',
      'SSC Foundation',
      'Banking Exam Strategy',
      'CAT Preparation',
      'GATE Preparation',
      'Essay Writing',
      'Polity & Governance',
      'Current Affairs System',
      'CSAT Practice',
      'Interview Preparation',
    ],
  },
  {
    category: 'UI/UX',
    icon: '✨',
    baseSkills: ['Design Thinking', 'Research', 'Wireframing', 'Prototyping', 'Accessibility'],
    topics: [
      'Design Thinking',
      'User Research',
      'Wireframing',
      'Prototyping',
      'Visual Design',
      'Information Architecture',
      'Accessibility',
      'Interaction Design',
      'Design Systems',
      'Usability Testing',
      'Motion Design',
      'Portfolio Building',
      'UI/UX Capstone',
    ],
  },
  {
    category: 'Linux',
    icon: '🐧',
    baseSkills: ['Shell', 'Permissions', 'Processes', 'Networking', 'System Administration'],
    topics: [
      'Shell Basics',
      'Filesystem Mastery',
      'Permissions & Users',
      'Processes & Services',
      'Networking on Linux',
      'Package Management',
      'systemd & Boot',
      'Shell Scripting',
      'Server Administration',
      'Security Hardening',
      'Performance Tuning',
      'Containers on Linux',
      'Linux Capstone',
    ],
  },
  {
    category: 'Blockchain',
    icon: '⛓️',
    baseSkills: ['Web3', 'Solidity', 'Wallets', 'Smart Contracts', 'Security'],
    topics: [
      'Web3 Foundations',
      'Smart Contract Basics',
      'Solidity Development',
      'Token Standards',
      'Wallets & Transactions',
      'DApp Frontends',
      'Blockchain Security',
      'DeFi Fundamentals',
      'NFT Platforms',
      'Layer 2 Systems',
      'Indexing & Analytics',
      'Testing & Deployment',
      'Blockchain Capstone',
    ],
  },
  {
    category: 'Game Development',
    icon: '🎮',
    baseSkills: ['Game Design', 'Physics', 'UI', 'Optimization', 'Problem Solving'],
    topics: [
      'Game Design Basics',
      'Unity Fundamentals',
      'Unreal Fundamentals',
      '2D Game Development',
      '3D Game Development',
      'Physics & Gameplay',
      'Input & Camera Systems',
      'UI & Menus',
      'Game AI',
      'Asset Pipeline',
      'Optimization Techniques',
      'Multiplayer Basics',
      'Game Capstone',
    ],
  },
  {
    category: 'Competitive Programming',
    icon: '🏁',
    baseSkills: ['Problem Solving', 'Complexity Analysis', 'Algorithms', 'Data Structures', 'Speed'],
    topics: [
      'Problem Solving Foundations',
      'Complexity Analysis',
      'Arrays & Strings',
      'Sorting & Searching',
      'Recursion & Backtracking',
      'Dynamic Programming',
      'Trees & BSTs',
      'Graph Algorithms',
      'Greedy Algorithms',
      'Math & Number Theory',
      'Segment Trees',
      'Contest Strategy',
      'CP Capstone',
    ],
  },
  {
    category: 'Product Management',
    icon: '📈',
    baseSkills: ['Discovery', 'Prioritization', 'Metrics', 'Communication', 'Roadmapping'],
    topics: [
      'Product Discovery',
      'User Research',
      'Market Analysis',
      'Roadmapping',
      'Prioritization Frameworks',
      'Metrics & Analytics',
      'Stakeholder Management',
      'Pricing & Packaging',
      'Experimentation & A/B Testing',
      'Product Launches',
    ],
  },
  {
    category: 'Finance',
    icon: '💹',
    baseSkills: ['Accounting', 'Valuation', 'Risk Management', 'Budgeting', 'Market Research'],
    topics: [
      'Personal Finance',
      'Financial Accounting',
      'Equity Markets',
      'Fixed Income',
      'Banking Operations',
      'Risk Management',
      'Financial Modeling',
      'Taxation & Compliance',
      'Portfolio Construction',
      'Finance Capstone',
    ],
  },
  {
    category: 'Digital Marketing',
    icon: '📣',
    baseSkills: ['SEO', 'Content Strategy', 'Analytics', 'Paid Ads', 'Copywriting'],
    topics: [
      'SEO Fundamentals',
      'Content Strategy',
      'Social Media Marketing',
      'Performance Marketing',
      'Email Campaigns',
      'Copywriting',
      'Video Editing Fundamentals',
      'Content Creator Growth',
      'Analytics & Attribution',
      'Campaign Capstone',
    ],
  },
  {
    category: 'AR/VR & XR',
    icon: '🥽',
    baseSkills: ['3D Thinking', 'Unity', 'Interaction Design', 'Spatial UI', 'Optimization'],
    topics: [
      'XR Foundations',
      'Unity XR Development',
      'Unreal XR Development',
      'Spatial UI Design',
      'Mixed Reality Prototyping',
      '3D Asset Pipeline',
      'Immersive Interaction Design',
      'XR Performance Tuning',
    ],
  },
];

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function encodeQuery(value: string) {
  return encodeURIComponent(value.trim());
}

function getPracticeHub(category: string) {
  return CATEGORY_PRACTICE_HUBS[category] || {
    provider: 'Google Search',
    url: `https://www.google.com/search?q=${encodeQuery(`${category} practice`)}`,
  };
}

function buildLearningResources(category: string, topic: string, focus: string): RoadmapLearningResource[] {
  const practiceHub = getPracticeHub(category);
  return [
    {
      title: `${topic} official docs`,
      provider: 'Official Docs',
      type: 'documentation',
      url: `https://www.google.com/search?q=${encodeQuery(`${topic} ${category} official docs`)}`,
      estimatedMinutes: 18,
    },
    {
      title: `${focus} video walkthrough`,
      provider: 'YouTube',
      type: 'video',
      url: `https://www.youtube.com/results?search_query=${encodeQuery(`${topic} ${category} ${focus} tutorial`)}`,
      estimatedMinutes: 27,
    },
    {
      title: `${category} practice hub`,
      provider: practiceHub.provider,
      type: 'practice',
      url: practiceHub.url,
      estimatedMinutes: 40,
    },
  ];
}

function extractKeywords(text: string) {
  return uniqueValues(
    text
      .split(/[^a-zA-Z0-9.+#]+/)
      .map((token) => token.trim())
      .filter((token) => token && !STOP_WORDS.has(token.toLowerCase()))
      .map((token) => titleCase(token))
  );
}

function inferDifficulty(index: number): RoadmapDifficulty {
  return DIFFICULTY_ORDER[index % DIFFICULTY_ORDER.length];
}

function durationInWeeks(index: number, difficulty: RoadmapDifficulty) {
  const base = difficulty === 'beginner' ? 6 : difficulty === 'intermediate' ? 8 : difficulty === 'advanced' ? 10 : 12;
  return base + (index % 3);
}

function buildRequiredSkills(category: RoadmapCategoryDefinition, topic: string, difficulty: RoadmapDifficulty) {
  const topicSkills = extractKeywords(topic);
  const categoryAnchor = titleCase(category.category);
  const coreSkills = uniqueValues([categoryAnchor, ...category.baseSkills, ...topicSkills]);
  const focusedSkills = difficulty === 'expert' ? 7 : difficulty === 'advanced' ? 6 : 5;
  return coreSkills.slice(0, focusedSkills);
}

function buildLearningStructure(category: RoadmapCategoryDefinition, topic: string, difficulty: RoadmapDifficulty): RoadmapLearningDay[] {
  const topicLabel = topic.toLowerCase();
  return [
    {
      day: 1,
      focus: 'Orientation and setup',
      dailyTopics: [`${topic} overview`, 'Prerequisites', 'Environment setup'],
      tasks: [
        `Map the ${topicLabel} workflow for the ${category.category} track`,
        'Review prerequisites and environment setup',
        'Define a learning backlog for the week',
      ],
      resources: buildLearningResources(category.category, topic, 'orientation and setup'),
      deliverable: `A setup checklist for ${topic}`,
      xp: difficulty === 'beginner' ? 40 : 60,
    },
    {
      day: 2,
      focus: 'Core concepts',
      dailyTopics: [`${topic} fundamentals`, 'Core terminology', 'Best practices'],
      tasks: [
        `Learn the essential building blocks of ${topicLabel}`,
        'Summarize key terminology and patterns',
        'Practice a small guided exercise',
      ],
      resources: buildLearningResources(category.category, topic, 'core concepts'),
      deliverable: `Concept notes for ${topic}`,
      xp: difficulty === 'expert' ? 90 : 70,
    },
    {
      day: 3,
      focus: 'Hands-on practice',
      dailyTopics: [`${topic} drills`, 'Debugging', 'Applied exercises'],
      tasks: [
        `Implement a focused ${topicLabel} exercise`,
        'Debug common mistakes and edge cases',
        'Capture reusable snippets or templates',
      ],
      resources: buildLearningResources(category.category, topic, 'hands-on practice'),
      deliverable: `A practice artifact for ${topic}`,
      xp: difficulty === 'expert' ? 100 : 80,
    },
    {
      day: 4,
      focus: 'Applied project work',
      dailyTopics: [`${topic} project`, 'Integration', 'Portfolio outcome'],
      tasks: [
        `Build a mini project using ${topicLabel}`,
        'Validate the solution against a checklist',
        'Document tradeoffs and next steps',
      ],
      resources: buildLearningResources(category.category, topic, 'applied project work'),
      deliverable: `A working mini project for ${topic}`,
      xp: difficulty === 'expert' ? 120 : 90,
    },
    {
      day: 5,
      focus: 'Review and stretch goals',
      dailyTopics: ['Review', 'Gap analysis', 'Next milestone'],
      tasks: [
        'Review the week’s outputs',
        'Close knowledge gaps with focused revision',
        'Plan the next weekly milestone',
      ],
      resources: buildLearningResources(category.category, topic, 'review and stretch goals'),
      deliverable: `A weekly review for ${topic}`,
      xp: difficulty === 'expert' ? 140 : 100,
    },
  ];
}

function buildMilestones(topic: string, difficulty: RoadmapDifficulty, totalWeeks: number): RoadmapMilestone[] {
  const checkpoints = [1, Math.ceil(totalWeeks / 3), Math.ceil((2 * totalWeeks) / 3), totalWeeks];
  const progressionTitles = ['Foundation Sprint', 'Builder Sprint', 'Specialization Sprint', 'Capstone Sprint'];
  const difficultyTone =
    difficulty === 'beginner'
      ? 'guided'
      : difficulty === 'intermediate'
        ? 'applied'
        : difficulty === 'advanced'
          ? 'strategic'
          : 'mastery';

  return checkpoints.map((week, index) => ({
    week,
    title: progressionTitles[index],
    description: `${index === 0 ? 'Learn the basics of' : index === 1 ? 'Apply the core patterns of' : index === 2 ? 'Tackle advanced scenarios in' : 'Ship a portfolio-ready project for'} ${topic.toLowerCase()} with a ${difficultyTone} ${difficulty} progression.`,
    modules: [
      { title: `${topic} concepts`, completed: false },
      { title: `${topic} exercises`, completed: false },
      { title: `${topic} project checkpoint`, completed: false },
    ],
  }));
}

function buildProgression(topic: string): RoadmapProgressionStage[] {
  return [
    {
      stage: 'beginner',
      title: 'Beginner foundation',
      description: `Learn the vocabulary, setup, and core ideas behind ${topic.toLowerCase()}.`,
    },
    {
      stage: 'intermediate',
      title: 'Intermediate builder',
      description: `Apply ${topic.toLowerCase()} in guided exercises and small projects.`,
    },
    {
      stage: 'advanced',
      title: 'Advanced specialist',
      description: `Solve real-world scenarios, tradeoffs, and production patterns with ${topic.toLowerCase()}.`,
    },
    {
      stage: 'expert',
      title: 'Expert capstone',
      description: `Ship a portfolio-ready capstone and review the full ${topic.toLowerCase()} system design.`,
    },
  ];
}

function buildRoadmapEntry(category: RoadmapCategoryDefinition, topic: string, index: number): RoadmapCatalogEntry {
  const difficulty = inferDifficulty(index);
  const weeks = durationInWeeks(index, difficulty);
  const requiredSkills = buildRequiredSkills(category, topic, difficulty);
  const focusSlug = slugify(topic);
  const categorySlug = slugify(category.category);
  const milestones = buildMilestones(topic, difficulty, weeks);
  const careerPath = CAREER_PATH_BY_CATEGORY[category.category] || category.category;

  return {
    title: `${topic} Roadmap`,
    category: category.category,
    careerPath,
    difficulty,
    duration: `${weeks} weeks`,
    requiredSkills,
    description: `A ${difficulty} roadmap for mastering ${topic.toLowerCase()} in the ${category.category.toLowerCase()} track.`,
    icon: category.icon,
    tags: uniqueValues([
      categorySlug,
      focusSlug,
      ...requiredSkills.slice(0, 4).map((skill) => slugify(skill)),
    ]),
    learningStructure: buildLearningStructure(category, topic, difficulty),
    milestones,
    progression: buildProgression(topic),
    estimatedHours: weeks * 10,
  };
}

export function generateRoadmapCatalog() {
  return CATEGORY_DEFINITIONS.flatMap((category) =>
    category.topics.map((topic, index) => buildRoadmapEntry(category, topic, index))
  );
}

export const ROADMAP_CATALOG = generateRoadmapCatalog();
