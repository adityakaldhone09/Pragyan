// Quiz generation service using Gemini
// Generates quiz on-demand without storing questions
import { aiProvider } from '@/services/aiProvider';

export interface GeneratedQuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer?: string;
  correctIndex?: number;
  explanation?: string;
}

export interface GeneratedQuiz {
  questions: GeneratedQuizQuestion[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topic: string;
  careerPath: string;
}

export interface QuizEvaluation {
  score: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  xpAwarded: number;
}

async function generateQuizWithGemini(params: {
  careerPath: string;
  topic: string;
  dayNumber: number;
  userLevel: 'beginner' | 'intermediate' | 'advanced';
  resourcesCompleted?: string[];
}): Promise<GeneratedQuiz> {
  const { careerPath, topic, dayNumber, userLevel, resourcesCompleted = [] } = params;

  const prompt = [
    'You are Pragyan AI quiz generator.',
    `Generate a ${userLevel} level quiz about: ${topic}`,
    `Career path: ${careerPath}`,
    `Day number: ${dayNumber}`,
    `Resources completed: ${resourcesCompleted.join(', ') || 'None'}`,
    '',
    'Rules:',
    '- Generate 5-8 questions based on user level',
    '- Beginner: 5 questions, concept understanding focus',
    '- Intermediate: 6 questions, practical scenario focus',
    '- Advanced: 8 questions, debugging and system design focus',
    '- Question types: multiple_choice (3-4 options), true_false, short_answer',
    '- Include explanations for correct answers',
    '- Questions should test real understanding, not just memorization',
    '',
    'Return ONLY valid JSON with this structure:',
    '{',
    '  "questions": [',
    '    {',
    '      "id": "q1",',
    '      "question": "What is...",',
    '      "type": "multiple_choice",',
    '      "options": ["A", "B", "C", "D"],',
    '      "correctIndex": 0,',
    '      "explanation": "The correct answer is A because..."',
    '    }',
    '  ],',
    '  "difficulty": "beginner",',
    '  "topic": "HTML Basics",',
    '  "careerPath": "Frontend Developer"',
    '}',
  ].join('\n');

  try {
    const response = await aiProvider.generateJsonRaw(prompt, { timeoutMs: 25000 });
    const parsed = JSON.parse(response) as GeneratedQuiz;
    
    // Validate response
    if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error('Invalid quiz response from Gemini');
    }
    
    return parsed;
  } catch (error) {
    console.error('[QuizGeneration] Gemini generation failed:', error);
    // Fallback to deterministic quiz
    return generateFallbackQuiz({ careerPath, topic, dayNumber, userLevel });
  }
}

function generateFallbackQuiz(params: {
  careerPath: string;
  topic: string;
  dayNumber: number;
  userLevel: 'beginner' | 'intermediate' | 'advanced';
}): GeneratedQuiz {
  const { careerPath, topic, userLevel } = params;
  
  const questionCount = userLevel === 'beginner' ? 5 : userLevel === 'intermediate' ? 6 : 8;
  const questions: GeneratedQuizQuestion[] = Array.from({ length: questionCount }, (_, i) => ({
    id: `q${i + 1}`,
    question: `What is an important aspect of ${topic}?`,
    type: 'multiple_choice',
    options: [
      `Understanding ${topic} fundamentals`,
      'Skipping theoretical concepts',
      'Using pre-built solutions only',
      'Ignoring best practices',
    ],
    correctIndex: 0,
    explanation: `The correct answer is A because fundamental understanding of ${topic} is essential for mastery.`,
  }));

  return {
    questions,
    difficulty: userLevel,
    topic,
    careerPath,
  };
}

