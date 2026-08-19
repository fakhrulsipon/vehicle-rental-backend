export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Vehicle Rental Management API',
    version: '1.0.0',
    description:
      'Complete RESTful Backend API for Vehicle Rental Management with Date Overlap Check & Monthly Revenue Reports',
  },
  servers: [
    {
      url: 'https://vehicle-rental-backend-tj9u.onrender.com',
      description: 'Live Production Server',
    },
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server',
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
        tags: ['System'],
        responses: {
          '200': { description: 'Server is running smoothly' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Staff Login',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin@vehiclerental.com' },
                  password: { type: 'string', example: 'admin123' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Login successful returning JWT token' },
          '400': { description: 'Invalid email or password' },
          '429': { description: 'Too many login attempts, rate limited' },
        },
      },
    },
    '/vehicles': {
      get: {
        summary: 'List all vehicles with pagination, category filter, and search',
        tags: ['Vehicles'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'category', in: 'query', schema: { type: 'string', example: 'Sedan' } },
          { name: 'search', in: 'query', schema: { type: 'string', example: 'Toyota' } },
        ],
        responses: {
          '200': { description: 'List of active vehicles retrieved successfully' },
          '401': { description: 'Unauthorized' },
        },
      },
      post: {
        summary: 'Create a new vehicle (with photo upload)',
        tags: ['Vehicles'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['name', 'plate_number', 'category', 'daily_rate'],
                properties: {
                  name: { type: 'string', example: 'Toyota Camry 2024' },
                  plate_number: { type: 'string', example: 'DHAKA-METRO-GA-88-9900' },
                  category: { type: 'string', example: 'Sedan' },
                  daily_rate: { type: 'number', example: 60.0 },
                  photo: { type: 'string', format: 'binary', description: 'Vehicle image file' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Vehicle created successfully' },
          '400': { description: 'Validation error or duplicate plate number' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/vehicles/{id}': {
      get: {
        summary: 'Get vehicle details by ID',
        tags: ['Vehicles'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer', example: 1 } },
        ],
        responses: {
          '200': { description: 'Vehicle details retrieved' },
          '404': { description: 'Vehicle not found' },
        },
      },
      put: {
        summary: 'Update vehicle details (including optional photo replacement)',
        tags: ['Vehicles'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer', example: 1 } },
        ],
        requestBody: {
          required: false,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Toyota Camry 2024 Updated' },
                  plate_number: { type: 'string', example: 'DHAKA-METRO-GA-88-9900' },
                  category: { type: 'string', example: 'Sedan' },
                  daily_rate: { type: 'number', example: 65.0 },
                  photo: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Vehicle updated successfully' },
          '400': { description: 'Validation error' },
          '404': { description: 'Vehicle not found' },
        },
      },
      delete: {
        summary: 'Soft delete vehicle',
        tags: ['Vehicles'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer', example: 1 } },
        ],
        responses: {
          '200': { description: 'Vehicle soft deleted successfully' },
          '404': { description: 'Vehicle not found' },
        },
      },
    },
    '/rentals': {
      get: {
        summary: 'List rentals with filters (vehicle_id, status, date range)',
        tags: ['Rentals'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'vehicle_id', in: 'query', schema: { type: 'integer', example: 1 } },
          { name: 'status', in: 'query', schema: { type: 'string', example: 'booked' } },
          { name: 'start_date', in: 'query', schema: { type: 'string', example: '2026-08-01' } },
          { name: 'end_date', in: 'query', schema: { type: 'string', example: '2026-08-31' } },
        ],
        responses: {
          '200': { description: 'Rentals list retrieved successfully' },
          '401': { description: 'Unauthorized' },
        },
      },
      post: {
        summary: 'Create customer rental booking (Checks date overlap & calculates total_amount)',
        tags: ['Rentals'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['vehicle_id', 'customer_name', 'customer_phone', 'start_date', 'end_date'],
                properties: {
                  vehicle_id: { type: 'integer', example: 1 },
                  customer_name: { type: 'string', example: 'Rahim Ahmed' },
                  customer_phone: { type: 'string', example: '01711112233' },
                  start_date: { type: 'string', example: '2026-08-10' },
                  end_date: { type: 'string', example: '2026-08-15' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Rental booking created successfully' },
          '400': { description: 'Validation error or invalid dates' },
          '409': { description: 'Vehicle already has an active rental overlapping these dates' },
        },
      },
    },
    '/rentals/{id}': {
      get: {
        summary: 'Get rental details by ID',
        tags: ['Rentals'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer', example: 1 } },
        ],
        responses: {
          '200': { description: 'Rental details retrieved' },
          '404': { description: 'Rental not found' },
        },
      },
      put: {
        summary: 'Update rental booking (Re-triggers date overlap check on date changes)',
        tags: ['Rentals'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer', example: 1 } },
        ],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  customer_name: { type: 'string', example: 'Rahim Ahmed Updated' },
                  customer_phone: { type: 'string', example: '01711112233' },
                  start_date: { type: 'string', example: '2026-08-12' },
                  end_date: { type: 'string', example: '2026-08-18' },
                  status: {
                    type: 'string',
                    enum: ['booked', 'ongoing', 'completed', 'cancelled'],
                    example: 'ongoing',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Rental updated successfully' },
          '409': { description: 'Updated dates conflict with an existing active rental' },
          '404': { description: 'Rental not found' },
        },
      },
      delete: {
        summary: 'Delete rental booking',
        tags: ['Rentals'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer', example: 1 } },
        ],
        responses: {
          '200': { description: 'Rental deleted successfully' },
          '404': { description: 'Rental not found' },
        },
      },
    },
    '/reports/rentals': {
      get: {
        summary: 'Generate Monthly Rental Activity & Revenue Report per Vehicle',
        tags: ['Reports'],
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
          '200': { description: 'Monthly rental report per vehicle & highest revenue vehicle' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
  },
};
