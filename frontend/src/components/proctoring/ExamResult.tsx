interface ExamResultProps {
    score: number;
    feedback: string;
    onRestart: () => void;
}

export default function ExamResult({
    score,
    feedback,
    onRestart,
}: ExamResultProps) {
    return (
        <div className="w-full max-w-2xl bg-[#18181b]/60 backdrop-blur-md border border-zinc-800 p-8 rounded-2xl shadow-xl z-10 animate-in fade-in duration-300">
            <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                    <div>
                        <span className="text-xs font-mono text-blue-400 uppercase tracking-widest">
                            Imtihon yakunlandi
                        </span>
                        <h2 className="text-xl font-semibold mt-1 text-zinc-200">
                            Umumiy Natija
                        </h2>
                    </div>
                    <span
                        className={`text-3xl font-mono font-bold ${
                            score >= 60 ? "text-emerald-400" : "text-rose-400"
                        }`}
                    >
                        {score} / 100
                    </span>
                </div>

                <div>
                    <span className="text-xs font-mono text-zinc-500 uppercase block mb-1">
                        Professor Xulosasi va Tavsiyalari
                    </span>
                    <p className="text-zinc-300 leading-relaxed bg-[#09090b]/40 p-4 rounded-xl border border-zinc-800/50 whitespace-pre-wrap">
                        {feedback}
                    </p>
                </div>

                <button
                    onClick={onRestart}
                    className="w-full border border-zinc-800 hover:bg-zinc-800 text-zinc-400 py-3 rounded-xl transition-colors text-sm font-medium"
                >
                    Yangi imtihon topshirish
                </button>
            </div>
        </div>
    );
}
