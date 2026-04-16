# SQLStream 🚀
> Real-time SQL result streaming for Laravel via SSE.

[![Laravel 12](https://img.shields.io/badge/Laravel-12.x-FF2D20?style=for-the-badge&logo=laravel)](https://laravel.com)
[![React 19](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

![SQLStream Hero](docs/images/hero.png)

**SQLStream** is a high-performance SQL result streaming platform that utilizes **Server-Sent Events (SSE)** to deliver real-time data from diverse database engines directly to a premium, glass-morphic frontend. 

Built on **Laravel 12** and **React 19**, it prioritizes memory efficiency and low-latency visualization for massive datasets.

---

## 📸 System Showcase

| Landing Page | Interactive Dashboard |
| :---: | :---: |
| ![Landing](docs/images/landing.png) | ![Dashboard](docs/images/dashboard.png) |

| Infrastructure Health | Engineering Documentation |
| :---: | :---: |
| ![Status](docs/images/status.png) | ![Docs](docs/images/hero.png) |

---

## ✨ Key Features

- ⚡ **Real-Time SSE Streaming**: Instant data delivery using high-performance PHP Generators and DB Cursors.
- 🌳 **Multi-Database Strategy**: Native support for **Postgres, MySQL, SQLite, Oracle, and SQL Server**.
- 📊 **Interactive Telemetry**: High-fidelity data table with spring-animations and CSV/Clipboard export.
- 🌫️ **Engineering Node UI**: A mission-critical, glass-morphic design built with Tailwind CSS 4.
- 🛡️ **Hardened Security**: Built-in SSRF protection and strict Read-Only SQL enforcement.
- 🔐 **SSO Ready**: Seamless identity federation via GitHub and Google.

---

## 🏗️ Project Structure

```bash
├── app/
│   ├── Http/Controllers/
│   │   └── SseController.php        # Core SSE Protocol Handler
│   ├── Services/
│   │   ├── DatabaseAdapters/       # Strategy Pattern Adapters (MySQL, Postgres, etc.)
│   │   └── SQL/
│   │       └── QueryStreamerService.php # Generator-based Streaming Logic
│   └── Traits/
│       └── ValidatesDatabaseHost.php # SSRF Security Layer
├── resources/js/
│   ├── Components/
│   │   ├── SQLStreamer.tsx        # Live Terminal Component
│   │   └── StreamingDataTable.tsx # High-performance Data Grid
│   └── Pages/                      # Inertia.js Dashboard & Status Nodes
└── routes/web.php                  # Protocol Route Definitions
```

---

## 📥 Installation Guide

Follow these steps to establish your SQLStream engineering node:

### 1. Clone & Prepare
```bash
git clone https://github.com/chanminko1234/SQLSTREAM_REPO.git
cd SQLSTREAM_REPO
```

### 2. Environment Setup
```bash
cp .env.example .env
php artisan key:generate
```
> **Note:** Update `DB_CONNECTION`, `DB_HOST`, and `DB_DATABASE` in your `.env` to point to your primary PostgreSQL/MySQL instance.

### 3. Install Dependencies
```bash
# Backend
composer install

# Frontend
npm install
```

### 4. Initialize Database
```bash
php artisan migrate --seed
```

### 5. Launch Node
```bash
# Start Vite & Laravel
npm run dev
```
Accessible at: `http://localhost:8000`

---

## 🧠 Why SSE over WebSockets?

For unidirectional SQL result streaming, **SSE** offers significant advantages:
1. **Efficiency**: Lower server overhead than full-duplex WebSockets.
2. **Standardized**: Reuses existing HTTP/2 connections; firewall-friendly.
3. **Resilient**: Built-in automatic reconnection logic in the browser.
4. **Stateless**: Easier to scale horizontally without complex sticky-session management.

---

## 🤝 Contributing
Contributions are what make the open-source community an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 👨‍💻 Author
**Chan Min Ko**
- GitHub: [@chanminko1234](https://github.com/chanminko1234)
- Twitter: [@chan_min_ko_24](https://x.com/chan_min_ko_24)

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.

*Engineered with precision for the next generation of data streaming.*
