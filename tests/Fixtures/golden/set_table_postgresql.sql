-- Input: CREATE TABLE permissions (id INT, roles SET('read', 'write', 'execute'));
-- Golden file: SET handling mapped to TEXT[]

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

DROP TABLE IF EXISTS permissions CASCADE;
CREATE TABLE permissions (
  id INTEGER,
  roles TEXT[]
);