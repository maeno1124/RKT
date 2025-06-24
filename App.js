// ------------------
// モジュールのインポート
// ------------------
const express = require('express'); //webフレームワーク"express"インポート
const path = require('path'); //パス操作のためのモジュール"path"インポート
const session = require('express-session'); //セッション管理のためのモジュール"express-session"インポート
const DatabaseManager = require('./databaseManager'); //データベース操作のためのモジュール"databaseManager"インポート
const chalk = require('chalk'); //コンソール出力の色付けのためのモジュール"chalk"インポート
const queries = require('./queries'); //SQLクエリを定義したモジュール"queries"インポート

// ------------------
// データベース設定
// 主キーは{}で囲まれたもの、それ以外は要素
// ------------------

// 各データベースファイルの絶対パスを定義
// __dirnameは現在のファイルがあるディレクトリを指す
const dbPaths = {
  students: path.join(__dirname, 'DB', 'students.db'), //{studentId}, studentName, studentPassword, studentage
  studentsInformation: path.join(__dirname, 'DB', 'studentsInformation.db'), //{studentId}, studentName, studentPassword, studentage, admissionDate, goBackHomeDate, teacherName, teacherId
  teacher: path.join(__dirname, 'DB', 'teacher.db'), //{teacherId}, teacherName, teacherPassword, teacherage
  study: path.join(__dirname, 'DB', 'study.db'), //{studentId, studyProblemId}, answer
  selfLearning: path.join(__dirname, 'DB', 'selfLearning.db'), //{studentId, teachingMaterialsId}, answer
  individualLearning: path.join(__dirname, 'DB', 'individual_learning.db'), //{studentId, aiProblemId}, answer
  learningRecords: path.join(__dirname, 'DB', 'learning_records.db'), //{studyProblemId, teachingMaterialsId, aiProblemId}, studentId, studyDate, studyTime, recordId, percentageOfCorrectAnswers
};

// 各データベースパスに対して、DatabaseManagerのインスタンスを作成
// これにより、各データベースに対する操作が可能になる
const dbManagers = {
  students: new DatabaseManager(dbPaths.students),
  studentsInformation: new DatabaseManager(dbPaths.studentsInformation),
  teacher: new DatabaseManager(dbPaths.teacher),
  study: new DatabaseManager(dbPaths.study),
  selfLearning: new DatabaseManager(dbPaths.selfLearning),
  individualLearning: new DatabaseManager(dbPaths.individualLearning),
  learningRecords: new DatabaseManager(dbPaths.learningRecords),
};

// ------------------
// Expressアプリケーション設定
// ------------------
const app = express(); // Expressアプリケーションのインスタンスを作成
const port = 3000; // サーバーがリッスンするポート番号を設定

app.set('view engine', 'ejs'); // EJSテンプレートエンジンを使用するための設定
app.set('views', path.join(__dirname, 'views')); // ビューのディレクトリを設定
app.use(express.urlencoded({ extended: true })); // URLエンコードされたデータをパースするためのミドルウェア
app.use(express.static(path.join(__dirname, 'public'))); // 静的ファイルの提供

// ------------------
// セッション管理の設定
// ------------------
app.use(session({
  secret: 'your_secret_key_is_very_secret_and_long',
  resave: false,
  saveUninitialized: true, // ログイン状態を保存するためにtrueに変更
  cookie: { secure: false } // HTTPSでない場合はfalse
}));

// res.localsにユーザー情報を設定するミドルウェア
app.use((req, res, next) => {
  res.locals.user = req.session.user; // セッションのユーザー情報を全てのEJSで使えるようにする
    // ナビゲーションバーのリンク情報を定義し、EJSテンプレート内で `navLinks` という変数で使用可能に設定
  res.locals.navLinks = [
    { href: '/', label: 'ホーム' },
    { href: '/contact', label: 'お問い合わせ' },
  ];
  next();
});

// ------------------
//認証ミドルウェア
// ------------------

// ログインが必要なページ用のミドルウェア
const requireLogin = (req, res, next) => {
  if (!req.session.user) {
    // ログインしていない場合、ログインページにリダイレクト
    return res.redirect('/');
  }
  next(); // ログインしていれば次の処理へ
};

