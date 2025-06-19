from fastapi import WebSocket
from typing import Dict, List

class ConnectionManager:
    def __init__(self):
        # Maps user_id to their WebSocket for personal notifications
        self.active_connections: Dict[int, WebSocket] = {}
        # Maps a room name (e.g., "image-123") to a list of WebSockets in that room
        self.room_connections: Dict[str, List[WebSocket]] = {}

    # --- Personal Notification Methods (Unchanged) ---
    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: str, user_id: int):
        if user_id in self.active_connections:
            websocket = self.active_connections[user_id]
            await websocket.send_text(message)

    # --- NEW: Room-Based Broadcast Methods ---
    async def connect_to_room(self, room_name: str, websocket: WebSocket):
        """Connects a WebSocket to a specific room."""
        await websocket.accept()
        if room_name not in self.room_connections:
            self.room_connections[room_name] = []
        self.room_connections[room_name].append(websocket)

    def disconnect_from_room(self, room_name: str, websocket: WebSocket):
        """Disconnects a WebSocket from a room and cleans up if empty."""
        if room_name in self.room_connections:
            self.room_connections[room_name].remove(websocket)
            # If the room is now empty, remove it to save memory
            if not self.room_connections[room_name]:
                del self.room_connections[room_name]

    async def broadcast_to_room(self, room_name: str, message: str):
        """Sends a message to all WebSockets in a specific room."""
        if room_name in self.room_connections:
            for connection in self.room_connections[room_name]:
                await connection.send_text(message)

# Create a single instance to be used across the application
manager = ConnectionManager()