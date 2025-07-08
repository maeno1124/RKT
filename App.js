// ------------------
// モジュールのインポート
// ------------------
const express = require('express'); // webフレームワーク"express"をインポート
const path = require('path'); // パス操作のためのモジュール"path"をインポート
const session = require('express-session'); // セッション管理のためのモジュール"express-session"をインポート
const DatabaseManager = require('./databaseManager'); // データベース操作のためのモジュール"databaseManager"をインポート
const chalk = require('chalk'); // コンソール出力の色付けのためのモジュール"chalk"をインポート
const queries = require('./queries'); // SQLクエリを定義したモジュール"queries"をインポート
const bcrypt = require('bcrypt'); // パスワードハッシュ化のためのモジュール"bcrypt"をインポート
const saltRounds = 10; // bcryptのソルト生成コスト

// ------------------
// データベース設定
// ------------------

// 各データベースファイルの絶対パスを定義
const dbPaths = {
  students: path.join(__dirname, 'DB', 'students.db'), //{studentId}, studentName, studentPassword(hashed), studentAge
  studentsInformation: path.join(__dirname, 'DB', 'studentsInformation.db'), //{studentId}, studentName, studentPassword(hashed), studentAge, admissionDate, goBackHomeDate, teacherName, teacherId
  teacher: path.join(__dirname, 'DB', 'teacher.db'), //{teacherId}, teacherName, teacherPassword(hashed), teacherAge
  study: path.join(__dirname, 'DB', 'study.db'), //{studentId, studyProblemId}, answer
  selfLearning: path.join(__dirname, 'DB', 'selfLearning.db'), //{studentId, teachingMaterialsId}, answer
  individualLearning: path.join(__dirname, 'DB', 'individual_learning.db'), //{studentId, aiProblemId}, answer
  learningRecords: path.join(__dirname, 'DB', 'learning_records.db'), //{studyProblemId}, problemStatement, OptionA, OptionB, OptionC, OptionD, Correct
  cramSchoolMaterials: path.join(__dirname, 'DB', 'CramSchoolMaterials.db'), //{studyProblemId}, problemStatement, OptionA, OptionB, OptionC, OptionD, Correct
  teachingMaterials: path.join(__dirname, 'DB', 'teachingMaterials.db'), //{teachingMaterialsId}, problemStatement, OptionA, OptionB, OptionC, OptionD, Correct
  aiProblem: path.join(__dirname, 'DB', 'AIProblem.db'), //{aiProblemId}, problemStatement, OptionA, OptionB, OptionC, OptionD, Correct
};

// 各データベースパスに対して、DatabaseManagerのインスタンスを作成
const dbManagers = {
  students: new DatabaseManager(dbPaths.students),
  studentsInformation: new DatabaseManager(dbPaths.studentsInformation),
  teacher: new DatabaseManager(dbPaths.teacher),
  study: new DatabaseManager(dbPaths.study),
  selfLearning: new DatabaseManager(dbPaths.selfLearning),
  individualLearning: new DatabaseManager(dbPaths.individualLearning),
  learningRecords: new DatabaseManager(dbPaths.learningRecords),
  cramSchoolMaterials: new DatabaseManager(dbPaths.cramSchoolMaterials),
  teachingMaterials: new DatabaseManager(dbPaths.teachingMaterials),
  aiProblem: new DatabaseManager(dbPaths.aiProblem),
};

// ------------------
// Expressアプリケーション設定
// ------------------
const app = express();
const port = 8080;  // ポート番号を8080に設定

app.set('view engine', 'ejs'); // EJSテンプレートエンジンを使用するための設定
app.set('views', path.join(__dirname, 'views')); // ビューのディレクトリを設定
app.use(express.urlencoded({ extended: true })); // URLエンコードされたデータをパースするためのミドルウェア
app.use(express.json()); // JSONボディをパースするためのミドルウェアを追加 (ログアウト時の学習時間送信に必要)
app.use(express.static(path.join(__dirname, 'public'))); // 静的ファイルの提供

// ------------------
// セッション管理の設定
// ------------------
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret_key_is_very_secret_and_long', // セッションIDを署名するためのシークレットキー
  resave: false, // セッションが変更されていなくても強制的にセッションをセッションストアに保存しない
  saveUninitialized: true, // 未初期化のセッション（新しいが変更されていないセッション）をセッションストアに保存する
  cookie: { secure: process.env.NODE_ENV === 'production' } // 本番環境ではHTTPSを推奨しtrueにする（開発時はfalse）
}));

// res.localsにユーザー情報を設定するミドルウェア
app.use((req, res, next) => {
  res.locals.user = req.session.user; // セッションのユーザー情報を全てのEJSテンプレートで使えるようにする
  // ナビゲーションバーのリンク情報を定義し、EJSテンプレート内で `navLinks` という変数で使用可能に設定
  res.locals.navLinks = [
    { href: '/contact', label: 'お問い合わせ' },
  ];
  next();
});