// 教師のみがアクセスできるページ用のミドルウェア
const requireTeacher = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'teacher') {
    // 教師としてログインしていない場合、エラーまたはホームへリダイレクト
    return res.status(403).send('No access rights.');
  }
  next();
};


// ------------------
// ルーティング
// ------------------

// --- GETリクエスト ---
app.get('/', (req, res) => res.render('login', { error: null }));
app.get('/contact', (req, res) => res.render('contant', { title: 'お問い合わせ' }));
app.get('/forgot-password', (req, res) => res.render('forgotPassword', { message: null }));
app.get('/terms', (req, res) => res.render('terms'));
app.get('/privacy', (req, res) => res.render('privacy'));

//認証が必要なルートにミドルウェアを適用
app.get('/learning', requireLogin, (req, res) => res.render('learning'));
app.get('/learning-records', requireLogin, (req, res) => res.render('learningRecords'));

// GET /teacher 認証ミドルウェアを追加し、表示するデータを変更
app.get('/teacher', requireLogin, requireTeacher, async (req, res) => {
  try {
    //students_informationテーブルから実用的なデータを取得
    const students = await dbManagers.studentsInformation.all(queries.selectAllStudentsInfo);
    res.render('teacher', { students: students });
  } catch (err) {
    console.error(chalk.red('DB All students acquisition error:', err));
    res.render('teacher', { students: [] });
  }
});


// --- POSTリクエスト ---

// POST /login
app.post('/login', async (req, res) => {
  const { userId, password } = req.body; // フォームからIDとパスワードを取得
  try {
    // ユーザーIDとパスワードで教師と生徒の両方をチェック
    // まずは教師テーブルでログインを試みる
    const teacher = await dbManagers.teacher.get(queries.selectTeacherForLogin, [userId, password]);
    if (teacher) {
      // 教師としてログイン成功
      req.session.user = { id: teacher.teacherId, role: 'teacher' };
      return res.redirect('/teacher'); // 教師のページへリダイレクト
    }

    // 教師で見つからなければ、生徒テーブルで探す
    const student = await dbManagers.students.get(queries.selectStudentForLogin, [userId, password]);
    if (student) {
      // 生徒としてログイン成功
      req.session.user = { ...student, role: 'student' };
      return res.render('student', { user: student }); // 生徒のページへレンダリング
    }
    // 教師と生徒の両方で見つからなければ、ログイン失敗
    res.render('login', { error: 'Incorrect ID or password.' });
  } catch (err) {
    console.error(chalk.red ('DB login error:', err));
    res.render('login', { error: 'An error has occurred.' });
  }
});

//認証が必要なルートにミドルウェアを適用
// 生徒追加処理 (要ログイン、かつ教師である必要あり)
app.post('/add-student', requireLogin, requireTeacher, async (req, res) => {
  // フォームから4つの値を受け取る
  const { userId, studentName, password, age } = req.body;
  try {
    // 1. 既存の生徒IDと重複しないか確認
    const existingStudent = await dbManagers.students.get(queries.selectStudentById, [userId]);
    if (existingStudent) {
      console.error(chalk.red('エラー: 生徒ID ' + userId + ' は既に存在します。'));
      // TODO: フロントエンドにエラーメッセージを返す仕組みを追加するとより親切です
      return res.redirect('/teacher');
    }

    // 2. studentsテーブルに基本情報を保存 (ログイン用)
    await dbManagers.students.run(queries.insertStudent, [userId, studentName, password, age]);
    
    // 3. students_informationテーブルに詳細情報を保存
    const teacherIdInCharge = req.session.user.id;
    // 担当教師名は、ログイン中の教師のIDから別途取得するのが望ましいですが、ここではIDを仮で入れています
    const teacherNameInCharge = req.session.user.id; 
    
    await dbManagers.studentsInformation.run(queries.insertStudentInfo, [
      userId,
      studentName,
      password,
      age,
      new Date().toISOString().split('T')[0], // 'YYYY-MM-DD'形式の登録日
      null, // 退室日（最初は空）
      teacherNameInCharge,
      teacherIdInCharge
    ]);
    
    // 4. 処理後、教師ページにリダイレクト
    res.redirect('/teacher');

  } catch (err) {
    console.error(chalk.red('生徒追加エラー:', err));
    res.redirect('/teacher');
  }
});

