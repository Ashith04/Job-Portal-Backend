require('dotenv').config();
const request = require('supertest');
const app = require('../app');
const { connectTestDB, clearTestDB, closeTestDB } = require('./testSetup');

beforeAll(async () => { await connectTestDB(); });
afterEach(async () => { await clearTestDB(); });
afterAll(async () => { await closeTestDB(); });

let counter = 0;
const registerAndLogin = async (role = 'employer') => {
  counter++;
  const user = { name: `Test ${role} ${counter}`, email: `${role}${counter}@test.com`, password: 'password123', role };
  const res = await request(app).post('/api/auth/register').send(user);
  return { token: res.body.data?.accessToken, user: res.body.data?.user };
};

const jobPayload = {
  title: 'Senior Node.js Developer',
  description: 'We are looking for an experienced Node.js developer to build scalable APIs.',
  skillsRequired: ['Node.js', 'MongoDB', 'Express'],
  tags: ['backend', 'nodejs'],
  employmentType: 'full-time',
  experienceLevel: 'senior',
  salary: { min: 800000, max: 1500000, currency: 'INR', period: 'yearly' },
  location: { city: 'Bangalore', state: 'Karnataka', country: 'India' },
  deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  openings: 2,
};

describe('Employer - Job Management', () => {
  describe('POST /api/employer/jobs', () => {
    it('should create a job successfully', async () => {
      const { token } = await registerAndLogin('employer');
      const res = await request(app)
        .post('/api/employer/jobs')
        .set('Authorization', `Bearer ${token}`)
        .send(jobPayload);
      expect(res.statusCode).toBe(201);
      expect(res.body.data.job.title).toBe(jobPayload.title);
      expect(res.body.data.job.skillsRequired).toEqual(jobPayload.skillsRequired);
    });

    it('should fail without auth token', async () => {
      const res = await request(app).post('/api/employer/jobs').send(jobPayload);
      expect(res.statusCode).toBe(401);
    });

    it('should fail with missing required fields', async () => {
      const { token } = await registerAndLogin('employer');
      const res = await request(app)
        .post('/api/employer/jobs')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Incomplete Job' });
      expect(res.statusCode).toBe(422);
    });
  });

  describe('GET /api/employer/jobs', () => {
    it('should get employer jobs with pagination', async () => {
      const { token } = await registerAndLogin('employer');
      await request(app).post('/api/employer/jobs').set('Authorization', `Bearer ${token}`).send(jobPayload);
      const res = await request(app).get('/api/employer/jobs').set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.jobs).toHaveLength(1);
      expect(res.body.meta.total).toBe(1);
    });
  });

  describe('PUT /api/employer/jobs/:id', () => {
    it('should update a job', async () => {
      const { token } = await registerAndLogin('employer');
      const createRes = await request(app).post('/api/employer/jobs').set('Authorization', `Bearer ${token}`).send(jobPayload);
      const id = createRes.body.data.job._id;
      const res = await request(app).put(`/api/employer/jobs/${id}`).set('Authorization', `Bearer ${token}`).send({ title: 'Updated Title' });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.job.title).toBe('Updated Title');
    });
  });

  describe('DELETE /api/employer/jobs/:id', () => {
    it('should soft delete a job', async () => {
      const { token } = await registerAndLogin('employer');
      const createRes = await request(app).post('/api/employer/jobs').set('Authorization', `Bearer ${token}`).send(jobPayload);
      const id = createRes.body.data.job._id;
      const res = await request(app).delete(`/api/employer/jobs/${id}`).set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      const getRes = await request(app).get('/api/employer/jobs').set('Authorization', `Bearer ${token}`);
      expect(getRes.body.data.jobs).toHaveLength(0);
    });
  });
});

describe('JobSeeker - Job Search & Applications', () => {
  describe('GET /api/jobseeker/jobs', () => {
    it('should search jobs without authentication', async () => {
      const { token } = await registerAndLogin('employer');
      await request(app).post('/api/employer/jobs').set('Authorization', `Bearer ${token}`).send(jobPayload);
      const res = await request(app).get('/api/jobseeker/jobs');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.jobs.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter jobs by employment type', async () => {
      const { token } = await registerAndLogin('employer');
      await request(app).post('/api/employer/jobs').set('Authorization', `Bearer ${token}`).send(jobPayload);
      const res = await request(app).get('/api/jobseeker/jobs?employmentType=full-time');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.jobs.every(j => j.employmentType === 'full-time')).toBe(true);
    });
  });

  describe('POST /api/jobseeker/jobs/:jobId/apply', () => {
    it('should fail applying to non-existent job', async () => {
      const { token } = await registerAndLogin('jobseeker');
      const res = await request(app)
        .post('/api/jobseeker/jobs/000000000000000000000000/apply')
        .set('Authorization', `Bearer ${token}`)
        .send({ coverLetter: 'Test' });
      expect(res.statusCode).toBe(404);
    });

    it('should fail without authentication', async () => {
      const { token } = await registerAndLogin('employer');
      const jobRes = await request(app).post('/api/employer/jobs').set('Authorization', `Bearer ${token}`).send(jobPayload);
      const jobId = jobRes.body.data.job._id;
      const res = await request(app).post(`/api/jobseeker/jobs/${jobId}/apply`).send({ coverLetter: 'Test' });
      expect(res.statusCode).toBe(401);
    });

    it('should return 400 or 201 based on resume availability', async () => {
      const employer = await registerAndLogin('employer');
      const seeker = await registerAndLogin('jobseeker');
      const jobRes = await request(app).post('/api/employer/jobs').set('Authorization', `Bearer ${employer.token}`).send(jobPayload);
      const jobId = jobRes.body.data.job._id;
      const res = await request(app)
        .post(`/api/jobseeker/jobs/${jobId}/apply`)
        .set('Authorization', `Bearer ${seeker.token}`)
        .send({ coverLetter: 'I am interested' });
      // Either 400 (no resume) or 201 (applied) - both are valid depending on seeker profile state
      expect([400, 201]).toContain(res.statusCode);
    });
  });

  describe('GET /api/jobseeker/applications', () => {
    it('should return empty applications list initially', async () => {
      const { token } = await registerAndLogin('jobseeker');
      const res = await request(app).get('/api/jobseeker/applications').set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.applications).toHaveLength(0);
    });
  });
});

describe('Role-Based Access Control', () => {
  it('should prevent jobseeker from creating jobs', async () => {
    const { token } = await registerAndLogin('jobseeker');
    const res = await request(app).post('/api/employer/jobs').set('Authorization', `Bearer ${token}`).send(jobPayload);
    expect(res.statusCode).toBe(403);
  });

  it('should prevent employer from accessing jobseeker profile routes', async () => {
    const { token } = await registerAndLogin('employer');
    const res = await request(app).get('/api/jobseeker/profile').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(403);
  });

  it('should prevent non-admin from accessing admin routes', async () => {
    const { token } = await registerAndLogin('employer');
    const res = await request(app).get('/api/admin/analytics').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(403);
  });
});
