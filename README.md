# SQL STREAM: Enterprise Database Migration Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/chanminko/sql-stream)
[![Tests](https://img.shields.io/badge/tests-126%20passed-blue.svg)](https://github.com/chanminko/sql-stream)
[![Technology](https://img.shields.io/badge/stack-Laravel%20%7C%20React%20%7C%20Inertia-red.svg)](https://github.com/chanminko/sql-stream)

**SQL STREAM** is an enterprise-grade migration ecosystem designed to transform complex, stateful database transitions into a seamless, automated, and observable experience. Built for scale, it handles multi-source migrations (MySQL, Oracle, SQL Server) to modern PostgreSQL targets with zero downtime.

---

## 🚀 Key Features

### 1. Multi-Source Adapter Fabric
- **Oracle to PostgreSQL**: Native type mapping for Oracle-specific objects (RAW, NUMBER, CLOB).
- **SQL Server to PostgreSQL**: Robust conversion for MSSQL-specific syntax (TOP, [bracketed identifiers], T-SQL functions).
- **MySQL to PostgreSQL**: Idempotent SQL generation with automatic enum and JSON normalization.

### 2. Zero-Downtime Migration Orchestrator
- **Live Fabric Monitoring**: Real-time throughput (Rows/s) and progress telemetry via a high-fidelity React cockpit.
- **Background Streaming**: Offloads heavy data movement to **Async Jobs**, ensuring 100% UI responsiveness.
- **Neural Simulation Mode**: Test cutover logic and charting with synthetic telemetry before connecting live production nodes.

### 3. AI-Powered Index Advisor (Gemini)
- **Schema Deep-Scan**: Leverages Google Gemini to analyze source schemas and recommend high-performance PostgreSQL-native indexing strategies (GIN, BRIN, Partial).
- **Architectural Rationale**: Provides DDL snippets alongside detailed engineering justifications for each recommendation.

### 4. High-Fidelity Data Integrity
- **Parity Auditing**: Real-time row-count and MD5 checksum validation between source and target sharding.
- **Cutover Guardrails**: Prevents cutover completion if pending binlog/CDC (Change Data Capture) transactions are detected.

---

## 🛠️ Architecture

SQL STREAM follows a highly modular, decoupled architecture:
- **Source Adapters**: Implemented via a `SourceAdapterInterface` and resolved through a container-based `SourceAdapterFactory`.
- **Inertia.js + React**: A premium, "Mission Control" visual aesthetic using **Framer Motion**, **Radix UI**, and **Tailwind CSS**.
- **Migration Checkpoints**: Maintains a stateful audit trail of sync progress, allowing for resilient resumes and incremental synchronization.

---

## 🎯 Getting Started

### Installation
1. Clone and install dependencies:
```bash
composer install
npm install
```

2. Configure your `.env` to use **PostgreSQL** for internal metadata tracking:
```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=sql_stream
DB_USERNAME=postgres
DB_PASSWORD=
```

3. Initialize the migration engine:
```bash
php artisan migrate
npm run dev
```

### Starting a Migration
1. Navigate to the **Home** page and select your source engine.
2. Enter your credentials and hit **Start Sync**.
3. Use the **Mission Control Dashboard** (Orchestrator) to monitor the data flow.
4. Once parity reaches 100%, perform a **Final Enterprise Cutover**.

---

## 🧪 Testing
The platform maintains a rigorous test suite covering 100% of the migration lifecycle.
```bash
php artisan test
```

*Developed with ❤️ by Antigravity.*
