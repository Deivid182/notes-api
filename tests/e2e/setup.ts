// Env mínimo para tests e2e: SQLite en memoria, sin puertos reales.
process.env.NODE_ENV = 'test';
process.env.DATABASE_ENGINE = 'sqlite';
process.env.DATABASE_URL = ':memory:';
process.env.JWT_ACCESS_SECRET = 'e2e-access-secret';
process.env.JWT_REFRESH_SECRET = 'e2e-refresh-secret';
process.env.JWT_ACCESS_EXPIRES_IN = '900';
process.env.JWT_REFRESH_EXPIRES_IN = '604800';
