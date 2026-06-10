export type ResourceCatalogSlot = "docs" | "video" | "practice" | "quiz" | "project";

export interface ResourceCatalogItem {
  title: string;
  url: string;
  provider: string;
  description?: string;
  estimatedMinutes?: number;
}

export interface ResourceCatalogEntry {
  docs?: ResourceCatalogItem[];
  video?: ResourceCatalogItem[];
  practice?: ResourceCatalogItem[];
  quiz?: ResourceCatalogItem[];
  project?: ResourceCatalogItem[];
}

type ResourceType = "youtube" | "documentation" | "practice" | "article" | "mini-project" | "certification";

const resourceCatalog: Record<string, ResourceCatalogEntry> = {
  html: {
    docs: [
      {
        title: "W3Schools HTML Introduction",
        url: "https://www.w3schools.com/html/html_intro.asp",
        provider: "W3Schools",
        description: "Official HTML introduction and learning path.",
        estimatedMinutes: 20,
      },
    ],
    video: [
      {
        title: "freeCodeCamp HTML Course",
        url: "https://www.youtube.com/@freecodecamp",
        provider: "freeCodeCamp",
        description: "Long-form HTML learning from a trusted source.",
        estimatedMinutes: 45,
      },
    ],
    practice: [
      {
        title: "Build a Semantic Landing Page",
        url: "https://www.freecodecamp.org/learn/2022/responsive-web-design/",
        provider: "freeCodeCamp",
        description: "Hands-on practice for semantic HTML structure.",
        estimatedMinutes: 40,
      },
    ],
    quiz: [
      {
        title: "HTML Quick Check",
        url: "https://www.w3schools.com/quiztest/quiztest.asp?qtest=HTML",
        provider: "W3Schools",
        description: "Short self-check after the documentation pass.",
        estimatedMinutes: 10,
      },
    ],
  },
  react: {
    docs: [
      {
        title: "W3Schools React Tutorial",
        url: "https://www.w3schools.com/react/",
        provider: "W3Schools",
        description: "React learning path on W3Schools.",
        estimatedMinutes: 25,
      },
      {
        title: "roadmap.sh React Path",
        url: "https://roadmap.sh/react",
        provider: "roadmap.sh",
        description: "A structured overview of React fundamentals and ecosystem.",
        estimatedMinutes: 20,
      },
    ],
    video: [
      {
        title: "Hitesh Choudhary React Playlist",
        url: "https://www.youtube.com/@HiteshChoudharydotcom",
        provider: "Hitesh Choudhary",
        description: "Practical React walkthroughs and project builds.",
        estimatedMinutes: 60,
      },
      {
        title: "freeCodeCamp React Course",
        url: "https://www.youtube.com/@freecodecamp",
        provider: "freeCodeCamp",
        description: "Trusted long-form React instruction.",
        estimatedMinutes: 90,
      },
    ],
    practice: [
      {
        title: "Build a React Todo App",
        url: "https://www.frontendmentor.io/",
        provider: "Frontend Mentor",
        description: "A compact practice build to reinforce React state flow.",
        estimatedMinutes: 45,
      },
    ],
    quiz: [
      {
        title: "React Knowledge Check",
        url: "https://www.w3schools.com/react/react_quiz.asp",
        provider: "W3Schools",
        description: "Self-check after the React docs pass.",
        estimatedMinutes: 12,
      },
    ],
    project: [
      {
        title: "Build a React Dashboard",
        url: "https://github.com/search?q=react+dashboard+project&type=repositories",
        provider: "Project Brief",
        description: "A capstone-style build to apply React concepts.",
        estimatedMinutes: 90,
      },
    ],
  },
  linux: {
    docs: [
      {
        title: "Ubuntu Documentation",
        url: "https://help.ubuntu.com/",
        provider: "Ubuntu Docs",
        description: "Trusted Linux desktop and server documentation.",
        estimatedMinutes: 20,
      },
      {
        title: "Linux Journey",
        url: "https://linuxjourney.com/",
        provider: "Linux Journey",
        description: "Friendly Linux fundamentals and command-line learning.",
        estimatedMinutes: 25,
      },
    ],
    video: [
      {
        title: "Linux Journey Video Companion",
        url: "https://www.youtube.com/results?search_query=linux+basics+linux+journey",
        provider: "YouTube",
        description: "Video explanation of Linux essentials.",
        estimatedMinutes: 40,
      },
    ],
    practice: [
      {
        title: "Practice Shell Navigation",
        url: "https://www.overthewire.org/wargames/bandit/",
        provider: "OverTheWire",
        description: "Hands-on Linux terminal practice.",
        estimatedMinutes: 45,
      },
    ],
    quiz: [
      {
        title: "Linux Quick Check",
        url: "https://linuxjourney.com/lesson/introduction",
        provider: "Linux Journey",
        description: "Short checkpoint for command-line basics.",
        estimatedMinutes: 10,
      },
    ],
  },
  "ethical hacking": {
    docs: [
      {
        title: "PortSwigger Web Security Academy",
        url: "https://portswigger.net/web-security",
        provider: "PortSwigger",
        description: "Industry-trusted web security documentation and labs.",
        estimatedMinutes: 25,
      },
    ],
    video: [
      {
        title: "TryHackMe Offensive Security Intro",
        url: "https://www.youtube.com/results?search_query=tryhackme+web+security",
        provider: "YouTube",
        description: "Trusted intro videos for ethical hacking concepts.",
        estimatedMinutes: 45,
      },
    ],
    practice: [
      {
        title: "TryHackMe Beginner Path",
        url: "https://tryhackme.com/",
        provider: "TryHackMe",
        description: "Hands-on security labs for practical learning.",
        estimatedMinutes: 60,
      },
    ],
    quiz: [
      {
        title: "Security Knowledge Check",
        url: "https://portswigger.net/web-security/all-materials",
        provider: "PortSwigger",
        description: "Checkpoint after the academy docs pass.",
        estimatedMinutes: 12,
      },
    ],
  },
  python: {
    docs: [
      {
        title: "Python Documentation",
        url: "https://docs.python.org/3/tutorial/",
        provider: "Python Docs",
        description: "Official Python tutorial and reference.",
        estimatedMinutes: 20,
      },
    ],
    video: [
      {
        title: "freeCodeCamp Python Course",
        url: "https://www.youtube.com/@freecodecamp",
        provider: "freeCodeCamp",
        description: "Long-form Python instruction from a trusted channel.",
        estimatedMinutes: 90,
      },
    ],
    practice: [
      {
        title: "Python Exercises",
        url: "https://www.freecodecamp.org/learn/scientific-computing-with-python/",
        provider: "freeCodeCamp",
        description: "Practice loops, functions, and data structures.",
        estimatedMinutes: 45,
      },
    ],
    quiz: [
      {
        title: "Python Quick Check",
        url: "https://docs.python.org/3/tutorial/",
        provider: "Python Docs",
        description: "Quick self-check after the docs pass.",
        estimatedMinutes: 10,
      },
    ],
  },
  ml: {
    docs: [
      {
        title: "Kaggle Learn Micro-Courses",
        url: "https://www.kaggle.com/learn",
        provider: "Kaggle",
        description: "Practical docs-style learning for core ML workflows.",
        estimatedMinutes: 25,
      },
      {
        title: "Fast.ai Course",
        url: "https://course.fast.ai/",
        provider: "FastAI",
        description: "Deep practical machine learning learning path.",
        estimatedMinutes: 30,
      },
    ],
    video: [
      {
        title: "Andrew Ng Machine Learning Specialization",
        url: "https://www.coursera.org/specializations/machine-learning-introduction",
        provider: "Coursera / Andrew Ng",
        description: "The canonical video-backed ML introduction.",
        estimatedMinutes: 80,
      },
    ],
    practice: [
      {
        title: "Kaggle Titanic Starter Project",
        url: "https://www.kaggle.com/learn/intro-to-machine-learning",
        provider: "Kaggle",
        description: "Hands-on ML practice with notebooks and datasets.",
        estimatedMinutes: 60,
      },
    ],
    quiz: [
      {
        title: "Machine Learning Quick Check",
        url: "https://www.kaggle.com/learn/intro-to-machine-learning",
        provider: "Kaggle",
        description: "Checkpoint after foundational ML lessons.",
        estimatedMinutes: 12,
      },
    ],
  },
  "full stack developer": {
    docs: [
      {
        title: "Full Stack Developer Learning Path",
        url: "https://www.freecodecamp.org/learn/",
        provider: "freeCodeCamp",
        description: "A comprehensive full stack learning path with official curriculum and projects.",
        estimatedMinutes: 30,
      },
    ],
    video: [
      {
        title: "Full Stack Developer Roadmap",
        url: "https://www.youtube.com/results?search_query=full+stack+developer+roadmap",
        provider: "YouTube",
        description: "A practical video roadmap for full stack developers.",
        estimatedMinutes: 45,
      },
    ],
    practice: [
      {
        title: "freeCodeCamp Full Stack Projects",
        url: "https://www.freecodecamp.org/learn/",
        provider: "freeCodeCamp",
        description: "Hands-on full stack practice exercises and projects.",
        estimatedMinutes: 50,
      },
    ],
  },
  "frontend developer": {
    docs: [
      {
        title: "MDN Web Docs for Frontend",
        url: "https://developer.mozilla.org/en-US/docs/Learn/Front-end_web_developer",
        provider: "MDN",
        description: "The official frontend web developer learning path.",
        estimatedMinutes: 30,
      },
    ],
    video: [
      {
        title: "Frontend Developer Tutorial",
        url: "https://www.youtube.com/results?search_query=frontend+developer+course",
        provider: "YouTube",
        description: "A beginner-friendly frontend developer video course.",
        estimatedMinutes: 45,
      },
    ],
    practice: [
      {
        title: "Frontend Mentor Challenges",
        url: "https://www.frontendmentor.io/",
        provider: "Frontend Mentor",
        description: "Practical frontend building challenges and templates.",
        estimatedMinutes: 45,
      },
    ],
  },
  "backend developer": {
    docs: [
      {
        title: "Node.js Official Docs",
        url: "https://nodejs.org/en/docs/",
        provider: "Node.js Docs",
        description: "The official documentation for building backend services with Node.js.",
        estimatedMinutes: 25,
      },
    ],
    video: [
      {
        title: "Node.js Crash Course",
        url: "https://www.youtube.com/results?search_query=nodejs+crash+course",
        provider: "YouTube",
        description: "A practical backend developer video walkthrough.",
        estimatedMinutes: 45,
      },
    ],
    practice: [
      {
        title: "freeCodeCamp APIs and Microservices",
        url: "https://www.freecodecamp.org/learn/back-end-development-and-apis/",
        provider: "freeCodeCamp",
        description: "Hands-on backend API and Express.js practice.",
        estimatedMinutes: 50,
      },
    ],
  },
  "data scientist": {
    docs: [
      {
        title: "Kaggle Learn Data Science",
        url: "https://www.kaggle.com/learn",
        provider: "Kaggle",
        description: "Data science learning modules and documentation.",
        estimatedMinutes: 25,
      },
    ],
    video: [
      {
        title: "Data Science Course",
        url: "https://www.youtube.com/results?search_query=data+science+course",
        provider: "YouTube",
        description: "A beginner data science video course.",
        estimatedMinutes: 45,
      },
    ],
    practice: [
      {
        title: "freeCodeCamp Data Analysis",
        url: "https://www.freecodecamp.org/learn/data-analysis-with-python/",
        provider: "freeCodeCamp",
        description: "Practical data analysis exercises.",
        estimatedMinutes: 50,
      },
    ],
  },
  "data analyst": {
    docs: [
      {
        title: "SQLBolt Interactive SQL",
        url: "https://sqlbolt.com/",
        provider: "SQLBolt",
        description: "Structured SQL tutorials and exercises.",
        estimatedMinutes: 25,
      },
    ],
    video: [
      {
        title: "Data Analyst Course",
        url: "https://www.youtube.com/results?search_query=data+analyst+course",
        provider: "YouTube",
        description: "A practical introduction to data analyst skills.",
        estimatedMinutes: 45,
      },
    ],
    practice: [
      {
        title: "Kaggle SQL and Data Analysis",
        url: "https://www.kaggle.com/learn/sql",
        provider: "Kaggle",
        description: "Hands-on SQL and data analysis practice.",
        estimatedMinutes: 45,
      },
    ],
  },
  "mobile app developer": {
    docs: [
      {
        title: "React Native Docs",
        url: "https://reactnative.dev/docs/getting-started",
        provider: "React Native Docs",
        description: "Official React Native documentation for mobile apps.",
        estimatedMinutes: 25,
      },
    ],
    video: [
      {
        title: "Flutter & React Native Tutorials",
        url: "https://www.youtube.com/results?search_query=mobile+app+development+flutter+react+native",
        provider: "YouTube",
        description: "Mobile app development videos for cross-platform frameworks.",
        estimatedMinutes: 45,
      },
    ],
    practice: [
      {
        title: "React Native Project Practice",
        url: "https://www.freecodecamp.org/learn/front-end-development-libraries/",
        provider: "freeCodeCamp",
        description: "Hands-on React Native and mobile web practice.",
        estimatedMinutes: 50,
      },
    ],
  },
  "devops engineer": {
    docs: [
      {
        title: "Docker Documentation",
        url: "https://docs.docker.com/",
        provider: "Docker Docs",
        description: "Official Docker docs for container workflows.",
        estimatedMinutes: 25,
      },
    ],
    video: [
      {
        title: "DevOps Roadmap Video",
        url: "https://www.youtube.com/results?search_query=devops+roadmap",
        provider: "YouTube",
        description: "DevOps learning path and CI/CD introduction videos.",
        estimatedMinutes: 45,
      },
    ],
    practice: [
      {
        title: "Linux Journey Practice",
        url: "https://linuxjourney.com/",
        provider: "Linux Journey",
        description: "Hands-on Linux and DevOps skill practice.",
        estimatedMinutes: 45,
      },
    ],
  },
  "cloud engineer": {
    docs: [
      {
        title: "AWS Skill Builder",
        url: "https://aws.amazon.com/training/",
        provider: "AWS",
        description: "Official cloud learning paths on AWS Skill Builder.",
        estimatedMinutes: 30,
      },
    ],
    video: [
      {
        title: "Cloud Engineer Introduction",
        url: "https://www.youtube.com/results?search_query=cloud+engineer+course",
        provider: "YouTube",
        description: "Cloud engineering video walkthroughs and fundamentals.",
        estimatedMinutes: 45,
      },
    ],
    practice: [
      {
        title: "Google Cloud Skills Boost",
        url: "https://cloud.google.com/skillsboost",
        provider: "Google Cloud",
        description: "Hands-on cloud labs and practical exercises.",
        estimatedMinutes: 45,
      },
    ],
  },
  "cyber security engineer": {
    docs: [
      {
        title: "PortSwigger Web Security Academy",
        url: "https://portswigger.net/web-security",
        provider: "PortSwigger",
        description: "Official web security academy documentation and labs.",
        estimatedMinutes: 25,
      },
    ],
    video: [
      {
        title: "Cyber Security Course",
        url: "https://www.youtube.com/results?search_query=cyber+security+course",
        provider: "YouTube",
        description: "Cyber security essentials and defensive tactics.",
        estimatedMinutes: 45,
      },
    ],
    practice: [
      {
        title: "TryHackMe Beginner Path",
        url: "https://tryhackme.com/",
        provider: "TryHackMe",
        description: "Hands-on cyber security labs and exercises.",
        estimatedMinutes: 60,
      },
    ],
  },
  "ui/ux designer": {
    docs: [
      {
        title: "Figma Learn",
        url: "https://www.figma.com/learn/",
        provider: "Figma",
        description: "Official Figma UX design learning resources.",
        estimatedMinutes: 25,
      },
    ],
    video: [
      {
        title: "UX Design Course",
        url: "https://www.youtube.com/results?search_query=ux+design+course",
        provider: "YouTube",
        description: "Introductory UX design video lessons.",
        estimatedMinutes: 45,
      },
    ],
    practice: [
      {
        title: "Google UX Design Exercises",
        url: "https://grow.google/programs/ux-design/",
        provider: "Google UX",
        description: "Practical UX research and prototyping exercises.",
        estimatedMinutes: 45,
      },
    ],
  },
  "software engineer": {
    docs: [
      {
        title: "CS50 Harvard",
        url: "https://cs50.harvard.edu/x/2024/",
        provider: "Harvard",
        description: "Core software engineering concepts and system design documentation.",
        estimatedMinutes: 30,
      },
    ],
    video: [
      {
        title: "Software Engineering Course",
        url: "https://www.youtube.com/results?search_query=software+engineering+course",
        provider: "YouTube",
        description: "A practical overview of programming, testing, and system design.",
        estimatedMinutes: 45,
      },
    ],
    practice: [
      {
        title: "LeetCode Practice",
        url: "https://leetcode.com/",
        provider: "LeetCode",
        description: "Algorithm and problem-solving practice for software engineers.",
        estimatedMinutes: 50,
      },
    ],
  },
  "game developer": {
    docs: [
      {
        title: "Unity Learn",
        url: "https://learn.unity.com/",
        provider: "Unity",
        description: "Official Unity tutorials and documentation.",
        estimatedMinutes: 30,
      },
    ],
    video: [
      {
        title: "Game Development Tutorial",
        url: "https://www.youtube.com/results?search_query=game+development+tutorial+unity",
        provider: "YouTube",
        description: "Beginner-friendly game dev tutorials.",
        estimatedMinutes: 45,
      },
    ],
    practice: [
      {
        title: "Unity Project Practice",
        url: "https://unity.com/resources/tutorials",
        provider: "Unity",
        description: "Hands-on game creation tutorials and exercises.",
        estimatedMinutes: 50,
      },
    ],
  },
  "blockchain developer": {
    docs: [
      {
        title: "Ethereum Developer Docs",
        url: "https://ethereum.org/en/developers/docs/",
        provider: "Ethereum",
        description: "Official blockchain developer documentation.",
        estimatedMinutes: 30,
      },
    ],
    video: [
      {
        title: "Solidity and Web3 Course",
        url: "https://www.youtube.com/results?search_query=solidity+developer+course",
        provider: "YouTube",
        description: "Introductory blockchain development videos.",
        estimatedMinutes: 45,
      },
    ],
    practice: [
      {
        title: "CryptoZombies Solidity Practice",
        url: "https://cryptozombies.io/",
        provider: "CryptoZombies",
        description: "Interactive Solidity programming practice.",
        estimatedMinutes: 45,
      },
    ],
  },
};

