import { PrismaClient } from '@prisma/client';
import { ROADMAP_CATALOG } from './roadmap-catalog';

const prisma = new PrismaClient();

async function clearRoadmapCollections() {
  await prisma.task.deleteMany({});
  await prisma.day.deleteMany({});
  await prisma.week.deleteMany({});
  await prisma.roadmap.deleteMany({});
}

function mapRoadmapData(roadmap: (typeof ROADMAP_CATALOG)[number]) {
  return {
    title: roadmap.title,
    category: roadmap.category,
    careerPath: roadmap.careerPath,
    difficulty: roadmap.difficulty,
    description: roadmap.description,
    level: roadmap.difficulty,
    duration: roadmap.duration,
    icon: roadmap.icon,
    estimatedHours: roadmap.estimatedHours,
    tags: roadmap.tags,
    requiredSkills: roadmap.requiredSkills,
    learningStructure: roadmap.learningStructure,
    milestones: roadmap.milestones,
    progression: roadmap.progression,
  };
}

export async function seedRoadmapCatalog() {
  console.log('🌱 Starting roadmap catalog seeding...');

  try {
    await clearRoadmapCollections();

    await prisma.roadmap.createMany({
      data: ROADMAP_CATALOG.map(mapRoadmapData) as any[],
    });

    console.log(`✅ Seeded ${ROADMAP_CATALOG.length} roadmap catalog entries.`);
  } catch (error) {
    console.error('❌ Roadmap catalog seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedRoadmapCatalog()
    .then(() => {
      console.log('Roadmap catalog seed complete.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Roadmap catalog seed failed:', error);
      process.exit(1);
    });
}
