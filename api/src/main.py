import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from starlette.middleware.cors import CORSMiddleware
from .routers import sky, objects, weather, moon, auth
from src.services.sky_visualization.artificial.tle_cache import ensure_tle_cache
from .dependencies.settings import settings
from .services.database import init_db

logger = logging.getLogger("api")
logging.basicConfig(level=logging.INFO)

scheduler = AsyncIOScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


origins = ["http://localhost:5174", "https://expedition25.dixen.fr"]


app = FastAPI(lifespan=lifespan)


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


app.include_router(weather_router)
app.include_router(sky_router)
app.include_router(moon_router)
app.include_router(auth_router)
app.include_router(spots_router)

@app.get("/health")
async def health():
    return {"status": "ok"}