import Header from '@/components/layout/Header';
import { ShieldCheck, MessageSquareWarning } from 'lucide-react';

export default function ProctoringResultsPage() {
    return (
        <div className="flex-1 flex flex-col h-full bg-[#09090b] text-zinc-100 overflow-hidden">
            <Header title="AI Proctoring Natijalari" />
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <ShieldCheck className="w-24 h-24 text-blue-500 mb-6 opacity-80" />
                <h1 className="text-2xl font-bold mb-4">Natijalar Telegram Botda</h1>
                <p className="text-zinc-400 max-w-md mb-8 leading-relaxed">
                    Hozirgi vaqtda barcha AI Proctoring tekshiruv natijalari, jumladan qoidabuzarliklar va baholar to'g'ridan-to'g'ri bog'langan Telegram botiga yuborilmoqda. Tizim avtomatik ravishda xavfsizlikni ta'minlaydi.
                </p>
                <div className="bg-[#18181b] p-6 rounded-xl border border-zinc-800 max-w-lg w-full flex items-start gap-4">
                    <MessageSquareWarning className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                    <div className="text-left">
                        <h3 className="font-semibold text-zinc-200">Tez orada</h3>
                        <p className="text-sm text-zinc-500 mt-1">Bu sahifada to'liq imtihon tarixini arxiv shaklida ko'rish imkoniyati qo'shiladi.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
