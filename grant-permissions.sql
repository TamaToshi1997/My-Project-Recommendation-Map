-- ユーザーが存在しない場合は作成
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'myappuser') THEN
    CREATE USER myappuser WITH PASSWORD 'mypassword';
  END IF;
END
$$;

-- データベースの所有者を設定
ALTER DATABASE myappdb OWNER TO myappuser;

-- スキーマの権限設定
GRANT ALL ON SCHEMA public TO myappuser;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO myappuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO myappuser;

-- 今後作成されるテーブルとシーケンスに対する権限を設定
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO myappuser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO myappuser;

-- plansテーブルに対する特定の権限
GRANT ALL PRIVILEGES ON TABLE plans TO myappuser;
GRANT USAGE, SELECT ON SEQUENCE plans_id_seq TO myappuser; 