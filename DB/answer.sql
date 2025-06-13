-- 解答記録テーブル
CREATE TABLE answers (
    -- 解答を⼀意に識別するID (自動採番)
    answer_id INTEGER PRIMARY KEY AUTO_INCREMENT,

    -- 解答した生徒のID (studentsテーブルのIDと連携)
    student_id INTEGER NOT NULL,

    -- 解答した問題のID (questionsテーブルのIDと連携)
    question_id INTEGER NOT NULL,

    -- 生徒が入力した解答
    student_answer TEXT NOT NULL,

    -- 正解かどうかのフラグ (True: 1, False: 0)
    is_correct BOOLEAN NOT NULL,

    -- 解答した日時
    answered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- 外部キー制約: studentsテーブルのstudent_idを参照
    FOREIGN KEY (student_id) REFERENCES students(student_id),

    -- 外部キー制約: questionsテーブルのquestion_idを参照
    FOREIGN KEY (question_id) REFERENCES questions(question_id)
);