const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

const HF_API_KEY = process.env.HF_API_KEY;

app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message;
    if (!userMessage) return res.status(400).json({ error: "Пустое сообщение" });

    try {
        // Используем модель, которая точно доступна (Zephyr)
        const response = await fetch("https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta", {
            headers: {
                "Authorization": `Bearer ${HF_API_KEY}`,
                "Content-Type": "application/json"
            },
            method: "POST",
            body: JSON.stringify({
                inputs: `Ты — Phantom, ИИ-ассистент студии Phantom Road Studio. Отвечай кратко и дружелюбно. Вопрос: ${userMessage}`,
                parameters: { max_new_tokens: 100, temperature: 0.7 }
            })
        });

        // Проверяем, не вернул ли сервер ошибку
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Ошибка от Hugging Face:", errorText);
            return res.status(500).json({ reply: "Ошибка API: " + response.status });
        }

        const data = await response.json();
        let botResponse = "Извини, я не смог ответить.";
        
        if (data && data[0] && data[0].generated_text) {
            botResponse = data[0].generated_text.replace(`Ты — Phantom, ИИ-ассистент студии Phantom Road Studio. Отвечай кратко и дружелюбно. Вопрос: ${userMessage}`, '').trim();
        }

        res.json({ reply: botResponse });
    } catch (error) {
        console.error("Ошибка сервера:", error);
        res.status(500).json({ reply: "Ошибка соединения с ИИ." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
