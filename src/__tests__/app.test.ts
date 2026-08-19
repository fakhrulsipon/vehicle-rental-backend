import request from 'supertest';
import app from '../app';
import db from '../config/database';

describe('Vehicle Rental API Integration Tests', () => {
  beforeAll(async () => {
    // Run migrations before running tests
    await db.migrate.latest();
  });

  afterAll(async () => {
    // Close database connection after tests
    await db.destroy();
  });

  describe('GET /health', () => {
    it('should return 200 OK and server status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
    });
  });

  describe('POST /auth/login', () => {
    it('should fail login with invalid credentials', async () => {
      const response = await request(app).post('/auth/login').send({
        email: 'nonexistent@test.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid email or password');
    });
  });
});
