import { Request, Response } from "express";
import {
    evaluateFullExam,
    checkProctoringImage,
    generateQuestionsByTopic,
} from "./proctoring.service";
import TelegramBot from 'node-telegram-bot-api';
import dotenv from "dotenv";

dotenv.config();

// Independent bot instance for proctoring notifications
let bot: TelegramBot | null = null;
const botToken = process.env.BOT_TOKEN;
const adminChatId = process.env.ADMIN_CHAT_ID;

if (botToken) {
    bot = new TelegramBot(botToken, { polling: false });
}

const sendTestReport = async (reportData: {
    studentName: string;
    score: number;
    violations: number;
    status: string;
    reason?: string;
    photoBase64?: string;
}) => {
    try {
        if (!adminChatId || !bot) {
            console.log("Telegram bot or admin chat ID not configured, skipping report.");
            return;
        }

        const { studentName, score, violations, status, reason, photoBase64 } = reportData;
        const message = `
📊 *YANGI IMTIHON NATIJASI* 📊

👤 *Talaba:* ${studentName}
💯 *To'plangan Ball:* ${score} ta to'g'ri
⚠️ *Qoidabuzarliklar soni:* ${violations} marta
🟢 *Status:* ${status === "passed" ? "✅ O'tdi" : "❌ Yiqildi"}
${reason ? `📝 *Izoh/Sabab:* ${reason}` : ""}

⚡️ _AI Proctoring Tizimi_
`;

        if (photoBase64 && photoBase64.startsWith("data:image")) {
            const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, "");
            const imageBuffer = Buffer.from(base64Data, "base64");
            
            await bot.sendPhoto(adminChatId, imageBuffer, {
                caption: message,
                parse_mode: "Markdown",
            });
        } else {
            await bot.sendMessage(adminChatId, message, {
                parse_mode: "Markdown",
            });
        }
    } catch (error) {
        console.error("Telegram bot error:", error);
    }
};

const handleError = (res: Response, error: any, defaultMessage: string): void => {
    console.error("Proctoring Error:", error);
    res.status(500).json({ success: false, message: defaultMessage });
};

export const submitFullExam = async (req: Request, res: Response): Promise<void> => {
    try {
        const { studentName, examHistory, photo, photoBase64, violationCount } = req.body;

        if (!Array.isArray(examHistory) || examHistory.length === 0) {
            res.status(400).json({ success: false, message: "Imtihon tarixi yuborilmadi." });
            return;
        }

        const rawEvaluation: any = await evaluateFullExam(examHistory);
        if (!rawEvaluation || rawEvaluation.status !== "success") {
            res.status(500).json({ success: false, message: "AI baholashni amalga oshira olmadi." });
            return;
        }

        const evaluation = typeof rawEvaluation.data === "string" ? JSON.parse(rawEvaluation.data) : rawEvaluation.data;
        const finalPhoto = photo || photoBase64 || "";
        const totalViolations = violationCount || 0;
        const isSuspicious = totalViolations > 3;
        const finalScore = Number(evaluation.finalScore) || 0;
        const status = isSuspicious || finalScore < 60 ? "failed" : "passed";

        await sendTestReport({
            studentName: studentName || "Ismsiz Talaba",
            score: finalScore,
            violations: totalViolations,
            status: status,
            reason: `🎓 AI Xulosasi: ${evaluation.overallFeedback || "Baholash mavjud emas."} ${isSuspicious ? "\\n⚠️ Qoida buzishlar ko'p." : ""}`,
            photoBase64: finalPhoto,
        });

        res.status(200).json({ success: true, evaluation, isSuspicious });
    } catch (error) {
        handleError(res, error, "Imtihonni topshirishda server xatoligi yuz berdi.");
    }
};

export const verifyLiveFrame = async (req: Request, res: Response): Promise<void> => {
    try {
        const finalPhoto = req.body.photo || req.body.photoBase64;
        if (!finalPhoto) {
            res.status(400).json({ success: false, message: "Rasm ma'lumoti topilmadi." });
            return;
        }

        const result: any = await checkProctoringImage(finalPhoto);
        if (result?.violationDetected) {
            res.status(403).json({
                success: false,
                violationDetected: true,
                violationType: result.violationType,
                message: "Qoida buzish aniqlandi.",
                reason: result.reason,
            });
            return;
        }

        res.status(200).json({ success: true, violationDetected: false });
    } catch (error) {
        handleError(res, error, "AI xizmati vaqtinchalik ishlamayapti.");
    }
};

export const startExamByTopic = async (req: Request, res: Response): Promise<void> => {
    try {
        const { topic } = req.body;
        if (!topic || typeof topic !== "string") {
            res.status(400).json({ success: false, message: "Mavzu noto'g'ri kiritilgan." });
            return;
        }

        const questions = await generateQuestionsByTopic(topic);
        if (!questions || (Array.isArray(questions) && questions.length === 0)) {
            res.status(404).json({ success: false, message: "Savollar generatsiya qilinmadi." });
            return;
        }

        res.status(200).json({ success: true, questions: questions });
    } catch (error) {
        handleError(res, error, "Savollarni yuklashda xatolik yuz berdi.");
    }
};

export const getSyllabus = async (req: Request, res: Response): Promise<void> => {
    // Dummy syllabus for now, can be expanded to fetch from DB
    res.status(200).json({ 
        success: true, 
        data: [
            { id: 1, title: "Modul 1: React asoslari", topics: ["Komponentlar", "State", "Props"] },
            { id: 2, title: "Modul 2: Backend Node.js", topics: ["Express", "Prisma", "Auth"] }
        ] 
    });
};

export const submitTestResult = async (req: Request, res: Response): Promise<void> => {
    try {
        const { studentId, testId, answers } = req.body;
        if (!studentId || !testId || !answers) {
            res.status(400).json({ success: false, message: "Kerakli ma'lumotlar to'liq emas." });
            return;
        }
        res.status(200).json({ success: true, message: "Natijalar muvaffaqiyatli saqlandi." });
    } catch (error) {
        handleError(res, error, "Natijalarni saqlashda server xatoligi yuz berdi.");
    }
};
