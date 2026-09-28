const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// الصفحة الرئيسية
app.get("/", (req, res) => {
  res.json({
    status: "Robot Backend OK",
    ai: "ready"
  });
});

// اختبار الاتصال
app.get("/health", (req, res) => {
  res.json({
    status: "ok"
  });
});

// الذكاء الاصطناعي
app.post("/chat", async (req, res) => {
  try {
    const message = req.body.message;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "الرسالة فارغة"
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "OPENAI_API_KEY غير موجود في Render"
      });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-5",
        input: [
          {
            role: "system",
            content: "أنت Robot، مساعد ذكاء اصطناعي ودود. أجب باللغة التي يستخدمها المستخدم، وكن واضحًا ومختصرًا."
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OPENAI ERROR:", data);

      return res.status(response.status).json({
        success: false,
        message: "حدث خطأ في اتصال الذكاء الاصطناعي"
      });
    }

    res.json({
      success: true,
      connection: "انترنت متصل",
      message: message,
      reply: data.output_text || "لم يصل رد من الذكاء الاصطناعي"
    });

  } catch (error) {
    console.error("SERVER ERROR:", error);

    res.status(500).json({
      success: false,
      message: "فشل الاتصال بالسيرفر"
    });
  }
});

// تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`Robot Backend running on port ${PORT}`);
});
