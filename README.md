# SQL STREAM: Engineering Node Architecture v4.0

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/chanminko1234/SQLSTREAM_REPO)
[![Tests](https://img.shields.io/badge/tests-134%20passed-blue.svg)](https://github.com/chanminko1234/SQLSTREAM_REPO)
[![Technology](https://img.shields.io/badge/stack-Laravel%2011%20%7C%20React%20%7C%20Inertia-red.svg)](https://github.com/chanminko1234/SQLSTREAM_REPO)
[![Design](https://img.shields.io/badge/design-Engineering%20Node-7c3aed.svg)](https://github.com/chanminko1234/SQLSTREAM_REPO)

**SQL STREAM** is a premium, mission-critical migration ecosystem designed to transform complex, stateful database transitions into a seamless, high-fidelity engineering experience. From its glass-morphic "Security Clearance" gateway to its real-time "Node Control Center," every layer is engineered for absolute observability and zero-downtime performance.

---

## 🚀 High-Fidelity Ecosystem

### 🔳 Node Control Center (Dashboard)
- **Real-Time Telemetry**: Monitor active migration streams, system throughput (MB/s), and database parity via a sophisticated, glass-morphic cockpit.
- **Operational Feed**: Track high-precision engineering logs, including identity verification successes and schema transpilation deltas.
- **Fast Response Hub**: Instant access to the Orchestrator, Validation Suite, and AI Advisor modules from a centralized command hub.

### 🔳 Security Clearance (Auth Architecture)
- **Identity Federation (SSO)**: Integrated support for specialized provider authentication via **GitHub** and **Google SSO**, enabling instant node establishment.
- **Engineering Node Identity**: A statefully managed authentication system with persistent session tracking and secure user entity mapping.
- **Strict Isolation**: Mission-critical routes (Overview, Orchestrator, Validation) are strictly isolated behind a robust `Security Clearance` middleware.

### 🔳 Migration Orchestrator v4.0
- **Zero-Downtime Data Fabric**: Executes direct node-to-node synchronization with millisecond latency and O(1) performance.
- **Oracle/SQL/MySQL Adapters**: Comprehensive type-mapping and structural normalization for enterprise-grade source engines.
- **AI-Powered Index Advisor**: Leverages Google Gemini to analyze source schemas and recommend high-performance PostgreSQL-native indexing strategies.

---

## 🛠️ Design System: "Engineering Node"

SQL STREAM utilizes a custom, premium design language defined by:
- **Glass-Morphism**: Deep blur effects (`backdrop-blur-3xl`) and subtle primary-keyed borders for a mission-critical "Mission Control" feel.
- **Dynamic Backgrounds**: Animated infrastructure grids and pulsing primary blobs representing the platform's active pulse.
- **Modern Typography**: Specialized tracking-heavy headers and monospace telemetry fonts for high-precision technical oversight.
- **Lucide Integration**: Seamless, icon-driven navigation for instant recognition of core operational modules.

---

## 🎯 Launch Protocol

### Deployment
1. Clone and initialize the engineering node:
```bash
composer install
npm install
```

2. Configure your `.env` for **PostgreSQL** and **Identity Federation**:
```env
# Database Core
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_DATABASE=sql_stream

# Identity Federation (OAuth)
GITHUB_CLIENT_ID=your_id
GITHUB_CLIENT_SECRET=your_secret
GITHUB_REDIRECT_URI="${APP_URL}/auth/github/callback"

GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
GOOGLE_REDIRECT_URI="${APP_URL}/auth/google/callback"
```

3. Initialize the core engines:
```bash
php artisan migrate
npm run dev
```

### Accessing the Hub
1.  **Live Node**: Access the production hub directly at [sql-stream.up.railway.app](https://sql-stream.up.railway.app/).
2.  **Establish Identity**: Navigate to [`/register`](https://sql-stream.up.railway.app/register) or use **GitHub/SSO** for instant clearance.
3.  **Command Center**: Access your node's overview and telemetry at [`/dashboard`](https://sql-stream.up.railway.app/dashboard).

---

## 🧪 Operational Verification
SQL STREAM maintains a 100% verified test suite covering every phase of the migration lifecycle.
```bash
php artisan test
```

---

## 💬 Support & Community

- **Engineering Cluster**: [Join our Discord](https://discord.gg/qwsG7jYw) for real-time peer reviews and technical guidance.
- **Bug Tracker**: Report structural anomalies and logic issues on [GitHub Issues](https://github.com/chanminko1234/SQLSTREAM_REPO/issues).
- **Documentation**: Access full mission protocols in the [Live Docs Hub](https://sql-stream.up.railway.app/docs).

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

*Engineered with precision by Chan Min Ko.*
