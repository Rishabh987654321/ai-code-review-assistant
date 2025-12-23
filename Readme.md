# AI Code Review Assistant 🚀

An **AI-powered, multi-language code review platform** that analyzes source code written in **any programming language** (Python, JavaScript, C++, Java, SQL, PostgreSQL queries, and more) and provides **structured, line-level feedback** on bugs, performance, security, and code quality.

This project is built as a **full-stack application** using **React + Tailwind CSS** on the frontend and **Django + Django REST Framework** on the backend, with an **LLM-based AI engine** at its core.

---

## ✨ Key Features

* 🔐 **JWT Authentication** (secure login & protected APIs)
* 🌐 **Language-agnostic code analysis** (supports any language)
* 🧠 **AI-powered code review** using structured prompt engineering
* 📊 **Severity-based issue classification** (Low / Medium / High)
* 🧩 **Line-level feedback** with explanations and suggested fixes
* 🗂️ **Review history** per user
* 🎨 **Modern UI** using React, Tailwind CSS, and code editor integration

---

## 🧠 How It Works (High-Level)

```
User submits code
        ↓
Backend detects language
        ↓
Optional static analysis (if available)
        ↓
AI reviews code using universal prompt
        ↓
Results normalized into structured JSON
        ↓
Stored in database & displayed in UI
```

> ⚠️ **Important:** The system does **NOT execute user code**. All analysis is static and AI-based, ensuring safety and security.

---

## 🏗️ Tech Stack

### Frontend

* React (Vite)
* Tailwind CSS
* JavaScript
* Monaco Editor (VS Code–like editor)

### Backend

* Python
* Django
* Django REST Framework
* JWT Authentication (SimpleJWT)

### Database

* PostgreSQL (SQLite for local development)

### AI Layer

* Large Language Model (OpenAI / Gemini / Claude – pluggable)
* Prompt Engineering
* Optional Static Analysis Tools:

  * Python: pylint, bandit
  * JavaScript: eslint

---

## 📂 Project Structure

```
ai-code-review-assistant/
│
├── backend/
│   ├── backend/          # Django project settings
│   ├── reviews/          # Core app (submissions, reviews)
│   ├── manage.py
│
├── frontend/
│   ├── src/
│   │   ├── pages/        # Login, Dashboard, Review
│   │   ├── components/   # UI components
│   │   └── services/     # API calls
│   └── package.json
│
└── README.md
```

---

## 🗄️ Database Design

### User

* Managed by Django Auth

### CodeSubmission

* Stores raw code and detected language

### Review

* Stores overall score and summary

### ReviewIssue

* Stores individual issues with severity and suggested fixes

```text
User
 └── CodeSubmission
      └── Review
           └── ReviewIssue (many)
```

---

## 🔑 Authentication Flow (JWT)

1. User logs in using credentials
2. Backend issues **access & refresh tokens**
3. Frontend stores access token securely
4. Protected APIs require `Authorization: Bearer <token>`

---

## 🧠 AI Design (Core Innovation)

### Universal Prompt Strategy

The AI engine uses a **single universal prompt** capable of reviewing **any programming language**, including SQL and system-level languages.

The AI returns **strict JSON output**, which is parsed and normalized by the backend.

#### Output Includes:

* Overall code score (0–100)
* Summary of code quality
* List of issues with:

  * Line number (if applicable)
  * Severity
  * Category (bug, performance, security, style, logic)
  * Explanation
  * Suggested fix

---

## 🔒 Security Considerations

* No execution of user-submitted code
* Rate limiting on AI endpoints
* Maximum code length restrictions
* API authentication via JWT
* Environment variables for API keys

---

## 🚀 Getting Started (Local Setup)

### Backend Setup

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 API Endpoints (Initial)

| Method | Endpoint             | Description            |
| ------ | -------------------- | ---------------------- |
| POST   | /api/token/          | Login (JWT)            |
| POST   | /api/token/refresh/  | Refresh token          |
| POST   | /api/reviews/submit/ | Submit code for review |

---

## 📈 Roadmap

### ✅ Week 1 (Completed)

* Project setup
* Authentication
* Code submission API
* Frontend-backend integration

### 🔜 Week 2

* Language detection
* AI integration
* Structured JSON parsing

### 🔜 Week 3

* Line-level highlighting
* Review history
* Scoring & analytics

### 🔜 Week 4 (Advanced)

* Static analysis tools
* GitHub repository review
* Diff-based PR reviews

---

## 💼 Resume Description

> **AI-Powered Multi-Language Code Review Assistant**
> Built a full-stack platform using React, Tailwind CSS, and Django REST Framework that analyzes code written in any programming language using AI. Designed a language-agnostic review engine with structured prompt engineering, severity-based issue classification, and secure JWT-based authentication.

---

## 📜 License

MIT License

---

## 🙌 Author

**Rishabh**
Aspiring Full-Stack & AI Engineer

---

If you find this project useful, feel free to ⭐ the repository!
