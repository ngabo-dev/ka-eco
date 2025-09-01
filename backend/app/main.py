from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import WebSocket, WebSocketDisconnect
from typing import List
import json

from .routers import auth, wetlands, observations, dashboard, sensors, system, settings, alerts, community
from . import models
from .database import engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Ka-Eco Urban Wetlands API", version="1.0.0")

# WebSocket connection manager for real-time updates
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                self.disconnect(connection)

manager = ConnectionManager()

# CORS middleware
origins = [
    "http://localhost:3000",  # React dev server
    "http://localhost:3001",  # React dev server (alternative port)
    "http://localhost:5173",  # Vite dev server
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(wetlands.router, prefix="/wetlands", tags=["wetlands"])
app.include_router(observations.router, prefix="/observations", tags=["observations"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
app.include_router(sensors.router, prefix="/sensors", tags=["sensors"])
app.include_router(system.router, prefix="/system", tags=["system"])
app.include_router(settings.router, prefix="/settings", tags=["settings"])
app.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
app.include_router(community.router, prefix="/community", tags=["community"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Ka-Eco Urban Wetlands API"}

@app.websocket("/ws/sensor-data")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo back the received data for now
            await websocket.send_text(f"Echo: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Function to broadcast sensor data updates
async def broadcast_sensor_update(sensor_data):
    message = json.dumps({
        "type": "sensor_update",
        "data": sensor_data
    })
    await manager.broadcast(message)