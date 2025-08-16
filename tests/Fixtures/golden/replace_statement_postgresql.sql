-- Input: REPLACE INTO users (id, name, email) VALUES (1, 'John Doe', 'john@example.com');
-- Expected PostgreSQL output for REPLACE statement conversion

INSERT INTO users (id, name, email) VALUES (1, 'John Doe', 'john@example.com'); ON CONFLICT DO UPDATE SET /* Add conflict resolution */