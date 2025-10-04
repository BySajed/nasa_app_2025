import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from starlette.middleware.cors import CORSMiddleware

from .routers import sky, objects, weather, moon
from src.services.sky_visualization.artificial.tle_cache import ensure_tle_cache
from .dependencies.settings import settings

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
        yield
    finally:
        # Shutdown logic
        if scheduler.running:
            scheduler.shutdown(wait=False)
            logger.info("Scheduler shut down.")

app = FastAPI(title="Sky Explorer API (Satellites)", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
)

app.include_router(weather.router)
app.include_router(moon.router)
app.include_router(sky.router)
app.include_router(objects.router)

@app.get("/health")
async def health():
    return {"status": "ok"}