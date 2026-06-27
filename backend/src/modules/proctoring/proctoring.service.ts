import fetch from 'node-fetch';
import { generateText, getAISettings } from '../../shared/utils/ai';

export const checkProctoringImage = async (photoBase64: string) => {
    try {
        const cleanBase64 = photoBase64.includes(",")
            ? photoBase64.split(",")[1]
            : photoBase64;

        const { apiKey, provider } = getAISettings();
        if (!apiKey) throw new Error("AI API kaliti sozlanmagan");

        if (provider === 'groq') {
           // Groq does not currently support vision models natively in the same simple way, 
           // but we can just skip or fake vision if they selected groq, 
           // or hardcode a fallback to Gemini if possible. Let's return generic for Groq if vision fails.
           return {
               violationDetected: false,
               violationType: "none",
               reason: "Rasm tekshiruvi Groq modelida cheklangan",
           };
        }

        // Use Gemini direct API for Vision
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: `Siz qat'iy imtihon nazoratchisisiz. Kadrni tahlil qiling va quyidagi qoidalarga asoslanib javob bering:
                            1. Agar kadrdan tashqarida odam bo'lsa yoki ekran/telefon ko'rinsa -> violationDetected: true.
                            2. Agar yonida yordamchi bo'lsa -> violationDetected: true.
                            3. Agar imtihon topshiruvchi ko'rinmasa -> violationDetected: true.
                            
                            Javobni faqat va faqat quyidagi JSON formatida bering:
                            {
                                "violationDetected": boolean,
                                "violationType": "phone_use" | "multiple_persons" | "no_person" | "suspicious_movement" | "none",
                                "reason": "Sababi qisqa o'zbek tilida"
                            }`
                        },
                        {
                            inline_data: {
                                mime_type: "image/jpeg",
                                data: cleanBase64
                            }
                        }
                    ]
                }],
                generationConfig: {
                    temperature: 0.2,
                    responseMimeType: "application/json"
                }
            })
        });

        const data: any = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        return JSON.parse(content);
    } catch (error) {
        console.error("Vision check error:", error);
        return {
            violationDetected: false,
            violationType: "none",
            reason: "Tahlil jarayonida xatolik yuz berdi",
        };
    }
};

export const evaluateFullExam = async (examHistory: any) => {
    try {
        const prompt = `Siz ekspert o'qituvchisiz. Talabaning imtihon javoblarini tahlil qilib, ball va feedback bering. Quyidagi imtihon tarixi bo'yicha baholash va tahlil qiling: ${JSON.stringify(examHistory)}
        
        Quyidagi JSON formatida qaytaring:
        {
          "finalScore": 0,
          "overallFeedback": "Qisqa xulosa"
        }
        `;
        
        let text = await generateText(prompt, 2000, 0.5, true);
        
        // Ensure it's valid JSON
        if (text.includes('\`\`\`json')) {
            text = text.split('\`\`\`json')[1].split('\`\`\`')[0].trim();
        } else if (text.includes('\`\`\`')) {
            text = text.split('\`\`\`')[1].split('\`\`\`')[0].trim();
        }
        
        // Remove markdown manually if any left
        text = text.replace(/^[^{]*/, '').replace(/[^}]*$/, '');

        return {
            status: "success",
            data: JSON.parse(text),
        };
    } catch (error) {
        console.error("Evaluate exam error:", error);
        return {
            status: "error",
            message: "Baholashni amalga oshirib bo'lmadi",
        };
    }
};

export const generateQuestionsByTopic = async (topic: string) => {
    try {
        const prompt = `Siz professional o'qituvchisiz. "${topic}" mavzusi bo'yicha 5 ta test savolini tuzing.
                    Javobni faqat va faqat quyidagi JSON formatida qaytaring:
                    {
                        "questions": [
                            {
                                "id": 1,
                                "question": "Savol matni",
                                "options": ["A", "B", "C", "D"],
                                "correct": 0
                            }
                        ]
                    }`;

        let text = await generateText(prompt, 2000, 0.7, true);
        
        // Extract JSON
        text = text.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
        
        const parsed = JSON.parse(text);
        return parsed.questions || [];
    } catch (error) {
        console.error("Savol generatsiya xatosi:", error);
        return [];
    }
};
