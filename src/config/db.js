const mongoose = require('mongoose');

async function connectDatabase() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected to Atlas');

  try {
    await mongoose.connection.collection('users').dropIndex('phone_1');
    console.log('Successfully dropped legacy phone_1 unique index');
  } catch (err) {
    // Index already dropped or doesn't exist
  }
}

module.exports = connectDatabase;
