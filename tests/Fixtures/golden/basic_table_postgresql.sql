-- Input: CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) UNIQUE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
-- Golden file: basic PostgreSQL conversion including SERIAL and mapping VARCHAR to TEXT
CREATE OR REPLACE FUNCTION substring_index(str text, delim text, count integer)
RETURNS text AS $body$
DECLARE
    tokens text[];
BEGIN
    tokens := string_to_array(str, delim);
    IF count > 0 THEN
        RETURN array_to_string(tokens[1:count], delim);
    ELSIF count < 0 THEN
        RETURN array_to_string(tokens[(array_length(tokens, 1) + count + 1):array_length(tokens, 1)], delim);
    ELSE
        RETURN '';
    END IF;
END;
$body$ LANGUAGE plpgsql IMMUTABLE;

DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);