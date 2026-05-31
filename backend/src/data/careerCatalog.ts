export type CareerDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type CareerCategory = 'government' | 'private' | 'higher_studies';

export interface CareerCatalogEntry {
  role: string;
  slug: string;
  category: CareerCategory;
  dashboardType: string;
  roadmapDays: number;
  difficulty: CareerDifficulty;
  salaryRange: string;
  growthRate: 'Low' | 'Medium' | 'High';
  requiredSkills: string[];
  recommendedProjects: string[];
  relatedAlternatives: string[];
  futureGrowthOpportunities: string[];
  roadmapTemplate: string;
  preferredSubjects?: string[];
  eligibility?: {
    qualification?: string[];
    stream?: string[];
    minAge?: number;
    maxAge?: number;
  };
  keywords: string[];
}

export type CareerRoleProfile = CareerCatalogEntry;

export interface PlacementReadinessMetrics {
  skillCoverage: number;
  roadmapProgress: number;
  projectCompletion: number;
  quizPerformance: number;
}

export interface PlacementReadinessResult {
  readinessScore: number;
  skillCoverage: number;
  roadmapProgress: number;
  projectCompletion: number;
  interviewReadiness: number;
  recommendedAction: string;
}

const normalize = (value: string) => String(value || '').trim().toLowerCase();

