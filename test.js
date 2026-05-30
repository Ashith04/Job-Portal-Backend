require('dotenv').config();
const request = require('supertest');
const app = require('./src/app');
const mongoose = require('mongoose');
const { connectTestDB, clearTestDB, closeTestDB } = require('./src/tests/testSetup');

(async () => {
  try {
    await connectTestDB();
    const user = { name: `Test employer 1`, email: `employer1@test.com`, password: 'password123', role: 'employer' };
    const res = await request(app).post('/api/auth/register').send(user);
    console.log('Registration response:', res.status, res.body);
    await closeTestDB();
  } catch (err) {
    console.error(err);
  }
})();
