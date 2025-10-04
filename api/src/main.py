from fastapi import FastAPI
from src.routers.sky import sky_router

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}

app.include_router(sky_router)

