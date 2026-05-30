import { MongoClient } from 'mongodb';
import dns from 'dns';
import dotenv from 'dotenv';

dotenv.config({ path: process.env.DOTENV_PATH || '.env' });

dns.setServers(['8.8.8.8', '8.8.4.4']);

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('Missing DATABASE_URL');
    process.exit(1);
  }

  // MongoClient expects the full connection string
  const client = new MongoClient(url);
  try {
    await client.connect();
    const dbName = new URL(url).pathname.replace(/^\/+/, '') || 'Pragyan';
    const db = client.db(dbName);

    console.log('Creating text index on roadmaps (title, description, tags, requiredSkills, category, careerPath)...');
    await db.collection('Roadmap').createIndex(
      { title: 'text', description: 'text', tags: 'text', requiredSkills: 'text', category: 'text', careerPath: 'text' },
      { name: 'roadmap_text_idx' }
    );
    console.log('Index created (or already exists).');
  } catch (err) {
    console.error('Index creation failed:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  run()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
