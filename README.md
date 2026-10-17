# 🧑‍🏫 PhysMentor — Socratic Physics Tutor

MVP веб-сервис для проверки рукописных решений задач по физике на казахском языке с использованием мультимодального искусственного интеллекта (Gemini 3.8 Flash / 3.6 Flash) и методики Сократического диалога.

---

## 🏗 Архитектура проекта

Проект организован как монорепозиторий:

```
ERS_Project/
├── backend/          # FastAPI REST API + Pillow + google-genai SDK
│   ├── app/          # Исходный код бэкенда
│   ├── tests/        # 11 автоматических pytest тестов
│   ├── requirements.txt
│   └── .python-version
├── frontend/         # Next.js 15 (App Router) + Tailwind CSS + KaTeX
│   ├── src/          # React компоненты и логика
│   ├── package.json
│   └── .env.local
├── render.yaml       # Конфигурация для автоматического деплоя бэкенда на Render
└── .gitignore        # Защита от утечки секретов и мусорных файлов
```

---

## 🚀 Быстрый запуск локально

### 1. Бэкенд (FastAPI)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Укажите GEMINI_API_KEY
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Swagger UI: `http://localhost:8000/docs`

### 2. Фронтенд (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Веб-интерфейс: `http://localhost:3000`

---

## ☁️ Деплой в Production (Free Tier)

- **Backend:** [Render.com](https://render.com) (Бесплатный Web Service на Python)
- **Frontend:** [Vercel.com](https://vercel.com) (Бесплатный хостинг Next.js)
