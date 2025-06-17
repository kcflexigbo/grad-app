from typing import Optional, Any, List
from fastapi import APIRouter, Depends, HTTPException
from database_manager import get_db

router = APIRouter(prefix="")

# @router.post("/")