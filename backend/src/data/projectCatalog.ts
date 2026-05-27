export type ProjectDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface RoadmapProjectResource {
  title: string;
  url: string;
  provider: string;
}

export interface RoadmapProject {
  id: string;
  title: string;
  difficulty: ProjectDifficulty;
  unlockAfterTopics: string[];
  estimatedMinutes: number;
  xpReward: number;
  skillsUsed: string[];
  githubIdeas?: string[];
  resources?: RoadmapProjectResource[];
}

type ProjectCatalogEntry = {
  beginner: RoadmapProject[];
  intermediate: RoadmapProject[];
  advanced: RoadmapProject[];
};

const catalog: Record<string, ProjectCatalogEntry> = {
  frontend: {
    beginner: [
      {
        id: 'frontend-landing-page',
        title: 'Landing Page',
        difficulty: 'beginner',
        unlockAfterTopics: ['HTML Basics', 'CSS Layout', 'Responsive Design'],
        estimatedMinutes: 45,
        xpReward: 120,
        skillsUsed: ['HTML', 'CSS', 'Layout'],
        githubIdeas: ['Product landing page', 'Marketing page clone'],
        resources: [{ title: 'MDN CSS Layout', url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout', provider: 'MDN' }],
      },
      {
        id: 'frontend-calculator',
        title: 'Calculator',
        difficulty: 'beginner',
        unlockAfterTopics: ['JavaScript Functions', 'Events', 'DOM'],
        estimatedMinutes: 60,
        xpReward: 130,
        skillsUsed: ['Events', 'Functions', 'DOM'],
      },
      {
        id: 'frontend-todo-app',
        title: 'Todo App',
        difficulty: 'beginner',
        unlockAfterTopics: ['React State', 'Components', 'Props'],
        estimatedMinutes: 75,
        xpReward: 150,
        skillsUsed: ['State', 'Components', 'Props'],
      },
      {
        id: 'frontend-portfolio',
        title: 'Portfolio Website',
        difficulty: 'beginner',
        unlockAfterTopics: ['Responsive Design', 'Navigation', 'Deployment'],
        estimatedMinutes: 90,
        xpReward: 180,
        skillsUsed: ['Responsive UI', 'Deployment', 'Presentation'],
      },
    ],
    intermediate: [
      {
        id: 'frontend-weather-app',
        title: 'Weather App',
        difficulty: 'intermediate',
        unlockAfterTopics: ['API Integration', 'Async JS', 'State Management'],
        estimatedMinutes: 120,
        xpReward: 220,
        skillsUsed: ['Fetch API', 'Error Handling', 'UI Composition'],
      },
      {
        id: 'frontend-expense-tracker',
        title: 'Expense Tracker',
        difficulty: 'intermediate',
        unlockAfterTopics: ['Forms', 'Data Filtering', 'Charts'],
        estimatedMinutes: 135,
        xpReward: 230,
        skillsUsed: ['Forms', 'State', 'Charts'],
      },
      {
        id: 'frontend-movie-app',
        title: 'Movie App',
        difficulty: 'intermediate',
        unlockAfterTopics: ['API Integration', 'Search', 'Routing'],
        estimatedMinutes: 150,
        xpReward: 250,
        skillsUsed: ['Routing', 'Search UX', 'Async Data'],
      },
      {
        id: 'frontend-blog-cms',
        title: 'Blog CMS',
        difficulty: 'intermediate',
        unlockAfterTopics: ['Auth', 'CRUD', 'Admin UI'],
        estimatedMinutes: 180,
        xpReward: 280,
        skillsUsed: ['CRUD', 'Authentication', 'Dashboards'],
      },
    ],
    advanced: [
      {
        id: 'frontend-netflix-clone',
        title: 'Netflix Clone',
        difficulty: 'advanced',
        unlockAfterTopics: ['Advanced React', 'Streaming UI', 'State Architecture'],
        estimatedMinutes: 300,
        xpReward: 420,
        skillsUsed: ['Architectural UI', 'Optimization', 'Large Components'],
      },
      {
        id: 'frontend-uber-clone',
        title: 'Uber Clone',
        difficulty: 'advanced',
        unlockAfterTopics: ['Maps', 'Realtime Updates', 'Payments'],
        estimatedMinutes: 360,
        xpReward: 480,
        skillsUsed: ['Realtime', 'Maps', 'Platform Thinking'],
      },
      {
        id: 'frontend-ai-dashboard',
        title: 'AI Dashboard',
        difficulty: 'advanced',
        unlockAfterTopics: ['Charts', 'AI APIs', 'Admin Analytics'],
        estimatedMinutes: 240,
        xpReward: 360,
        skillsUsed: ['Analytics UI', 'AI Integration', 'Product Thinking'],
      },
    ],
  },
  react: {
    beginner: [
      {
        id: 'react-counter-app',
        title: 'Counter App',
        difficulty: 'beginner',
        unlockAfterTopics: ['React State', 'Events', 'Components'],
        estimatedMinutes: 45,
        xpReward: 120,
        skillsUsed: ['useState', 'Events', 'Components'],
        resources: [{ title: 'React Learn - Adding Interactivity', url: 'https://react.dev/learn/adding-interactivity', provider: 'React Docs' }],
      },
      {
        id: 'react-todo-app',
        title: 'Todo App',
        difficulty: 'beginner',
        unlockAfterTopics: ['State', 'Props', 'Lists'],
        estimatedMinutes: 60,
        xpReward: 140,
        skillsUsed: ['State', 'Lists', 'Props'],
      },
      {
        id: 'react-portfolio',
        title: 'Portfolio Website',
        difficulty: 'beginner',
        unlockAfterTopics: ['Components', 'Routing', 'Deployment'],
        estimatedMinutes: 90,
        xpReward: 180,
        skillsUsed: ['Routing', 'Deployment', 'Composition'],
      },
    ],
    intermediate: [
      {
        id: 'react-weather-app',
        title: 'Weather App',
        difficulty: 'intermediate',
        unlockAfterTopics: ['Hooks', 'API Integration', 'Async Flow'],
        estimatedMinutes: 120,
        xpReward: 220,
        skillsUsed: ['Hooks', 'Fetch', 'Effects'],
      },
      {
        id: 'react-expense-tracker',
        title: 'Expense Tracker',
        difficulty: 'intermediate',
        unlockAfterTopics: ['State Management', 'Forms', 'Charts'],
        estimatedMinutes: 135,
        xpReward: 240,
        skillsUsed: ['State', 'Forms', 'Data viz'],
      },
      {
        id: 'react-movie-app',
        title: 'Movie App',
        difficulty: 'intermediate',
        unlockAfterTopics: ['Routing', 'Search', 'API Integration'],
        estimatedMinutes: 150,
        xpReward: 250,
        skillsUsed: ['Routing', 'Search UX', 'Async Data'],
      },
      {
        id: 'react-blog-cms',
        title: 'Blog CMS',
        difficulty: 'intermediate',
        unlockAfterTopics: ['Auth', 'CRUD', 'Admin UI'],
        estimatedMinutes: 180,
        xpReward: 280,
        skillsUsed: ['CRUD', 'Authentication', 'Dashboards'],
      },
    ],
    advanced: [
      {
        id: 'react-netflix-clone',
        title: 'Netflix Clone',
        difficulty: 'advanced',
        unlockAfterTopics: ['Advanced Hooks', 'Architecture', 'Performance'],
        estimatedMinutes: 300,
        xpReward: 420,
        skillsUsed: ['Performance', 'Composition', 'Scale'],
      },
      {
        id: 'react-uber-clone',
        title: 'Uber Clone',
        difficulty: 'advanced',
        unlockAfterTopics: ['Maps', 'Realtime', 'Auth'],
        estimatedMinutes: 360,
        xpReward: 480,
        skillsUsed: ['Realtime', 'Maps', 'Fullstack Thinking'],
      },
      {
        id: 'react-ai-dashboard',
        title: 'AI Dashboard',
        difficulty: 'advanced',
        unlockAfterTopics: ['AI APIs', 'Analytics', 'Complex State'],
        estimatedMinutes: 240,
        xpReward: 360,
        skillsUsed: ['Analytics UI', 'AI Integration', 'Product Thinking'],
      },
    ],
  },
  ai: {
    beginner: [
      {
        id: 'ai-spam-classifier',
        title: 'Spam Classifier',
        difficulty: 'beginner',
        unlockAfterTopics: ['ML Basics', 'Classification', 'Data Cleaning'],
        estimatedMinutes: 90,
        xpReward: 160,
        skillsUsed: ['Classification', 'Dataset Prep', 'Model Evaluation'],
      },
      {
        id: 'ai-bmi-predictor',
        title: 'BMI Predictor',
        difficulty: 'beginner',
        unlockAfterTopics: ['Regression Basics', 'Features', 'Training'],
        estimatedMinutes: 60,
        xpReward: 130,
        skillsUsed: ['Regression', 'Features', 'Model Training'],
      },
    ],
    intermediate: [
      {
        id: 'ai-movie-recommendation',
        title: 'Movie Recommendation System',
        difficulty: 'intermediate',
        unlockAfterTopics: ['Collaborative Filtering', 'Embedding Basics', 'Evaluation'],
        estimatedMinutes: 150,
        xpReward: 240,
        skillsUsed: ['Recommenders', 'Similarity', 'Ranking'],
      },
      {
        id: 'ai-chatbot',
        title: 'Domain Chatbot',
        difficulty: 'intermediate',
        unlockAfterTopics: ['Prompting', 'Context', 'Evaluation'],
        estimatedMinutes: 180,
        xpReward: 260,
        skillsUsed: ['LLM Prompting', 'Context Handling', 'Product UX'],
      },
    ],
    advanced: [
      {
        id: 'ai-dashboard',
        title: 'AI Dashboard',
        difficulty: 'advanced',
        unlockAfterTopics: ['Model Monitoring', 'Experiment Tracking', 'Deployment'],
        estimatedMinutes: 240,
        xpReward: 360,
        skillsUsed: ['Analytics', 'Monitoring', 'LLM Ops'],
      },
      {
        id: 'ai-agent-workflow',
        title: 'AI Agent Workflow',
        difficulty: 'advanced',
        unlockAfterTopics: ['Tool Use', 'Routing', 'Guardrails'],
        estimatedMinutes: 300,
        xpReward: 420,
        skillsUsed: ['Agent Design', 'Workflow Routing', 'Safety'],
      },
    ],
  },
  cybersecurity: {
    beginner: [
      {
        id: 'cyber-password-checker',
        title: 'Password Strength Checker',
        difficulty: 'beginner',
        unlockAfterTopics: ['Input Validation', 'Security Basics', 'Regex'],
        estimatedMinutes: 45,
        xpReward: 120,
        skillsUsed: ['Validation', 'Security Basics', 'UX'],
      },
      {
        id: 'cyber-port-scanner',
        title: 'Port Scanner',
        difficulty: 'beginner',
        unlockAfterTopics: ['Networking Basics', 'Ports', 'Sockets'],
        estimatedMinutes: 75,
        xpReward: 150,
        skillsUsed: ['Networking', 'Ports', 'Scripting'],
      },
      {
        id: 'cyber-log-analyzer',
        title: 'Log Analyzer',
        difficulty: 'beginner',
        unlockAfterTopics: ['Logs', 'Patterns', 'Filtering'],
        estimatedMinutes: 80,
        xpReward: 160,
        skillsUsed: ['Parsing', 'Patterns', 'Automation'],
      },
    ],
    intermediate: [
      {
        id: 'cyber-vuln-dashboard',
        title: 'Vulnerability Dashboard',
        difficulty: 'intermediate',
        unlockAfterTopics: ['OWASP', 'Reporting', 'Prioritization'],
        estimatedMinutes: 150,
        xpReward: 240,
        skillsUsed: ['OWASP', 'Analytics', 'Reporting'],
      },
    ],
    advanced: [
      {
        id: 'cyber-siem-workbench',
        title: 'SIEM Workbench',
        difficulty: 'advanced',
        unlockAfterTopics: ['Monitoring', 'Detection', 'Alerting'],
        estimatedMinutes: 300,
        xpReward: 420,
        skillsUsed: ['Monitoring', 'Detection', 'Incident Response'],
      },
    ],
  },
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function pickCatalogKey(roadmap: { title: string; category?: string; requiredSkills?: string[]; tags?: string[] }) {
  const normalized = normalize([roadmap.title, roadmap.category, ...(roadmap.requiredSkills || []), ...(roadmap.tags || [])].filter(Boolean).join(' '));

  if (normalized.includes('react') || normalized.includes('frontend') || normalized.includes('ui') || normalized.includes('web')) return 'react';
  if (normalized.includes('javascript') || normalized.includes('html') || normalized.includes('css')) return 'frontend';
  if (normalized.includes('machine learning') || normalized.includes('ml') || normalized.includes('ai ' ) || normalized.includes(' ai')) return 'ai';
  if (normalized.includes('cyber') || normalized.includes('security') || normalized.includes('hacking') || normalized.includes('owasp')) return 'cybersecurity';

  return null;
}

function pickDifficulty(level?: string | null): ProjectDifficulty {
  const normalized = String(level || '').toLowerCase();
  if (normalized.includes('advanced') || normalized.includes('expert')) return 'advanced';
  if (normalized.includes('intermediate') || normalized.includes('mid')) return 'intermediate';
  return 'beginner';
}

export function getRoadmapProjects(roadmap: { title: string; category?: string; level?: string | null; difficulty?: string | null; requiredSkills?: string[]; tags?: string[] }) {
  const key = pickCatalogKey(roadmap);
  const difficulty = pickDifficulty(roadmap.level || roadmap.difficulty);
  const entry = key ? catalog[key] : null;

  if (entry?.[difficulty]?.length) {
    return entry[difficulty];
  }

  const label = roadmap.category || roadmap.title;
  return [
    {
      id: `${normalize(label || 'roadmap')}-mini-project`,
      title: `Build ${label} Project`,
      difficulty,
      unlockAfterTopics: (roadmap.requiredSkills || []).slice(0, 3),
      estimatedMinutes: difficulty === 'advanced' ? 240 : difficulty === 'intermediate' ? 150 : 60,
      xpReward: difficulty === 'advanced' ? 360 : difficulty === 'intermediate' ? 220 : 120,
      skillsUsed: (roadmap.requiredSkills || []).slice(0, 5),
    },
  ];
}

export function getTopProjectForTime(roadmap: { title: string; category?: string; level?: string | null; difficulty?: string | null; requiredSkills?: string[]; tags?: string[] }, availableMinutes: number) {
  const projects = getRoadmapProjects(roadmap).filter((project) => project.estimatedMinutes <= availableMinutes);
  return projects[0] || getRoadmapProjects(roadmap)[0] || null;
}
