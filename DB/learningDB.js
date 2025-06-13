const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const app = express();
const db = new sqlite3.Database('./learning_records.db');

// JSONリクエストを受け取るための設定
app.use(bodyParser.json());

// 学習記録の保存
app.post('/save_record', (req, res) => {
  const { userId, date, duration, month, year } = req.body;

  const stmt = db.prepare(`
    INSERT INTO learning_records (user_id, date, duration, month, year)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(userId, date, duration, month, year, function(err) {
    if (err) {
      res.status(500).json({ error: '保存エラー: ' + err.message });
    } else {
      res.status(200).json({ message: '記録が保存されました' });
    }
  });
  stmt.finalize();
});

// ユーザーの学習記録を取得
app.get('/get_records', (req, res) => {
  const { userId, year, month } = req.query;

  db.all(
    `SELECT date, duration FROM learning_records WHERE user_id = ? AND year = ? AND month = ? ORDER BY date`,
    [userId, year, month],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: 'エラー: ' + err.message });
      } else {
        res.status(200).json(rows);
      }
    }
  );
});

// サーバーを指定ポートで起動
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
