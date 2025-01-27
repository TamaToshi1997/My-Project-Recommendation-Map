// server.js
const express = require('express');

const path = require('path');

const { Client } = require('pg');
const cors = require('cors');
const { spawn } = require('child_process');
require('dotenv').config({ path: '.env.local' });

const app = express();
const port = process.env.PORT || 5000;


// 静的ファイルを提供するディレクトリを指定
const staticDir = path.join(__dirname, 'build');

// CORSの設定をより具体的に行う
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true
}));

app.use(express.json()); // JSONリクエストを解析

// express.static ミドルウェアを設定
app.use(express.static(staticDir));


const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

// フロントエンド開発サーバーを起動
function startFrontend() {
  console.log('Starting frontend development server...');
  const frontend = spawn('yarn', ['start'], {
    stdio: 'inherit',
    shell: true
  });

  frontend.on('error', (err) => {
    console.error('Failed to start frontend:', err);
  });

  process.on('exit', () => {
    frontend.kill();
  });
}

// バックエンドサーバーの起動とデータベース接続
async function startBackend() {
  try {
    await client.connect();
    console.log('Database connected successfully');

    app.listen(port, () => {
      console.log(`Backend server is running on port ${port}`);
      // バックエンド起動後にフロントエンドを起動
      startFrontend();
    });
  } catch (err) {
    console.error('Failed to start backend:', err);
    process.exit(1);
  }
}

// APIエンドポイントを先に定義
app.get('/api/plans', async (req, res) => {
 try {
      console.log('GET /api/plans - リクエスト受信');
      const query = 'SELECT * FROM plans';
      console.log('クエリ実行:', query);
      const result = await client.query(query);
      console.log('クエリ結果:', result.rows);
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

// プラン削除用エンドポイント
app.delete('/api/plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = {
      text: 'DELETE FROM plans WHERE id = $1',
      values: [id],
    };
    await client.query(query);
    res.status(200).send({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).send({ error: 'Failed to delete plan' });
  }
});

// ワイルドカードルートは最後に定義
app.get('*', (req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

startBackend();