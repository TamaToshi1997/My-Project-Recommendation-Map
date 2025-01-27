const express = require('express');
const { Client } = require('pg');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: '.env.local' });

const app = express();
const port = process.env.PORT || 5000;

// CORSの設定を詳細に指定
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// PostgreSQLクライアントの設定
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// データベース接続
async function connectDB() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');
  } catch (err) {
    console.error('Database connection error:', err);
  }
}
connectDB();

// プラン一覧を取得
app.get('/api/plans', async (req, res) => {
  try {
    const query = 'SELECT * FROM plans ORDER BY created_at DESC';
    const result = await client.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error loading plans:", error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// 新しいプランを保存
app.post('/api/plans', async (req, res) => {
  const { purpose, range, plan_text, locations, route } = req.body;
  try {
    const query = {
      text: 'INSERT INTO plans(user_id, purpose, range, plan_text, locations, route, created_at) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      values: ['test_user', purpose, range, plan_text, JSON.stringify(locations), JSON.stringify(route), new Date()]
    };
    const result = await client.query(query);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error saving plan:', error);
    res.status(500).json({ error: 'Failed to save plan' });
  }
});

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});