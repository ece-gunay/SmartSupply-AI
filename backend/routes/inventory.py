from fastapi import APIRouter
from backend.services.inventory_service import get_inventory_summary

router = APIRouter(prefix="/inventory", tags=["Inventory"])


@router.get("")
def inventory():
    return get_inventory_summary()