// ------------------
// 認証ミドルウェア
// ------------------

// ログインが必要なページ用のミドルウェア
const requireLogin = (req, res, next) => {
  if (!req.session.user) {
    // ログインしていない場合、ログインページにリダイレクトし、エラーメッセージを渡す
    return res.render('login', { error: 'ログインが必要です。' });
  }
  next(); // ログインしていれば次の処理へ
};

// 教師のみがアクセスできるページ用のミドルウェア
const requireTeacher = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'teacher') {
    // 教師としてログインしていない場合、エラーまたはホームへリダイレクト
    return res.status(403).render('error', { message: 'アクセス権がありません。教師アカウントでログインしてください。' });
  }
  next();
};


// ------------------
// ルーティング
// ------------------

// --- GETリクエスト ---
// ルートパス: ログインページを表示
app.get('/', (req, res) => res.render('login', { error: null }));
// お問い合わせページを表示
app.get('/contact', (req, res) => res.render('contact', { title: 'お問い合わせ' }));
// パスワード忘れページを表示
app.get('/forgot-password', (req, res) => res.render('forgotPassword', { message: null, error: null })); // テンプレート名を修正
// 利用規約ページを表示
app.get('/terms', (req, res) => res.render('terms'));
// プライバシーポリシーページを表示
app.get('/privacy', (req, res) => res.render('privacy'));

// 新規学生登録フォームの表示ルート (ログイン済み教師のみアクセス可能)
app.get('/add-student', requireLogin, requireTeacher, (req, res) => {
  res.render('add-student', { 
    success: req.session.success, 
    error: req.session.error 
  });
  delete req.session.success; // メッセージを一度表示したらクリア
  delete req.session.error;   // メッセージを一度表示したらクリア
});

// 新規教師登録フォームの表示ルート (ログイン済み教師のみアクセス可能)
app.get('/add-teacher', requireLogin, requireTeacher, (req, res) => {
  res.render('add-teacher', { 
    success: req.session.success, 
    error: req.session.error 
  });
  delete req.session.success; // メッセージを一度表示したらクリア
  delete req.session.error;   // メッセージを一度表示したらクリア
});

// 汎用学習ページ (現在未使用だがルートは残す)
app.get('/learning', requireLogin, (req, res) => res.render('learning'));

// 学習記録一覧ページ (ログイン済みユーザーのみアクセス可能)
app.get('/learning-records', requireLogin, async (req, res) => {
  try {
    let records = []; // 全期間の学習記録（サマリー）
    let totalQuestions = 0;
    let totalCorrectAnswers = 0;
    // URLクエリから日付を取得、なければ今日の日付をデフォルトとする
    const selectedDate = req.query.date || new Date().toISOString().split('T')[0];

    let dailyRecord = null; // 選択された日付の単一の学習記録

    if (req.session.user.role === 'teacher') {
      // 教師の場合、全ての学習記録を表示
      records = await dbManagers.learningRecords.all(queries.selectAllLearningRecords);
      
      // 教師の場合、全生徒の学習成果を集計 (daily summary recordsから)
      const allDailySummaries = await dbManagers.learningRecords.all(queries.selectAllLearningRecords); // 全てのサマリーレコードを取得
      allDailySummaries.forEach(record => {
        totalQuestions += record.dailyTotalQuestions;
        totalCorrectAnswers += record.dailyCorrectAnswers;
      });

      // 教師の場合、selectedDateに紐づく特定の生徒の記録ではなく、
      // records配列からselectedDateに一致するレコードをフィルタリングして表示する
      // learning-records.ejs の表示ロジックに合わせて、dailyRecordはnullのまま
      // recordsは全ての記録なので、UI側でselectedDateでフィルタリングして表示する
      
    } else if (req.session.user.role === 'student') {
      // 生徒の場合、自身の全期間の学習サマリーを取得
      records = await dbManagers.learningRecords.all(queries.selectLearningRecordsByStudentId, [req.session.user.id]);
      
      // 全期間の学習成果を集計
      records.forEach(record => {
        totalQuestions += record.dailyTotalQuestions;
        totalCorrectAnswers += record.dailyCorrectAnswers;
      });

      // 選択された日付の自身の学習記録を取得
      dailyRecord = await dbManagers.learningRecords.get(queries.selectDailyLearningRecord, [req.session.user.id, selectedDate]);
    }

    // 正答率を計算 (総問題数が0の場合は'N/A')
    const correctAnswerRate = (totalQuestions > 0) ? ((totalCorrectAnswers / totalQuestions) * 100).toFixed(2) : 'N/A';

    res.render('learning-records', {
      records: records, // 生徒の場合は自身の全期間の記録、教師の場合は全生徒の全期間の記録
      dailyRecord: dailyRecord, // 選択された日付の単一の記録 (生徒の場合のみ有効)
      selectedDate: selectedDate, // 現在表示している日付 (YYYY-MM-DD)
      user: req.session.user,
      totalQuestions: totalQuestions,
      totalCorrectAnswers: totalCorrectAnswers,
      correctAnswerRate: correctAnswerRate
    });
  } catch (err) {
    console.error(chalk.red('DB learning records acquisition error:', err));
    res.status(500).render('error', { message: '学習記録の取得中にエラーが発生しました。' });
  }
});

