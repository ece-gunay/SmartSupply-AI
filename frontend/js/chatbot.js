async function sendMessage() {
    const input = document.getElementById("message");
    const chat = document.getElementById("chat");
    const message = input.value.trim();

    if (!message) return;

    chat.innerHTML += `<p><strong>You:</strong> ${message}</p>`;
    input.value = "";

    try {
        const response = await fetch("http://127.0.0.1:8000/api/chatbot", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({message})
        });

        const data = await response.json();
        chat.innerHTML += `<p><strong>AI:</strong> ${data.answer}</p>`;
    } catch (error) {
        chat.innerHTML += `<p><strong>AI:</strong> API connection failed.</p>`;
    }
}
