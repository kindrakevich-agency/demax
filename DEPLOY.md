# Розгортання на сервері (aaPanel)

Інструкція для домену **demax.kindrakevich.com**.
Усе налаштовується так, щоб **база даних і Python-проєкт були видимі та керовані з aaPanel** —
без Docker на сервері.

> Значення у кутових дужках (`<...>`) підставте свої. Реальні паролі й ключі
> ніколи не потрапляють у репозиторій — тільки у `.env` на сервері та в GitHub Secrets.

---

## Схема

```
Cloudflare (проксі, SSL)
        │
        ▼
   Nginx (aaPanel, сайт demax.kindrakevich.com)
        ├── /            → статика адмінки  (demax-admin/dist)
        └── /api/        → 127.0.0.1:8100   (Python-проєкт aaPanel)
                                │
                                ▼
                       PostgreSQL + pgvector (aaPanel → Databases)
```

---

## 1. PostgreSQL із розширенням pgvector

### 1.1 Встановити PostgreSQL

aaPanel → **App Store** → **PostgreSQL Manager** → встановити версію **16**.

### 1.2 Створити базу

aaPanel → **Databases** → вкладка **PostgreSQL** → **Add database**:

| Поле | Значення |
|---|---|
| Database name | `demax` |
| Username | `demax` |
| Password | *(згенерувати, зберегти в менеджері паролів)* |

Після цього база видна у списку панелі — там же бекапи, розмір, керування доступом.

### 1.3 Додати розширення pgvector

pgvector не входить у стандартну збірку — встановлюємо один раз через SSH:

```bash
# Знайти версію PostgreSQL, встановлену aaPanel
ls /www/server/pgsql/

# Залежності для збірки
apt update && apt install -y build-essential git

# Збірка pgvector під PostgreSQL з aaPanel
cd /tmp
git clone --branch v0.8.0 https://github.com/pgvector/pgvector.git
cd pgvector
export PG_CONFIG=/www/server/pgsql/bin/pg_config
make && make install
```

Увімкнути розширення в базі:

```bash
/www/server/pgsql/bin/psql -U postgres -d demax -c "CREATE EXTENSION IF NOT EXISTS vector;"
/www/server/pgsql/bin/psql -U postgres -d demax -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
```

Перевірка:

```bash
/www/server/pgsql/bin/psql -U postgres -d demax -c "\dx"
# у списку мають бути vector і pgcrypto
```

---

## 2. Python-проєкт у aaPanel

### 2.1 Встановити менеджер

aaPanel → **App Store** → **Python Project Manager** (потрібен Python **3.12**).

### 2.2 Викачати код

```bash
mkdir -p /www/wwwroot/demax.kindrakevich.com
cd /www/wwwroot/demax.kindrakevich.com
git clone https://github.com/kindrakevich-agency/demax.git .
```

### 2.3 Створити файл конфігурації

```bash
cd /www/wwwroot/demax.kindrakevich.com/demax-rag
cp .env.example .env
nano .env
```

Заповнити:

```
OPENAI_API_KEY=<ваш ключ>
OPENAI_MODEL=gpt-4o-mini
DATABASE_URL=postgresql://demax:<пароль з кроку 1.2>@127.0.0.1:5432/demax
CORS_ORIGINS=https://demax.kindrakevich.com
```

Обмежити доступ до файлу:

```bash
chmod 600 .env
```

### 2.4 Додати проєкт у панель

aaPanel → **Python Project** → **Add Project**:

| Поле | Значення |
|---|---|
| Project name | `demax-rag` |
| Path | `/www/wwwroot/demax.kindrakevich.com/demax-rag` |
| Python version | `3.12` |
| Framework | `python` |
| Startup file / command | `uvicorn app.main:app --host 127.0.0.1 --port 8100` |
| Port | `8100` |
| Install requirements | `requirements.txt` ✔ |
| Auto-start | ✔ |

Після старту проєкт видно в панелі: статус, логи, рестарт, споживання ресурсів.

### 2.5 Перша індексація

База знань індексується автоматично при першому старті (≈5 хв).
Стан можна перевірити:

```bash
curl http://127.0.0.1:8100/v1/health/ready
```

---

## 3. Сайт і Nginx

### 3.1 Створити сайт

aaPanel → **Website** → **Add site**:

| Поле | Значення |
|---|---|
| Domain | `demax.kindrakevich.com` |
| Root directory | `/www/wwwroot/demax.kindrakevich.com/demax-admin/dist` |
| PHP version | `Static / Pure static` |

### 3.2 Конфігурація Nginx

aaPanel → сайт → **Config** → додати в блок `server`:

