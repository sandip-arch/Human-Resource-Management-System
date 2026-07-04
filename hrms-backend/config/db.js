const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

let pool;

async function initializeDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'hrms_db';

  try {
    // 1. First, connect without a specific database to ensure it exists
    const tempConnection = await mysql.createConnection({ host, user, password });
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
    await tempConnection.end();
    
    // 2. Create the connection pool with the target database
    pool = mysql.createPool({
      host,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: true // Essential for running schema.sql
    });

    console.log(`Connected to MySQL database: ${database}`);

    // 3. Check if table 'users' exists. If not, auto-import schema.sql
    const connection = await pool.getConnection();
    const [rows] = await connection.query(`SHOW TABLES LIKE 'users'`);
    
    if (rows.length === 0) {
      console.log('Database tables not found. Initializing from database/schema.sql...');
      const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
      
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        // Execute the schema SQL. Since multipleStatements is enabled, we can execute the whole file.
        await connection.query(schemaSql);
        console.log('Database schema successfully initialized.');
      } else {
        console.warn('Warning: schema.sql file not found. Could not auto-initialize tables.');
      }
    } else {
      console.log('Database tables verified.');
    }
    
    connection.release();
  } catch (error) {
    console.error('Database connection or initialization failed:', error.message);
    process.exit(1); // Exit process on critical db failure
  }
}

// Immediately trigger initialization
initializeDatabase();

// Export a proxy or getter that returns pool once it is initialized, or export pool directly.
// To handle exports, we can export pool directly, but since initializeDatabase is async, 
// any queries immediately run upon require might fail. However, in an Express app, 
// the server starts listening after some milliseconds, which is usually enough for connection, 
// or we can export a function/pool wrapper.
// To be safe, we can export the pool object and let Express handle errors if it queries before initialization,
// but since the pool object is created synchronously in the first tick (once connection finishes), 
// it will queue queries until connected.
const poolProxy = {
  query: async function(...args) {
    if (!pool) {
      // Wait a bit or initialize if needed
      await new Promise(resolve => setTimeout(resolve, 500));
      if (!pool) throw new Error('Database pool not initialized yet.');
    }
    return pool.query(...args);
  },
  getConnection: async function() {
    if (!pool) {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (!pool) throw new Error('Database pool not initialized yet.');
    }
    return pool.getConnection();
  }
};

module.exports = poolProxy;
