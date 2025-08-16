import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pg from 'pg';

export default function configureSession(app) {
  const PgSession = connectPgSimple(session);
  const pgPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://prayag:password@localhost:5432/digivantrix',
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
