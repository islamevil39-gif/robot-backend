const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        status: "Robot Backend OK",
        ai: "Gemini"
    });
});

app.get("/health", (req, res) => {
    res.json({
        status: "ok"
    });
});

app.post("/chat", async (req, res) => {
    try {
        const message = req.body.message;

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "الرسالة فارغة"
            });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                success: false,
                message: "GEMINI_API_KEY غير موجود في Render"
            });
        }

        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": apiKey
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: message
                                }
                            ]
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        console.log(
            "GEMINI RESPONSE:",
            JSON.stringify(data)
        );

        if (!response.ok) {
            return res.status(500).json({
                success: false,
                message:
                    data.error?.message ||
                    "Gemini API Error"
            });
        }

        const reply =
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            "لم يصل رد من Gemini";

        res.json({
            success: true,
            connection: "انترنت متصل",
            ai: "Gemini",
            reply: reply
        });

    } catch (error) {

        console.error(
            "SERVER ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(
        "Robot Backend running on port " + PORT
    );
});