```nginx
# Статика адмінки (SPA — усі маршрути на index.html)
location / {
    root /www/wwwroot/demax.kindrakevich.com/demax-admin/dist;
    try_files $uri $uri/ /index.html;
}

location /assets/ {
    root /www/wwwroot/demax.kindrakevich.com/demax-admin/dist;
    add_header Cache-Control "public, max-age=31536000, immutable";
}

# RAG API
location /api/ {
    proxy_pass http://127.0.0.1:8100/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 120s;
    proxy_buffering off;          # потрібно для потокових відповідей
}
```

Перезапустити Nginx: aaPanel → **Website** → **Restart**.

### 3.3 SSL

Домен уже проксіюється через **Cloudflare**. У aaPanel → сайт → **SSL** →
випустити сертифікат Let's Encrypt та увімкнути **Force HTTPS**.

У Cloudflare режим SSL має бути **Full (strict)**.

---

## 4. Збірка фронтенду

```bash
cd /www/wwwroot/demax.kindrakevich.com/demax-admin
npm ci
npm run build          # результат у dist/
```

Node.js встановлюється через aaPanel → **App Store** → **Node.js Manager** (версія 22+).

---

## 5. Автоматичний деплой (GitHub Actions)

Push у гілку `main` автоматично оновлює сервер.

### 5.1 SSH-ключ для деплою

На **локальній машині**:

```bash
ssh-keygen -t ed25519 -C "github-actions-demax" -f ~/.ssh/demax_deploy -N ""
```

Публічну частину додати на сервер:

```bash
ssh-copy-id -i ~/.ssh/demax_deploy.pub root@<IP сервера>
# або вручну дописати вміст demax_deploy.pub у /root/.ssh/authorized_keys
```

### 5.2 Секрети GitHub

GitHub → репозиторій → **Settings** → **Secrets and variables** → **Actions** → **New secret**:

| Ім'я | Значення |
|---|---|
| `SERVER_IP` | IP сервера |
| `SSH_PRIVATE_KEY` | вміст файлу `~/.ssh/demax_deploy` (приватний ключ, повністю) |
| `SERVER_PATH` | `/www/wwwroot/demax.kindrakevich.com` |

> Секрети зберігаються зашифрованими на боці GitHub і не видимі у логах.

### 5.3 Що робить деплой

Workflow `.github/workflows/deploy.yml`:

1. підключається по SSH;
2. `git fetch && git reset --hard origin/main`;
3. оновлює Python-залежності у віртуальному оточенні проєкту;
4. збирає фронтенд (`npm ci && npm run build`);
5. перезапускає Python-проєкт через aaPanel CLI;
6. перевіряє `/v1/health`.

---

## 6. Перевірка після розгортання

```bash
# API живий
curl https://demax.kindrakevich.com/api/v1/health

# База знань проіндексована
curl https://demax.kindrakevich.com/api/v1/health/ready

# Тестове питання
curl -X POST https://demax.kindrakevich.com/api/v1/me/conversations/messages \
  -H 'Content-Type: application/json' \
  -d '{"text":"Який крем підійде для сухої шкіри?","language":"uk"}'
```

У браузері: відкрити `https://demax.kindrakevich.com`, натиснути плаваючу кнопку
консультанта праворуч унизу та поставити запитання.

---

## 7. Обслуговування

| Задача | Де |
|---|---|
| Логи Python-проєкту | aaPanel → Python Project → `demax-rag` → **Log** |
| Логи Nginx | aaPanel → Website → **Logs** або `/www/wwwlogs/` |
| Рестарт API | aaPanel → Python Project → **Restart** |
| Бекап бази | aaPanel → Databases → **Backup** (налаштувати розклад) |
| Переіндексація бази знань | `curl -X POST http://127.0.0.1:8100/v1/admin/knowledge/reindex` |
| Оновлення ключа LLM | відредагувати `.env` → рестарт проєкту в панелі |

---

## Типові проблеми

**`502 Bad Gateway` на `/api/`**
Python-проєкт не запущений або слухає інший порт. Перевірити в aaPanel → Python Project статус
і порт `8100`; переглянути логи проєкту.

**`extension "vector" is not available`**
Не встановлено pgvector — виконати крок 1.3. Перевірити, що `PG_CONFIG` вказує саме на
PostgreSQL із aaPanel, а не на системний.

**База знань порожня (`knowledge_chunks: 0`)**
Індексація не пройшла: перевірити доступ сервера до `demax.com.ua` та логи проєкту,
потім запустити переіндексацію вручну.

**Консультант відповідає фрагментами замість зв'язного тексту**
Не заданий `OPENAI_API_KEY` — сервіс працює в екстрактивному режимі. Додати ключ у `.env`
і перезапустити проєкт.
