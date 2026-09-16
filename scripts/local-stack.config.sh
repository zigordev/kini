APP_LABEL="the kini app stack"
APP_ENV_FILE="docker/.env.app.local"
APP_ENV_EXAMPLE_FILE="docker/.env.app.local.example"
COMPOSE_FILES=(docker/compose.app.local.yml)
DEV_COMPOSE_FILES=(docker/compose.app.dev.yml)

OPENBAO_SECRET_PATH="kini"
OPENBAO_REQUIRED_KEYS="POSTGRES_PASSWORD,SESSION_SECRET,SESSION_COOKIE_SECRET,GOOGLE_CLIENT_SECRET,TOLGEE_API_KEY"
OPENBAO_EXPORT_KEYS="POSTGRES_PASSWORD"

DB_SERVICE="kini_db"
DB_USER="kini"
DB_NAME="kini"
DB_BOOTSTRAP_DB="kini"

TOLGEE_SYNC="push-pull"
TOLGEE_WORKSPACE="@kini/web"

RESET_MODE="volumes"
READY_MESSAGE="kini app stack started (the API runs migrations on startup)."
READY_URLS=("http://localhost:3012/health" "http://localhost:3013")