// はなみち学習室専用教材学習ページ (ログイン済みユーザーのみアクセス可能)
app.get('/selfLearning', requireLogin, async (req, res) => {
  try {
    // ログイン中の生徒の基本情報を取得
    const studentInfo = await dbManagers.students.get(queries.selectStudentById, [req.session.user.id]);
    
    // CramSchoolMaterials からランダムな問題を取得
    const problem = await dbManagers.cramSchoolMaterials.get(queries.selectRandomCramSchoolMaterial);
    
    res.render('selfLearning', { 
      problem: problem, // 取得した問題データ
      user: req.session.user, // ログインユーザー情報
      studentInfo: studentInfo, // 生徒の基本情報
      success: req.session.success, // 前回の解答結果メッセージ
      error: req.session.error     // エラーメッセージ
    });
    delete req.session.success; // メッセージを一度表示したらクリア
    delete req.session.error;   // メッセージを一度表示したらクリア
  } catch (err) {
    console.error(chalk.red('DB CramSchoolMaterials acquisition error or student info error:', err));
    res.status(500).render('error', { message: '教材または生徒情報の取得中にエラーが発生しました。' });
  }
});

// 一般教材学習ページ (ログイン済みユーザーのみアクセス可能)
app.get('/study', requireLogin, async (req, res) => {
  try {
    // ログイン中の生徒の基本情報を取得
    const studentInfo = await dbManagers.students.get(queries.selectStudentById, [req.session.user.id]);
    
    // teachingMaterials からランダムな問題を取得
    const problem = await dbManagers.teachingMaterials.get(queries.selectRandomTeachingMaterial);
    
    res.render('study', { // study.ejs テンプレートをレンダリング
      problem: problem, 
      user: req.session.user, 
      studentInfo: studentInfo,
      success: req.session.success,
      error: req.session.error
    });
    delete req.session.success;
    delete req.session.error;
  } catch (err) {
    console.error(chalk.red('DB teachingMaterials acquisition error or student info error:', err));
    res.status(500).render('error', { message: '教材または生徒情報の取得中にエラーが発生しました。' });
  }
});

// AI使用個別苦手克服学習ページ (ログイン済みユーザーのみアクセス可能)
app.get('/individual_learning', requireLogin, async (req, res) => {
  try {
    // ログイン中の生徒の基本情報を取得
    const studentInfo = await dbManagers.students.get(queries.selectStudentById, [req.session.user.id]);
    
    // AIProblem からランダムな問題を取得
    const problem = await dbManagers.aiProblem.get(queries.selectRandomAIProblem);
    
    res.render('individual_learning', { 
      problem: problem, 
      user: req.session.user, 
      studentInfo: studentInfo,
      success: req.session.success,
      error: req.session.error
    });
    delete req.session.success;
    delete req.session.error;
  } catch (err) {
    console.error(chalk.red('DB AIProblem acquisition error or student info error:', err));
    res.status(500).render('error', { message: 'AI問題または生徒情報の取得中にエラーが発生しました。' });
  }
});


// 教師用管理画面 (ログイン済み教師のみアクセス可能)
app.get('/teacher', requireLogin, requireTeacher, async (req, res) => {
  try {
    // students_informationテーブルから生徒の実用的なデータを取得
    const students = await dbManagers.studentsInformation.all(queries.selectAllStudentsInfo);
    // teachersテーブルから教師の実用的なデータを取得
    const teachers = await dbManagers.teacher.all(queries.selectAllTeachers);

    res.render('teacher', {
      students: students,
      teachers: teachers,
      success: req.session.success,
      error: req.session.error
    });
    delete req.session.success;
    delete req.session.error;
  } catch (err) {
    console.error(chalk.red('DB All students or teachers acquisition error:', err));
    req.session.error = '生徒または教師情報の取得中にエラーが発生しました。';
    res.redirect('/teacher');
  }
});

