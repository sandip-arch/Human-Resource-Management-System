const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function debug() {
  console.log('Testing MySQL Connection with settings:');
  console.log('Host:', process.env.DB_HOST || 'localhost');
  console.log('User:', process.env.DB_USER || 'root');
  console.log('Password:', process.env.DB_PASSWORD === '' ? '(empty)' : '********');
  
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });
    console.log('SUCCESS: Connected to MySQL!');
    const [rows] = await conn.query('SHOW DATABASES');
    console.log('Databases available:', rows.map(r => r.Database));
    await conn.end();
  } catch (err) {
    console.error('ERROR connecting to MySQL:', err.message);
  }
}

debug();
