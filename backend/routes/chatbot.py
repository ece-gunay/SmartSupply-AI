from fastapi import APIRouter
from pydantic import BaseModel
from backend.services.chatbot_service import answer_question

router = APIRouter(prefix="/chatbot", tags=["Chatbot"])


class ChatRequest(BaseModel):
    message: str


@router.post("")
def chatbot(request: ChatRequest):
    return {"answer": answer_question(request.message)}
