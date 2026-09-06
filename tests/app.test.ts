import request from 'supertest';
import app from '../src/index';
import { prisma } from '../src/db';

let token: string;
let projectId: number;
let taskId: number;
let userEmail = `test_${Date.now()}@example.com`;

beforeAll(async () => {
  // Clear the DB to ensure clean state
  await prisma.projectMember.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Axionix Team Task Tracker API', () => {
  describe('Authentication', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: userEmail,
          password: 'password123',
        });
      expect(res.statusCode).toEqual(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.email).toEqual(userEmail);
    });

    it('should not register user with existing email', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          name: 'Test User 2',
          email: userEmail,
          password: 'password123',
        });
      expect(res.statusCode).toEqual(409);
    });

    it('should login and return a token', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: userEmail,
          password: 'password123',
        });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      token = res.body.token;
    });

    it('should fail login with wrong password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: userEmail,
          password: 'wrongpassword',
        });
      expect(res.statusCode).toEqual(401);
    });
  });

  describe('Projects', () => {
    it('should create a project', async () => {
      const res = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Project',
          description: 'A test project',
        });
      expect(res.statusCode).toEqual(201);
      expect(res.body.data).toHaveProperty('id');
      projectId = res.body.data.id;
    });

    it('should not allow access without token', async () => {
      const res = await request(app).get('/projects');
      expect(res.statusCode).toEqual(401);
    });
  });

  describe('Tasks', () => {
    it('should create a task', async () => {
      const res = await request(app)
        .post(`/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test Task',
          due_date: new Date().toISOString(),
        });
      expect(res.statusCode).toEqual(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.status).toEqual('TODO');
      taskId = res.body.data.id;
    });

    it('should update task status to DONE and set completed_at', async () => {
      const res = await request(app)
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'DONE',
        });
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.status).toEqual('DONE');
      expect(res.body.data.completed_at).not.toBeNull();
    });

    it('should filter tasks by status', async () => {
      const res = await request(app)
        .get(`/projects/${projectId}/tasks?status=DONE`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].status).toEqual('DONE');
    });

    it('should provide summary of tasks', async () => {
      const res = await request(app)
        .get(`/projects/${projectId}/summary`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.status['DONE']).toBe(1);
    });
  });
});
