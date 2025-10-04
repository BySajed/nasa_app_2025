from contextlib import asynccontextmanager
from fastapi import FastAPI
from api.src.services.database import init_db
from src.routers.sky import sky_router
from dotenv import load_dotenv

from starlette.middleware.cors import CORSMiddleware
from src.routers.weather import weather_router
from src.routers.moon import moon_router

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()


app = FastAPI(lifespan=lifespan)

    
@app.get("/")
def read_root():
    return {"Hello": "World"}


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
)

app.include_router(weather_router)
app.include_router(sky_router)
app.include_router(moon_router)
