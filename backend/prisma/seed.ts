import { MongoClient, ObjectId } from 'mongodb';
import { hashPassword } from '../src/utils/password';
import { generateRefreshToken } from '../src/utils/jwt';

const mongoUrl = process.env.DATABASE_URL;
const mongoDbName = process.env.DB_NAME || 'Pragyan';

async function clearSeedCollections() {
  if (!mongoUrl) {
    throw new Error('DATABASE_URL is required for seed cleanup');
  }

  const client = new MongoClient(mongoUrl);
  try {
    await client.connect();
    const db = client.db(mongoDbName);
    const collections = [
      'Resource',
      'DailyTask',
      'Skill',
      'RefreshToken',
      'CurrentUser',
      'AdminUser',
      'UserRoadmap',
      'TaskProgress',
      'AssessmentAnswer',
      'AssessmentQuestion',
      'Assessment',
      'CareerMatch',
      'User',
    ];

    await Promise.all(
      collections.map((collectionName) => db.collection(collectionName).deleteMany({}))
    );
  } finally {
    await client.close();
  }
}

const skillSeeds = [
  {
    skillName: 'HTML & CSS Fundamentals',
    skillCategory: 'frontend',
    difficulty: 'beginner',
    description: 'Learn semantic HTML, modern CSS, Flexbox, Grid, accessibility, and responsive layouts.',
    totalDuration: '4 weeks',
    estimatedHours: 40,
    icon: '🎨',
    color: 'primary',
    prerequisites: [],
    relatedSkills: ['JavaScript Fundamentals'],
    totalDays: 28,
    dailyTasks: [
      {
        taskNumber: 1,
        title: 'Introduction to Web',
        description: 'Understand the web and HTML basics.',
        estimatedTime: '45 mins',
        subtasks: ['How the web works', 'Client-server basics', 'HTML file structure'],
        resources: [
          {
            title: 'W3Schools - Introduction to the Web',
            url: 'https://www.w3schools.com/html/html_intro.asp',
            description: 'Learn how the web works.',
            platform: 'W3Schools',
            type: 'documentation',
          },
          {
            title: 'W3Schools HTML Tutorial',
            url: 'https://www.w3schools.com/html/',
            description: 'Interactive HTML tutorial.',
            platform: 'W3Schools',
            type: 'tutorial',
          },
        ],
      },
      {
        taskNumber: 2,
        title: 'Semantic HTML',
        description: 'Build structured, accessible HTML pages.',
        estimatedTime: '50 mins',
        subtasks: ['Semantic tags', 'Forms', 'Media elements'],
        resources: [
          {
            title: 'W3Schools Semantic HTML',
            url: 'https://www.w3schools.com/html/html5_semantic_elements.asp',
            description: 'Semantic markup reference.',
            platform: 'W3Schools',
            type: 'documentation',
          },
        ],
      },
      {
        taskNumber: 3,
        title: 'CSS Layouts',
        description: 'Use Flexbox and Grid to create responsive layouts.',
        estimatedTime: '60 mins',
        subtasks: ['Box model', 'Flexbox', 'Grid layouts'],
        resources: [
          {
            title: 'W3Schools Flexbox',
            url: 'https://www.w3schools.com/css/css3_flexbox.asp',
            description: 'Flexbox layout guide.',
            platform: 'W3Schools',
            type: 'documentation',
          },
        ],
      },
    ],
  },
  {
    skillName: 'JavaScript Fundamentals',
    skillCategory: 'frontend',
    difficulty: 'beginner',
    description: 'Master JavaScript syntax, DOM manipulation, events, and async programming.',
    totalDuration: '5 weeks',
    estimatedHours: 50,
    icon: '✨',
    color: 'secondary',
    prerequisites: ['HTML & CSS Fundamentals'],
    relatedSkills: ['React Fundamentals'],
    totalDays: 35,
    dailyTasks: [
      {
        taskNumber: 1,
        title: 'Variables and Data Types',
        description: 'Learn variables, primitives, and coercion.',
        estimatedTime: '60 mins',
        subtasks: ['let, const', 'Strings, numbers, booleans', 'Undefined vs null'],
        resources: [
          {
            title: 'W3Schools JavaScript Tutorial',
            url: 'https://www.w3schools.com/js/default.asp',
            description: 'Official JavaScript guide.',
            platform: 'W3Schools',
            type: 'documentation',
          },
        ],
      },
      {
        taskNumber: 2,
        title: 'Functions and Scope',
        description: 'Work with functions, closures, and scope.',
        estimatedTime: '60 mins',
        subtasks: ['Function declarations', 'Arrow functions', 'Closures'],
        resources: [
          {
            title: 'JavaScript.info Functions',
            url: 'https://javascript.info/function-basics',
            description: 'Functions and scope tutorial.',
            platform: 'JavaScript.info',
            type: 'tutorial',
          },
        ],
      },
    ],
  },
  {
    skillName: 'React Fundamentals',
    skillCategory: 'frontend',
    difficulty: 'intermediate',
    description: 'Build component-based user interfaces with React hooks, props, and state.',
    totalDuration: '6 weeks',
    estimatedHours: 60,
    icon: '⚛️',
    color: 'accent',
    prerequisites: ['JavaScript Fundamentals'],
    relatedSkills: ['Node.js Backend'],
    totalDays: 42,
    dailyTasks: [
      {
        taskNumber: 1,
        title: 'React Setup',
        description: 'Set up a React app and understand JSX.',
        estimatedTime: '45 mins',
        subtasks: ['Project setup', 'JSX syntax', 'Component structure'],
        resources: [
          {
            title: 'React Docs - Quick Start',
            url: 'https://react.dev/learn',
            description: 'Official React learning path.',
            platform: 'React',
            type: 'documentation',
          },
        ],
      },
      {
        taskNumber: 2,
        title: 'State and Props',
        description: 'Pass data with props and manage component state.',
        estimatedTime: '60 mins',
        subtasks: ['Props basics', 'useState', 'Component composition'],
        resources: [
          {
            title: 'React State Guide',
            url: 'https://react.dev/learn/state-a-components-memory',
            description: 'Learn component state.',
            platform: 'React',
            type: 'documentation',
          },
        ],
      },
    ],
  },
  {
    skillName: 'Node.js Backend',
    skillCategory: 'backend',
    difficulty: 'intermediate',
    description: 'Create APIs with Node.js, Express, and MongoDB integration.',
    totalDuration: '6 weeks',
    estimatedHours: 60,
    icon: '🟢',
    color: 'success',
    prerequisites: ['JavaScript Fundamentals'],
    relatedSkills: ['React Fundamentals'],
    totalDays: 42,
    dailyTasks: [
      {
        taskNumber: 1,
        title: 'Node.js Setup',
        description: 'Set up Node.js and npm.',
        estimatedTime: '30 mins',
        subtasks: ['Install Node.js', 'npm basics', 'Run scripts'],
        resources: [
          {
            title: 'Node.js Docs',
            url: 'https://nodejs.org/en/learn',
            description: 'Official Node.js learning resource.',
            platform: 'Node.js',
            type: 'documentation',
          },
        ],
      },
      {
        taskNumber: 2,
        title: 'Express APIs',
        description: 'Build REST endpoints with Express.',
        estimatedTime: '60 mins',
        subtasks: ['Routing', 'Middleware', 'Request validation'],
        resources: [
          {
            title: 'Express Guide',
            url: 'https://expressjs.com/en/guide/routing.html',
            description: 'Express routing guide.',
            platform: 'Express',
            type: 'documentation',
          },
        ],
      },
    ],
  },
];