export async function evaluateQuizAnswers(params: {
  quiz: GeneratedQuiz;
  userAnswers: (number | string)[];
  userSkillLevel: 'beginner' | 'intermediate' | 'advanced';
}): Promise<QuizEvaluation> {
  const { quiz, userAnswers } = params;

  // Score the quiz
  let correct = 0;
  const weakAreas: string[] = [];

  for (let i = 0; i < quiz.questions.length; i++) {
    const question = quiz.questions[i];
    const userAnswer = userAnswers[i];

    let isCorrect = false;
    if (question.type === 'multiple_choice' && typeof question.correctIndex === 'number') {
      isCorrect = Number(userAnswer) === question.correctIndex;
    } else if (question.type === 'true_false') {
      isCorrect = String(userAnswer).toLowerCase() === (question.correctAnswer || '').toLowerCase();
    } else {
      // For short answer, do simple matching
      isCorrect = String(userAnswer).toLowerCase().includes(
        (question.correctAnswer || '').toLowerCase().split(' ')[0]
      );
    }

    if (isCorrect) {
      correct += 1;
    } else {
      weakAreas.push(question.question.substring(0, 60));
    }
  }

  const score = Math.round((correct / quiz.questions.length) * 100);

  // Determine user level based on score
  let level: 'beginner' | 'intermediate' | 'advanced';
  if (score >= 85) {
    level = 'advanced';
  } else if (score >= 70) {
    level = 'intermediate';
  } else {
    level = 'beginner';
  }

  // Calculate XP based on score and difficulty
  let baseXp = 50;
  if (quiz.difficulty === 'intermediate') baseXp = 75;
  if (quiz.difficulty === 'advanced') baseXp = 100;

  let xpAwarded = 0;
  if (score >= 90) xpAwarded = Math.round(baseXp * 1.5);
  else if (score >= 75) xpAwarded = Math.round(baseXp * 1.2);
  else if (score >= 60) xpAwarded = baseXp;
  else if (score >= 40) xpAwarded = Math.round(baseXp * 0.5);
  else xpAwarded = 0;

  // Generate strengths and suggestions via Gemini
  const { strengths, suggestions } = await generateAnalysisWithGemini({
    topic: quiz.topic,
    careerPath: quiz.careerPath,
    score,
    weakAreas,
  });

  return {
    score,
    level,
    strengths: strengths || extractStrengths(quiz, userAnswers),
    weaknesses: weakAreas,
    suggestions: suggestions || generateDefaultSuggestions(weakAreas, quiz.topic),
    xpAwarded,
  };
}

async function generateAnalysisWithGemini(params: {
  topic: string;
  careerPath: string;
  score: number;
  weakAreas: string[];
}): Promise<{ strengths: string[]; suggestions: string[] }> {
  const { topic, careerPath, score, weakAreas } = params;

  const prompt = [
    'You are Pragyan AI quiz analyst.',
    `Topic: ${topic}`,
    `Career path: ${careerPath}`,
    `Score: ${score}/100`,
    `Weak areas: ${weakAreas.join('; ') || 'None'}`,
    '',
    'Return JSON with:',
    '{',
    '  "strengths": ["strength 1", "strength 2"],',
    '  "suggestions": ["next step 1", "next step 2"]',
    '}',
  ].join('\n');

  try {
    const response = await aiProvider.generateJsonRaw(prompt, { timeoutMs: 15000 });
    return JSON.parse(response);
  } catch (error) {
    console.warn('[QuizAnalysis] Gemini analysis failed:', error);
    return { strengths: [], suggestions: [] };
  }
}

function extractStrengths(quiz: GeneratedQuiz, userAnswers: (number | string)[]): string[] {
  const strengths: string[] = [];

  for (let i = 0; i < quiz.questions.length && strengths.length < 3; i++) {
    const question = quiz.questions[i];
    const userAnswer = userAnswers[i];

    let isCorrect = false;
    if (question.type === 'multiple_choice' && typeof question.correctIndex === 'number') {
      isCorrect = Number(userAnswer) === question.correctIndex;
    }

    if (isCorrect) {
      const topicWords = question.question.split(' ').slice(0, 4).join(' ');
      strengths.push(`${topicWords}`);
    }
  }

  return strengths.length > 0 ? strengths : ['Quiz completion'];
}

function generateDefaultSuggestions(weakAreas: string[], topic: string): string[] {
  if (weakAreas.length === 0) {
    return [
      `Excellent! Continue to the next topic in ${topic}`,
      'Try building a small project to reinforce your learning',
    ];
  }

  return [
    `Review ${topic} concepts, especially the weak areas identified`,
    'Work through practice problems to solidify understanding',
    'Watch additional video resources for clarification',
  ];
}

export { generateQuizWithGemini };
