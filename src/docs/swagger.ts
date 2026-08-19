export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Vehicle Rental Management API',
    version: '1.0.0',
    description: 'Complete Backend API for Vehicle Rental System with Date Overlap Check & Monthly Reports',
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Server Health Check',
        responses: {
          '200': { description: 'Server is running' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'User Login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'admin@rental.com' },
                  password: { type: 'string', example: 'admin123' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Login successful' },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/reports/monthly': {
      get: {
        summary: 'Generate Monthly Revenue & Overlap Report',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'year', in: 'query', required: true, schema: { type: 'integer', example: 2026 } },
          { name: 'month', in: 'query', required: true, schema: { type: 'integer', example: 2 } },
        ],
        responses: {
          '200': { description: 'Monthly report data' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
  },
};