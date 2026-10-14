# 🧑‍🏫 Physics AI Tutor — Backend

MVP бэкенд для проверки рукописных решений задач по физике с использованием мультимодальной модели Gemini и Сократического метода обратной связи.

## Возможности

- 📸 Загрузка фото решения (JPEG / PNG / WebP, до 8 МБ)
- 🔄 Автоматическая обработка изображения (EXIF, RGB, downscale)
- 🤖 Оценка через Gemini (structured JSON output)
- 🛡️ Отказоустойчивость: Retry при 503/429 и мгновенный Fallback на резервные модели (`gemini-3.8-flash` -> `gemini-3.6-flash`)
- 🇰🇿 Обратная связь строго на казахском языке
- ❓ Сократический метод — направляющие вопросы вместо готовых ответов
- 📊 Рубрикатор на 100 баллов (4 критерия)

## Быстрый старт

```bash
# 1. Создать виртуальное окружение
python3 -m venv venv
source venv/bin/activate

# 2. Установить зависимости
pip install -r requirements.txt

# 3. Настроить окружение
cp .env.example .env
# Отредактировать .env — вставить GEMINI_API_KEY

# 4. Запустить сервер
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Сервер будет доступен по адресу: **http://localhost:8000**

Документация API (Swagger UI): **http://localhost:8000/docs**

## Запуск тестов

```bash
pytest tests/ -v
```

## API

### `GET /api/v1/health`

Проверка доступности сервиса.

**Ответ:**
```json
{"status": "ok"}
```

### `POST /api/v1/evaluate`

Загрузка фото решения и получение оценки.

| Параметр            | Тип          | Обязательный | Описание                      |
|---------------------|--------------|:------------:|-------------------------------|
| `file`              | `UploadFile` | ✅           | Фото решения (JPEG/PNG/WebP)  |
| `problem_statement` | `string`     | ❌           | Текст условия задачи          |

**Пример с curl:**
```bash
curl -X POST http://localhost:8000/api/v1/evaluate \
  -F "file=@solution.jpg" \
  -F "problem_statement=Массасы 5 кг дене 10 м биіктіктен құлады. Жерге жеткендегі жылдамдығын тап."
```

**Пример ответа:**
```json
{
  "total_score": 72,
  "rubric": {
    "si_units_and_given": 12,
    "physics_laws_setup": 25,
    "math_derivations": 20,
    "calculation_units": 15
  },
  "strong_points": [
    "Берілгені дұрыс жазылған",
    "ХБЖ жүйесіне аудару дұрыс орындалған"
  ],
  "socratic_hints": [
    "Тік ось бойындағы барлық күштер ескерілді ме?",
    "Өлшем бірліктер ХБЖ жүйесімен сәйкес келе ме?"
  ],
  "error_area": "Күштердің проекцияларын жазу кезеңі"
}
```

## Структура проекта

```
backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, роутеры
│   ├── config.py            # Pydantic Settings (.env)
│   ├── schemas/
│   │   └── evaluation.py    # Pydantic-схемы ответа
│   ├── services/
│   │   ├── image_service.py # Валидация и обработка изображений
│   │   └── gemini_service.py# Интеграция с Gemini API
│   └── api/
│       └── v1/
│           └── endpoints.py # REST-эндпоинты
├── tests/
│   └── test_api.py
├── .env.example
├── requirements.txt
└── README.md
```

## Лицензия

Internal / Private
