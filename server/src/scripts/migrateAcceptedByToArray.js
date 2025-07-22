// Migration script to ensure all tasks have acceptedBy as an array
const mongoose = require('mongoose');
const Task = require('../models/Task').default;

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/your-db-name';

async function migrate() {
  await mongoose.connect(MONGO_URI);
  // Convert single ObjectId to array
  await Task.updateMany(
    { acceptedBy: { $type: 'objectId' } },
    [{ $set: { acceptedBy: ["$acceptedBy"] } }]
  );
  // Set missing acceptedBy to empty array
  await Task.updateMany(
    { acceptedBy: { $exists: false } },
    { $set: { acceptedBy: [] } }
  );
  console.log('Migration complete.');
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
}); 