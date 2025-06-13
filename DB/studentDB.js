const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./students.db');

// 学生を追加
function addStudent(userId, password, callback) {
  db.run('INSERT INTO students (userId, password) VALUES (?, ?)', [userId, password], callback);
}

// 学生一覧を取得
function getAllStudents(callback) {
  db.all('SELECT id, userId FROM students', callback);
}

// 学生を削除
function deleteStudent(userId, callback) {
  db.run('DELETE FROM students WHERE userId = ?', [userId], callback);
}

// 認証チェック
function authenticate(userId, password, callback) {
  db.get('SELECT * FROM students WHERE userId = ? AND password = ?', [userId, password], callback);
}

module.exports = { addStudent, getAllStudents, deleteStudent, authenticate };
