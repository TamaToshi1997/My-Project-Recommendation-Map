const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { Client } = require('pg');


console.log("DATABASE_URL from env:", process.env.DATABASE_URL);


const client = new Client({
    connectionString: process.env.DATABASE_URL,
    client_encoding: 'UTF8',
});

async function testConnection() {
     try {
        await client.connect();
        console.log('Database connection successful!');

         const res = await client.query('SELECT 1');
         console.log("PostgreSQL version:", res.rows);
     } catch (error) {
         console.error('Database connection failed:', error);
     } finally {
         await client.end();
        console.log('Database connection closed');
    }
}

testConnection();