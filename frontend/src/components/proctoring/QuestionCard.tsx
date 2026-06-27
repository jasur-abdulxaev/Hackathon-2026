import { useState, useEffect, useRef } from "react";

interface Question {
    id: number;
    text?: string;
    question?: string;
}

interface QuestionCardProps {
    questions: Question[];
    currentLesson: number;
    onFinishExam: (
        history: Array<{ question: string; answer: string }>,
        photoBase64: string | null,
    ) => void;
    onForceFail: (reason: string, photoBase64: string | null) => void;
}

export default function QuestionCard({
    questions,
    currentLesson,
    onFinishExam,
    onForceFail,
}: QuestionCardProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState("");
    const [examHistory, setExamHistory] = useState<
        Array<{ question: string; answer: string }>
    >([]);

    const [violationsCount, setViolationsCount] = useState(0);
    const [proctoringStatus, setProctoringStatus] = useState("Kamera va mikrofon yuklanmoqda...");
    const [isAudioReady, setIsAudioReady] = useState(false);
    const [warning, setWarning] = useState<string | null>(null);

    const violationsRef = useRef(0);
    const isExamActive = useRef(true);
    const examHistoryRef = useRef<Array<{ question: string; answer: string }>>([]);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const triggerWarning = (msg: string) => {
        setWarning(msg);
        setTimeout(() => setWarning(null), 5000);
    };

    const takeSnapshot = (): string | null => {
        if (videoRef.current && canvasRef.current && videoRef.current.videoWidth > 0) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const width = 640;
            const height = 480;

            canvas.width = width;
            canvas.height = height;

            const context = canvas.getContext("2d");
            if (context) {
                context.imageSmoothingEnabled = true;
                context.imageSmoothingQuality = "medium";
                context.drawImage(video, 0, 0, width, height);
                return canvas.toDataURL("image/jpeg", 0.7);
            }
        }
        return null;
    };

    const stopMedia = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== "closed") {
            audioContextRef.current.close().catch((e) => console.error(e));
        }
        if (audioIntervalRef.current) {
            clearInterval(audioIntervalRef.current);
        }
    };

    const triggerForceFail = (reason: string, frame: string | null) => {
        if (!isExamActive.current) return;
        isExamActive.current = false;
        stopMedia();
        onForceFail(reason, frame);
    };

    const startAudioMonitoring = async () => {
        if (!streamRef.current || audioContextRef.current) return;

        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const audioContext = new AudioContextClass();

            if (audioContext.state === "suspended") {
                await audioContext.resume();
            }

            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(streamRef.current);

            analyser.fftSize = 512;
            source.connect(analyser);

            audioContextRef.current = audioContext;
            setIsAudioReady(true);
            setProctoringStatus("🟢 Tizim to'liq nazorat qilmoqda");

            const bufferLength = analyser.fftSize;
            const dataArray = new Uint8Array(bufferLength);

            audioIntervalRef.current = setInterval(() => {
                if (!isExamActive.current) return;

                analyser.getByteTimeDomainData(dataArray);

                let totalSquares = 0;
                for (let i = 0; i < bufferLength; i++) {
                    const normalized = (dataArray[i] - 128) / 128;
                    totalSquares += normalized * normalized;
                }

                const volumeValue = Math.round(Math.sqrt(totalSquares / bufferLength) * 100);

                if (volumeValue > 15) {
                    const currentFrame = takeSnapshot();
                    violationsRef.current += 1;
                    setViolationsCount(violationsRef.current);
                    setProctoringStatus("⚠️ Shubhali shovqin aniqlandi!");

                    if (violationsRef.current >= 3) {
                        triggerForceFail("Imtihon qoidalari buzildi (shovqin).", currentFrame);
                    } else {
                        triggerWarning(`Ogohlantirish (${violationsRef.current}/3): Shovqin taqiqlanadi!`);
                    }
                }
            }, 1000);
        } catch (audioErr) {
            console.error(audioErr);
        }
    };

    useEffect(() => {
        let isMounted = true;

        navigator.mediaDevices
            .getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
                audio: true,
            })
            .then((mediaStream) => {
                if (!isMounted) {
                    mediaStream.getTracks().forEach((track) => track.stop());
                    return;
                }
                streamRef.current = mediaStream;
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                    videoRef.current.play().catch(console.error);
                }
                setProctoringStatus("🟢 AI Kamera faol");
            })
            .catch(() => triggerForceFail("Kamera/Mikrofonga ruxsat yo'q.", null));

        const handleVisibilityChange = () => {
            if (!isExamActive.current) return;
            if (document.hidden) {
                const currentFrame = takeSnapshot();
                violationsRef.current += 1;
                setViolationsCount(violationsRef.current);

                if (violationsRef.current >= 3) {
                    triggerForceFail("Sahifadan chiqish taqiqlanadi.", currentFrame);
                } else {
                    triggerWarning("Ogohlantirish: Sahifadan chiqish taqiqlanadi!");
                }
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        const proctoringInterval = setInterval(async () => {
            if (!isExamActive.current) {
                clearInterval(proctoringInterval);
                return;
            }

            const frame = takeSnapshot();
            if (frame && frame.length > 500) {
                try {
                    const cleanBase64 = frame.includes(",") ? frame.split(",")[1] : frame;
                    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

                    const response = await fetch(`${apiUrl}/v1/proctoring/verify-frame`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ photoBase64: cleanBase64 }),
                    });

                    if (!response.ok) return;

                    const data = await response.json();
                    if (!isExamActive.current) return;

                    if (data.success && data.violationDetected) {
                        violationsRef.current += 1;
                        setViolationsCount(violationsRef.current);
                        setProctoringStatus(`⚠️ Qoidabuzarlik aniqlandi`);

                        if (violationsRef.current >= 3) {
                            triggerForceFail(`Ko'p martalik qoidabuzarlik: ${data.reason}`, frame);
                        } else {
                            triggerWarning(`Qoidabuzarlik (${violationsRef.current}/3): ${data.reason}`);
                        }
                    }
                } catch (err) {
                    console.error("Frame tekshirishda xatolik:", err);
                }
            }
        }, 15000);

        return () => {
            isMounted = false;
            clearInterval(proctoringInterval);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            stopMedia();
        };
    }, []);

    const currentQuestionText = questions[currentIndex]?.question || questions[currentIndex]?.text;

    return (
        <div className="w-full max-w-2xl bg-[#18181b]/60 backdrop-blur-md border border-zinc-800 p-8 rounded-2xl shadow-xl z-10 relative animate-in fade-in duration-300">
            {warning && (
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 bg-rose-500/90 text-white px-6 py-3 rounded-full text-sm font-medium shadow-2xl animate-bounce">
                    {warning}
                </div>
            )}

            <div className="absolute top-4 right-4 w-24 h-24 rounded-lg overflow-hidden border border-zinc-700 bg-black opacity-80 z-20">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]"
                />
            </div>

            <div className="mb-4 flex flex-col gap-2">
                <div>
                    <span
                        className={`text-xs font-mono px-3 py-1 rounded-md ${violationsCount > 0 ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"}`}
                    >
                        {proctoringStatus} ({violationsCount}/3)
                    </span>
                </div>
                {!isAudioReady && (
                    <div>
                        <button
                            onClick={startAudioMonitoring}
                            className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 text-[10px] px-3 py-1 rounded-md transition-colors font-mono"
                        >
                            🎙 Ovoz datchigini yoqish
                        </button>
                    </div>
                )}
            </div>

            <div className="mb-6 flex justify-between items-center pr-28">
                {questions && questions[currentIndex] && (
                    <div>
                        <span className="text-xs font-mono text-blue-400 uppercase tracking-widest">
                            {currentLesson}-dars
                        </span>
                        <h2 className="text-xl font-semibold mt-1 text-zinc-200">
                            {currentQuestionText}
                        </h2>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <textarea
                    className="w-full h-32 bg-[#09090b]/80 border border-zinc-800 rounded-xl p-4 text-zinc-300 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Javobingizni shu yerga yozing..."
                />
                <button
                    onClick={() => {
                        if (!questions || !questions[currentIndex]) return;
                        const newHistory = [
                            ...examHistory,
                            {
                                question: currentQuestionText || "",
                                answer,
                            },
                        ];
                        examHistoryRef.current = newHistory;

                        if (currentIndex < questions.length - 1) {
                            setCurrentIndex((prev) => prev + 1);
                            setExamHistory(newHistory);
                            setAnswer("");
                        } else {
                            const finalPhoto = takeSnapshot();
                            isExamActive.current = false;
                            stopMedia();
                            onFinishExam(newHistory, finalPhoto);
                        }
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium py-3 rounded-xl transition-all shadow-lg hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99]"
                >
                    {currentIndex === questions.length - 1 ? "Tugatish" : "Keyingisi"}
                </button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
