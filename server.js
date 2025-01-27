// server.js
const express = require('express');
const { Client } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors()); // CORSを許可
app.use(express.json()); // JSONリクエストを解析

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

client.connect();


app.get('/api/plans', async (req, res) => {
 try {
      const query = 'SELECT * FROM plans';
      const result = await client.query(query);
      res.json(result.rows);
  } catch (error) {
     console.error("Error loading plans:", error);
     res.status(500).json({ error: 'Failed to fetch plans' });
  }
});


app.post('/api/plans', async (req, res) => {
const { purpose, range, planText, locations, route } = req.body;
 try {
      const query = {
          text: 'INSERT INTO plans(user_id, purpose, range, plan_text, locations, route, created_at) VALUES($1, $2, $3, $4, $5, $6, $7)',
           values: ['test_user', purpose, range, planText, JSON.stringify(locations), JSON.stringify(route), new Date()],
      };
      await client.query(query);
      res.status(201).send({message: 'Plan saved successfully'});
  } catch (error) {
     console.error('Error saving plan:', error);
     res.status(500).send({ error: 'Failed to save plan' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});