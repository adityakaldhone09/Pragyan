import { routeAI } from './aiRouter';

function deterministicTestResponse() {
  return JSON.stringify([
    {
      id: 'stub-q1',
      question: 'Which of the following best describes your strongest technical skill?',
      type: 'multiple_choice',
      options: ['Programming', 'Data Analysis', 'Design', 'DevOps'],
      category: 'skills',
    },
  ]);
}

export async function generateContent(prompt: string): Promise<string> {
  try {
    const response = await routeAI('summary', { prompt, format: 'json' });
    return response.value;
  } catch (error) {
    console.warn('AI generation failed; using deterministic fallback:', error);
    return deterministicTestResponse();
  }
}
