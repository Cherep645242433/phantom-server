const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const rateLimit = require('express-rate-limit');

const app = express();

// Временно разрешаем все запросы для теста
app.use(cors());

// Ограничиваем количество запросов (Rate Limiting)
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 минута
    max: 10, // Максимум 10 запросов в минуту с одного IP
    message: { error: "Слишком много запросов. Попробуй позже." }
});
app.use('/api/chat', limiter);

app.use(express.json());

// Ключ берется из переменных окружения Render (в коде его нет!)
const HF_API_KEY = process.env.HF_API_KEY;

app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message;
    
    if (!userMessage) {
        return res.status(400).json({ error: "Пустое сообщение" });
    }

    try {
        const response = await fetch("https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct", {
            headers: {
                "Authorization": `Bearer ${HF_API_KEY}`,
                "Content-Type": "application/json"
            },
            method: "POST",
            body: JSON.stringify({
                inputs: `Ты — Phantom, ИИ-ассистент студии Phantom Road Studio. Отвечай кратко, дружелюбно и по делу. Вопрос пользователя: ${userMessage}`,
                parameters: { max_new_tokens: 150, temperature: 0.7 }
            })
        });

        const data = await response.json();
        let botResponse = "Извини, я не смог ответить.";
        
        if (data && data[0] && data[0].generated_text) {
            botResponse = data[0].generated_text.replace(`Ты — Phantom, ИИ-ассистент студии Phantom Road Studio. Отвечай кратко, дружелюбно и по делу. Вопрос пользователя: ${userMessage}`, '').trim();
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
