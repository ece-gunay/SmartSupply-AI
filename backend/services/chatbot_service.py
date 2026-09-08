def answer_question(message: str) -> str:
    """Starter chatbot logic.

    Later this service can call an LLM and provide forecast/inventory context.
    """
    text = message.lower().strip()

    if "stok" in text or "stock" in text:
        return (
            "Inventory assistant is connected. "
            "Next step: provide current stock and forecast data to generate "
            "product-level reorder recommendations."
        )

    if "tahmin" in text or "forecast" in text:
        return (
            "Forecast assistant is connected. "
            "The API currently exposes a starter moving-average forecast."
        )

    return (
        "I can help with sales forecasts, stock risk, and reorder decisions. "
        "The LLM integration will be added in the next stage."
    )
