import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from valkey_client.client import valkey
from api.session import router as session_router
from api.memory import router as memory_router
from api.event import router as event_router
from api.metrics import router as metrics_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: connect to Valkey
    valkey.connect()
    # Ping to verify
    try:
        valkey.ping()
        print("Successfully connected to Valkey!")
    except Exception as e:
        print(f"Failed to connect to Valkey on startup: {e}")
    yield
    # Shutdown: disconnect Valkey
    valkey.disconnect()
    print("Valkey connection closed.")

app = FastAPI(
    title="MemoryOS",
    description="Distributed Memory Infrastructure for AI Agents powered by Valkey",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Telemetry Middleware to track request counts and latencies
@app.middleware("http")
async def telemetry_middleware(request: Request, call_next):
    # Increment total request count
    # Note: We wrap in try-except to prevent Valkey failures from breaking API completely
    try:
        valkey.hincrby("memoryos:metrics:global", "request_count", 1)
    except Exception as e:
        print(f"Metrics count error: {e}")

    start_time = time.time()
    response = await call_next(request)
    latency_ms = (time.time() - start_time) * 1000.0

    try:
        valkey.get_client().hincrbyfloat("memoryos:metrics:global", "total_latency_ms", latency_ms)
        valkey.hincrby("memoryos:metrics:global", "latency_request_count", 1)
    except Exception as e:
        print(f"Metrics latency error: {e}")

    return response

# Include service routers
app.include_router(session_router)
app.include_router(memory_router)
app.include_router(event_router)
app.include_router(metrics_router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "MemoryOS",
        "description": "Distributed Memory Infrastructure for AI Agents powered by Valkey"
    }
