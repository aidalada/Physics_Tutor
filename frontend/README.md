# PhysCheck AI — Frontend

Қолмен жазылған физика есептерін AI арқылы тексеретін сервістің фронтенд бөлігі.

## Стек

- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS v4**
- **KaTeX** — формулаларды рендерлеу (`$E=mc^2$`)
- **Lucide React** — иконкалар
- **canvas-confetti** — жоғары балл үшін салют 🎉

## Быстрый старт

```bash
# 1. Зависимостарды орнату
npm install

# 2. Сервер қосу (development)
npm run dev
```

Фронтенд: **http://localhost:3000**

## Ортаның айнымалылары

`.env.local` файлында:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## Бэкендпен байланыс

Бэкенд (`FastAPI`) 8000 портында жұмыс істеуі керек:

```bash
cd ../backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Жоба құрылымы

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Түбір layout (Inter шрифті, мета-деректер)
│   │   ├── page.tsx         # Негізгі бет (state machine)
│   │   └── globals.css      # Tailwind + KaTeX стильдер
│   ├── components/
│   │   ├── Header.tsx       # Хедер + логотип
│   │   ├── UploadSection.tsx# Сурет жүктеу (drag-drop, камера, превью)
│   │   ├── ResultsView.tsx  # Нәтижелер экраны
│   │   ├── ScoreCircle.tsx  # Дөңгелек прогресс-бар (SVG)
│   │   ├── RubricBar.tsx    # Рубрика прогресс-бар
│   │   ├── FeedbackCard.tsx # Кері байланыс карточкасы
│   │   ├── LatexText.tsx    # LaTeX формулаларды рендерлеу
│   │   └── SkeletonLoader.tsx# Жүктелу скелетоны
│   ├── lib/
│   │   └── api.ts           # API клиент (fetch + error handling)
│   └── types/
│       └── evaluation.ts    # TypeScript типтер
├── .env.local
├── package.json
└── README.md
```