// 生徒情報更新処理 (要ログイン、かつ教師である必要あり)
app.post('/delete/:id', requireLogin, requireTeacher, async (req, res) => {
  const { id } = req.params; // URLパラメータから生徒IDを取得
  try {
    // 注意: 生徒を削除する際は、関連する全テーブルから削除する必要があるため、より複雑な処理が必要です。
    // ここではstudentsテーブルからのみ削除しています。
    await dbManagers.students.run(queries.deleteStudentById, [id]);
    res.redirect('/teacher');
  } catch (err) {
    console.error('Student Deletion Error:', err);
    res.redirect('/teacher');
  }
});

// ログアウト処理
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(chalk.red('session discard error:', err));
      return res.status(500).send('Logout failed.');
    }
    // セッションを破棄した後、ログインページへリダイレクト
    res.redirect('/');
  });
});

// ------------------
// サーバー起動前のデータベース初期化
// ------------------
async function initializeDatabases() {  
  // テーブル作成の順番を指定するための配列
  const tablesToCreate = [
    { name: 'teachers', exec: () => dbManagers.teacher.exec(queries.createTeachersTable) },
    { name: 'students', exec: () => dbManagers.students.exec(queries.createStudentsTable) },
    { name: 'students_information', exec: () => dbManagers.studentsInformation.exec(queries.createStudentsInformationTable) },
    { name: 'study', exec: () => dbManagers.study.exec(queries.createStudyTable) },
    { name: 'self_learning', exec: () => dbManagers.selfLearning.exec(queries.createSelfLearningTable) },
    { name: 'individual_learning', exec: () => dbManagers.individualLearning.exec(queries.createIndividualLearningTable) },
    { name: 'learning_records', exec: () => dbManagers.learningRecords.exec(queries.createLearningRecordsTable) },
  ];
  // 各テーブルを順番に作成するためのループ
  try {
    console.log(chalk.green ('Start database initialization...'));
    for (const table of tablesToCreate) {
      try {
        await table.exec();
      } catch (error) {
        // エラーが発生した場合、どのテーブルで失敗したかを具体的に報告
        console.error(chalk.red(`「${table.name}」table creation failed.`));
        // エラーを再スローして、外側のcatchブロックで捕捉
        throw error;
      }
    }
    //ループがすべて正常に完了した場合に、成功メッセージを表示します
    console.log(chalk.green('Fabrication of all tables has been completed.'));

    // マスター教師アカウントの確認と作成ロジック (この部分は元のままです)
    console.log(chalk.green('Verify the existence of a master teacher account...'));
    const masterId = 'teacher2025';
    const masterPassword = 'password2025';

    const masterTeacher = await dbManagers.teacher.get(queries.selectTeacherById, [masterId]);
    if (!masterTeacher) {
      // runメソッドに渡す配列が4つの値を持っているか確認
      // (ID, 名前, パスワード, 年齢)
      await dbManagers.teacher.run(queries.insertTeacher, [
        masterId,           // 1. teacherId
        'マスター管理者',    // 2. teacherName
        masterPassword,     // 3. teacherPassword
        null                // 4. age (年齢は任意なのでnullでOK)
      ]);
      console.log(chalk.green(`[SUCCESSES] A master teacher account '${masterId}' created`));
    } else {
      console.log(chalk.cyan(`[INFORMATION] A master teacher account '${masterId}' already exists.`));
    }

    console.log(chalk.green('All database initial settings have been completed.'));

  } catch (err) {
    // テーブル作成で失敗した場合、ループ内で再スローされたエラーがここで捕捉されます
    console.error(chalk.red('FATAL ERROR: Database setup failed:', err));
    // エラーが発生したらサーバーを起動せずに終了
    process.exit(1);
  }
}

// ------------------
// サーバー起動
// ------------------

// サーバー起動前にデータベースの初期化を行う
initializeDatabases().then(() => {
  app.listen(port, () => {
    console.log(chalk.green('Access here ') + chalk.black.bgGreen.bold(`[http://localhost:${port}]`));
  });
});

// アプリケーション終了時にDB接続を閉じる
process.on('exit', async () => {
  console.log(chalk.cyan('Shutting down the application...'));
  for (const key in dbManagers) {
    await dbManagers[key].close();
  }
});