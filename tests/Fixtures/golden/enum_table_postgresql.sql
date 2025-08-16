-- Input: CREATE TABLE status (id INT, status ENUM('active', 'inactive', 'pending'));
-- Golden file: ENUM handling with check constraint

CREATE TABLE status (
    id INTEGER,
    status VARCHAR(255) CHECK (status IN ('active', 'inactive', 'pending'))
);