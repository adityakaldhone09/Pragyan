#!/usr/bin/env tsx
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { MongoClient } from 'mongodb';

const email = (process.env.ADMIN_EMAIL || process.argv[2] || 'admin@pragyan.com').trim().toLowerCase();
const mongoUrl = process.env.MONGO_DIRECT_URL || process.env.MONGODB_URI || process.env.DATABASE_URL;
const mongoDbName = process.env.DB_NAME || 'Pragyan';

async function main() {
  if (!mongoUrl) {
    throw new Error('DATABASE_URL or MONGO_DIRECT_URL is required');
  }

  const client = new MongoClient(mongoUrl);
  await client.connect();

  try {
    const db = client.db(mongoDbName);
    const adminUsersCollection = db.collection('AdminUser');
    const matched = await adminUsersCollection.find({ email }).toArray();
    const total = await adminUsersCollection.countDocuments();

    console.log(JSON.stringify({
      database: mongoDbName,
      collection: 'AdminUser',
      totalDocuments: total,
      matchedDocuments: matched.length,
      documents: matched,
    }, null, 2));
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error('Verification failed:', error);
  process.exit(1);
});
