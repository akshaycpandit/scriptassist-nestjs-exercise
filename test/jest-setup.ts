// Setup file for tests
// This file is executed before running tests

// Mock environment variables
process.env.NODE_ENV = 'development';
process.env.JWT_SECRET = 'myS3cr3tK3y!@062025$%^&*()_+aBcDeFgHiJkLmNoP';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_USERNAME = 'root';
process.env.DB_PASSWORD = 'secret';
process.env.DB_DATABASE = 'taskflow'; 