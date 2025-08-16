-- Input: CREATE TABLE permissions (id INT, roles SET('admin', 'user', 'guest'));
-- Golden file: SET handling with array type

CREATE TABLE permissions (
    id INTEGER,
    roles TEXT[]
);