# 🚀 WorkflowMCP - AI-Integrated Project Management Platform

[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)](https://github.com/foswmine/workflow-mcp)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![Claude](https://img.shields.io/badge/Claude%20Code-Integrated-orange.svg)](https://claude.ai/code)

**AI-Integrated DevOps Platform** - Complete Software Development Lifecycle (SDLC) Management

> 💡 **Need Multi-Agent AI Collaboration?**
> Use [Claude Swarm](https://github.com/anthropics/claude-swarm) alongside WorkflowMCP for real multi-agent orchestration!

## 🎯 **Core Features**

| Feature | Tools | Description |
|---------|-------|-------------|
| **📊 Project Management** | 6 tools | Project creation, analytics, progress tracking |
| **📋 Requirements Management** | 5 tools | PRD creation, requirements tracking |
| **🎨 Design Management** | 5 tools | System design, architecture documentation |
| **✅ Task Management** | 8 tools | Task creation, dependencies, progress tracking |
| **🧪 Testing Management** | 9 tools | Test cases, execution, results management |
| **📝 Document Management** | 10 tools | Unified document storage, search, linking |
| **🚀 DevOps Operations** | 12 tools | Incident, environment, deployment management |

**Total: 55+ MCP Tools** + **SvelteKit Web Dashboard**

## 🎯 **Three Usage Options**

WorkflowMCP supports three different usage patterns. **Choose what fits your needs:**

### 🤖 **1. MCP Tools** (AI Integration)
**Best for**: Claude Code users, AI-driven automation
**Benefits**: AI-native integration, automation, real-time processing
**Usage**:
```bash
npm start  # Start MCP server
# Use MCP tools in Claude Code
```
- **[MCP Tools Guide](docs/guides/USER_GUIDE.md)** - Complete guide for 55+ MCP tools

### 🌐 **2. Dashboard API** (Web Interface)
**Best for**: Team collaboration, visual management, browser-based workflows
**Benefits**: Web UI, team collaboration, visualization, real-time sync
**Usage**:
```bash
npm start                    # Start MCP server (background)
cd dashboard && npm run dev  # Start web dashboard
# Visit http://localhost:3301
```
- **[Dashboard API Guide](docs/DASHBOARD_API_GUIDE.md)** - Complete web interface guide

### 📁 **3. Folder Structure** (Standalone)
**Best for**: Individual projects, complete independence, offline work
**Benefits**: No external dependencies, Git version control, offline capable
**Usage**:
```bash
# Copy folder structure for use (no server needed)
```
- **[Folder Structure Guide](docs/STANDALONE_WORKFLOW_SYSTEM.md)** - Standalone workflow system
- **[Practical Examples](docs/api/)** - Start directly from `docs/api/` folder

## 🚀 **Quick Start**

### 1. Installation & Setup
```bash
# Install dependencies
npm install

# Start MCP server (Claude Code integration)
npm start

# Start web dashboard (separate terminal)
cd dashboard && npm install && npm run dev
```

### 2. Verify Setup
- **Claude Code**: MCP server connection - check with `/mcp` command
- **Web Dashboard**: http://localhost:3301
- **Database**: `data/workflow.db` auto-created

### 3. First Usage
```javascript
// Execute in Claude Code
create_project({
  "name": "My First Project",
  "description": "WorkflowMCP test project"
})

get_project_dashboard()  // Check dashboard
```

## 🌐 **Web Dashboard**

### 📋 Management Pages
- **Projects** (`/projects`) - Project overview and management
- **PRD Management** (`/prds`) - Requirements document card view
- **Task Management** (`/tasks`) - Kanban board workflow
- **Plan Management** (`/plans`) - Progress tracking system
- **Operations Management** (`/operations`) - Incident management and details
- **Environment Management** (`/environments`) - Environment creation and status
- **Deployment Management** (`/deployments`) - Deployment planning and execution

### 🔧 Creation Pages
- **New PRD** (`/prds/new`) - Requirements/acceptance criteria management
- **New Task** (`/tasks/new`) - Plan connection and preview
- **New Plan** (`/plans/new`) - Schedule and progress setup
- **New Environment** (`/environments/new`) - Dev/staging/production environment setup
- **New Deployment** (`/deployments/create`) - Deployment strategy and scheduling

## 🔧 **Tech Stack**

- **Backend**: Node.js 18+, SQLite, MCP SDK
- **Frontend**: SvelteKit, Chart.js, D3.js
- **AI Integration**: Claude Code MCP Tools
- **Database**: SQLite (ACID transactions, FTS search)

## 📚 **Documentation**

### 🚀 Quick Start
- **[Installation & Setup](docs/guides/USER_GUIDE.md#installation--setup)** - Environment setup and getting started
- **[Quick Test](docs/testing/QUICK_TEST_CHECKLIST.md)** - Basic verification after installation

### 📖 User Guides
- **[Complete User Guide](docs/guides/USER_GUIDE.md)** - Detailed usage for all MCP tools
- **[Dashboard API Guide](docs/DASHBOARD_API_GUIDE.md)** - Complete web interface guide
- **[Folder Structure Guide](docs/STANDALONE_WORKFLOW_SYSTEM.md)** - Standalone workflow system
- **[DevOps Operations](docs/guides/DEVOPS_OPERATIONS_GUIDE.md)** - Incident, environment, deployment management
- **[Documentation Index](docs/README.md)** - Complete documentation structure

### 🛠️ Developer Guides
- **[MCP Server Troubleshooting](docs/development/MCP_SERVER_TROUBLESHOOTING_GUIDE.md)** - Server issue resolution
- **[Development Progress](docs/development/DEVELOPMENT_PROGRESS.md)** - Project status
- **[Testing Guide](docs/testing/MCP_PHASE_2_9_TESTING_GUIDE.md)** - Complete system testing

## 🌍 **Language Support**

- **English**: README.md (this file)
- **한국어**: [README_KR.md](README_KR.md) - Korean documentation

## 📄 **License**

MIT License - Feel free to use!

---

**WorkflowMCP v3.0.0** - *AI-Powered DevOps Integration Platform*
For more details, check the **[Documentation Index](docs/README.md)**.