// Env mínimo para tests e2e. El motor lo decide `tests/support/test-database.ts`
// (TEST_DB_ENGINE, sqlite en memoria por defecto); aquí solo lo común.
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'e2e-access-secret';
process.env.JWT_REFRESH_SECRET = 'e2e-refresh-secret';
process.env.JWT_ACCESS_EXPIRES_IN = '900';
process.env.JWT_REFRESH_EXPIRES_IN = '604800';
process.env.RUN_MIGRATIONS = 'true';
