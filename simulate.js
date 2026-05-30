require('dotenv').config();
const request = require('supertest');
const app = require('./src/app');
const mongoose = require('mongoose');

// Colors for terminal output
const B = '\x1b[1m';
const G = '\x1b[32m';
const C = '\x1b[36m';
const Y = '\x1b[33m';
const R = '\x1b[0m';

const logRequest = (step, method, url, body) => {
  console.log(`\n${B}${C}=== ${step} ===${R}`);
  console.log(`${B}${Y}> ${method} ${url}${R}`);
  if (body) console.log(`Payload:`, body);
};

const logResponse = (status, body) => {
  console.log(`${B}${G}< Status: ${status}${R}`);
  console.log(`Response:`, JSON.stringify(body, null, 2));
};

(async () => {
  try {
    // Connect to the DB (Make sure it's running)
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/job-portal');
    console.log(`${B}${G}Database Connected! Starting API Simulation...${R}`);

    // 1. Register Employer
    const employerPayload = { name: "Tech Corp", email: `employer_${Date.now()}@test.com`, password: "password123", role: "employer" };
    logRequest('1. Register Employer', 'POST', '/api/auth/register', employerPayload);
    let res = await request(app).post('/api/auth/register').send(employerPayload);
    logResponse(res.status, res.body);
    const employerToken = res.body.data.accessToken;

    // 2. Login Employer
    logRequest('2. Login Employer', 'POST', '/api/auth/login', { email: employerPayload.email, password: "password123" });
    res = await request(app).post('/api/auth/login').send({ email: employerPayload.email, password: "password123" });
    logResponse(res.status, res.body);

    // 3. Create Job
    const jobPayload = {
      title: "Senior Node.js Developer",
      description: "Looking for an experienced Node.js developer.",
      skillsRequired: ["Node.js", "Express"],
      employmentType: "full-time",
      experienceLevel: "senior",
      deadline: new Date(Date.now() + 86400000 * 30).toISOString(),
    };
    logRequest('3. Create Job', 'POST', '/api/employer/jobs', jobPayload);
    res = await request(app).post('/api/employer/jobs').set('Authorization', `Bearer ${employerToken}`).send(jobPayload);
    logResponse(res.status, res.body);
    const jobId = res.body.data.job._id;

    // 4. Register Job Seeker
    const seekerPayload = { name: "John Doe", email: `seeker_${Date.now()}@test.com`, password: "password123", role: "jobseeker" };
    logRequest('4. Register Job Seeker', 'POST', '/api/auth/register', seekerPayload);
    res = await request(app).post('/api/auth/register').send(seekerPayload);
    logResponse(res.status, res.body);
    const seekerToken = res.body.data.accessToken;

    // 5. Login Job Seeker
    logRequest('5. Login Job Seeker', 'POST', '/api/auth/login', { email: seekerPayload.email, password: "password123" });
    res = await request(app).post('/api/auth/login').send({ email: seekerPayload.email, password: "password123" });
    logResponse(res.status, res.body);

    // 6. Bypass Resume Upload & Apply
    // We update the seeker directly in DB to bypass Cloudinary upload requirement for the test
    await mongoose.connection.collection('users').updateOne(
        { email: seekerPayload.email },
        { $set: { resume: { url: "http://example.com/resume.pdf", publicId: "123", originalName: "resume.pdf" } } }
    );
    console.log(`\n${B}${C}[System] Bypassed Cloudinary: Injected mock resume into Job Seeker profile${R}`);

    // 7. Apply for Job
    logRequest('7. Apply for Job', 'POST', `/api/jobseeker/jobs/${jobId}/apply`, { coverLetter: "I'm a great fit!" });
    res = await request(app).post(`/api/jobseeker/jobs/${jobId}/apply`).set('Authorization', `Bearer ${seekerToken}`).send({ coverLetter: "I'm a great fit!" });
    logResponse(res.status, res.body);

    await mongoose.disconnect();
    console.log(`\n${B}${G}Simulation Completed Successfully!${R}`);
  } catch (err) {
    console.error(err);
  }
})();
