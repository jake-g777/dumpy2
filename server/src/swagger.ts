export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Database Connection Manager API',
    version: '1.0.0',
    description: 'API for managing database connections across multiple database types',
    contact: {
      name: 'API Support',
      email: 'support@example.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server'
    }
  ],
  tags: [
    {
      name: 'Database',
      description: 'Database connection operations'
    },
    {
      name: 'System',
      description: 'System operations'
    }
  ],
  components: {
    schemas: {
      DatabaseConnection: {
        type: 'object',
        required: ['id', 'name', 'type', 'host', 'port', 'database', 'username', 'password'],
        properties: {
          id: { type: 'string', description: 'Unique identifier' },
          name: { type: 'string', description: 'Connection name' },
          type: { 
            type: 'string', 
            enum: ['mysql', 'postgresql', 'mongodb', 'sqlserver', 'oracle'],
            description: 'Database type'
          },
          host: { type: 'string', description: 'Database host' },
          port: { type: 'string', description: 'Database port' },
          database: { type: 'string', description: 'Database name' },
          username: { type: 'string', description: 'Database username' },
          password: { type: 'string', format: 'password', description: 'Database password' },
          ssl: { type: 'boolean', description: 'Use SSL connection' }
        }
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string' },
          message: { type: 'string' }
        }
      }
    }
  },
  paths: {
    '/': {
      get: {
        tags: ['System'],
        summary: 'Get API documentation',
        responses: {
          '200': {
            description: 'API documentation',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    version: { type: 'string' },
                    endpoints: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Check API health',
        responses: {
          '200': {
            description: 'Health status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' },
                    uptime: { type: 'number' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/{dbType}/test-connection': {
      post: {
        tags: ['Database'],
        summary: 'Test database connection',
        parameters: [
          {
            name: 'dbType',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
              enum: ['mysql', 'postgresql', 'mongodb', 'sqlserver', 'oracle']
            }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/DatabaseConnection'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Connection test result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '500': {
            description: 'Server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    }
  }
}; 