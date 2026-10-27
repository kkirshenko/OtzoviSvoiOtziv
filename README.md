# ОтзовиСвойОтзыв

Веб-приложение для универсального AI-анализа клиентских отзывов о товарах, услугах, магазинах, ресторанах, доставке, цифровых продуктах, поддержке и других сферах. Yandex AI Studio Agent определяет тональность, оценку опыта, проблемы, риски и рекомендации по содержанию конкретного отзыва.

## Возможности

- Анализ отзывов на русском языке через Yandex AI Studio Agent.
- История успешно обработанных отзывов, доступная через API.
- Дашборд со счётчиками, рассчитанными по фактическим результатам анализа.
- Раздел «Отчёты» с детализацией отзывов и экспортом в CSV.
- Swagger UI для просмотра и проверки REST API.
- Адаптивный React-интерфейс; секретный API-ключ остаётся только на backend.

## Запуск через Docker Compose

Требуются Docker Engine и Docker Compose v2.

1. Создайте в корне проекта файл `.env` из `.env.example`:
   - PowerShell: `Copy-Item .env.example .env`
   - Linux/macOS: `cp .env.example .env`
2. Укажите действительный `YANDEX_API_KEY` в `.env`. Не коммитьте этот файл.
3. Запустите приложение:
   ```bash
   docker compose up --build -d
   ```
4. Откройте интерфейс: http://localhost:5173

Ссылки:
- Frontend: http://localhost:5173
- Backend: http://localhost:8080
- Swagger API: http://localhost:8080/swagger-ui/index.html
- Health check: http://localhost:8080/actuator/health

Полезные команды:
```bash
docker compose logs -f
docker compose down
docker compose up --build -d
```

## Запуск без Docker

Требуются Node.js 20+, npm, Java 21 и Maven.

### Backend

Linux/macOS:
```bash
cd backend
export YANDEX_API_KEY="ваш_ключ"
export YANDEX_PROJECT_ID="b1gfj3v8keh3qobuh6rv"
export YANDEX_AGENT_PROMPT_ID="fvt526o3mhjmd9f6l2te"
mvn spring-boot:run
```

PowerShell:
```powershell
cd backend
$env:YANDEX_API_KEY="ваш_ключ"
$env:YANDEX_PROJECT_ID="b1gfj3v8keh3qobuh6rv"
$env:YANDEX_AGENT_PROMPT_ID="fvt526o3mhjmd9f6l2te"
mvn spring-boot:run
```

### Frontend

В отдельном терминале:
```bash
cd frontend
npm install
npm run dev
```

При локальном запуске frontend по умолчанию обращается к backend по адресу `http://localhost:8080`. Для другого адреса задайте `VITE_API_URL`.

## REST API

- `POST /api/reviews/analyze` — анализирует отзыв и добавляет успешный результат в историю.
- `GET /api/reviews` — возвращает историю анализов.
- `GET /api/reviews/stats` — возвращает фактические счётчики для дашборда.
- `GET /api/reviews/reports` — возвращает записи для отчётности.
- `GET /actuator/health` — проверка состояния backend.
- `/swagger-ui/index.html` — интерактивная документация API.

## Хранение данных

История и статистика сейчас хранятся в памяти backend-процесса. Они отражают реальные успешные анализы и доступны всем вкладкам интерфейса, но очищаются при перезапуске backend. Для постоянного хранения между перезапусками следующим этапом можно подключить PostgreSQL или другую базу данных.

## Безопасность

Не помещайте API-ключи во frontend и не коммитьте файл `.env`. Не отправляйте платёжные данные и ненужную персональную информацию в тексте отзывов.
