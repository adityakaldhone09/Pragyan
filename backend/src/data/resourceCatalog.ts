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
