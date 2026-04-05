-- Input: REPLACE INTO users (id, name, email) VALUES (1, 'John', 'john@example.com');
-- Golden file: REPLACE statement conversion for PostgreSQL

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

INSERT INTO users (id, name, email) VALUES (1, 'John', 'john@example.com') ON CONFLICT DO UPDATE SET /* Add conflict resolution */;