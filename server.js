const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json());

const HF_API_KEY = process.env.HF_API_KEY;

app.post('/api/chat', (req, res) => {
    const userMessage = req.body.message;
    if (!userMessage) return res.status(400).json({ error: "Пустое сообщение" });

    const postData = JSON.stringify({
        inputs: `Ты — Phantom, ИИ-ассистент студии Phantom Road Studio. Отвечай кратко, дружелюбно и по делу. Вопрос пользователя: ${userMessage}`,
        parameters: { max_new_tokens: 150, temperature: 0.7 }
    });

    const options = {
        hostname: 'api-inference.huggingface.co',
        port: 443,
        path: '/models/Qwen/Qwen2.5-7B-Instruct',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${HF_API_KEY}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const apiReq = https.request(options, (apiRes) => {
        let data = '';
        apiRes.on('data', (chunk) => { data += chunk; });
        apiRes.on('end', () => {
            try {
                const parsed = JSON.parse(data);
                let botResponse = "Извини, я не смог ответить.";
                if (parsed && parsed[0] && parsed[0].generated_text) {
                    botResponse = parsed[0].generated_text.replace(`Ты — Phantom, ИИ-ассистент студии Phantom Road Studio. Отвечай кратко, дружелюбно и по делу. Вопрос пользователя: ${userMessage}`, '').trim();
                }
                res.json({ reply: botResponse });
            } catch (e) {
                console.error("Ошибка парсинга:", e);
                res.status(500).json({ reply: "Ошибка формата ответа." });
            }
        });
    });

    apiReq.on('error', (e) => {
        console.error("Ошибка запроса:", e);
        res.status(500).json({ reply: "Ошибка соединения с ИИ." });
    });

    apiReq.write(postData);
    apiReq.end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