// 学生用画面 (ログイン済み学生のみアクセス可能)
app.get('/student', requireLogin, async (req, res) => {
  if (req.session.user.role !== 'student') {
    return res.status(403).render('error', { message: 'アクセス権がありません。生徒アカウントでログインしてください。' });
  }
  try {
    // 生徒自身の基本情報を students テーブルから取得し、テンプレートに渡す
    const studentId = req.session.user.id;
    const studentInfo = await dbManagers.students.get(queries.selectStudentById, [studentId]);

    // ログイン時にその日の学習サマリーレコードをチェック/作成
    const today = new Date().toISOString().split('T')[0];
    let dailyRecord = await dbManagers.learningRecords.get(queries.selectDailyLearningRecord, [studentId, today]);

    if (!dailyRecord) {
      // レコードが存在しない場合、新規作成
      await dbManagers.learningRecords.run(queries.insertDailyLearningRecord, [
        studentId, today, 0, 0, 0, 0, 0, 0
      ]);
      dailyRecord = { // 新規作成したレコードのデフォルト値を設定
        studentId: studentId,
        studyDate: today,
        totalStudyTimeMinutes: 0,
        dailyTotalQuestions: 0,
        dailyCorrectAnswers: 0,
        hasCramSchoolStudy: 0,
        hasTeachingMaterialStudy: 0,
        hasAIProblemStudy: 0
      };
    }

    res.render('student', {
      user: { ...req.session.user, ...studentInfo } // セッション情報とDB情報をマージしてテンプレートに渡す
    });
  } catch (err) {
    console.error(chalk.red('DB student info or learning records acquisition error:', err));
    res.status(500).render('error', { message: '生徒情報または学習記録の取得中にエラーが発生しました。' });
  }
});


// --- POSTリクエスト ---

// ログイン処理
app.post('/login', async (req, res) => {
  const { userId, password } = req.body; // フォームからIDとパスワードを取得
  try {
    // まず教師テーブルでログインを試みる
    const teacher = await dbManagers.teacher.get(queries.selectTeacherById, [userId]);
    if (teacher && await bcrypt.compare(password, teacher.teacherPassword)) {
      // 教師としてログイン成功
      req.session.user = { id: teacher.teacherId, name: teacher.teacherName, role: 'teacher' };
      return res.redirect('/teacher'); // 教師のページへリダイレクト
    }

    // 教師で見つからなければ、生徒テーブルで探す
    const student = await dbManagers.students.get(queries.selectStudentById, [userId]);
    if (student && await bcrypt.compare(password, student.studentPassword)) {
      // 生徒としてログイン成功
      req.session.user = { id: student.studentId, name: student.studentName, role: 'student' };
      return res.redirect('/student'); // 生徒のページへリダイレクト
    }

    // 教師と生徒の両方で見つからなければ、ログイン失敗
    res.render('login', { error: 'IDまたはパスワードが正しくありません。' });
  } catch (err) {
    console.error(chalk.red('DB login error:', err));
    res.render('login', { error: 'ログイン中にエラーが発生しました。' });
  }
});

