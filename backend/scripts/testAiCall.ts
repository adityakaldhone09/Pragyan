import 'module-alias/register';
import dotenv from 'dotenv';

dotenv.config();

import { aiLayers } from '@/services/ai-layers';
import { aiProvider } from '@/services/aiProvider';

async function run() {
  const prompt = 'How can I become a Full Stack Developer? Provide concise, actionable steps.';

  console.log('Runtime:', aiProvider.getRuntime());

  try {
    const reply = await aiLayers.generateCreative(prompt);
    console.log('AI reply:', reply);
  } catch (err: any) {
    console.error('AI call failed:', err instanceof Error ? err.message : String(err));
    if (err?.response) {
      try {
        console.error('Error response body:', JSON.stringify(err.response, null, 2));
      } catch {}
    }
    process.exit(1);
  }
}

void run();
