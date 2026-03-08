/**
 * Migration: Set country: 'saudi' on all existing Bill documents
 *
 * Run ONCE before deploying the country-tab feature.
 * Safe to run multiple times (idempotent).
 *
 * Usage: node server/scripts/migrateBillCountry.js
 */
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function migrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('ERROR: MONGODB_URI not set'); process.exit(1); }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Connected.\n');

  const billsCol = mongoose.connection.db.collection('bills');

  const result = await billsCol.updateMany(
    { country: { $exists: false } },
    { $set: { country: 'saudi' } }
  );

  console.log('========== Migration Summary ==========');
  console.log(`Bills matched  : ${result.matchedCount}`);
  console.log(`Bills updated  : ${result.modifiedCount}`);
  console.log('=======================================\n');

  await mongoose.disconnect();
  console.log('Done. Disconnected from MongoDB.');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  mongoose.disconnect().finally(() => process.exit(1));
});