// 生徒追加処理 (ログイン済み教師のみアクセス可能)
app.post('/add-student', requireLogin, requireTeacher, async (req, res) => {
  const { userId, studentName, password, age } = req.body; // フォームから生徒情報を取得
  try {
    // 1. 既存の生徒IDと重複しないか確認
    const existingStudent = await dbManagers.students.get(queries.selectStudentById, [userId]);
    if (existingStudent) {
      console.error(chalk.red('エラー: 生徒ID ' + userId + ' は既に存在します。'));
      req.session.error = `生徒ID ${userId} は既に存在します。`;
      return res.redirect('/teacher');
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // ログイン中の教師のIDと名前を担当教師として取得
    const teacherIdInCharge = req.session.user.id;
    const teacherNameInCharge = req.session.user.name;
    
    // 2. studentsテーブルに基本情報を保存 (ログイン用)
    await dbManagers.students.run(queries.insertStudent, [
      userId,
      studentName,
      hashedPassword,
      age
    ]);

    // 3. students_informationテーブルに詳細情報を保存
    await dbManagers.studentsInformation.run(queries.insertStudentInfo, [
      userId,
      studentName,
      hashedPassword, // students_informationにもハッシュ化されたパスワードを保存
      age,
      new Date().toISOString().split('T')[0], // admissionDate (今日のYYYY-MM-DD形式)
      null, // goBackHomeDate (初期はNULL)
      teacherNameInCharge, // 担当教師名
      teacherIdInCharge // 担当教師ID
    ]);
    
    // 処理後、教師ページにリダイレクトし、成功メッセージを表示
    req.session.success = `生徒 ${studentName} (${userId}) が追加されました。`;
    res.redirect('/teacher');

  } catch (err) {
    console.error(chalk.red('生徒追加エラー:', err));
    req.session.error = '生徒の追加中にエラーが発生しました。';
    res.redirect('/teacher');
  }
});

// 新規教師登録処理 (ログイン済み教師のみアクセス可能)
app.post('/add-teacher', requireLogin, requireTeacher, async (req, res) => {
  const { teacherId, teacherName, password, age } = req.body; // フォームから教師情報を取得
  try {
    // 1. 既存の教師IDと重複しないか確認
    const existingTeacher = await dbManagers.teacher.get(queries.selectTeacherById, [teacherId]);
    if (existingTeacher) {
      console.error(chalk.red('エラー: 教師ID ' + teacherId + ' は既に存在します。'));
      req.session.error = `教師ID ${teacherId} は既に存在します。`;
      return res.redirect('/add-teacher'); // エラー時は新規登録画面に戻す
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // teachersテーブルに教師情報を保存
    await dbManagers.teacher.run(queries.insertTeacher, [
      teacherId,
      teacherName,
      hashedPassword,
      age || null // 年齢は任意のため、値がなければnullを保存
    ]);
    
    // 処理後、成功メッセージをセッションに保存し、教師管理画面にリダイレクト
    req.session.success = `教師 ${teacherName} (${teacherId}) が追加されました。`;
    res.redirect('/teacher');

  } catch (err) {
    console.error(chalk.red('教師追加エラー:', err));
    req.session.error = '教師の追加中にエラーが発生しました。';
    res.redirect('/add-teacher'); // エラー時は新規登録画面に戻す
  }
});


// はなみち学習室専用教材学習の解答送信処理 (ログイン済みユーザーのみアクセス可能)
app.post('/submit-self-learning-answer', requireLogin, async (req, res) => {
  const { teachingMaterialsId, answer } = req.body; // フォームから教材IDと解答を取得
  const studentId = req.session.user.id; // ログイン中の生徒ID
  const today = new Date().toISOString().split('T')[0]; // 今日の日付

  try {
    // 問題の正解を取得 (CramSchoolMaterials から)
    const problem = await dbManagers.cramSchoolMaterials.get(queries.selectCramSchoolMaterialById, [teachingMaterialsId]);

    if (!problem) {
      req.session.error = '問題が見つかりませんでした。';
      return res.redirect('/selfLearning');
    }

    // 正誤判定
    const isCorrect = (answer === problem.Correct);
    const correction = isCorrect ? '正解' : '不正解';

    // self_learning テーブルに学習記録を保存 (これは以前からある個別記録)
    await dbManagers.selfLearning.run(queries.insertSelfLearningRecord, [
      studentId,
      teachingMaterialsId,
      answer,
      correction
    ]);

    // learning_records (日ごとのサマリー) を更新
    let dailyRecord = await dbManagers.learningRecords.get(queries.selectDailyLearningRecord, [studentId, today]);
    
    if (!dailyRecord) {
      // 万が一、レコードがない場合は新規作成 (ログイン時に作成されるはずだが念のため)
      await dbManagers.learningRecords.run(queries.insertDailyLearningRecord, [
        studentId, today, 0, 0, 0, 0, 0, 0
      ]);
      dailyRecord = { totalStudyTimeMinutes: 0, dailyTotalQuestions: 0, dailyCorrectAnswers: 0, hasCramSchoolStudy: 0, hasTeachingMaterialStudy: 0, hasAIProblemStudy: 0 };
    }

    // サマリーデータを更新
    const updatedTotalQuestions = dailyRecord.dailyTotalQuestions + 1;
    const updatedCorrectAnswers = dailyRecord.dailyCorrectAnswers + (isCorrect ? 1 : 0);
    const updatedHasCramSchoolStudy = 1; // このタイプの学習が行われたことを示す

    await dbManagers.learningRecords.run(queries.updateDailyLearningRecord, [
      dailyRecord.totalStudyTimeMinutes, // 時間はログアウト時にまとめて更新
      updatedTotalQuestions,
      updatedCorrectAnswers,
      updatedHasCramSchoolStudy,
      dailyRecord.hasTeachingMaterialStudy, // 他の学習タイプフラグはそのまま
      dailyRecord.hasAIProblemStudy,        // 他の学習タイプフラグはそのまま
      studentId,
      today
    ]);

    // 解答結果をセッションに保存し、ページをリロードして次の問題を表示 (または結果メッセージを表示)
    req.session.success = `あなたの解答は「${answer}」でした。結果: ${correction}！`;
    res.redirect('/selfLearning');
  } catch (err) {
    console.error(chalk.red('解答保存エラー:', err));
    req.session.error = '解答の保存中にエラーが発生しました。';
    res.redirect('/selfLearning');
  }
});

// 一般教材学習の解答送信処理 (ログイン済みユーザーのみアクセス可能)
app.post('/submit-general-study-answer', requireLogin, async (req, res) => {
  const { studyProblemId, answer } = req.body; // フォームから問題ID (teachingMaterialsId) と解答を取得
  const studentId = req.session.user.id; // ログイン中の生徒ID
  const today = new Date().toISOString().split('T')[0]; // 今日の日付

  try {
    // teachingMaterials テーブルから問題の正解を取得
    const problem = await dbManagers.teachingMaterials.get(queries.selectTeachingMaterialById, [studyProblemId]);

    if (!problem) {
      req.session.error = '問題が見つかりませんでした。';
      return res.redirect('/study');
    }

    // 正誤判定
    const isCorrect = (answer === problem.Correct);
    const correction = isCorrect ? '正解' : '不正解';

    // study テーブルに学習記録を保存
    // 注意: study.db の studyProblemId は CramSchoolMaterials を参照する外部キー制約があるため、
    // teachingMaterialsId を格納すると外部キーエラーになる可能性があります。
    // スキーマの再設計を推奨します。
    await dbManagers.study.run(queries.insertStudyRecord, [
      studentId,
      studyProblemId,
      answer,
      correction
    ]);

    // learning_records (日ごとのサマリー) を更新
    let dailyRecord = await dbManagers.learningRecords.get(queries.selectDailyLearningRecord, [studentId, today]);
    
    if (!dailyRecord) {
      // 万が一、レコードがない場合は新規作成 (ログイン時に作成されるはずだが念のため)
      await dbManagers.learningRecords.run(queries.insertDailyLearningRecord, [
        studentId, today, 0, 0, 0, 0, 0, 0
      ]);
      dailyRecord = { totalStudyTimeMinutes: 0, dailyTotalQuestions: 0, dailyCorrectAnswers: 0, hasCramSchoolStudy: 0, hasTeachingMaterialStudy: 0, hasAIProblemStudy: 0 };
    }

    // サマリーデータを更新
    const updatedTotalQuestions = dailyRecord.dailyTotalQuestions + 1;
    const updatedCorrectAnswers = dailyRecord.dailyCorrectAnswers + (isCorrect ? 1 : 0);
    const updatedHasTeachingMaterialStudy = 1; // このタイプの学習が行われたことを示す

    await dbManagers.learningRecords.run(queries.updateDailyLearningRecord, [
      dailyRecord.totalStudyTimeMinutes, // 時間はログアウト時にまとめて更新
      updatedTotalQuestions,
      updatedCorrectAnswers,
      dailyRecord.hasCramSchoolStudy, // 他の学習タイプフラグはそのまま
      updatedHasTeachingMaterialStudy,
      dailyRecord.hasAIProblemStudy,        // 他の学習タイプフラグはそのまま
      studentId,
      today
    ]);

    // 解答結果をセッションに保存し、ページをリロードして次の問題を表示 (または結果メッセージを表示)
    req.session.success = `あなたの解答は「${answer}」でした。結果: ${correction}！`;
    res.redirect('/study');
  } catch (err) {
    console.error(chalk.red('一般教材学習の解答保存エラー:', err));
    req.session.error = '解答の保存中にエラーが発生しました。';
    res.redirect('/study');
  }
});

// AI使用個別苦手克服学習の解答送信処理 (ログイン済みユーザーのみアクセス可能)
app.post('/submit-individual-learning-answer', requireLogin, async (req, res) => {
  const { aiProblemId, answer } = req.body; // フォームからAI問題IDと解答を取得
  const studentId = req.session.user.id; // ログイン中の生徒ID
  const today = new Date().toISOString().split('T')[0]; // 今日の日付

  try {
    // AIProblem テーブルから問題の正解を取得
    const problem = await dbManagers.aiProblem.get(queries.selectAIProblemById, [aiProblemId]);

    if (!problem) {
      req.session.error = 'AI問題が見つかりませんでした。';
      return res.redirect('/individual_learning');
    }

    // 正誤判定
    const isCorrect = (answer === problem.Correct);
    const correction = isCorrect ? '正解' : '不正解';

    // individual_learning テーブルに学習記録を保存
    await dbManagers.individualLearning.run(queries.insertIndividualLearningRecord, [
      studentId,
      aiProblemId,
      answer,
      correction
    ]);

    // learning_records (日ごとのサマリー) を更新
    let dailyRecord = await dbManagers.learningRecords.get(queries.selectDailyLearningRecord, [studentId, today]);
    
    if (!dailyRecord) {
      // 万が一、レコードがない場合は新規作成 (ログイン時に作成されるはずだが念のため)
      await dbManagers.learningRecords.run(queries.insertDailyLearningRecord, [
        studentId, today, 0, 0, 0, 0, 0, 0
      ]);
      dailyRecord = { totalStudyTimeMinutes: 0, dailyTotalQuestions: 0, dailyCorrectAnswers: 0, hasCramSchoolStudy: 0, hasTeachingMaterialStudy: 0, hasAIProblemStudy: 0 };
    }

    // サマリーデータを更新
    const updatedTotalQuestions = dailyRecord.dailyTotalQuestions + 1;
    const updatedCorrectAnswers = dailyRecord.dailyCorrectAnswers + (isCorrect ? 1 : 0);
    const updatedHasAIProblemStudy = 1; // このタイプの学習が行われたことを示す

    await dbManagers.learningRecords.run(queries.updateDailyLearningRecord, [
      dailyRecord.totalStudyTimeMinutes, // 時間はログアウト時にまとめて更新
      updatedTotalQuestions,
      updatedCorrectAnswers,
      dailyRecord.hasCramSchoolStudy, // 他の学習タイプフラグはそのまま
      dailyRecord.hasTeachingMaterialStudy, // 他の学習タイプフラグはそのまま
      updatedHasAIProblemStudy,
      studentId,
      today
    ]);

    // 解答結果をセッションに保存し、ページをリロードして次の問題を表示 (または結果メッセージを表示)
    req.session.success = `あなたの解答は「${answer}」でした。結果: ${correction}！`;
    res.redirect('/individual_learning');
  } catch (err) {
    console.error(chalk.red('AI個別学習の解答保存エラー:', err));
    req.session.error = '解答の保存中にエラーが発生しました。';
    res.redirect('/individual_learning');
  }
});


// 生徒情報削除処理 (ログイン済み教師のみアクセス可能)
app.post('/delete-student/:id', requireLogin, requireTeacher, async (req, res) => {
  const { id } = req.params; // URLパラメータから生徒IDを取得
  try {
    // 関連する全てのテーブルから生徒のデータを削除
    await dbManagers.learningRecords.run(queries.deleteLearningRecordsByStudentId, [id]);
    await dbManagers.study.run(queries.deleteStudyByStudentId, [id]);
    await dbManagers.selfLearning.run(queries.deleteSelfLearningByStudentId, [id]);
    await dbManagers.individualLearning.run(queries.deleteIndividualLearningByStudentId, [id]);
    
    // students_informationテーブルから削除
    await dbManagers.studentsInformation.run(queries.deleteStudentInfoById, [id]);
    
    // 最後にstudentsテーブルから削除
    await dbManagers.students.run(queries.deleteStudentById, [id]);

    req.session.success = `生徒ID ${id} の情報が削除されました。`;
    res.redirect('/teacher');
  } catch (err) {
    console.error(chalk.red('Student Deletion Error:', err));
    req.session.error = `生徒ID ${id} の削除中にエラーが発生しました。`;
    res.redirect('/teacher');
  }
});

// ログアウト処理
// クライアントから送信された学習時間を受け取り、learning_records テーブルに保存します。
app.post('/logout', async (req, res) => {
  const accumulatedStudyTime = req.body.accumulatedStudyTime || 0; // クライアントから送られた学習時間（秒）

  try {
    // ログイン中のユーザーが生徒であり、学習時間が0より大きい場合のみ保存
    if (req.session.user && req.session.user.role === 'student' && accumulatedStudyTime > 0) {
      const studentId = req.session.user.id;
      const today = new Date().toISOString().split('T')[0]; // 今日の日付 (YYYY-MM-DD形式)

      // learning_records に学習時間を保存
      // このレコードは特定の学習問題に紐づかないため、IDはNULLで保存
      // 正答率は別途計算されるため、ここでは0として保存
      await dbManagers.learningRecords.run(queries.insertLearningRecord, [
        null, // studyProblemId (該当なし)
        null, // teachingMaterialsId (該当なし)
        null, // aiProblemId (該当なし)
        studentId,
        today,
        Math.round(accumulatedStudyTime / 60), // 秒を分に変換して四捨五入
        0 // 正答率は別途計算されるため、ここでは0またはN/A
      ]);
      console.log(chalk.green(`[SUCCESS] Student ${studentId} logged out. Study time ${Math.round(accumulatedStudyTime / 60)} minutes saved for ${today}.`));
    }
  } catch (err) {
    console.error(chalk.red('Error saving study time on logout:', err));
  } finally {
    // セッションを破棄し、ログインページへリダイレクト
    req.session.destroy((err) => {
      if (err) {
        console.error(chalk.red('session discard error:', err));
        return res.status(500).render('error', { message: 'ログアウトに失敗しました。' });
      }
      res.redirect('/');
    });
  }
});

// ------------------
// サーバー起動前のデータベース初期化
// ------------------
async function initializeDatabases() {  
  // テーブル作成の順番を定義します。外部キー制約を考慮し、参照されるテーブルを先に作成します。
  const tablesToCreate = [
    { name: 'teachers', exec: () => dbManagers.teacher.exec(queries.createTeachersTable) },
    { name: 'students', exec: () => dbManagers.students.exec(queries.createStudentsTable) },
    { name: 'students_information', exec: () => dbManagers.studentsInformation.exec(queries.createStudentsInformationTable) },
    { name: 'CramSchoolMaterials', exec: () => dbManagers.cramSchoolMaterials.exec(queries.createCramSchoolMaterialsTable) },
    { name: 'teachingMaterials', exec: () => dbManagers.teachingMaterials.exec(queries.createTeachingMaterialsTable) },
    { name: 'AIProblem', exec: () => dbManagers.aiProblem.exec(queries.createAIProblemTable) },
    { name: 'study', exec: () => dbManagers.study.exec(queries.createStudyTable) }, // studyテーブルはCramSchoolMaterialsを参照
    { name: 'self_learning', exec: () => dbManagers.selfLearning.exec(queries.createSelfLearningTable) }, // self_learningテーブルはteachingMaterialsを参照
    { name: 'individual_learning', exec: () => dbManagers.individualLearning.exec(queries.createIndividualLearningTable) }, // individual_learningテーブルはAIProblemを参照
    { name: 'learning_records', exec: () => dbManagers.learningRecords.exec(queries.createLearningRecordsTable) } // learning_recordsは複数のテーブルを参照
  ];
  try {
    console.log(chalk.green ('Start database initialization...'));
    // 各テーブルを順番に作成
    for (const table of tablesToCreate) {
      try {
        await table.exec(); // テーブル作成クエリを実行
        console.log(chalk.green(`[SUCCESSES] 「${table.name}」table created or already exists.`));
      } catch (error) {
        // エラーが発生した場合、どのテーブルで失敗したかを具体的に報告し、処理を中断
        console.error(chalk.red(`「${table.name}」table creation failed.`, error.message));
        throw error; // エラーを再スローして外側のcatchブロックで捕捉
      }
    }
    console.log(chalk.green('Fabrication of all tables has been completed.'));

    // マスター教師アカウントの存在確認と作成ロジック
    console.log(chalk.green('Verify the existence of a master teacher account...'));
    const masterId = 'teacher2025';
    const masterPassword = 'password2025';

    const masterTeacher = await dbManagers.teacher.get(queries.selectTeacherById, [masterId]);
    if (!masterTeacher) {
      // マスター教師アカウントが存在しない場合、パスワードをハッシュ化して挿入
      const hashedMasterPassword = await bcrypt.hash(masterPassword, saltRounds);
      await dbManagers.teacher.run(queries.insertTeacher, [
        masterId,           // 1. teacherId
        'マスター管理者',    // 2. teacherName
        hashedMasterPassword, // 3. teacherPassword (ハッシュ化されたパスワード)
        null                // 4. age (年齢は任意なのでnullでOK)
      ]);
      console.log(chalk.green(`[SUCCESSES] A master teacher account '${masterId}' created`));
    } else {
      console.log(chalk.cyan(`[INFORMATION] A master teacher account '${masterId}' already exists.`));
    }

    console.log(chalk.green('All database initial settings have been completed.'));

  } catch (err) {
    // データベース設定中に致命的なエラーが発生した場合、ログを出力しアプリケーションを終了
    console.error(chalk.red('FATAL ERROR: Database setup failed:', err));
    process.exit(1); // エラーが発生したらサーバーを起動せずに終了
  }
}

// ------------------
// サーバー起動
// ------------------

// サーバー起動前にデータベースの初期化を行う
initializeDatabases().then(() => {
  // サーバーが全てのネットワークインターフェースからの接続を受け入れるように変更
  app.listen(port, '0.0.0.0', () => {
    console.log(chalk.green('Access here for my PC: ') + chalk.black.bgGreen.bold(`[http://localhost:${port}]`));    
    console.log(chalk.green('Access URL from other computers: ') + chalk.black.bgGreen.bold(`[ [http://192.168.53.59:8080]]`));
    console.log(chalk.yellow('Also, ensure your firewall allows connections on port 8080.'));
  });
}).catch(err => {
  // データベース初期化に失敗した場合、サーバーを起動せずに終了
  console.error(chalk.red('Failed to start server due to database initialization error:', err));
  process.exit(1);
});

// アプリケーション終了時にDB接続を閉じる
process.on('exit', async () => {
  console.log(chalk.cyan('Shutting down the application...'));
  for (const key in dbManagers) {
    await dbManagers[key].close(); // 各データベース接続を閉じる
  }
});

// 未処理の例外をキャッチ
process.on('uncaughtException', (err) => {
  console.error(chalk.red('Uncaught Exception:'), err);
  process.exit(1); // アプリケーションを終了し、クリーンな終了を促す
});

// Promiseの拒否をキャッチ
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled Rejection at:'), promise, 'reason:', reason);
  // 終了はしないが、ログを記録して監視する（本番環境ではより詳細なエラーハンドリングが必要）
});