export const careerCatalog: CareerCatalogEntry[] = [
  {
    role: 'NDA',
    slug: 'nda',
    category: 'government',
    dashboardType: 'defence-dashboard',
    roadmapDays: 180,
    difficulty: 'Intermediate',
    salaryRange: '6-12 LPA',
    growthRate: 'High',
    requiredSkills: ['Mathematics', 'English', 'General Knowledge', 'Physical Fitness'],
    recommendedProjects: ['Physical fitness plan', 'Current affairs tracker', 'Mock interview preparation'],
    relatedAlternatives: ['Agniveer Army', 'Agniveer Navy', 'Agniveer Air Force', 'Coast Guard'],
    futureGrowthOpportunities: ['CDS', 'Officer Training', 'Defence Leadership Roles'],
    roadmapTemplate: 'nda-roadmap',
    preferredSubjects: ['Mathematics', 'Physics'],
    eligibility: { qualification: ['12th'], stream: ['Science'], minAge: 16.5, maxAge: 19.5 },
    keywords: ['defence', 'army', 'navy', 'air force', 'military', 'discipline'],
  },
  {
    role: 'Bank PO',
    slug: 'bank-po',
    category: 'government',
    dashboardType: 'government-dashboard',
    roadmapDays: 120,
    difficulty: 'Beginner',
    salaryRange: '5-9 LPA',
    growthRate: 'Medium',
    requiredSkills: ['Quantitative Aptitude', 'Reasoning', 'English', 'General Awareness'],
    recommendedProjects: ['Banking aptitude drills', 'Reasoning workbook', 'Mock interviews'],
    relatedAlternatives: ['Bank Clerk', 'Specialist Officer', 'IBPS PO'],
    futureGrowthOpportunities: ['Bank Manager', 'Branch Manager', 'Risk Analyst'],
    roadmapTemplate: 'bank-po-roadmap',
    preferredSubjects: ['Mathematics', 'Economics'],
    eligibility: { qualification: ["Bachelor's Degree"], minAge: 18, maxAge: 35 },
    keywords: ['bank', 'finance', 'numbers', 'aptitude', 'reasoning'],
  },
  {
    role: 'Railways Engineer',
    slug: 'railways-engineer',
    category: 'government',
    dashboardType: 'government-dashboard',
    roadmapDays: 150,
    difficulty: 'Intermediate',
    salaryRange: '6-11 LPA',
    growthRate: 'Medium',
    requiredSkills: ['Technical Aptitude', 'Problem Solving', 'Engineering Fundamentals'],
    recommendedProjects: ['Infrastructure case study', 'Technical mock tests', 'Maintenance planning exercises'],
    relatedAlternatives: ['Railway Technical Officer', 'RRB JE'],
    futureGrowthOpportunities: ['Senior Engineer', 'Project Manager', 'Infrastructure Lead'],
    roadmapTemplate: 'railways-engineer-roadmap',
    preferredSubjects: ['Mathematics', 'Physics', 'Engineering'],
    eligibility: { qualification: ["Bachelor's Degree", 'Diploma'], minAge: 18, maxAge: 33 },
    keywords: ['railway', 'engineering', 'infrastructure', 'technical'],
  },
  {
    role: 'Civil Services (IAS/IPS/IFS)',
    slug: 'civil-services',
    category: 'government',
    dashboardType: 'government-dashboard',
    roadmapDays: 365,
    difficulty: 'Advanced',
    salaryRange: '10-18 LPA',
    growthRate: 'High',
    requiredSkills: ['Current Affairs', 'General Studies', 'Essay Writing', 'Communication'],
    recommendedProjects: ['Policy brief writing', 'Debate practice', 'Essay portfolio'],
    relatedAlternatives: ['State PSC Officer', 'Judicial Services'],
    futureGrowthOpportunities: ['District Administration', 'Policy Leadership', 'Ministry Roles'],
    roadmapTemplate: 'upsc-roadmap',
    preferredSubjects: ['Political Science', 'History', 'Economics'],
    eligibility: { qualification: ["Bachelor's Degree"], minAge: 21, maxAge: 32 },
    keywords: ['upsc', 'civil services', 'policy', 'administration', 'leadership'],
  },
  {
    role: 'Software Engineer',
    slug: 'software-engineer',
    category: 'private',
    dashboardType: 'software-dashboard',
    roadmapDays: 120,
    difficulty: 'Beginner',
    salaryRange: '6-20 LPA',
    growthRate: 'High',
    requiredSkills: ['Programming', 'Data Structures', 'Algorithms', 'Debugging'],
    recommendedProjects: ['Developer portfolio', 'Command-line utility', 'REST API service'],
    relatedAlternatives: ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Mobile Developer'],
    futureGrowthOpportunities: ['Senior Software Engineer', 'Tech Lead', 'Software Architect'],
    roadmapTemplate: 'software-engineer-roadmap',
    preferredSubjects: ['Computer Science', 'Mathematics'],
    eligibility: { qualification: ["Bachelor's Degree", 'Diploma'], minAge: 18, maxAge: 60 },
    keywords: ['software', 'coding', 'programming', 'developer', 'engineer'],
  },
  {
    role: 'Frontend Developer',
    slug: 'frontend-developer',
    category: 'private',
    dashboardType: 'software-dashboard',
    roadmapDays: 90,
    difficulty: 'Beginner',
    salaryRange: '5-15 LPA',
    growthRate: 'High',
    requiredSkills: ['HTML', 'CSS', 'JavaScript', 'React', 'TypeScript'],
    recommendedProjects: ['Portfolio Website', 'E-Commerce UI', 'Career Guidance Dashboard'],
    relatedAlternatives: ['Full Stack Developer', 'UI/UX Designer', 'Backend Developer'],
    futureGrowthOpportunities: ['Senior Frontend Engineer', 'Design Systems Engineer', 'Product Engineer'],
    roadmapTemplate: 'frontend-roadmap',
    preferredSubjects: ['Computer Science'],
    eligibility: { qualification: ["Bachelor's Degree", 'Diploma'], minAge: 18, maxAge: 60 },
    keywords: ['frontend', 'ui', 'web', 'react', 'javascript'],
  },
  {
    role: 'Backend Developer',
    slug: 'backend-developer',
    category: 'private',
    dashboardType: 'software-dashboard',
    roadmapDays: 120,
    difficulty: 'Intermediate',
    salaryRange: '6-18 LPA',
    growthRate: 'High',
    requiredSkills: ['Node.js', 'APIs', 'Databases', 'Authentication', 'Testing'],
    recommendedProjects: ['REST API', 'Auth service', 'Booking system'],
    relatedAlternatives: ['Full Stack Developer', 'Software Engineer', 'Cloud Engineer'],
    futureGrowthOpportunities: ['Senior Backend Engineer', 'Platform Engineer', 'Software Architect'],
    roadmapTemplate: 'backend-roadmap',
    preferredSubjects: ['Computer Science'],
    eligibility: { qualification: ["Bachelor's Degree", 'Diploma'], minAge: 18, maxAge: 60 },
    keywords: ['backend', 'server', 'api', 'database', 'node'],
  },
  {
    role: 'Full Stack Developer',
    slug: 'full-stack-developer',
    category: 'private',
    dashboardType: 'software-dashboard',
    roadmapDays: 180,
    difficulty: 'Intermediate',
    salaryRange: '6-18 LPA',
    growthRate: 'High',
    requiredSkills: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'MongoDB', 'TypeScript'],
    recommendedProjects: ['Portfolio Website', 'E-Commerce Platform', 'Career Guidance System'],
    relatedAlternatives: ['Frontend Developer', 'Backend Developer', 'Software Engineer'],
    futureGrowthOpportunities: ['Tech Lead', 'Engineering Manager', 'Solution Architect'],
    roadmapTemplate: 'fullstack-roadmap',
    preferredSubjects: ['Computer Science'],
    eligibility: { qualification: ["Bachelor's Degree", 'Diploma'], minAge: 18, maxAge: 60 },
    keywords: ['full stack', 'web', 'react', 'node', 'javascript'],
  },
  {
    role: 'Mobile Developer',
    slug: 'mobile-developer',
    category: 'private',
    dashboardType: 'software-dashboard',
    roadmapDays: 150,
    difficulty: 'Intermediate',
    salaryRange: '6-16 LPA',
    growthRate: 'Medium',
    requiredSkills: ['Flutter', 'React Native', 'Mobile UI', 'State Management', 'APIs'],
    recommendedProjects: ['Habit tracker app', 'Cross-platform portfolio app'],
    relatedAlternatives: ['Full Stack Developer', 'Frontend Developer'],
    futureGrowthOpportunities: ['Senior Mobile Engineer', 'Product Engineer'],
    roadmapTemplate: 'mobile-roadmap',
    preferredSubjects: ['Computer Science'],
    eligibility: { qualification: ["Bachelor's Degree", 'Diploma'], minAge: 18, maxAge: 60 },
    keywords: ['mobile', 'android', 'ios', 'flutter', 'react native'],
  },
  {
    role: 'AI Engineer',
    slug: 'ai-engineer',
    category: 'private',
    dashboardType: 'ai-dashboard',
    roadmapDays: 240,
    difficulty: 'Advanced',
    salaryRange: '10-28 LPA',
    growthRate: 'High',
    requiredSkills: ['Python', 'Machine Learning', 'Deep Learning', 'Model Deployment', 'Statistics'],
    recommendedProjects: ['AI assistant', 'Model evaluation lab', 'Prompt workflow tool'],
    relatedAlternatives: ['ML Engineer', 'NLP Engineer', 'Computer Vision Engineer'],
    futureGrowthOpportunities: ['Senior AI Engineer', 'Applied Scientist', 'AI Architect'],
    roadmapTemplate: 'ai-engineer-roadmap',
    preferredSubjects: ['Mathematics', 'Statistics', 'Computer Science'],
    eligibility: { qualification: ["Bachelor's Degree", "Master's Degree"], stream: ['Science', 'Engineering'], minAge: 18, maxAge: 60 },
    keywords: ['ai', 'machine learning', 'deep learning', 'models', 'ml'],
  },
  {
    role: 'ML Engineer',
    slug: 'ml-engineer',
    category: 'private',
    dashboardType: 'ai-dashboard',
    roadmapDays: 240,
    difficulty: 'Advanced',
    salaryRange: '10-26 LPA',
    growthRate: 'High',
    requiredSkills: ['Python', 'Machine Learning', 'MLOps', 'Statistics', 'Deployment'],
    recommendedProjects: ['Model serving pipeline', 'End-to-end ML project'],
    relatedAlternatives: ['AI Engineer', 'Data Scientist'],
    futureGrowthOpportunities: ['Senior ML Engineer', 'Applied Scientist'],
    roadmapTemplate: 'ml-engineer-roadmap',
    preferredSubjects: ['Mathematics', 'Statistics', 'Computer Science'],
    eligibility: { qualification: ["Bachelor's Degree"], stream: ['Science', 'Engineering'], minAge: 18, maxAge: 60 },
    keywords: ['machine learning', 'ml', 'models', 'data', 'deployment'],
  },
  {
    role: 'NLP Engineer',
    slug: 'nlp-engineer',
    category: 'private',
    dashboardType: 'ai-dashboard',
    roadmapDays: 240,
    difficulty: 'Advanced',
    salaryRange: '10-26 LPA',
    growthRate: 'High',
    requiredSkills: ['Python', 'NLP', 'LLMs', 'Text Processing', 'Evaluation'],
    recommendedProjects: ['Chatbot project', 'Text summarizer', 'Retrieval assistant'],
    relatedAlternatives: ['AI Engineer', 'ML Engineer'],
    futureGrowthOpportunities: ['Senior NLP Engineer', 'LLM Architect'],
    roadmapTemplate: 'nlp-engineer-roadmap',
    preferredSubjects: ['Computer Science', 'Linguistics'],
    eligibility: { qualification: ["Bachelor's Degree"], stream: ['Science', 'Engineering'], minAge: 18, maxAge: 60 },
    keywords: ['nlp', 'language', 'llm', 'text', 'chatbot'],
  },
  {
    role: 'Computer Vision Engineer',
    slug: 'computer-vision-engineer',
    category: 'private',
    dashboardType: 'ai-dashboard',
    roadmapDays: 240,
    difficulty: 'Advanced',
    salaryRange: '10-26 LPA',
    growthRate: 'High',
    requiredSkills: ['Python', 'OpenCV', 'Deep Learning', 'Image Processing', 'Model Deployment'],
    recommendedProjects: ['Image classifier', 'Object detection demo', 'Vision pipeline'],
    relatedAlternatives: ['AI Engineer', 'ML Engineer'],
    futureGrowthOpportunities: ['Senior CV Engineer', 'Applied Scientist'],
    roadmapTemplate: 'computer-vision-roadmap',
    preferredSubjects: ['Computer Science', 'Mathematics'],
    eligibility: { qualification: ["Bachelor's Degree"], stream: ['Science', 'Engineering'], minAge: 18, maxAge: 60 },
    keywords: ['computer vision', 'opencv', 'image', 'vision', 'deep learning'],
  },
  {
    role: 'Data Scientist',
    slug: 'data-scientist',
    category: 'private',
    dashboardType: 'data-dashboard',
    roadmapDays: 210,
    difficulty: 'Intermediate',
    salaryRange: '8-25 LPA',
    growthRate: 'High',
    requiredSkills: ['Python', 'Statistics', 'SQL', 'Data Analysis', 'Machine Learning'],
    recommendedProjects: ['Data dashboard', 'Predictive model', 'Insight report'],
    relatedAlternatives: ['Data Analyst', 'ML Engineer', 'Business Analyst'],
    futureGrowthOpportunities: ['Senior Data Scientist', 'Analytics Lead', 'ML Scientist'],
    roadmapTemplate: 'data-scientist-roadmap',
    preferredSubjects: ['Mathematics', 'Statistics', 'Economics'],
    eligibility: { qualification: ["Bachelor's Degree"], stream: ['Science', 'Engineering', 'Commerce'], minAge: 18, maxAge: 60 },
    keywords: ['data', 'analytics', 'statistics', 'insights', 'machine learning'],
  },
  {
    role: 'Security Analyst',
    slug: 'security-analyst',
    category: 'private',
    dashboardType: 'cyber-dashboard',
    roadmapDays: 180,
    difficulty: 'Intermediate',
    salaryRange: '6-18 LPA',
    growthRate: 'High',
    requiredSkills: ['Networking', 'Linux', 'Security Tools', 'Threat Analysis'],
    recommendedProjects: ['Threat monitoring lab', 'Vulnerability audit', 'Security checklist'],
    relatedAlternatives: ['Penetration Tester', 'SOC Analyst', 'Security Engineer'],
    futureGrowthOpportunities: ['Security Engineer', 'SOC Lead', 'Security Architect'],
    roadmapTemplate: 'cyber-security-roadmap',
    preferredSubjects: ['Computer Science', 'IT'],
    eligibility: { qualification: ["Bachelor's Degree", 'Diploma'], stream: ['Science', 'Engineering'], minAge: 18, maxAge: 60 },
    keywords: ['cyber', 'security', 'threat', 'network', 'incident'],
  },
  {
    role: 'Cloud Engineer',
    slug: 'cloud-engineer',
    category: 'private',
    dashboardType: 'cloud-dashboard',
    roadmapDays: 180,
    difficulty: 'Intermediate',
    salaryRange: '7-22 LPA',
    growthRate: 'High',
    requiredSkills: ['AWS', 'Azure', 'Linux', 'Networking', 'CI/CD'],
    recommendedProjects: ['Cloud deployment lab', 'Infrastructure automation', 'Monitoring setup'],
    relatedAlternatives: ['DevOps Engineer', 'Site Reliability Engineer'],
    futureGrowthOpportunities: ['Senior Cloud Engineer', 'Cloud Architect', 'Platform Engineer'],
    roadmapTemplate: 'cloud-engineer-roadmap',
    preferredSubjects: ['Computer Science', 'IT'],
    eligibility: { qualification: ["Bachelor's Degree", 'Diploma'], minAge: 18, maxAge: 60 },
    keywords: ['cloud', 'aws', 'azure', 'infra', 'deployment'],
  },
  {
    role: 'DevOps Engineer',
    slug: 'devops-engineer',
    category: 'private',
    dashboardType: 'devops-dashboard',
    roadmapDays: 180,
    difficulty: 'Advanced',
    salaryRange: '8-24 LPA',
    growthRate: 'High',
    requiredSkills: ['Linux', 'Docker', 'Kubernetes', 'CI/CD', 'Cloud'],
    recommendedProjects: ['CI/CD pipeline', 'Containerized app', 'Infrastructure as code setup'],
    relatedAlternatives: ['Cloud Engineer', 'Site Reliability Engineer'],
    futureGrowthOpportunities: ['SRE Lead', 'Platform Engineering Manager', 'DevOps Architect'],
    roadmapTemplate: 'devops-roadmap',
    preferredSubjects: ['Computer Science', 'IT'],
    eligibility: { qualification: ["Bachelor's Degree", 'Diploma'], minAge: 18, maxAge: 60 },
    keywords: ['devops', 'ci/cd', 'kubernetes', 'docker', 'automation'],
  },
  {
    role: 'MBA',
    slug: 'mba',
    category: 'higher_studies',
    dashboardType: 'management-dashboard',
    roadmapDays: 365,
    difficulty: 'Intermediate',
    salaryRange: '8-30 LPA',
    growthRate: 'High',
    requiredSkills: ['Communication', 'Business Analysis', 'Quantitative Aptitude', 'Leadership'],
    recommendedProjects: ['Business case study', 'Market analysis', 'Mock consulting deck'],
    relatedAlternatives: ['PGDM', 'MS Abroad'],
    futureGrowthOpportunities: ['Product Manager', 'Business Analyst', 'Operations Manager'],
    roadmapTemplate: 'mba-roadmap',
    preferredSubjects: ['Commerce', 'Economics', 'Management'],
    eligibility: { qualification: ["Bachelor's Degree"], minAge: 20, maxAge: 60 },
    keywords: ['mba', 'management', 'business', 'leadership', 'operations'],
  },
  {
    role: 'MTech',
    slug: 'mtech',
    category: 'higher_studies',
    dashboardType: 'engineering-dashboard',
    roadmapDays: 365,
    difficulty: 'Advanced',
    salaryRange: '8-20 LPA',
    growthRate: 'Medium',
    requiredSkills: ['Technical Depth', 'Research', 'Problem Solving'],
    recommendedProjects: ['Research review', 'Technical paper summary', 'Prototype build'],
    relatedAlternatives: ['MS Abroad', 'Research Scholar'],
    futureGrowthOpportunities: ['Research Engineer', 'R&D Lead', 'Technical Specialist'],
    roadmapTemplate: 'mtech-roadmap',
    preferredSubjects: ['Engineering', 'Mathematics'],
    eligibility: { qualification: ["Bachelor's Degree"], stream: ['Engineering'], minAge: 20, maxAge: 60 },
    keywords: ['mtech', 'engineering', 'research', 'technical'],
  },
  {
    role: 'MS Abroad',
    slug: 'ms-abroad',
    category: 'higher_studies',
    dashboardType: 'study-abroad-dashboard',
    roadmapDays: 365,
    difficulty: 'Advanced',
    salaryRange: 'Varies',
    growthRate: 'High',
    requiredSkills: ['GRE', 'TOEFL/IELTS', 'Statement of Purpose', 'Research'],
    recommendedProjects: ['Application portfolio', 'SOP draft', 'Research statement'],
    relatedAlternatives: ['MTech', 'PhD'],
    futureGrowthOpportunities: ['Research Associate', 'Specialist Engineer', 'Global Product Roles'],
    roadmapTemplate: 'ms-abroad-roadmap',
    preferredSubjects: ['Engineering', 'Science', 'Computer Science'],
    eligibility: { qualification: ["Bachelor's Degree"], minAge: 20, maxAge: 60 },
    keywords: ['ms abroad', 'masters', 'overseas', 'research', 'study abroad'],
  },
];

