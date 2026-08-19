export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Vehicle Rental Management API',
    version: '1.0.0',
    description:
      'Complete Backend API for Vehicle Rental System with Date Overlap Check & Monthly Reports',
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
    '/reports/rentals': {
      get: {
        summary: 'Generate Monthly Revenue & Rental Activity Report per Vehicle',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'month',
            in: 'query',
            required: true,
            schema: { type: 'string', example: '2026-08' },
            description: 'Target month in YYYY-MM format',
          },
          {
            name: 'vehicle_id',
            in: 'query',
            required: false,
            schema: { type: 'integer', example: 1 },
            description: 'Optional vehicle ID filter',
          },
        ],
        responses: {
          '200': { description: 'Monthly report data per vehicle and top revenue vehicle' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
  },
};
