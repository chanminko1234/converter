# SQLStream 🚀

[![Laravel 12](https://img.shields.io/badge/Laravel-12.x-FF2D20?style=for-the-badge&logo=laravel)](https://laravel.com)
[![React 19](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Inertia.js](https://img.shields.io/badge/Inertia.js-2.0-9553E9?style=for-the-badge&logo=inertia)](https://inertiajs.com)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

**SQLStream** is a high-performance SQL result streaming platform that utilizes **Server-Sent Events (SSE)** to deliver real-time data from your database to your frontend with zero latency and minimal overhead. Built on the cutting-edge **Laravel 12** and **React 19** stack, it provides a seamless, high-fidelity experience for monitoring and analyzing live query streams.

---

## ✨ Key Features

- ⚡ **Real-Time SSE Streaming**: Experience instantaneous data delivery using a high-performance, cursor-based PHP generator backend.
- 🌳 **Multi-Database Strategy**: Native support for **PostgreSQL, MySQL, SQLite, Oracle, and SQL Server** via a decoupled Strategy Pattern architecture.
- 🎨 **SQL Syntax Highlighting**: Premium query editor experience powered by `react-syntax-highlighter`.
- 📊 **Interactive Query Streamer**: View live telemetry with spring-based row animations, sticky glass-morphic headers, and CSV/Clipboard export.
- 🌫️ **Engineering Node UI**: A glass-morphic, mission-critical design built with **Tailwind CSS 4** and **Framer Motion**.
- 🛡️ **Security Fortress**: Built-in SSRF protection via host validation and strict **Read-Only** SQL enforcement for the streaming protocol.
- 🔐 **Secure Isolation**: Robust authentication and identity federation via **GitHub/Google SSO**.
- 🛠️ **Developer First**: Fully typed with TypeScript and tested with Pest/PHPUnit.

---

## 🏗️ Tech Stack

- **Backend**: Laravel 12.x (PHP 8.2+)
- **Frontend**: React 19.x with TypeScript
- **State/Routing**: Inertia.js 2.x
- **Architecture**: Strategy Pattern for Database Adapters
- **Styling**: Tailwind CSS 4.0
- **Real-time Protocol**: HTML5 Server-Sent Events (SSE)
- **Animation**: Framer Motion 12+
- **Database**: PostgreSQL / MySQL / SQLite / Oracle / SQL Server support

---

## 📥 Installation Guide

Follow these steps to establish your SQLStream engineering node locally:

### 1. Clone the Repository
```bash
git clone https://github.com/chanminko1234/SQLSTREAM_REPO.git
cd SQLSTREAM_REPO
```

### 2. Install Dependencies
```bash
# Install PHP dependencies
composer install

# Install Node.js dependencies
npm install
```

### 3. Environment Configuration
Copy the environment file and update your database credentials:
```bash
cp .env.example .env
php artisan key:generate
```

### 4. Database Setup
Initialize the database and seed the core identity protocols:
```bash
php artisan migrate --seed
```

### 5. Launch Protocol
Run the integrated development server (Multi-thread):
```bash
npm run dev
```
The application will be accessible at `http://localhost:8000`.

---

## 🧠 Why SSE over WebSockets?

SQLStream intentionally utilizes **Server-Sent Events (SSE)** instead of WebSockets for its data fabric. Here is the technical rationale behind this engineering decision:

1. **Unidirectional Efficiency**: For streaming SQL results, the data flow is inherently server-to-client. SSE is optimized for this exact use case without the overhead of maintaining a full-duplex WebSocket connection.
2. **HTTP/2 Compatibility**: SSE works directly over standard HTTP. When combined with HTTP/2, it shares the same TCP connection as other requests, making it more firewall-friendly and easier to load balance.
3. **Automatic Reconnection**: Unlike WebSockets, the SSE protocol has built-in support for automatic reconnection and event ID tracking to prevent data loss.
4. **Lightweight Implementation**: SSE consumes fewer server resources and doesn't require complex proxy configurations or specialized libraries like Socket.io.

---

## 🧪 Testing
Maintain 100% verified telemetry with the integrated test suite:
```bash
php artisan test
```

---

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

*Engineered with precision for the next generation of data streaming.*
