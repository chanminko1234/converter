# MySQL to PostgreSQL Converter

A powerful web-based tool for converting MySQL database schemas and data to PostgreSQL format. This application provides an intuitive interface for database migration with support for multiple output formats including PostgreSQL, CSV, Excel, and SQLite.

## Features

- **Multiple Output Formats**: Convert to PostgreSQL, CSV, Excel (.xlsx/.xls), SQLite, and psql scripts
- **Advanced Conversion Options**: Handle ENUMs, SETs, triggers, and MySQL-specific syntax
- **Web Interface**: Modern, responsive UI built with React and Tailwind CSS
- **API Endpoints**: RESTful API for programmatic access
- **Comprehensive Testing**: Full test suite with PHPStan and Pint code quality tools

## Installation Guide

### Prerequisites

Before installing this application, ensure you have the following requirements:

#### System Requirements
- **Operating System**: macOS, Linux, or Windows
- **PHP**: Version 8.2 or higher
- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher (comes with Node.js)
- **Composer**: Latest version for PHP dependency management

#### Required PHP Extensions
- `php-xml`
- `php-zip`
- `php-gd`
- `php-mbstring`
- `php-curl`
- `php-fileinfo`

### Installation Steps

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd converter
```

#### 2. Install PHP Dependencies

```bash
composer install
```

#### 3. Install Node.js Dependencies

```bash
npm install
```

#### 4. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Generate the application key:

```bash
php artisan key:generate
```

#### 5. Build Frontend Assets

For development:
```bash
npm run dev
```

For production:
```bash
npm run build
```

### Configuration

#### Environment Variables

Edit the `.env` file to configure your application:

```env
# Application Settings
APP_NAME="MySQL to PostgreSQL Converter"
APP_ENV=local
APP_KEY=base64:your-generated-key-here
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database (Optional - for session storage)
DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite

# Session Configuration
SESSION_DRIVER=file
SESSION_LIFETIME=120

# Cache Configuration
CACHE_DRIVER=file

# Logging
LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug
```

#### Optional Database Setup

If you want to use database sessions (optional):

```bash
php artisan migrate
```

### Verification

#### 1. Start the Development Server

```bash
php artisan serve
```

The application should be accessible at `http://localhost:8000`.

#### 2. Run Tests

Verify the installation by running the test suite:

```bash
# Run all tests
php artisan test

# Or use Pest directly
./vendor/bin/pest
```

#### 3. Check Code Quality

Run static analysis and code formatting:

```bash
# Static analysis with PHPStan
./vendor/bin/phpstan analyse

# Code formatting with Pint
./vendor/bin/pint
```

#### 4. Test the Conversion API

Test the API endpoint with a sample MySQL query:

```bash
curl -X POST http://localhost:8000/convert \
  -H "Content-Type: application/json" \
  -H "X-CSRF-TOKEN: $(php artisan tinker --execute='echo csrf_token();')" \
  -d '{
    "mysql_dump": "CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255));",
    "target_format": "postgresql",
    "options": {}
  }'
```

### Troubleshooting

#### Common Issues

**1. Permission Errors**
```bash
# Fix storage and cache permissions
sudo chmod -R 775 storage bootstrap/cache
sudo chown -R $USER:www-data storage bootstrap/cache
```

**2. Composer Memory Limit**
```bash
# Increase PHP memory limit for Composer
php -d memory_limit=-1 /usr/local/bin/composer install
```

**3. Node.js Build Errors**
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**4. PHP Extension Missing**
```bash
# Ubuntu/Debian
sudo apt-get install php8.2-xml php8.2-zip php8.2-gd php8.2-mbstring php8.2-curl

# macOS with Homebrew
brew install php@8.2
```

**5. Vite Build Issues**
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run build
```

**6. CSRF Token Issues**

Ensure your `.env` file has the correct `APP_URL` and clear the config cache:
```bash
php artisan config:clear
php artisan cache:clear
```

#### Getting Help

If you encounter issues not covered here:

1. Check the Laravel logs: `storage/logs/laravel.log`
2. Enable debug mode in `.env`: `APP_DEBUG=true`
3. Run `php artisan config:clear` after making configuration changes
4. Ensure all required PHP extensions are installed
5. Verify Node.js and npm versions meet the requirements

## License

This project is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
