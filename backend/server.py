"""CipherStakes FastAPI app — investor-ready sweepstakes MVP.

Architecture:
- MongoDB (Motor) for all state
- Route modules registered under /api
- Stripe webhook at /api/webhook/stripe
- APScheduler runs T1 daily 20:00 UTC + T2 Sunday 20:00 UTC
- Core "provably fair" RNG uses Python `secrets` (flagged for Chainlink VRF swap)
"""
import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from db import client, create_indexes
from seed import seed_draws
from scheduler import start_scheduler, stop_scheduler
from routes.auth_routes import router as auth_router
from routes.user_routes import router as user_router
from routes.claims_routes import router as claims_router
from routes.draws_routes import router as draws_router
from routes.packs_routes import router as packs_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="CipherStakes API", version="0.1.0")

# Main API router (everything under /api for Kubernetes ingress).
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {
        "app": "CipherStakes API",
        "version": "0.1.0",
        "status": "ok",
    }


@api_router.get("/health")
async def health():
    return {"ok": True}


api_router.include_router(auth_router)
api_router.include_router(user_router)
api_router.include_router(claims_router)
api_router.include_router(draws_router)
api_router.include_router(packs_router)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup() -> None:
    await create_indexes()
    await seed_draws()
    try:
        start_scheduler()
    except Exception as exc:  # pragma: no cover
        logger.exception("Failed to start scheduler: %s", exc)
    logger.info("CipherStakes API ready")


@app.on_event("shutdown")
async def on_shutdown() -> None:
    stop_scheduler()
    client.close()
