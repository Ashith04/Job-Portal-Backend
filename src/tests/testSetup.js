const mongoose = require('mongoose');

const connectTestDB = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/job-portal-test');
};

const clearTestDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

const closeTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
};

module.exports = { connectTestDB, clearTestDB, closeTestDB };
