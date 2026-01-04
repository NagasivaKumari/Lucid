# 💎 Lucid

> **An Algorand-native experimentation workspace for micro-income streams.**

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Platform: Algorand](https://img.shields.io/badge/Platform-Algorand-black)
![Status: Active](https://img.shields.io/badge/Status-Active-success)

**Lucid** bundles PyTeal smart contracts, a lightweight FastAPI backend, and a reactive Hero-style dashboard to demonstrate a complete dApp architecture on Algorand.

---

## ✨ Features

- **🌊 Donation Pool**: Smart contract that accepts pooled ALGO contributions.
- **⚖️ Weighted Payouts**: UMIS (Universal Micro-Income System) engine for proportional distribution.
- **🚀 Reactive Dashboard**: Real-time stats, wallet connectivity, and transaction timeline.
- **🔌 Multi-Wallet Support**: Integrated with Pera, Defly, Daffi, and Lute wallets.
- **⚡ Instant Feedback**: Optimistic UI updates and real-time backend polling.

## 🛠️ Tech Stack

- **Contracts**: [PyTeal](https://pyteal.readthedocs.io/) (Smart Contracts), [Algorand SDK](https://github.com/algorand/py-algorand-sdk).
- **Backend**: [FastAPI](https://fastapi.tiangolo.com/), [Uvicorn](https://www.uvicorn.org/).
- **Frontend**: Vanilla JS (ES Modules), CSS3 (Glassmorphism), [Chart.js](https://www.chartjs.org/).
- **Testing**: `pytest`, `httpx` for backend integration tests.

## 📂 Project Structure

| Directory | Description |
|-----------|-------------|
| `contracts/` | PyTeal source code for Donation Pool and UMIS Engine. |
| `backend/` | FastAPI proxy for serving the app and relaying transactions. |
| `frontend/` | Dashboard source code (HTML/CSS/JS Modules). |
| `scripts/` | Utilities for compiling contracts and simulating payouts. |
| `tests/` | Unit and integration tests. |

## 🚀 Getting Started

### 1. Prerequisites
- python >= 3.10
- pip
- A modern web browser

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/NagasivaKumari/Lucid.git
cd Lucid

# Set up virtual environment
python -m venv .venv
# Windows: .venv\Scripts\activate
# Mac/Linux: source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Running the App
The backend serves both the API and the static frontend files.

```bash
# Start the server (autoreload enabled)
uvicorn backend.app:app --reload --host 127.0.0.1 --port 3000
```

Open your browser to **[http://127.0.0.1:3000](http://127.0.0.1:3000)** to launch the dashboard.

## 🧪 Testing

Run the automated test suite to verify backend and contract logic:

```bash
pytest
```

## 🤝 Contributing

Contributions are welcome! Please verify your changes with existing tests before submitting a PR.
1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---
*Engineered for the Algorand Ecosystem.*
