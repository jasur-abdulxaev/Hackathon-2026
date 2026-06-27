import { useState } from "react";
import Header from '@/components/layout/Header';
import { useAuthStore } from '@/stores/authStore';
import LessonSelector from "@/components/proctoring/LessonSelector";
import QuestionCard from "@/components/proctoring/QuestionCard";
import ExamResult from "@/components/proctoring/ExamResult";
import AIOrb from "@/components/proctoring/AIOrb";

export default function ProctoringExamPage() {
    const { user } = useAuthStore();
    const studentName = user?.fullName || "Eldor Abdukhalikov";
    
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<"select" | "exam" | "result">("select");

    const [questions, setQuestions] = useState([]);
    const [currentLesson, setCurrentLesson] = useState(1);
    const [aiResult, setAiResult] = useState<{
        score: number;
        feedback: string;
    } | null>(null);

    const handleStartExam = async (lessonId: number) => {
        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
            const response = await fetch(`${apiUrl}/v1/proctoring/start-exam`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    topic: String(lessonId),
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setQuestions(data.questions || []);
                setCurrentLesson(data.currentLesson || lessonId);
                setStep("exam");
            } else {
                alert(`Xatolik: ${data.message || "Server ma'lumotni qaytarmadi"}`);
            }
        } catch (error) {
            console.error("❌ Fetch xatosi:", error);
            alert("Backendga ulanib bo'lmadi!");
        } finally {
            setLoading(false);
        }
    };

    const handleFinishExam = async (
        examHistory: Array<{ question: string; answer: string }>,
        photoBase64: string | null,
    ) => {
        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
            const response = await fetch(`${apiUrl}/v1/proctoring/submit-full-exam`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentName,
                    examHistory,
                    photoBase64,
                }),
            });
            const data = await response.json();

            if (response.ok && data.success) {
                const evalData = data.evaluation || {};

                setAiResult({
                    score: Number(evalData.finalScore) || 0,
                    feedback: evalData.overallFeedback || "Baholash yakunlandi.",
                });
                setStep("result");
            } else {
                alert("Natijani saqlashda xatolik: " + (data.message || "Noma'lum xato"));
            }
        } catch (error) {
            console.error("Imtihon topshirishda xato:", error);
            alert("Serverga ulanishda xatolik yuz berdi.");
        } finally {
            setLoading(false);
        }
    };

    const handleForceFail = async (reason: string, photoBase64: string | null) => {
        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
            // Make a dummy request to submit a failed test
            await fetch(`${apiUrl}/v1/proctoring/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentName,
                    score: 0,
                    violations: 5,
                    status: "failed",
                    reason: `🚫 IMTIHON MUZLATILDI: ${reason}`,
                    photoBase64,
                }),
            });
            
            // Note: Currently proctoring.controller.ts dummy submitTestResult handles /submit
            
            setAiResult({
                score: 0,
                feedback: `Qoidabuzarlik: ${reason}`,
            });
            setStep("result");
        } catch (error) {
            console.error("Force fail xatosi:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRestart = () => {
        setQuestions([]);
        setAiResult(null);
        setStep("select");
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-[#09090b] text-zinc-100 overflow-hidden">
            <Header title="AI Proctoring Imtihon" />
            <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-auto">
                <AIOrb loading={loading} />
                
                {step === "select" && (
                    <LessonSelector onStartExam={handleStartExam} loading={loading} />
                )}
                
                {step === "exam" && (
                    <QuestionCard
                        questions={questions}
                        currentLesson={currentLesson}
                        onFinishExam={handleFinishExam}
                        onForceFail={handleForceFail}
                    />
                )}
                
                {step === "result" && aiResult && (
                    <ExamResult
                        score={aiResult.score}
                        feedback={aiResult.feedback}
                        onRestart={handleRestart}
                    />
                )}
            </div>
        </div>
    );
}
