require('dotenv').config();
const request = require('supertest');
const app = require('./src/app');
const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = {
      "name": "Tech Corp",
      "email": "employer@techcorp.com",
      "password": "password123",
      "role": "employer"
    };
    const res = await request(app).post('/api/auth/register').send(user);
    console.log('Registration response:', res.status, res.body);
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
})();
