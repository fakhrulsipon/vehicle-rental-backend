import request from 'supertest';
import app from '../app';

describe('Vehicle Rental API Basic Integration Tests', () => {
  describe('GET /health', () => {
    it('should return 200 OK and server status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
    });
  });

  describe('GET / (Root API info)', () => {
    it('should return 200 OK with API details', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Welcome to Vehicle Rental Management API');
      expect(response.body).toHaveProperty('documentation', '/api-docs');
    });
  });

  describe('GET /non-existent-route', () => {
    it('should return 404 for unknown endpoints', async () => {
      const response = await request(app).get('/non-existent-route');
      expect(response.status).toBe(404);
    });
  });
});
