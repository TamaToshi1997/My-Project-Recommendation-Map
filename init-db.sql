-- データベースの作成
CREATE DATABASE myappdb;

-- ユーザーの作成
CREATE USER myappuser WITH PASSWORD 'mypassword';

-- データベースの所有者を設定
ALTER DATABASE myappdb OWNER TO myappuser;

-- スキーマの作成と権限設定
\c myappdb

CREATE SCHEMA IF NOT EXISTS public;
GRANT ALL ON SCHEMA public TO myappuser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO myappuser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO myappuser; 