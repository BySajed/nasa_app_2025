from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from src.routers.weather import weather_router

app = FastAPI()

app.include_router(weather_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
)

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.head("/")
def read_root():
    return {"Hello": "World"}
