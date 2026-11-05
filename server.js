const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const rateLimit = require('express-rate-limit');

const app = express();

// Временно разрешаем все запросы
app.use(cors());

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 10,
    message: { error: "Слишком много запросов. Попробуй позже." }
});
app.use('/api/chat', limiter);

app.use(express.json());

// Ключ берется из переменных окружения Render
const HF_API_KEY = process.env.HF_API_KEY;

app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message;
    
    if (!userMessage) {
        return res.status(400).json({ error: "Пустое сообщение" });
    }

    try {
        // Используем модель Mistral
        const response = await fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2", {
            headers: {
                "Authorization": `Bearer ${HF_API_KEY}`,
                "Content-Type": "application/json"
            },
            method: "POST",
            body: JSON.stringify({
                inputs: `<s>[INST] Ты — Phantom, ИИ-ассистент студии Phantom Road Studio. Отвечай кратко, дружелюбно и по делу. Вопрос пользователя: ${userMessage} [/INST]`,
                parameters: { max_new_tokens: 150, temperature: 0.7 }
            })
        });

        const data = await response.json();
        let botResponse = "Извини, я не смог ответить.";
        
        if (data && data[0] && data[0].generated_text) {
            // Очищаем ответ от лишнего текста
            botResponse = data[0].generated_text.replace(`<s>[INST] Ты — Phantom, ИИ-ассистент студии Phantom Road Studio. Отвечай кратко, дружелюбно и по делу. Вопрос пользователя: ${userMessage} [/INST]`, '').trim();
        }

        res.json({ reply: botResponse });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
