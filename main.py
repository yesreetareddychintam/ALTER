import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from .routes.api import router

app = FastAPI(
    title="ALTER API",
    description="Visual Counterfactual Intelligence",
    version="1.0.0",
)

origins = [x.strip() for x in os.getenv("FRONTEND_ORIGIN", "*").split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
async def root():
    return {
        "name": "ALTER",
        "tagline": "Don't just understand what you see. Change it. See what happens.",
        "docs": "/docs",
    }