const aliases: Record<string, string> = {
  javascript: "javascript",
  js: "javascript",
  reactjs: "react",
  react: "react",
  html: "html",
  css: "html",
  linux: "linux",
  "ethical hacking": "ethical hacking",
  hacking: "ethical hacking",
  security: "ethical hacking",
  python: "python",
  ml: "ml",
  machinelearning: "ml",
  "machine learning": "ml",
  "full stack developer": "full stack developer",
  "frontend developer": "frontend developer",
  frontend: "frontend developer",
  "backend developer": "backend developer",
  backend: "backend developer",
  "data scientist": "data scientist",
  "data analyst": "data analyst",
  "mobile app developer": "mobile app developer",
  "devops engineer": "devops engineer",
  devops: "devops engineer",
  "cloud engineer": "cloud engineer",
  "cyber security engineer": "cyber security engineer",
  "ui/ux designer": "ui/ux designer",
  "ui ux": "ui/ux designer",
  "software engineer": "software engineer",
  "game developer": "game developer",
  "blockchain developer": "blockchain developer",
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function slotFromResourceType(resourceType: ResourceType): ResourceCatalogSlot {
  switch (resourceType) {
    case "documentation":
      return "docs";
    case "youtube":
      return "video";
    case "practice":
      return "practice";
    case "article":
      return "docs";
    case "mini-project":
      return "project";
    case "certification":
    default:
      return "quiz";
  }
}

function pickCatalogKey(skill: string, topic: string) {
  const normalizedSkill = normalize(skill);
  const normalizedTopic = normalize(topic);
  const candidateKeys = [normalizedSkill, normalizedTopic, aliases[normalizedSkill], aliases[normalizedTopic]].filter(Boolean) as string[];

  for (const candidate of candidateKeys) {
    if (resourceCatalog[candidate]) {
      return candidate;
    }
  }

  const topicTokens = normalizedTopic.split(' ').filter(Boolean);
  for (const token of topicTokens) {
    const alias = aliases[token];
    if (alias && resourceCatalog[alias]) {
      return alias;
    }
  }

  return null;
}

export function getResourceCatalogBlueprint(skill: string, topic: string, resourceType: ResourceType) {
  const key = pickCatalogKey(skill, topic);
  if (!key) {
    return null;
  }

  const slot = slotFromResourceType(resourceType);
  const entry = resourceCatalog[key];
  const item = entry[slot]?.[0];

  if (!item) {
    return null;
  }

  return {
    title: item.title,
    description: item.description || `${item.provider} resource for ${topic}.`,
    url: item.url,
    provider: item.provider,
    estimatedMinutes: item.estimatedMinutes || (slot === "video" ? 45 : slot === "practice" ? 40 : slot === "project" ? 90 : 20),
    isOfficial: slot === "docs",
  };
}
