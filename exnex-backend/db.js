const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'exnex_db',
  password: 'ВАШ_ПАРОЛЬ',
  port: 5432,
});

module.exports = pool;