export const careerCatalogAliases: Record<string, string> = {
  'full stack': 'Full Stack Developer',
  fullstack: 'Full Stack Developer',
  'frontend developer': 'Frontend Developer',
  'backend developer': 'Backend Developer',
  'software developer': 'Software Engineer',
  'software development': 'Software Engineer',
  'ai engineer': 'AI Engineer',
  'ml engineer': 'ML Engineer',
  'data scientist': 'Data Scientist',
  'cyber security': 'Security Analyst',
  'cloud engineer': 'Cloud Engineer',
  'devops engineer': 'DevOps Engineer',
  mba: 'MBA',
  mtech: 'MTech',
  'ms abroad': 'MS Abroad',
};

export const getCareerByRole = (role: string) => {
  const normalizedRole = normalize(role);
  const resolvedRole = careerCatalogAliases[normalizedRole] || role;
  return careerCatalog.find((entry) => normalize(entry.role) === normalize(resolvedRole) || normalize(entry.slug) === normalize(resolvedRole));
};

export const getCareerBySlug = (slug: string) => careerCatalog.find((entry) => entry.slug === normalize(slug));

export const getCareersByCategory = (category: CareerCategory) => careerCatalog.filter((entry) => entry.category === category);

export const calculatePlacementReadiness = (
  entry: CareerCatalogEntry,
  metrics: PlacementReadinessMetrics
): PlacementReadinessResult => {
  const skillCoverage = Math.max(0, Math.min(100, Math.round(metrics.skillCoverage)));
  const roadmapProgress = Math.max(0, Math.min(100, Math.round(metrics.roadmapProgress)));
  const projectCompletion = Math.max(0, Math.min(100, Math.round(metrics.projectCompletion)));
  const quizPerformance = Math.max(0, Math.min(100, Math.round(metrics.quizPerformance)));

  const readinessScore = Math.round(
    skillCoverage * 0.4 +
    roadmapProgress * 0.25 +
    projectCompletion * 0.2 +
    quizPerformance * 0.15
  );

  const interviewReadiness = Math.round(
    skillCoverage * 0.35 +
    projectCompletion * 0.25 +
    quizPerformance * 0.25 +
    roadmapProgress * 0.15
  );

  const recommendedAction = skillCoverage < 60
    ? `Strengthen ${entry.requiredSkills.slice(0, 3).join(', ')}`
    : projectCompletion < 60
      ? `Complete ${entry.recommendedProjects[0] || 'one role-specific project'}`
      : quizPerformance < 60
        ? 'Revise role-specific fundamentals and practice quizzes'
        : 'Apply for internships and mock interviews';

  return {
    readinessScore,
    skillCoverage,
    roadmapProgress,
    projectCompletion,
    interviewReadiness,
    recommendedAction,
  };
};

export const roleMetadata = Object.fromEntries(
  careerCatalog.map((entry) => [entry.role, {
    role: entry.role,
    dashboardType: entry.dashboardType,
    durationDays: entry.roadmapDays,
    difficulty: entry.difficulty,
    roadmapTemplate: entry.roadmapTemplate,
    requiredSkills: entry.requiredSkills,
  }])
) as Record<string, {
  role: string;
  dashboardType: string;
  durationDays: number;
  difficulty: CareerDifficulty;
  roadmapTemplate: string;
  requiredSkills: string[];
}>;
