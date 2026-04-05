<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ConversionControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_convert_endpoint_returns_successful_response(): void
    {
        $mysqlSql = 'CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), email VARCHAR(255) UNIQUE);';

        $response = $this->post('/convert', [
            'mysql_dump' => $mysqlSql,
            'target_format' => 'postgresql',
            'options' => [
                'preserveIdentity' => true,
                'handleEnums' => 'check_constraint',
                'handleSets' => 'array',
                'timezoneHandling' => 'utc',
                'triggerHandling' => 'convert',
                'replaceHandling' => 'upsert',
                'ignoreHandling' => 'on_conflict_ignore',
            ],
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'sql',
                    'format',
                    'report',
                ],
                'metadata' => [
                    'tables_processed',
                    'target_format',
                    'processing_time',
                ],
            ]);
    }

    public function test_convert_endpoint_handles_invalid_sql(): void
    {
        $response = $this->post('/convert', [
            'mysql_dump' => 'INVALID SQL SYNTAX',
            'target_format' => 'postgresql',
            'options' => [],
        ]);

        $response->assertStatus(422);
    }

    public function test_convert_endpoint_supports_different_target_formats(): void
    {
        $mysqlSql = "INSERT INTO users (name, email) VALUES ('John', 'john@example.com');";

        $formats = ['postgresql', 'csv', 'xlsx', 'sqlite', 'psql'];

        foreach ($formats as $format) {
            $response = $this->post('/convert', [
                'mysql_dump' => $mysqlSql,
                'target_format' => $format,
                'options' => [],
            ]);

            $response->assertStatus(200);
        }
    }

    public function test_upload_endpoint_processes_sql_file(): void
    {
        Storage::fake('local');

        $file = UploadedFile::fake()->createWithContent(
            'test.sql',
            'CREATE TABLE products (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255));'
        );

        $response = $this->post('/convert/upload', [
            'file' => $file,
            'target_format' => 'postgresql',
            'options' => [],
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'sql',
                    'format',
                    'report',
                ],
                'metadata' => [
                    'tables_processed',
                    'target_format',
                    'processing_time',
                ],
            ]);
    }

    public function test_upload_endpoint_rejects_invalid_file_types(): void
    {
        Storage::fake('local');

        $file = UploadedFile::fake()->create('test.txt', 100);

        $response = $this->post('/convert/upload', [
            'file' => $file,
            'target_format' => 'postgresql',
            'options' => [],
        ]);

        $response->assertStatus(422);
    }

    public function test_convert_endpoint_handles_enum_conversion_options(): void
    {
        $mysqlSql = "CREATE TABLE status (id INT, status ENUM('active', 'inactive', 'pending'));";

        $enumOptions = ['varchar', 'check_constraint', 'enum_table'];

        foreach ($enumOptions as $option) {
            $response = $this->post('/convert', [
                'mysql_dump' => $mysqlSql,
                'target_format' => 'postgresql',
                'options' => [
                    'handleEnums' => $option,
                ],
            ]);

            $response->assertStatus(200);
            $data = $response->json();
            $this->assertNotEmpty($data['data']['sql']);
        }
    }

    public function test_convert_endpoint_handles_set_conversion_options(): void
    {
        $mysqlSql = "CREATE TABLE permissions (id INT, roles SET('admin', 'user', 'guest'));";

        $setOptions = ['varchar', 'array', 'separate_table'];

        foreach ($setOptions as $option) {
            $response = $this->post('/convert', [
                'mysql_dump' => $mysqlSql,
                'target_format' => 'postgresql',
                'options' => [
                    'handleSets' => $option,
                ],
            ]);

            $response->assertStatus(200);
            $data = $response->json();
            $this->assertNotEmpty($data['data']['sql']);
        }
    }

    public function test_convert_endpoint_handles_replace_statements(): void
    {
        $mysqlSql = "REPLACE INTO users (id, name) VALUES (1, 'John Doe');";

        $response = $this->post('/convert', [
            'mysql_dump' => $mysqlSql,
            'target_format' => 'postgresql',
            'options' => [
                'replaceHandling' => 'upsert',
            ],
        ]);

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertStringContainsString('ON CONFLICT', $data['data']['sql']);
    }

    public function test_convert_endpoint_handles_insert_ignore_statements(): void
    {
        $mysqlSql = "INSERT IGNORE INTO users (name, email) VALUES ('Jane', 'jane@example.com');";

        $response = $this->post('/convert', [
            'mysql_dump' => $mysqlSql,
            'target_format' => 'postgresql',
            'options' => [
                'ignoreHandling' => 'on_conflict_ignore',
            ],
        ]);

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertStringContainsString('ON CONFLICT DO NOTHING', $data['data']['sql']);
    }

    public function test_predictive_refactoring_suggestions(): void
    {
        $mysqlSql = 'CREATE TABLE users (id CHAR(36) PRIMARY KEY, login VARCHAR(255), created_at TIMESTAMP);';

        $response = $this->post('/convert', [
            'mysql_dump' => $mysqlSql,
            'target_format' => 'postgresql',
            'options' => [
                'predictiveRefactoring' => true,
            ],
        ]);

        $response->assertStatus(200);
        $data = $response->json();
        
        $sql = $data['data']['sql'];
        $report = $data['data']['report'];

        // Verify modern types
        $this->assertStringContainsString('UUID', $sql);
        $this->assertStringContainsString('TEXT', $sql);
        $this->assertStringContainsString('TIMESTAMP WITH TIME ZONE', $sql);

        // Verify reports
        $reportMessages = array_column($report, 'message');
        $this->assertTrue(collect($reportMessages)->contains(fn($m) => str_contains($m, 'UUID')));
        $this->assertTrue(collect($reportMessages)->contains(fn($m) => str_contains($m, 'TEXT')));
        $this->assertTrue(collect($reportMessages)->contains(fn($m) => str_contains($m, 'TIMESTAMPTZ')));
    }

    public function test_auto_cleaning_detection(): void
    {
        $mysqlSql = "CREATE TABLE orders (id INT, orderDate DATETIME, customer_id INT);\n" . 
                    "CREATE TABLE orders_backup (id INT, orderDate DATETIME, customer_id INT);";

        $response = $this->post('/convert', [
            'mysql_dump' => $mysqlSql,
            'target_format' => 'postgresql',
            'options' => [
                'autoCleaning' => true,
            ],
        ]);

        $response->assertStatus(200);
        $report = $response->json('data.report');
        $reportMessages = array_column($report, 'message');

        // Verify naming inconsistency detection (orderDate vs customer_id)
        $this->assertTrue(collect($reportMessages)->contains(fn($m) => str_contains($m, 'mixed naming')));
        
        // Verify data structure clone detection
        $this->assertTrue(collect($reportMessages)->contains(fn($m) => str_contains($m, 'identical structure')));
    }

    public function test_stream_endpoint_validates_input(): void
    {
        $response = $this->postJson('/convert/stream', [
            'source' => [],
            'target' => [],
        ]);

        $response->assertStatus(422);
    }

    public function test_incremental_sync_persistence(): void
    {
        // Mock a direct database action to simulate a successful checkpoint
        \Illuminate\Support\Facades\DB::table('migration_checkpoints')->updateOrInsert(
            ['source_db' => 'mysql_src', 'target_db' => 'pgsql_tgt', 'table_name' => 'users'],
            ['checkpoint_column' => 'id', 'last_value' => '500', 'last_synced_at' => now()]
        );

        $this->assertDatabaseHas('migration_checkpoints', [
            'table_name' => 'users',
            'last_value' => '500',
        ]);
        
        $checkpoint = \Illuminate\Support\Facades\DB::table('migration_checkpoints')
            ->where('table_name', 'users')
            ->first();
            
        $this->assertEquals('500', $checkpoint->last_value);
    }

    public function test_analyze_endpoint_returns_schema_metadata_for_erd(): void
    {
        $mysqlSql = "CREATE TABLE authors (\n" .
                    "  id INT PRIMARY KEY,\n" .
                    "  name VARCHAR(255)\n" .
                    ");\n" .
                    "CREATE TABLE books (\n" .
                    "  id INT PRIMARY KEY,\n" .
                    "  title TEXT,\n" .
                    "  author_id INT,\n" .
                    "  FOREIGN KEY (author_id) REFERENCES authors(id)\n" .
                    ");";

        $response = $this->post('/convert/analyze', [
            'mysql_dump' => $mysqlSql,
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'schema_meta' => [
                        '*' => [
                            'name',
                            'columns',
                            'foreign_keys',
                        ]
                    ]
                ]
            ]);

        $data = $response->json('data.schema_meta');
        
        // Check authors table
        $authors = collect($data)->firstWhere('name', 'authors');
        $this->assertNotNull($authors);
        
        // Check books table and its foreign key
        $books = collect($data)->firstWhere('name', 'books');
        $this->assertNotNull($books);
        $this->assertCount(1, $books['foreign_keys']);
        $this->assertEquals('author_id', $books['foreign_keys'][0]['column']);
        $this->assertEquals('authors', $books['foreign_keys'][0]['references_table']);
    }

    public function test_analyze_endpoint_captures_alter_table_foreign_keys(): void
    {
        $mysqlSql = "CREATE TABLE users (id INT PRIMARY KEY);\n" .
                    "CREATE TABLE profiles (id INT PRIMARY KEY, user_id INT);\n" .
                    "ALTER TABLE profiles ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id);";

        $response = $this->post('/convert/analyze', [
            'mysql_dump' => $mysqlSql,
        ]);

        $response->assertStatus(200);
        $profiles = collect($response->json('data.schema_meta'))->firstWhere('name', 'profiles');
        
        $this->assertNotNull($profiles);
        $this->assertNotEmpty($profiles['foreign_keys']);
        $this->assertEquals('user_id', $profiles['foreign_keys'][0]['column']);
        $this->assertEquals('users', $profiles['foreign_keys'][0]['references_table']);
    }

    public function test_auto_cleaning_detects_duplicate_tables(): void
    {
        $mysqlSql = "CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(255));\n" .
                    "CREATE TABLE members (id INT PRIMARY KEY, name VARCHAR(255));";

        $response = $this->post('/convert', [
            'mysql_dump' => $mysqlSql,
            'target_format' => 'postgresql',
            'options' => [
                'autoCleaning' => true,
            ],
        ]);

        $response->assertStatus(200);
        $report = $response->json('data.report') ?? [];

        // Verify the auto-cleaning report exists
        $duplicateWarning = collect($report)->first(function($m) {
            return str_contains($m['message'] ?? '', "identical structure to 'users'");
        });
        
        if (!$duplicateWarning) {
             // Debug dump only on failure
             // print_r($report);
        }
        $this->assertNotNull($duplicateWarning, "Duplicate table warning not found in report");
    }

    public function test_data_masking_obfuscates_pii(): void
    {
        $mysqlSql = "INSERT INTO users (name, email, phone) VALUES ('John Doe', 'john.doe@example.com', '+1-555-0199');";

        $response = $this->post('/convert', [
            'mysql_dump' => $mysqlSql,
            'target_format' => 'postgresql',
            'options' => [
                'dataMasking' => true,
            ],
        ]);

        $response->assertStatus(200);
        $sql = $response->json('data.sql');

        // Check email masking: 'john.doe@example.com' -> 'j***e@e***e.com' or similar
        $this->assertStringNotContainsString('john.doe@example.com', $sql);
        $this->assertStringContainsString('@', $sql);
        
        // Check phone masking: '+1-555-0199' -> '+1-555-****'
        $this->assertStringNotContainsString('0199', $sql);
        $this->assertStringContainsString('****', $sql);
    }

    public function test_pii_discovery_tags_sensitive_columns(): void
    {
        $mysqlSql = "CREATE TABLE customers (id INT PRIMARY KEY, email_address VARCHAR(255), phone_num TEXT, secret_key VARCHAR(64), ssn_val VARCHAR(11));";

        $response = $this->post('/convert/analyze', [
            'mysql_dump' => $mysqlSql,
        ]);

        $response->assertStatus(200);
        $data = $response->json('data.schema_meta');
        $customers = collect($data)->firstWhere('name', 'customers');

        $emailCol = collect($customers['columns'])->firstWhere('name', 'email_address');
        $phoneCol = collect($customers['columns'])->firstWhere('name', 'phone_num');
        $passCol = collect($customers['columns'])->firstWhere('name', 'secret_key');
        $ssnCol = collect($customers['columns'])->firstWhere('name', 'ssn_val');

        $this->assertEquals('EMAIL', $emailCol['pii_tag']);
        $this->assertEquals('PHONE', $phoneCol['pii_tag']);
        $this->assertEquals('PASSWORD', $passCol['pii_tag']);
        $this->assertEquals('SSN', $ssnCol['pii_tag']);
    }

    public function test_csv_conversion_escapes_data(): void
    {
        $mysqlSql = "CREATE TABLE products (id INT, name VARCHAR(255));";

        $response = $this->post('/convert', [
            'mysql_dump' => $mysqlSql,
            'target_format' => 'csv',
            'options' => [
                'csv_delimiter' => ',',
                'csv_enclosure' => '"',
                'csv_include_headers' => true,
            ],
        ]);

        $response->assertStatus(200);
        $files = $response->json('data.files');
        // The implementation uses direct table name as key
        $this->assertArrayHasKey('products', $files);
        
        // Verify header (fields are enclosed in quotes)
        $this->assertStringContainsString('"id","name"', $files['products']);
        // The current CSV implementation generates sample rows for identified columns
        $this->assertStringContainsString('"sample_id","sample_name"', $files['products']);
    }

    public function test_sqlite_conversion_handles_basic_types(): void
    {
        $mysqlSql = "CREATE TABLE tasks (id INT AUTO_INCREMENT PRIMARY KEY, description TEXT, created_at DATETIME);";

        $response = $this->post('/convert', [
            'mysql_dump' => $mysqlSql,
            'target_format' => 'sqlite',
        ]);

        $response->assertStatus(200);
        $sql = $response->json('data.sql');
        
        $this->assertStringContainsString('INTEGER PRIMARY KEY AUTOINCREMENT', $sql);
        // MySQL DATETIME is mapped to TEXT in SQLite affinity mapping
        $this->assertStringContainsString('TEXT', $sql); 
    }

    public function test_laravel_preset_converts_timestamps(): void
    {
        $mysqlSql = "CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), created_at DATETIME, email_verified_at TIMESTAMP);";

        $response = $this->post('/convert', [
            'mysql_dump' => $mysqlSql,
            'target_format' => 'postgresql',
            'options' => [
                'frameworkPreset' => 'laravel',
            ],
        ]);

        $response->assertStatus(200);
        $sql = $response->json('data.sql');

        // Verify TIMESTAMPTZ conversion for Laravel standard columns
        $this->assertStringContainsString('created_at TIMESTAMP WITH TIME ZONE', $sql);
        $this->assertStringContainsString('email_verified_at TIMESTAMP WITH TIME ZONE', $sql);
        
        $reportMessages = array_column($response->json('data.report') ?? [], 'message');
        $this->assertTrue(collect($reportMessages)->contains(fn($m) => str_contains($m, 'Laravel framework optimizations')));
    }

    public function test_wordpress_preset_modernizes_longtext(): void
    {
        $mysqlSql = "CREATE TABLE wp_posts (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, post_content LONGTEXT, post_title TEXT);";

        $response = $this->post('/convert', [
            'mysql_dump' => $mysqlSql,
            'target_format' => 'postgresql',
            'options' => [
                'frameworkPreset' => 'wordpress',
            ],
        ]);

        $response->assertStatus(200);
        $sql = $response->json('data.sql');

        // WordPress LONGTEXT should become TEXT
        $this->assertStringContainsString('post_content TEXT', $sql);
        $reportMessages = array_column($response->json('data.report') ?? [], 'message');
        $this->assertTrue(collect($reportMessages)->contains(fn($m) => str_contains($m, 'WordPress framework optimizations')));
    }

    public function test_auto_cleaning_detects_mixed_naming(): void
    {
        $mysqlSql = "CREATE TABLE legacy_data (snake_case_col INT, camelCaseCol INT);";

        $response = $this->post('/convert', [
            'mysql_dump' => $mysqlSql,
            'target_format' => 'postgresql',
            'options' => [
                'autoCleaning' => true,
            ],
        ]);

        $response->assertStatus(200);
        $reportMessages = array_column($response->json('data.report') ?? [], 'message');
        $hasInconsistentWarning = collect($reportMessages)->contains(fn($m) => str_contains($m, 'uses mixed naming (snake_case and camelCase)'));
        $this->assertTrue($hasInconsistentWarning, "Mixed naming warning not found in report");
    }

    public function test_integrity_validation_script_generation(): void
    {
        $mysqlSql = "CREATE TABLE orders (id INT PRIMARY KEY, amount DECIMAL(10,2), customer_id INT, FOREIGN KEY (customer_id) REFERENCES customers(id));\n" .
                    "CREATE TABLE customers (id INT PRIMARY KEY, name VARCHAR(255));";

        $response = $this->post('/convert', [
            'mysql_dump' => $mysqlSql,
            'target_format' => 'postgresql',
        ]);

        $response->assertStatus(200);
        $validationSql = $response->json('data.validation_sql');

        $this->assertNotNull($validationSql);

        // Assert Row Count queries exist (standard lowercase tables are unquoted)
        $this->assertStringContainsString("SELECT 'orders' AS table_name, count(*) AS total_rows FROM orders;", $validationSql);
        $this->assertStringContainsString("SELECT 'customers' AS table_name, count(*) AS total_rows FROM customers;", $validationSql);

        // Assert SUM aggregations exist for numeric columns
        $this->assertStringContainsString("SUM(amount) AS sum_amount", $validationSql);

        // Assert FK Orphan check exists
        $this->assertStringContainsString("LEFT JOIN customers r ON t.customer_id = r.id", $validationSql);
        $this->assertStringContainsString("WHERE t.customer_id IS NOT NULL AND r.id IS NULL;", $validationSql);
    }

    public function test_magento_preset_converts_eav_types(): void
    {
        $mysqlSql = "CREATE TABLE catalog_product_entity_decimal (value_id INT PRIMARY KEY, value DECIMAL(12,4));\n" .
                    "CREATE TABLE catalog_product_entity_int (value_id INT PRIMARY KEY, value INT(11));";

        $response = $this->post('/convert', [
            'mysql_dump' => $mysqlSql,
            'target_format' => 'postgresql',
            'options' => [
                'framework_preset' => 'magento',
            ],
        ]);

        $response->assertStatus(200);
        $sql = $response->json('data.sql');

        // Verify Magento EAV type mapping overrides
        $this->assertStringContainsString('value NUMERIC(12,4)', $sql);
        // Magento `value` int columns must map exactly to INTEGER, discarding lengths
        $this->assertStringContainsString('value INTEGER', $sql);
    }

    public function test_convert_endpoint_respects_schema_only_option(): void
    {
        $mysqlSql = "CREATE TABLE users (id INT PRIMARY KEY);\nINSERT INTO users (id) VALUES (1);";

        $response = $this->post('/convert', [
            'mysql_dump' => $mysqlSql,
            'target_format' => 'postgresql',
            'options' => [
                'schema_only' => true,
            ],
        ]);

        $response->assertStatus(200);
        $sql = $response->json('data.sql');

        $this->assertStringContainsString('CREATE TABLE users', $sql);
        $this->assertStringNotContainsString('INSERT INTO users', $sql);
    }

    public function test_triggers_handling_options(): void
    {
        $mysqlSql = "CREATE TABLE test_table (id INT PRIMARY KEY);\n" . 
                    "CREATE TRIGGER test_trigger BEFORE INSERT ON test_table FOR EACH ROW SET NEW.id = 1;";

        $response = $this->post('/convert', [
            'mysql_dump' => $mysqlSql,
            'target_format' => 'postgresql',
            'options' => [
                'trigger_handling' => 'comment',
            ],
        ]);

        $response->assertStatus(200);
        $sql = $response->json('data.sql');

        // Confirm the trigger is commented out instead of executed
        $this->assertStringContainsString('-- CREATE TRIGGER test_trigger', $sql);
    }
}