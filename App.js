// ------------------
// モジュールのインポート
// ------------------

// express: Node.jsでWebアプリケーションを構築するためのフレームワーク
const express = require('express');
// path: ファイルパスやディレクトリパスを操作するためのモジュール
const path = require('path');
// sqlite3: SQLiteデータベースを操作するためのモジュール。'.verbose()'は詳細なエラーメッセージを出力するモード
const sqlite3 = require('sqlite3').verbose();
// express-session: Expressでセッション管理を行うためのミドルウェア
const session = require('express-session');
// consoleモジュールのclear関数をインポート（このコードでは未使用）
const { clear } = require('console');

// ------------------
// データベース設定
// ------------------

// db: データベース接続オブジェクトを格納する変数
// './DB/students.db'というファイルでデータベースに接続する
const db = new sqlite3.Database('./DB/students.db', (err) => {
  // err: 接続時にエラーが発生した場合、エラーオブジェクトが格納される
  if (err) {
    // データベース接続に失敗した場合、エラーメッセージをコンソールに出力
    console.error('データベース接続エラー:', err.message);
  } else {
    // データベース接続に成功した場合、成功メッセージをコンソールに出力
    console.log('SQLiteデータベース接続成功');
  }
});

// ★ テーブルがなければ作成する処理
// db.serialize: 内部の処理を順番に（直列で）実行することを保証する
db.serialize(() => {
  // db.run: SQLクエリを実行する。結果を返さないクエリ（CREATE, INSERT, UPDATE, DELETEなど）に使用
  // IF NOT EXISTS: 'students'テーブルが存在しない場合のみ、このクエリを実行する
  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT, -- id: 学生のユニークなID（自動採番）
      userId TEXT NOT NULL UNIQUE,          -- userId: ログインID（必須、重複不可）
      password TEXT NOT NULL                -- password: パスワード（必須）
    )
  `, (err) => {
    // テーブル作成時にエラーが発生した場合、エラーメッセージをコンソールに出力
    if (err) {
      console.error('テーブル作成エラー:', err.message);
    } else {
      // テーブルが既に存在するか、正常に作成された場合にメッセージをコンソールに出力
      console.log('studentsテーブル確認済み');
    }
  });
});

// ------------------
// Expressアプリケーション設定
// ------------------

// app: Expressアプリケーションのインスタンスを格納する変数
const app = express();
// port: サーバーが待機するポート番号を格納する変数
const port = 3000;

// app.use: ミドルウェア（リクエストとレスポンスの間で実行される関数）を設定する

// セッション管理ミドルウェアの設定
app.use(session({
  secret: 'your_secret_key',  // セッションIDを署名するための秘密鍵。本番環境では推測されにくい文字列に変更する必要がある
  resave: false,              // セッションに変更がなくても再保存しない
  saveUninitialized: false    // 未初期化のセッション（新しいが変更されていないセッション）を保存しない
}));

// app.set: Expressアプリケーションの設定を行う

// テンプレートエンジンとして'ejs'を使用する設定
app.set('view engine', 'ejs');
// 'views'ディレクトリのパスを設定。__dirnameは現在のファイルがあるディレクトリを指す
app.set('views', path.join(__dirname, 'views'));

// POSTリクエストのbody（フォームから送信されたデータなど）を解析するためのミドルウェア
// extended: true は、より複雑なオブジェクト形式のデータも解析できるようにする
app.use(express.urlencoded({ extended: true }));

// 'public'ディレクトリを静的ファイル（CSS, JavaScript, 画像など）の配信用に設定
app.use(express.static(path.join(__dirname, 'public')));

// 全てのページで共通のデータ（ここではナビゲーションリンク）を利用できるようにするミドルウェア
// req: リクエストオブジェクト, res: レスポンスオブジェクト, next: 次のミドルウェアを呼び出す関数
app.use((req, res, next) => {
  // res.localsは、レンダリングされるビュー（EJSファイル）内で利用できる変数
  res.locals.navLinks = [
    { href: '/', label: 'ホーム' },
    { href: '/contact', label: 'お問い合わせ' },
    ];
  // 次の処理（この場合は各ルーティング）へ移る
  next();
});

// ------------------
// ルーティング (URLパスと処理の紐付け)
// ------------------

// (関数) app.get(path, callback): GETリクエストに対する処理を定義する
// (関数) res.render(view, data): 指定されたビュー（EJSファイル）をレンダリングしてレスポンスとして返す

// GET / : ログイン画面を表示する
// ルートURL ('/') へのGETリクエストを受け取った際の処理
app.get('/', (req, res) => {
  // 'views/login.ejs' をレンダリングする。error変数をnullで渡す
  res.render('login', { error: null });
});

// GET /contact : お問い合わせページを表示する
app.get('/contact', (req, res) => {
  // 'views/contant.ejs' をレンダリングする。title変数を渡す
  res.render('contant', { title: 'お問い合わせ' });
});

// GET /forgot-password : パスワードを忘れた方向けのページを表示する
app.get('/forgot-password', (req, res) => {
  // 'views/forgotPassword.ejs' をレンダリングする。message変数をnullで渡す
  res.render('forgotPassword', { message: null });
});

// GET /learning : 学習ページを表示する
app.get('/learning', (req, res) => {
  // 'views/learning.ejs' をレンダリングする
  res.render('learning');
});

// (関数) app.post(path, callback): POSTリクエストに対する処理を定義する

// POST /forgot-password : パスワードを忘れた方向けの処理を実行する
app.post('/forgot-password', (req, res) => {
  // req.body: POSTリクエストで送信されたデータを格納するオブジェクト
  // { userId } は req.body.userId と同じ意味（分割代入）
  const { userId } = req.body;

  // (関数) db.get(sql, params, callback): クエリに一致する最初の1行だけを取得する
  // 'students'テーブルから、指定されたuserIdを持つレコードを検索する
  db.get('SELECT * FROM students WHERE userId = ?', [userId], (err, row) => {
    // err: DB検索時にエラーが発生した場合、エラーオブジェクトが格納される
    // row: 検索結果のレコードが格納される（見つからない場合はundefined）
    if (err) {
      console.error('DB検索エラー:', err);
      return res.render('forgotPassword', { message: 'エラーが発生しました。' });
    }
    if (row) {
      // ユーザーが見つかった場合、パスワードを含むメッセージを表示する（注意：これはセキュリティ上非常に危険な実装です）
      res.render('forgotPassword', { message: `パスワードは「${row.password}」です。` });
    } else {
      // ユーザーが見つからなかった場合、その旨をメッセージとして表示する
      res.render('forgotPassword', { message: 'そのIDは登録されていません。' });
    }
  });
});

// POST /login : ログイン処理
app.post('/login', (req, res) => {
  // フォームから送信されたuserIdとpasswordを取得
  const { userId, password } = req.body;

  // 先生アカウントの固定ログイン情報と比較
  if (userId === 'sensei' && password === '2025pass') {
    // (関数) res.redirect(path): 指定されたパスにリダイレクトする
    // 先生用のページにリダイレクト
    res.redirect('/teacher');
  } else {
    // 学生アカウントのログイン処理
    // 'students'テーブルから、userIdとpasswordが一致するレコードを検索
    db.get('SELECT * FROM students WHERE userId = ? AND password = ?', [userId, password], (err, row) => {
      if (err) {
        console.error('DBエラー:', err);
        res.render('login', { error: 'エラーが発生しました。' });
      } else if (row) {
        // ログイン成功時
        // rowに生徒情報（id, userId, password）が入っている
        // 'views/student.ejs'に生徒情報を渡してレンダリングする
        res.render('student', { user: row });
      } else {
        // ログイン失敗時（ユーザーが見つからない）
        res.render('login', { error: 'IDまたはパスワードが間違っています。' });
      }
    });
  }
});

// GET /teacher : 先生画面を表示（学生一覧を表示）
app.get('/teacher', (req, res) => {
  // (関数) db.all(sql, callback): クエリに一致する全ての行を取得する
  // 'students'テーブルから全学生の情報を取得
  db.all('SELECT * FROM students', (err, rows) => {
    // err: DB検索時にエラーが発生した場合、エラーオブジェクトが格納される
    // rows: 検索結果の全レコードが配列として格納される
    if (err) {
      console.error('DBエラー:', err);
      // エラーが発生した場合、空の学生リストでページをレンダリング
      res.render('teacher', { students: [] });
    } else {
      // 取得した学生リスト(rows)を 'views/teacher.ejs' に渡してレンダリング
      res.render('teacher', { students: rows });
    }
  });
});

// GET /learning-records : 学習記録ページを表示
app.get('/learning-records', (req, res) => {
  res.render('learningRecords');
});

// POST /add-student : 学生追加処理
app.post('/add-student', (req, res) => {
  // フォームから送信された新しい学生のuserIdとpasswordを取得
  const { userId, password } = req.body;
  // 'students'テーブルに新しいレコードを挿入する
  db.run('INSERT INTO students (userId, password) VALUES (?, ?)', [userId, password], (err) => {
    if (err) {
      // 挿入時にエラーが発生した場合（例：userIdの重複など）、エラーをコンソールに出力
      console.error('学生追加エラー:', err);
    }
    // 処理完了後、先生ページにリダイレクトして一覧を更新表示する
    res.redirect('/teacher');
  });
});

// POST /delete/:id : 学生削除処理
// ':id' はURLパラメータで、動的な値（ここでは学生のID）を受け取る
app.post('/delete/:id', (req, res) => {
  // req.params: URLパラメータを格納するオブジェクト
  const studentId = req.params.id;
  // 'students'テーブルから指定されたidのレコードを削除する
  db.run('DELETE FROM students WHERE id = ?', [studentId], (err) => {
    if (err) {
      console.error('学生削除エラー:', err);
    }
    // 処理完了後、先生ページにリダイレクトして一覧を更新表示する
    res.redirect('/teacher');
  });
});

// GET /terms : 利用規約ページを表示
app.get('/terms', (req, res) => {
  res.render('terms');
});

// GET /privacy : プライバシーポリシーページを表示
app.get('/privacy', (req, res) => {
  res.render('privacy');
});

// POST /logout : ログアウト処理
app.post('/logout', (req, res) => {
  // (関数) req.session.destroy(callback): 現在のセッションを破棄する
  req.session.destroy((err) => {
    if (err) {
      console.error('セッション破棄エラー:', err);
      // ステータスコード500（サーバー内部エラー）でエラーメッセージを返す
      return res.status(500).send('ログアウトに失敗しました。');
    }
    // セッション破棄後、ログインページにリダイレクト
    res.redirect('/');
  });
});

// ------------------
// サーバー起動
// ------------------

// (関数) app.listen(port, callback): 指定されたポートでサーバーを起動し、リクエストを待ち受ける
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log("ここにアクセスhttp://maenoshuuichirounomacbook-pro-2.local:3000/");
});