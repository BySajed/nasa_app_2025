import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from starlette.middleware.cors import CORSMiddleware
from .routers import sky, objects, weather, moon, auth
from src.services.sky_visualization.artificial.tle_cache import ensure_tle_cache
from .dependencies.settings import settings
from .services.database import init_db
from .services.database import init_db

load_dotenv()

logger = logging.getLogger("api")
logging.basicConfig(level=logging.INFO)

scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    await ensure_tle_cache()
    # Use a fixed job id to avoid duplicate jobs on auto-reload (e.g. uvicorn --reload)
    scheduler.add_job(
        ensure_tle_cache,
        "interval",
        id="refresh_tle",
        hours=settings.TLE_REFRESH_HOURS,
        replace_existing=True,
    )
    scheduler.start()
    logger.info("API started, TLE cache initialized and scheduler running.")
    try:
        init_db()
        logger.info("Database initialized.")
        yield
    finally:
        # Shutdown logic
        if scheduler.running:
            scheduler.shutdown(wait=False)
            logger.info("Scheduler shut down.")
    yield


app = FastAPI(title="Sky Explorer API (Satellites)", version="0.1.0", lifespan=lifespan)

origins = ["http://localhost:5174", "https://expedition25.dixen.fr"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"Hello": "World"}


app.include_router(weather.router)
app.include_router(moon.router)
app.include_router(sky.router)
app.include_router(auth.router)
app.include_router(objects.router)
app.include_router(spots.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
