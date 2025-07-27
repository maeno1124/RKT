// queries.js
module.exports = {
  // =================================================================
  // テーブル作成 (CREATE TABLE)
  // =================================================================

  /**
   * 生徒テーブル
   * 主にログイン認証用として使われる基本情報テーブルです。
   * studentId: 生徒を一意に識別するコード (主キー)
   * studentName: 生徒の氏名 (必須)
   * studentPassword: 生徒のパスワード (ハッシュ化されたもの、必須)
   * studentAge: 生徒の年齢
   */
  createStudentsTable: `
    CREATE TABLE IF NOT EXISTS students (
      studentId       TEXT PRIMARY KEY,
      studentName     TEXT NOT NULL,
      studentPassword TEXT NOT NULL,
      studentAge      INTEGER
    );
  `,

  /**
   * 教師テーブル
   * 教師の基本情報とログイン認証情報を格納するテーブルです。
   * teacherId: 教師を一意に識別するコード (主キー)
   * teacherName: 教師の氏名 (必須)
   * teacherPassword: 教師のパスワード (ハッシュ化されたもの、必須)
   * teacherAge: 教師の年齢
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
   * 学習テーブル (一般教材学習の記録用)
   * 学生が一般教材学習を行った際の解答記録を保存します。
   * studentId: 生徒用コード (外部キー: studentsテーブル)
   * studyProblemId: 学習問題ID (teachingMaterials.teachingMaterialsId を格納する想定ですが、
   * CramSchoolMaterials.studyProblemId への外部キー制約があるため注意が必要です。
   * スキーマ設計の見直しを推奨します。)
   * answer: 生徒の解答
   * correction: 解答の正誤 ('正解' または '不正解')
   * PRIMARY KEY: studentId と studyProblemId の複合主キー
   * FOREIGN KEY: studentsテーブルとCramSchoolMaterialsテーブルを参照 (後者は論理的な不一致の可能性あり)
   */
    createStudyTable: `
    CREATE TABLE IF NOT EXISTS study (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId         TEXT NOT NULL,
      studyProblemId    TEXT NOT NULL,
      answer            TEXT NOT NULL,
      correction        TEXT NOT NULL,
      timestamp         TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (studentId) REFERENCES students (studentId)
    );
  `,

  /**
   * 自己学習テーブル (はなみち学習室専用教材学習の記録用)
   * 学生がはなみち学習室専用教材学習を行った際の解答記録を保存します。
   * studentId: 生徒用コード (外部キー: studentsテーブル)
   * teachingMaterialsId: 教材ID (外部キー: teachingMaterialsテーブル)
   * answer: 生徒の解答
   * correction: 解答の正誤 ('正解' または '不正解')
   * PRIMARY KEY: studentId と teachingMaterialsId の複合主キー
   * FOREIGN KEY: studentsテーブルとteachingMaterialsテーブルを参照
   */
  createSelfLearningTable: `
    CREATE TABLE IF NOT EXISTS self_learning (
      studentId           TEXT,
      teachingMaterialsId INTEGER,
      answer              TEXT,
      correction          TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (studentId, teachingMaterialsId),
      FOREIGN KEY (studentId) REFERENCES students (studentId),
      FOREIGN KEY (teachingMaterialsId) REFERENCES teachingMaterials (teachingMaterialsId)
    );
  `,

  /**
   * 個別学習テーブル (AI使用個別苦手克服学習の記録用)
   * 学生がAI使用個別苦手克服学習を行った際の解答記録を保存します。
   * studentId: 生徒用コード (外部キー: studentsテーブル)
   * aiProblemId: AI問題ID (外部キー: AIProblemテーブル)
   * answer: 解答
   * correction: 解答の正誤 ('正解' または '不正解')
   * PRIMARY KEY: studentId と aiProblemId の複合主キー
   * FOREIGN KEY: studentsテーブルとAIProblemテーブルを参照
   */
  createIndividualLearningTable: `
     CREATE TABLE IF NOT EXISTS individual_learning (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId TEXT NOT NULL,
      aiProblemId TEXT NOT NULL,
      answer TEXT NOT NULL,
      correction TEXT NOT NULL,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (studentId) REFERENCES students(studentId)
    );
  `,

  /**
   * 学習記録テーブル (日ごとの学習サマリー用)
   * 生徒の日ごとの総学習時間、総問題数、正解数、学習タイプフラグを保存します。
   * recordId: ユニークなレコードID (主キー)
   * studentId: 生徒用コード (外部キー: studentsテーブル)
   * studyDate: 学習日 (YYYY-MM-DD形式、studentIdとの組み合わせでユニーク)
   * totalStudyTimeMinutes: その日の合計学習時間（分）
   * dailyTotalQuestions: その日に解答した総問題数
   * dailyCorrectAnswers: その日に正解した問題数
   * hasCramSchoolStudy: 塾の学習(仮)を行ったか (0=No, 1=Yes)
   * hasTeachingMaterialStudy: 一般教材学習を行ったか (0=No, 1=Yes)
   * hasAIProblemStudy: AI使用個別苦手克服学習を行ったか (0=No, 1=Yes)
   * UNIQUE: studentId と studyDate の組み合わせでユニーク性を保証
   */
  createLearningRecordsTable: `
    CREATE TABLE IF NOT EXISTS learning_records (
      recordId             INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId            TEXT NOT NULL,
      studyDate            TEXT NOT NULL,
      totalStudyTimeMinutes INTEGER DEFAULT 0,
      dailyTotalQuestions  INTEGER DEFAULT 0,
      dailyCorrectAnswers  INTEGER DEFAULT 0,
      hasCramSchoolStudy   INTEGER DEFAULT 0,
      hasTeachingMaterialStudy INTEGER DEFAULT 0,
      hasAIProblemStudy    INTEGER DEFAULT 0,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (studentId) REFERENCES students (studentId),
      UNIQUE (studentId, studyDate)
    );
  `,

  /**
   * 生徒情報管理テーブル
   * 生徒の拡張情報と担当教師情報を格納するテーブルです。
   * studentId: 生徒用コード (主キー, 外部キー: studentsテーブル)
   * studentName: 生徒氏名 (必須)
   * studentPassword: 生徒用パスワード (ハッシュ化されたもの、必須)
   * studentAge: 生徒年齢
   * admissionDate: 入塾日
   * goBackHomeDate: 退塾日
   * teacherName: 担当教師氏名
   * teacherId: 担当教師コード (外部キー: teachersテーブル)
   * FOREIGN KEY: studentsテーブルとteachersテーブルを参照
   */
  createStudentsInformationTable: `
   CREATE TABLE IF NOT EXISTS students_information (
            studentId TEXT PRIMARY KEY,
            studentName TEXT NOT NULL,
            studentPassword TEXT NOT NULL,
            studentAge INTEGER,
            admissionDate TEXT,
            goBackHomeDate TEXT,
            teacherName TEXT,
            teacherId TEXT,
            FOREIGN KEY (studentId) REFERENCES students(studentId)
    );
  `,

  /**
   * 塾の学習(仮)テーブル
   * はなみち学習室専用教材の問題を格納するテーブルです。
   * studyProblemId: 問題ID (主キー)
   * problemStatement: 問題文
   * OptionA, B, C, D: 選択肢
   * Correct: 正解の選択肢 (例: 'A', 'B', 'C', 'D')
   */
  createCramSchoolMaterialsTable: `
    CREATE TABLE IF NOT EXISTS CramSchoolMaterials (
      studyProblemId INTEGER PRIMARY KEY,
      problemStatement TEXT,
      OptionA TEXT,
      OptionB TEXT,
      OptionC TEXT,
      OptionD TEXT,
      Correct TEXT
    );
  `,  

  /**
   * 教材テーブル
   * 一般教材の問題を格納するテーブルです。
   * teachingMaterialsId: 教材ID (主キー)
   * problemStatement: 問題文
   * OptionA, B, C, D: 選択肢
   * Correct: 正解の選択肢 (例: 'A', 'B', 'C', 'D')
   */
  createTeachingMaterialsTable: `
    CREATE TABLE IF NOT EXISTS teachingMaterials (
      teachingMaterialsId TEXT PRIMARY KEY,
      problemStatement TEXT,
      OptionA TEXT,
      OptionB TEXT,
      OptionC TEXT,
      OptionD TEXT,
      Correct TEXT
    );
  `,  

  /**
   * AI問題テーブル
   * AI使用個別苦手克服学習の問題を格納するテーブルです。
   * aiProblemId: AI問題ID (主キー)
   * problemStatement: 問題文
   * OptionA, B, C, D: 選択肢
   * Correct: 正解の選択肢 (例: 'A', 'B', 'C', 'D')
   */
  createAIProblemTable: `
    CREATE TABLE IF NOT EXISTS AIProblem (
      aiProblemId TEXT PRIMARY KEY,
      problemStatement TEXT,
      OptionA TEXT,
      OptionB TEXT,
      OptionC TEXT,
      OptionD TEXT,
      Correct TEXT
    );
  `,    


  // =================================================================
  // データ操作 (SELECT, INSERT, DELETEなど)
  // =================================================================

  // SELECT文

  /**
   * 指定された教師IDに一致する教師情報を取得します。
   */
  selectTeacherById: `SELECT * FROM teachers WHERE teacherId = ?;`,
  /**
   * 指定された生徒IDに一致する生徒情報を取得します。
   */
  selectStudentById: `SELECT * FROM students WHERE studentId = ?;`,

  /**
   * 全生徒の情報を取得します。
   * students_informationテーブルから生徒ID、氏名、年齢、入塾日、退塾日、担当教師ID、担当教師名を取得します。
   * 担当教師名はstudents_information.teacherNameカラムから直接取得されます。
   */
  selectAllStudentsInfo: `
    SELECT
      si.studentId,
      si.studentName,
      si.studentAge,
      si.admissionDate,
      si.goBackHomeDate,
      si.teacherId,
      si.teacherName AS teacherNameInCharge
    FROM
      students_information si
    ORDER BY
      si.studentId;
  `,

  /**
   * 全ての教師情報を取得します。
   */
  selectAllTeachers: `SELECT * FROM teachers ORDER BY teacherId;`,

  /**
   * 全ての学習記録（日ごとのサマリー）を学習日と生徒IDの降順で取得します。
   */
  selectAllLearningRecords: `SELECT * FROM learning_records ORDER BY studyDate DESC, studentId;`,

  /**
   * 特定の生徒の学習記録（日ごとのサマリー）を学習日の降順で取得します。
   * studentId をパラメータとして受け取ります。
   */
  selectLearningRecordsByStudentId: `SELECT * FROM learning_records WHERE studentId = ? ORDER BY studyDate DESC;`,

  /**
   * CramSchoolMaterialsテーブルからランダムな問題を1つ取得します。
   */
  selectRandomCramSchoolMaterial: `SELECT * FROM CramSchoolMaterials ORDER BY RANDOM() LIMIT 1;`,

  /**
   * 指定されたstudyProblemIdに一致するCramSchoolMaterialsの問題を取得します。
   */
  selectCramSchoolMaterialById: `SELECT * FROM CramSchoolMaterials WHERE studyProblemId = ?;`,

  /**
   * teachingMaterialsテーブルからランダムな問題を1つ取得します。
   */
  selectRandomTeachingMaterial: `SELECT * FROM teachingMaterials ORDER BY RANDOM() LIMIT 1;`,

  /**
   * 指定されたteachingMaterialsIdに一致するteachingMaterialsの問題を取得します。
   */
  selectTeachingMaterialById: `SELECT * FROM teachingMaterials WHERE teachingMaterialsId = ?;`,

  /**
   * AIProblemテーブルからランダムな問題を1つ取得します。
   */
  selectRandomAIProblem: `SELECT * FROM AIProblem ORDER BY RANDOM() LIMIT 1;`,

  /**
   * 指定されたaiProblemIdに一致するAIProblemの問題を取得します。
   */
  selectAIProblemById: `SELECT * FROM AIProblem WHERE aiProblemId = ?;`,

  /**
   * 特定の生徒の自己学習 (self_learning) 記録を全て取得します。
   */
  selectSelfLearningRecordsByStudentId: `SELECT * FROM self_learning WHERE studentId = ?;`,

  /**
   * 特定の生徒の一般教材学習 (study) 記録を全て取得します。
   */
  selectStudyRecordsByStudentId: `SELECT * FROM study WHERE studentId = ?;`,

  /**
   * 特定の生徒の個別学習 (individual_learning) 記録を全て取得します。
   */
  selectIndividualLearningRecordsByStudentId: `SELECT * FROM individual_learning WHERE studentId = ?;`,

  /**
   * 特定の生徒と日付の学習記録サマリーを取得します。
   */
  selectDailyLearningRecord: `SELECT * FROM learning_records WHERE studentId = ? AND studyDate = ?;`,


  // INSERT文

  /**
   * teachersテーブルに新しい教師情報を挿入します。
   * teacherId, teacherName, teacherPassword (ハッシュ化), teacherAge をパラメータとして受け取ります。
   */
  insertTeacher: `INSERT INTO teachers (teacherId, teacherName, teacherPassword, teacherAge) VALUES (?, ?, ?, ?);`,
  /**
   * studentsテーブルに新しい生徒の基本情報を挿入します。
   * studentId, studentName, studentPassword (ハッシュ化), studentAge をパラメータとして受け取ります。
   */
  insertStudent: `INSERT INTO students (studentId, studentName, studentPassword, studentAge) VALUES (?, ?, ?, ?);`,

  /**
   * students_informationテーブルに新しい生徒の詳細情報を挿入します。
   * studentId, studentName, studentPassword (ハッシュ化), studentAge, admissionDate, goBackHomeDate, teacherName, teacherId をパラメータとして受け取ります。
   */
  insertStudentInfo: `INSERT INTO students_information (studentId, studentName, studentPassword, studentAge, admissionDate, goBackHomeDate, teacherName, teacherId) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,

  /**
   * learning_recordsテーブルに新しい日ごとの学習サマリーを挿入します。
   * studentId, studyDate, totalStudyTimeMinutes, dailyTotalQuestions, dailyCorrectAnswers, hasCramSchoolStudy, hasTeachingMaterialStudy, hasAIProblemStudy をパラメータとして受け取ります。
   */
  insertDailyLearningRecord: `
    INSERT INTO learning_records (studentId, studyDate, totalStudyTimeMinutes, dailyTotalQuestions, dailyCorrectAnswers, hasCramSchoolStudy, hasTeachingMaterialStudy, hasAIProblemStudy)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
  `,

  /**
   * self_learningテーブルに新しい自己学習記録を挿入します。
   * studentId, teachingMaterialsId, answer, correction をパラメータとして受け取ります。
   */
  insertSelfLearningRecord: 'INSERT INTO self_learning (studentId, teachingMaterialsId, answer, correction, timestamp) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
  /**
   * studyテーブルに新しい一般教材学習記録を挿入します。
   * studentId, studyProblemId, answer, correction をパラメータとして受け取ります。
   * studyProblemId には teachingMaterialsId を格納する想定です。
   */
  insertStudyRecord: 'INSERT INTO study (studentId, studyProblemId, answer, correction, timestamp) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)', 

  /**
   * individual_learningテーブルに新しい個別学習記録を挿入します。
   * studentId, aiProblemId, answer, correction をパラメータとして受け取ります。
   */
 insertIndividualLearningRecord: 'INSERT INTO individual_learning (studentId, aiProblemId, answer, correction, timestamp) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)', 

  // UPDATE文
  /**
   * learning_recordsテーブルの日ごとの学習サマリーを更新します。
   * totalStudyTimeMinutes, dailyTotalQuestions, dailyCorrectAnswers, hasCramSchoolStudy, hasTeachingMaterialStudy, hasAIProblemStudy を更新します。
   * studentId と studyDate でレコードを特定します。
   */
  updateDailyLearningRecord: `
    UPDATE learning_records
    SET
      totalStudyTimeMinutes = ?,
      dailyTotalQuestions = ?,
      dailyCorrectAnswers = ?,
      hasCramSchoolStudy = ?,
      hasTeachingMaterialStudy = ?,
      hasAIProblemStudy = ?
    WHERE
      studentId = ? AND studyDate = ?;
  `,
    /**
   * learning_recordsテーブルのtotalStudyTimeMinutesを既存の値に加算して更新します。
   * totalStudyTimeMinutes (加算する分), studentId, studyDate をパラメータとして受け取ります。
   */
  updateTotalStudyTimeMinutes: `
    UPDATE learning_records
    SET totalStudyTimeMinutes = totalStudyTimeMinutes + ?
    WHERE studentId = ? AND studyDate = ?;
  `,


  // DELETE文

  /**
   * 指定されたstudentIdに一致する生徒をstudentsテーブルから削除します。
   */
  deleteStudentById: `DELETE FROM students WHERE studentId = ?;`,
  /**
   * 指定されたstudentIdに一致する生徒情報をstudents_informationテーブルから削除します。
   */
  deleteStudentInfoById: `DELETE FROM students_information WHERE studentId = ?;`,
  /**
   * 指定されたstudentIdに一致する学習記録をstudyテーブルから削除します。
   */
  deleteStudyByStudentId: `DELETE FROM study WHERE studentId = ?;`,
  /**
   * 指定されたstudentIdに一致する自己学習記録をself_learningテーブルから削除します。
   */
  deleteSelfLearningByStudentId: `DELETE FROM self_learning WHERE studentId = ?;`,
  /**
   * 指定されたstudentIdに一致する個別学習記録をindividual_learningテーブルから削除します。
   */
  deleteIndividualLearningByStudentId: `DELETE FROM individual_learning WHERE studentId = ?;`,
  /**
   * 指定されたstudentIdに一致する学習記録をlearning_recordsテーブルから削除します。
   */
  deleteLearningRecordsByStudentId: `DELETE FROM learning_records WHERE studentId = ?;`
};
