-- 問題テーブル
CREATE TABLE questions (
    -- 問題を一意に識別するID (自動採番)
    question_id INTEGER PRIMARY KEY AUTO_INCREMENT,

    -- 問題文
    question_text TEXT NOT NULL,

    -- その問題の正解
    correct_answer VARCHAR(255) NOT NULL
);