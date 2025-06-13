const db = require('./study.db');

const studyDB = {
  // ランダムに問題を取得する
  getRandomQuestion: () => {
    return new Promise((resolve, reject) => {
      // ORDER BY RANDOM() はSQLiteの構文
      const sql = 'SELECT * FROM questions ORDER BY RANDOM() LIMIT 1';
      db.get(sql, [], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  },

  // IDで問題を取得する
  getQuestionById: (questionId) => {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM questions WHERE question_id = ?';
      db.get(sql, [questionId], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  }
};

module.exports = studyDB;