if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./tmp/test.db';
}

process.env.NODE_ENV = 'test';