async function main() {
  console.log('Starting MongoDB seed...');

  if (!mongoUrl) {
    throw new Error('DATABASE_URL is required for seeding');
  }

  await clearSeedCollections();

  const client = new MongoClient(mongoUrl);
  await client.connect();

  try {
    const db = client.db(mongoDbName);
    const now = new Date();

    const usersCollection = db.collection('User');
    const currentUsersCollection = db.collection('CurrentUser');
    const adminUsersCollection = db.collection('AdminUser');
    const skillsCollection = db.collection('Skill');
    const dailyTasksCollection = db.collection('DailyTask');
    const resourcesCollection = db.collection('Resource');
    const assessmentCollection = db.collection('Assessment');
    const assessmentQuestionsCollection = db.collection('AssessmentQuestion');
    const careerMatchesCollection = db.collection('CareerMatch');

    const adminId = new ObjectId();
    const sampleUserIds = [new ObjectId(), new ObjectId(), new ObjectId()];
    const adminPassword = await hashPassword('admin123');
    const userPassword = await hashPassword('user123');

    const users = [
      {
        _id: adminId,
        fullName: 'Admin User',
        email: 'admin@pragyan.com',
        password: adminPassword,
        role: 'ADMIN',
        age: null,
        location: null,
        phone: null,
        linkedin: null,
        skills: ['HTML & CSS Fundamentals', 'JavaScript Fundamentals'],
        interests: ['Web Development', 'Backend Development'],
        preferences: [],
        experience: null,
        experienceType: 'fresher',
        education: null,
        educationEntries: [],
        skillLevel: 'Advanced',
        xp: 1000,
        streak: 0,
        createdAt: now,
        updatedAt: now,
      },
      ...sampleUserIds.map((id, index) => ({
        _id: id,
        fullName: `Sample User ${index + 1}`,
        email: `user${index + 1}@pragyan.com`,
        password: userPassword,
        role: 'USER',
        age: null,
        location: null,
        phone: null,
        linkedin: null,
        skills: [],
        interests: ['Web Development', 'AI/ML'],
        preferences: [],
        experience: null,
        experienceType: 'fresher',
        education: null,
        educationEntries: [],
        skillLevel: 'Beginner',
        xp: Math.round(Math.random() * 500),
        streak: 0,
        createdAt: now,
        updatedAt: now,
      })),
    ];

    await Promise.all([
      usersCollection.insertMany(users as any[]),
      currentUsersCollection.insertMany(
        users.map((user) => ({
          _id: user._id,
          userId: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          age: user.age,
          location: user.location,
          phone: user.phone,
          linkedin: user.linkedin,
          skills: user.skills,
          interests: user.interests,
          preferences: user.preferences,
          experience: user.experience,
          experienceType: user.experienceType,
          education: user.education,
          educationEntries: user.educationEntries,
          skillLevel: user.skillLevel,
          xp: user.xp,
          streak: user.streak,
          active: true,
          lastLoginAt: now,
          createdAt: now,
          updatedAt: now,
        })) as any[]
      ),
      adminUsersCollection.insertMany([
        {
          _id: adminId,
          userId: adminId,
          email: 'admin@pragyan.com',
          fullName: 'Admin User',
          role: 'ADMIN',
          xp: 1000,
          streak: 0,
          active: true,
          createdAt: now,
          updatedAt: now,
        },
      ] as any[]),
    ]);

    await Promise.all(
      skillSeeds.map(async (skillSeed) => {
      const skillId = new ObjectId();
      const taskDocuments: Array<Record<string, unknown>> = [];
      const resourceDocuments: Array<Record<string, unknown>> = [];

      for (const task of skillSeed.dailyTasks) {
        const taskId = new ObjectId();
        taskDocuments.push({
          _id: taskId,
          skillId,
          taskNumber: task.taskNumber,
          title: task.title,
          description: task.description,
          estimatedTime: task.estimatedTime,
          subtasks: task.subtasks,
          xp: 0,
          createdAt: now,
          updatedAt: now,
        });

        for (const resource of task.resources) {
          resourceDocuments.push({
            _id: new ObjectId(),
            taskId,
            title: resource.title,
            url: resource.url,
            description: resource.description,
            platform: resource.platform,
            type: resource.type,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      await skillsCollection.insertOne({
        _id: skillId,
        skillName: skillSeed.skillName,
        skillCategory: skillSeed.skillCategory,
        difficulty: skillSeed.difficulty,
        description: skillSeed.description,
        totalDuration: skillSeed.totalDuration,
        estimatedHours: skillSeed.estimatedHours,
        icon: skillSeed.icon,
        color: skillSeed.color,
        prerequisites: skillSeed.prerequisites,
        relatedSkills: skillSeed.relatedSkills,
        totalDays: skillSeed.totalDays,
        createdAt: now,
        updatedAt: now,
      });

      if (taskDocuments.length > 0) {
        await dailyTasksCollection.insertMany(taskDocuments as any[]);
      }

      if (resourceDocuments.length > 0) {
        await resourcesCollection.insertMany(resourceDocuments as any[]);
      }
    })
    );

    const assessmentId = new ObjectId();
    await assessmentCollection.insertOne({
      _id: assessmentId,
      title: 'Career Direction Assessment',
      description: 'Short assessment to understand your current interests and goals.',
      createdAt: now,
      updatedAt: now,
    });

    const assessmentQuestions = [
    {
      questionText: 'Do you enjoy building user interfaces?',
      options: ['Yes', 'No', 'Maybe'],
      category: 'frontend',
    },
    {
      questionText: 'Do you enjoy working with APIs and databases?',
      options: ['Yes', 'No', 'Maybe'],
      category: 'backend',
    },
    {
      questionText: 'Are you interested in data and machine learning?',
      options: ['Yes', 'No', 'Maybe'],
      category: 'ai-ml',
    },
    {
      questionText: 'Do you like automation and deployment?',
      options: ['Yes', 'No', 'Maybe'],
      category: 'devops',
    },
    {
      questionText: 'Are you curious about security and ethical hacking?',
      options: ['Yes', 'No', 'Maybe'],
      category: 'cyber-security',
    },
  ];

    await Promise.all([
      assessmentQuestionsCollection.insertMany(
        assessmentQuestions.map((question) => ({
          _id: new ObjectId(),
          assessmentId,
          questionText: question.questionText,
          options: question.options,
          category: question.category,
          createdAt: now,
          updatedAt: now,
        })) as any[]
      ),
      careerMatchesCollection.insertMany([
        {
          _id: new ObjectId(),
          userId: sampleUserIds[0],
          careerTitle: 'Frontend Developer',
          company: 'Pragyan Labs',
          description: 'Strong fit for frontend roles focused on React and design systems.',
          matchScore: 92,
          requiredSkills: ['React', 'TypeScript', 'CSS'],
          growthAreas: ['Testing', 'Performance optimization'],
          salaryRange: '$70k - $110k',
          jobMarketDemand: 8,
          createdAt: now,
          updatedAt: now,
        },
        {
          _id: new ObjectId(),
          userId: adminId,
          careerTitle: 'Full Stack Engineer',
          company: 'Pragyan Labs',
          description: 'Experienced profile with backend, frontend, and platform skills.',
          matchScore: 98,
          requiredSkills: ['Node.js', 'React', 'MongoDB'],
          growthAreas: ['Leadership', 'Architecture'],
          salaryRange: '$110k - $150k',
          jobMarketDemand: 9,
          createdAt: now,
          updatedAt: now,
        },
      ] as any[]),
    ]);

    const seededUsers = await usersCollection.countDocuments();
    console.log(`Seeded ${skillSeeds.length} skill roadmaps, demo users, assessment data, and career matches.`);
    console.log(`User documents in MongoDB: ${seededUsers}`);
  } finally {
    await client.close();
  }
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
