// Env mínimo para tests de integración (motor según TEST_DB_ENGINE).
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'it-access-secret';
process.env.JWT_REFRESH_SECRET = 'it-refresh-secret';
