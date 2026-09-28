const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const MODELS = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash"
];

app.get("/", (req, res) => {
    res.json({
        status: "Robot Backend OK",
        ai: "Gemini",
        fallback: true
    });
});

app.get("/health", (req, res) => {
    res.json({
        status: "ok"
    });
});

async function askGemini(model, message, apiKey) {

    const url =
        "https://generativelanguage.googleapis.com/v1beta/models/" +
        model +
        ":generateContent";

    const response = await fetch(url, {
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
            ],

            generationConfig: {
                thinkingConfig: {
                    thinkingLevel: "low"
                },

                maxOutputTokens: 500
            }
        })
    });

    const data = await response.json();

    console.log(
        model + " RESPONSE:",
        JSON.stringify(data)
    );

    return {
        response,
        data
    };
}

app.post("/chat", async (req, res) => {

    try {

        const message = req.body.message;

        if (!message || !message.trim()) {

            return res.status(400).json({
                success: false,
                message: "الرسالة فارغة"
            });
        }

        const apiKey =
            process.env.GEMINI_API_KEY;

        if (!apiKey) {

            return res.status(500).json({
                success: false,
                message:
                    "GEMINI_API_KEY غير موجود في Render"
            });
        }

        let lastError = null;

        for (const model of MODELS) {

            console.log(
                "Trying Gemini model:",
                model
            );

            const result =
                await askGemini(
                    model,
                    message,
                    apiKey
                );

            const response =
                result.response;

            const data =
                result.data;

            if (response.ok) {

                const reply =
                    data.candidates?.[0]
                        ?.content?.parts?.[0]
                        ?.text;

                if (reply) {

                    return res.json({
                        success: true,
                        connection:
                            "انترنت متصل",
                        ai: model,
                        reply: reply
                    });
                }

                lastError =
                    "Gemini لم يرجع جوابًا";

                continue;
            }

            lastError =
                data.error?.message ||
                "Gemini API Error";

            /*
             * إذا كان السيرفر مشغولاً
             * أو يوجد ضغط، نجرب الموديل التالي.
             */
            if (
                response.status === 503 ||
                response.status === 429
            ) {

                console.log(
                    model +
                    " unavailable/busy. Trying next model..."
                );

                continue;
            }

            /*
             * الأخطاء الأخرى لا تحتاج
             * تجربة كل الموديلات.
             */
            return res.status(response.status).json({
                success: false,
                message: lastError,
                model: model
            });
        }

        return res.status(503).json({
            success: false,
            message:
                "كل نماذج Gemini غير متاحة حاليًا. حاول بعد قليل.",
            detail: lastError
        });

    } catch (error) {

        console.error(
            "SERVER ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.listen(PORT, () => {

    console.log(
        "Robot Backend running on port " +
        PORT
    );

});
