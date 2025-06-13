const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const db = new sqlite3.Database('./students.db');

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

// 学習記録表示
app.get('/record', (req, res) => {
  const userId = req.query.userId || 'TanakaKira'; // デフォルトユーザー
  const year = parseInt(req.query.year) || 2025;
  const month = parseInt(req.query.month) || 4;

  db.all(`
    SELECT * FROM learning_records 
    WHERE user_id = ? AND year = ? AND month = ?
    ORDER BY date ASC
  `, [userId, year, month], (err, rows) => {
    if (err) return res.status(500).send("DBエラー: " + err.message);
    res.render('record', { userId, year, month, records: rows });
  });
});
