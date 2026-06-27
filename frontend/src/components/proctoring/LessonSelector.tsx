import { useEffect, useState } from "react";

interface Lesson {
    id: number;
    title: string;
}

interface LessonSelectorProps {
    onStartExam: (lessonId: number) => void;
    loading: boolean;
}

export default function LessonSelector({
    onStartExam,
    loading,
}: LessonSelectorProps) {
    const [syllabus, setSyllabus] = useState<Lesson[]>([]);
    const [selectedLesson, setSelectedLesson] = useState<number>(0);
    const [fetchError, setFetchError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

        fetch(`${apiUrl}/v1/proctoring/syllabus`, {
            method: "GET",
            headers: {
                Accept: "application/json",
            },
        })
            .then((res) => res.json())
            .then((data) => {
                if (!isMounted) return;
                const lessons = data.data || data.syllabus || [];
                if (lessons && Array.isArray(lessons)) {
                    setSyllabus(lessons);
                    if (lessons.length > 0) {
                        setSelectedLesson(lessons[0].id);
                    }
                } else {
                    setFetchError("Darslar ro'yxati topilmadi yoki format noto'g'ri.");
                }
            })
            .catch((err) => {
                if (isMounted) {
                    console.error("Syllabus yuklash xatosi:", err);
                    setFetchError("Backend bilan bog'lanishda xatolik.");
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="w-full max-w-2xl bg-[#18181b]/60 backdrop-blur-md border border-zinc-800 p-8 rounded-2xl shadow-xl z-10 animate-in fade-in zoom-in duration-300">
            <div className="mb-6">
                <span className="text-xs font-mono text-blue-400 uppercase tracking-widest">
                    Imtihon sozlamalari
                </span>
                <h2 className="text-xl font-semibold mt-1 text-zinc-200">
                    Hozirda qaysi darsga kelgansiz?
                </h2>
                <p className="text-sm text-zinc-400 mt-1">
                    AI tanlangan darsgacha bo'lgan barcha o'tilgan mavzulardan aralash imtihon tayyorlaydi.
                </p>
            </div>

            <div className="space-y-4">
                {fetchError ? (
                    <div className="w-full bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm text-center">
                        {fetchError}
                    </div>
                ) : (
                    <select
                        value={selectedLesson}
                        onChange={(e) => setSelectedLesson(Number(e.target.value))}
                        disabled={loading || syllabus.length === 0}
                        className="w-full bg-[#09090b]/80 border border-zinc-800 rounded-xl p-4 text-zinc-300 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer disabled:opacity-50"
                    >
                        {syllabus.length === 0 ? (
                            <option value={0}>Darslar yuklanmoqda...</option>
                        ) : (
                            syllabus.map((lesson) => (
                                <option key={lesson.id} value={lesson.id}>
                                    {lesson.title}
                                </option>
                            ))
                        )}
                    </select>
                )}

                <button
                    onClick={() => selectedLesson !== 0 && onStartExam(selectedLesson)}
                    disabled={loading || syllabus.length === 0 || selectedLesson === 0}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-zinc-800 disabled:to-zinc-800 text-white font-medium py-3 px-6 rounded-xl transition-all shadow-lg active:scale-[0.99]"
                >
                    {loading ? "AI Imtihon tayyorlamoqda..." : "Imtihonni boshlash"}
                </button>
            </div>
        </div>
    );
}
