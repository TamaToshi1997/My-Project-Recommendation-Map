CREATE TABLE IF NOT EXISTS plans (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    purpose TEXT NOT NULL,
    range TEXT NOT NULL,
    plan_text TEXT NOT NULL,
    locations JSONB NOT NULL,
    route JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
); 