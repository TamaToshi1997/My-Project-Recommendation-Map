-- ユーザーが存在する場合はパスワードを変更
ALTER USER myappuser WITH PASSWORD 'mypassword';

-- 接続権限を付与
GRANT CONNECT ON DATABASE myappdb TO myappuser;

-- public スキーマへの権限を付与
\c myappdb
GRANT ALL ON SCHEMA public TO myappuser;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO myappuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO myappuser; 