const chalk = require('chalk');

const sqlite3 = require('sqlite3').verbose();

class DatabaseManager {
  /**
   * @param {string} dbFilePath データベースファイルへのパス
   */
  constructor(dbFilePath) {
    // データベース接続をプロパティとして保持
    this.db = new sqlite3.Database(dbFilePath, (err) => {
      if (err) {
        console.error(chalk.red('Database connection failed:', err.message));
      }
    });
  }

  /**
   * パラメータなしのSQL（CREATE TABLEなど）を実行します。
   * @param {string} sql 実行するSQL文
   * @returns {Promise<void>}
   */
  exec(sql) {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) {
          console.error(chalk.red('SQL execution failed:', sql));
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * パラメータ付きのSQL（INSERT, UPDATE, DELETEなど）を実行します。
   * @param {string} sql 実行するSQL文
   * @param {Array} params SQLにバインドするパラメータの配列
   * @returns {Promise<{lastID: number, changes: number}>}
   */
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      // this.lastID, this.changes を使うため、アロー関数ではなく function を使う
      this.db.run(sql, params, function (err) {
        if (err) {
          console.error(chalk.red('SQL failed to run:', sql));
          reject(err);
        } else {
          // 挿入した行のIDや変更された行数を返す
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  /**
   * 1行だけ結果を取得します (SELECT)。
   * @param {string} sql 実行するSQL文
   * @param {Array} params SQLにバインドするパラメータの配列
   * @returns {Promise<Object|undefined>}
   */
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          console.error(chalk.red('SQL execution (get) failed:', sql));
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * 全ての結果行を取得します (SELECT)。
   * @param {string} sql 実行するSQL文
   * @param {Array} params SQLにバインドするパラメータの配列
   * @returns {Promise<Array<Object>>}
   */
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error(chalk.red('SQL execution (all) failed:', sql));
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * データベース接続を閉じます。
   */
  close() {
    this.db.close((err) => {
      if (err) {
        console.error(chalk.red('Failed to close database:', err.message));
      }
    });
  }
}

// クラスを外部から使えるようにエクスポート
module.exports = DatabaseManager;