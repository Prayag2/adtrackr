import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pg from 'pg';

export default function configureSession(app) {
  const PgSession = connectPgSimple(session);
  // Use the same connection string logic as index.js
  const {
    POSTGRES_USER,
    POSTGRES_PASSWORD,
    POSTGRES_DB,
    POSTGRES_HOST,
    POSTGRES_PORT,
  } = process.env;

  const POSTGRES_URL = `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`;
  const pgPool = new pg.Pool({
    connectionString: POSTGRES_URL,
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  });

  app.use(
    session({
      store: new PgSession({
        pool: pgPool,
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || 'devsecret',
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }, // 1 week
    })
  );
}
