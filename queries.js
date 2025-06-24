// queries.js
module.exports = {
  // =================================================================
  // テーブル作成 (CREATE TABLE)
  // =================================================================

  /**
   * 教師テーブルを作成します。
   */
  createTeachersTable: `
    CREATE TABLE IF NOT EXISTS teachers (
      teacherId       TEXT PRIMARY KEY,
      teacherName     TEXT NOT NULL,
      teacherPassword TEXT NOT NULL,
      teacherAge      INTEGER
    );
  `,

  /**
   * 生徒テーブルを作成します。
   * こちらは主にログイン認証用として使われる想定です。
   */
  createStudentsTable: `
    CREATE TABLE IF NOT EXISTS students (
      studentId       TEXT PRIMARY KEY,
      studentName     TEXT NOT NULL,
      studentPassword TEXT NOT NULL,
      studentAge             INTEGER
    );
  `,

  /**
   * 生徒情報管理テーブルを作成します。
   */
  createStudentsInformationTable: `
    CREATE TABLE IF NOT EXISTS students_information (
      studentId           TEXT PRIMARY KEY,
      studentName         TEXT NOT NULL,
      studentPassword     TEXT,
      age                 INTEGER,
      admissionDate       TEXT,
      goBackHomeDate      TEXT,
      teacherNameInCharge TEXT,
      teacherId           TEXT,
      FOREIGN KEY (studentId) REFERENCES students (studentId),
      FOREIGN KEY (teacherId) REFERENCES teachers (teacherId)
    );
  `,

  /**
   * 学習テーブルを作成します。
   */
  createStudyTable: `
    CREATE TABLE IF NOT EXISTS study (
      studentId      TEXT,
      studyProblemId TEXT,
      answer         TEXT,
      PRIMARY KEY (studentId, studyProblemId),
      FOREIGN KEY (studentId) REFERENCES students (studentId)
    );
  `,

  /**
   * 自己学習テーブルを作成します。
   */
  createSelfLearningTable: `
    CREATE TABLE IF NOT EXISTS self_learning (
      studentId           TEXT,
      teachingMaterialsId TEXT,
      answer              TEXT,
      PRIMARY KEY (studentId, teachingMaterialsId),
      FOREIGN KEY (studentId) REFERENCES students (studentId)
    );
  `,

  /**
   * 個別学習テーブルを作成します。
   */
  createIndividualLearningTable: `
    CREATE TABLE IF NOT EXISTS individual_learning (
      studentId   TEXT,
      aiProblemId TEXT,
      answer      TEXT,
      PRIMARY KEY (studentId, aiProblemId),
      FOREIGN KEY (studentId) REFERENCES students (studentId)
    );
  `,

  /**
   * 学習記録テーブルを作成します。
   */
  createLearningRecordsTable: `
    CREATE TABLE IF NOT EXISTS learning_records (
      studyProblemId             TEXT,
      teachingMaterialsId        TEXT,
      aiProblemId                TEXT,
      studentId                  TEXT,
      studyDate                  TEXT,
      studyTime                  INTEGER,
      percentageOfCorrectAnswers INTEGER,
      FOREIGN KEY (studentId) REFERENCES students (studentId)
    );
  `,

  // =================================================================
  // データ操作 (SELECT, INSERT, DELETEなど)
  // =================================================================
  
  // SELECT文
  selectTeacherById: `SELECT * FROM teachers WHERE teacherId = ?;`,
  selectStudentById: `SELECT * FROM students WHERE studentId = ?;`, // ★ この行を追加しました
  selectTeacherForLogin: `SELECT * FROM teachers WHERE teacherId = ? AND teacherPassword = ?;`, 
  selectStudentForLogin: `SELECT * FROM students WHERE studentId = ? AND studentPassword = ?;`,

  selectAllStudentsInfo: `
    SELECT 
      studentId, 
      studentName, 
      age, 
      teacherNameInCharge 
    FROM 
      students_information 
    ORDER BY 
      studentId;
  `,

  // INSERT文
  // [注意] サーバー側でマスター教師アカウントを作成する際の呼び出しも、このクエリに合わせて修正が必要です。
  // (teacherId, teacherName, teacherPassword, age) の4つの値を渡す必要があります。
  insertTeacher: `INSERT INTO teachers (teacherId, teacherName, teacherPassword, teacherAge) VALUES (?, ?, ?, ?);`,

  // [修正] Canvasで修正したフォームに合わせて、4つの値 (ID, 名前, パスワード, 年齢) を受け取るように変更
  insertStudent: `INSERT INTO students (studentId, studentName, studentPassword, studentAge) VALUES (?, ?, ?, ?);`,

  insertStudentInfo: `INSERT INTO students_information (studentId, studentName, studentPassword, studentAge, admissionDate, goBackHomeDate, teacherNameInCharge, teacherId) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
  insertStudy: `INSERT INTO study (studentId, studyProblemId, answer) VALUES (?, ?, ?);`,
  insertSelfLearning: `INSERT INTO self_learning (studentId, teachingMaterialsId, answer) VALUES (?, ?, ?);`,
  insertIndividualLearning: `INSERT INTO individual_learning (studentId, aiProblemId, answer) VALUES (?, ?, ?);`,
  insertLearningRecord: `INSERT INTO learning_records (studyProblemId, teachingMaterialsId, aiProblemId, studentId, studyDate, studyTime, percentageOfCorrectAnswers) VALUES (?, ?, ?, ?, ?, ?, ?);`,
  
  // DELETE文
  deleteStudentById: `DELETE FROM students WHERE studentId = ?;`
};
