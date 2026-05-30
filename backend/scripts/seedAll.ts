#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SeedTask {
  name: string;
  script: string;
}

const SEED_TASKS: SeedTask[] = [
  {
    name: 'Careers & Skill Mappings',
    script: 'seedCareers.ts',
  },
  {
    name: 'Roadmaps',
    script: 'seedRoadmapCatalog.ts',
  },
  {
    name: 'Jobs',
    script: 'seedJobs.ts',
  },
];

async function runSeedScript(script: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['ts-node', script], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script ${script} failed with code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function runAllSeeds(): Promise<void> {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  🌱 Pragyan Database Seeding                   ║');
  console.log('║  Intelligent Data Population                   ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  let completed = 0;
  const total = SEED_TASKS.length;

  for (const task of SEED_TASKS) {
    console.log(`\n📍 Step ${completed + 1}/${total}: ${task.name}`);
    console.log('─'.repeat(50));

    try {
      await runSeedScript(task.script);
      completed++;
      console.log(`✅ ${task.name} seeding completed!\n`);
    } catch (error) {
      console.error(`\n❌ ${task.name} seeding failed!`);
      console.error(error);
      process.exit(1);
    }
  }

  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  ✨ All Seeding Complete!                      ║');
  console.log('║  Pragyan is now populated with:                ║');
  console.log('║  • 16 Career tracks with skill mappings        ║');
  console.log('║  • 240+ roadmap catalog entries                ║');
  console.log('║  • 20+ Realistic job listings                  ║');
  console.log('│                                                ║');
  console.log('║  Ready for end-to-end testing! 🚀             ║');
  console.log('╚════════════════════════════════════════════════╝\n');
}

runAllSeeds().catch((error) => {
  console.error('Fatal error during seeding:', error);
  process.exit(1);
});
