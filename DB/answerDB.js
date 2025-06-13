const db = require('./answer.db');

const answerDB = {
  // 新しい解答を保存する
  create: (studentId, questionId, studentAnswer, isCorrect) => {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO answers (student_id, question_id, student_answer, is_correct) 
        VALUES (?, ?, ?, ?)
      `;
      db.run(sql, [studentId, questionId, studentAnswer, isCorrect], function(err) {
        if (err) reject(err);
        resolve({ id: this.lastID });
      });
    });
  },

  // 特定の生徒の全解答履歴を取得する
  getAnswersByStudent: (studentId) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM answers WHERE student_id = ? ORDER BY answered_at DESC';
        db.all(sql, [studentId], (err, rows) => {
            if (err) reject(err);
            resolve(rows);
        });
    });
  }
};

module.exports = answerDB;