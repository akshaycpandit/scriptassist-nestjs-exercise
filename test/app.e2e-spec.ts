import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

jest.setTimeout(600000);

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let userToken: string;
  let adminToken: string;
  let createdUserId: string | undefined;
  let createdTaskId: string | undefined;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply the same pipes used in the main application
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();
  });

  // afterEach(async () => {
  //   await app.close();
  // });

  it('/ (GET) - should be protected', () => {
    return request(app.getHttpServer()).get('/').expect(401);
  });

  // Add more tests as needed
  describe('Auth flow', () => {
    it('should login as admin and get token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@example.com', password: 'admin123' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.access_token).toBeDefined();
      adminToken = res.body.data.access_token;
    });

    it('should allow admin to create a user', async () => {
      const res = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test User',
          email: 'testuser@example.com',
          password: 'test1234',
          role: 'USER',
        })
        .expect(201);

      expect(res.body.data.id).toBeDefined();
      createdUserId = res.body.data.id;
    });

    it('should login as user and get token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'testuser@example.com', password: 'test1234' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.access_token).toBeDefined();
      userToken = res.body.data.access_token;
    });
  });

  describe('User operations', () => {
    it('should allow admin to fetch all users', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should not allow user to fetch all users', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should not allow user to create another user', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Hacker',
          email: 'hacker@example.com',
          password: 'hacker1234',
          role: 'ADMIN',
        })
        .expect(403);
    });
  });

describe('Task operations', () => {
  let tempTaskId: string;

  it('should allow admin to create a task', async () => {
    const res = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Admin Task', description: 'Task by admin', userId: createdUserId })
      .expect(201);

    expect(res.body.data.id).toBeDefined();
    tempTaskId = res.body.data.id;
    console.log(`Created Task ID: ${tempTaskId}`);
  });

  it('should allow admin to delete its own task', async () => {
    // First create the task to delete
    const createRes = await request(app.getHttpServer())
      .post(`/tasks/`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Delete Me', description: 'Task to delete', userId: createdUserId })
      .expect(201);

    const taskIdToDelete = createRes.body.data.id;
    expect(taskIdToDelete).toBeDefined();

    // Now delete it
    await request(app.getHttpServer())
      .delete(`/tasks/${taskIdToDelete}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  it('should not allow user to create task', async () => {
    await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'User Task', description: 'Task by user', userId: createdUserId })
      .expect(403);
  });

  it('should allow user to get their tasks', async () => {
    await request(app.getHttpServer())
      .get('/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
  });

  it('should not allow user to batch process tasks', async () => {
    // Create a task as admin for this test
    const createRes = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Batch Task', description: 'Task for batch test', userId: createdUserId })
      .expect(201);

    const batchTaskId = createRes.body.data.id;

    // Attempt batch process as user
    await request(app.getHttpServer())
      .post('/tasks/batch')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ tasks: [batchTaskId], action: 'delete' })
      .expect(403);

    // Clean up
    await request(app.getHttpServer())
      .delete(`/tasks/${batchTaskId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    });
  });

   afterAll(async () => {
    if (createdTaskId) {
      await request(app.getHttpServer())
        .delete(`/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${adminToken}`);
    }

    if (createdUserId) {
      await request(app.getHttpServer())
        .delete(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);
    }

    await app.close();
  });
});
