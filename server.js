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

const SYSTEM_PROMPT = `
أنت Robot AI، مساعد ذكاء اصطناعي عام.

مهمتك مساعدة المستخدم في أي موضوع مفيد، وليس في مجال واحد فقط.

يمكنك المساعدة في:
- المعلومات العامة
- الدراسة والتعليم
- البرمجة
- Android والتطبيقات
- الألعاب
- الهواتف والتقنية
- الرياضيات
- الكتابة
- الترجمة
- اللغات
- الأفكار والمشاريع
- حل المشاكل
- الشرح خطوة بخطوة
- الأسئلة اليومية
- المحادثة العادية

تحدث مع المستخدم بطريقة طبيعية وودية.

إذا تحدث المستخدم بالعربية، أجب بالعربية.
إذا تحدث بالدارجة الجزائرية، حاول فهمها والرد بطريقة بسيطة ومفهومة.
إذا تحدث بالإنجليزية أو الفرنسية، يمكنك الرد بنفس اللغة.

لا تفترض أن المستخدم يسأل عن الألعاب فقط.

إذا كان السؤال يحتاج شرحاً، اشرح بطريقة واضحة ومنظمة.
إذا كان المستخدم يريد خطوات، أعطه خطوات مرتبة.
إذا كان السؤال غير واضح، اطلب توضيحاً قصيراً.

لا تدّعي أنك قمت بشيء لم تقم به.
`;

app.get("/", (req, res) => {
    res.json({
        status: "Robot Backend OK",
        ai: "Robot AI",
        type: "General Assistant"
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
            systemInstruction: {
                parts: [
                    {
                        text: SYSTEM_PROMPT
                    }
                ]
            },

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
                maxOutputTokens: 800
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

        let lastError =
            "Unknown error";

        for (const model of MODELS) {

            console.log(
                "Trying model:",
                model
            );

            try {

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
                            ai: "Robot AI",
                            model: model,
                            reply: reply
                        });
                    }

                    lastError =
                        "لم يتم الحصول على نص من Gemini";

                    continue;
                }

                lastError =
                    data.error?.message ||
                    "Gemini API Error";

                if (
                    response.status === 429 ||
                    response.status === 503
                ) {

                    console.log(
                        model +
                        " unavailable. Trying next model..."
                    );

                    continue;
                }

                return res.status(
                    response.status
                ).json({
                    success: false,
                    message: lastError,
                    model: model
                });

            } catch (error) {

                console.error(
                    model +
                    " ERROR:",
                    error.message
                );

                lastError =
                    error.message;

                continue;
            }
        }

        return res.status(503).json({
            success: false,
            message:
                "Robot AI غير متاح حالياً. حاول مرة أخرى بعد قليل.",
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
        "Robot AI Backend running on port " +
        PORT
    );
});
