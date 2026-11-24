# AgentX AI — Enterprise AI Agent Creation, Deployment & Orchestration Platform

<div align="center">

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com/)

**AgentX AI** is an all-in-one platform for creating, deploying, orchestrating, and monitoring autonomous AI agents and multi-agent teams. Built for developers and enterprises, supporting both local runtimes (Ollama/Docker) and scalable cloud deployments.

[Features](#features) • [Architecture](#architecture) • [Quickstart](#quickstart) • [Tech Stack](#tech-stack) • [Roadmap](#roadmap)

</div>

---

## 🚀 Key Features

### 🛠️ Visual & Configurable AI Agent Builder
- **Custom Personas & Instructions:** Define system prompts, roles, output schemas, and operating boundaries.
- **Model Flexibility:** Connect OpenAI (`gpt-4o`, `gpt-4o-mini`), Anthropic, or local open-weights models via Ollama (`llama3`, `mistral`).
- **Tool Registry:** Assign and restrict tools with strict allowlists (e.g., calculator, JSON formatter, word counter, summarizer).
- **Execution Limits:** Configurable max iterations, step timeouts, and cost ceilings to prevent runaway agent loops.
- **Interactive Playground:** Real-time test-and-preview console with Server-Sent Events (SSE) streaming output and tool execution tracing.

### 🧠 Autonomous Execution Engine
- **LangGraph Stateful Orchestration:** Stateful ReAct-style loop maintaining execution state, message history, and tool feedback.
- **Resilient Recovery:** Graceful error handling and retry mechanisms on tool failures.
- **Live Stream Observability:** SSE endpoints delivering real-time tokens, tool invocations, and status updates.

### 👥 Multi-Agent Collaboration (In Progress)
- Specialized agent roles: Orchestrator, Research, Developer, Cybersecurity, Data Analysis, and Documentation.
- Structured message bus, task delegation, dependency management, and human-in-the-loop checkpoints.

### 🔒 Enterprise Security & Multi-Tenancy
- **Tenant Isolation:** Enforced organization-level isolation (`org_id`) across all data queries and executions.
- **RBAC & Auth:** JWT access and refresh token workflow with bcrypt password hashing.
- **Tool Sandboxing:** Zero arbitrary shell or unrestricted network access; all execution is gated through verified tool wrappers.
- **Audit Logging:** Comprehensive audit trails for logins, agent creations, updates, and executions.

---

## 🏛️ Architecture Overview

```
                      ┌─────────────────────────────────────────┐
                      │          React 18 + TypeScript          │
                      │       Tailwind CSS (Dark Theme UI)      │
                      └────────────────────┬────────────────────┘
                                           │ HTTP / SSE Stream
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │          FastAPI Backend Gateway        │
                      │     Auth / RBAC / Multi-Tenant Guard    │
                      └─────────────┬─────────────┬─────────────┘
                                    │             │
                    ┌───────────────┘             └───────────────┐
                    ▼                                             ▼
       ┌────────────────────────┐                    ┌────────────────────────┐
       │   LangGraph Agent      │                    │     SQLAlchemy ORM     │
       │   Execution Engine     │                    │  PostgreSQL / SQLite   │
       │  (Tools + State Graph) │                    └───────────┬────────────┘
       └────────────┬───────────┘                                │
                    │                                            ▼
      ┌─────────────┴─────────────┐                  ┌────────────────────────┐
      ▼                           ▼                  │    Alembic Migrations  │
┌───────────┐               ┌───────────┐            │    Audit Log Store     │
│ Cloud LLMs│               │Local LLMs │            └────────────────────────┘
│  (OpenAI) │               │ (Ollama)  │
└───────────┘               └───────────┘
```

---

## ⚡ Quickstart

### Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- Docker & Docker Compose (optional for containerized setup)

### 1. Clone the Repository
```bash
git clone https://github.com/H4R5787/AgentX-AI.git
cd AgentX-AI
```

### 2. Backend Setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Run database migrations
alembic upgrade head

# Start development API server
uvicorn app.main:app --reload --port 8000
```
Backend API interactive documentation is available at:
- Swagger UI: `http://localhost:8000/api/docs`
- ReDoc: `http://localhost:8000/api/redoc`

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Running with Docker Compose
```bash
cd infrastructure
docker compose -f docker-compose.yml up -d
```

---

## 🧪 Testing

Run backend tests using pytest:
```bash
cd backend
pytest tests/ -v
```

---

## 📦 Tech Stack

| Domain | Technologies |
|---|---|
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy 2.0 (Async), Alembic, Pydantic v2 |
| **Agent Engine** | LangGraph, LangChain Core, Custom Tool Execution Bus |
| **Database** | PostgreSQL (Production) / SQLite + aiosqlite (Dev) |
| **Security** | Python-JOSE (JWT), Passlib (Bcrypt), SlowAPI rate limiting |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Zustand |
| **Infra & DevOps** | Docker, Docker Compose, Nginx, Prometheus, Grafana |

---

## 🗺️ Roadmap & Phases

- [x] **Phase 1: Foundation & Architecture** (FastAPI async core, multi-tenant DB schema, auth system, base UI)
- [x] **Phase 2: Autonomous Agent Engine** (Visual Agent Builder, LangGraph executor, tool registry, SSE streaming)
- [ ] **Phase 3: Multi-Agent Orchestration** (ReactFlow canvas, supervisor coordination, human approval gates)
- [ ] **Phase 4: Hybrid Deployment Runtime** (Ollama local runtime worker, cloud worker orchestration)
- [ ] **Phase 5: Cybersecurity Engine** (Static code scanning, dependency security analysis, vulnerability reports)
- [ ] **Phase 6: Enterprise Observability** (Prometheus metric exporter, Grafana dashboards, execution audit logs)
- [ ] **Phase 7: SaaS & Commercial Polish** (Subscription quotas, API key management, enterprise RBAC)

---

## 📄 License
This project is licensed under the Apache 2.0 License.
