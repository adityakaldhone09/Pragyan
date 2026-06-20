import axios from 'axios';

const provider = (process.env.LLM_PROVIDER || 'groq').toLowerCase();

const groqApiKey = process.env.GROQ_API_KEY || '';
const groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const groqUrl = 'https://api.groq.com/openai/v1/chat/completions';

const geminiApiKey = process.env.GEMINI_API_KEY || '';
const geminiModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;

export interface LLMCallOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
}

export async function callLLM(options: LLMCallOptions): Promise<string> {
  const { systemPrompt, userPrompt, temperature = 0.4 } = options;

  if (provider === 'gemini') {
    if (!geminiApiKey) throw new Error('GEMINI_API_KEY is not configured');

    const response = await axios.post(
      `${geminiUrl}?key=${geminiApiKey}`,
      {
        contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
        generationConfig: { temperature, responseMimeType: 'application/json' },
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    return response.data.candidates[0].content.parts[0].text as string;
  }

  if (!groqApiKey) throw new Error('GROQ_API_KEY is not configured');

  const response = await axios.post(
    groqUrl,
    {
      model: groqModel,
      temperature,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    },
    {
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data.choices[0].message.content as string;
}

export function parseLLMJson<T>(raw: string): T {
  const cleaned = raw.replace(/```json\s*|```/g, '').trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch (error) {
    throw new Error(`Failed to parse LLM JSON output: ${(error as Error).message}`);
  }
}
