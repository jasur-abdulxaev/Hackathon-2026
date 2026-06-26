import Header from '@/components/layout/Header';
import { exportApi, backupApi } from '@/api';
import { useAuthStore } from '@/stores/authStore';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { downloadBlob } from '@/utils';

export default function ExportPage() {
  const { user } = useAuthStore();
  const [exportingGroup, setExportingGroup] = useState(false);
  const [exportingOverview, setExportingOverview] = useState(false);
  const [exportingMonthly, setExportingMonthly] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [groupId, setGroupId] = useState('');

  const handleExportOverview = async () => {
    setExportingOverview(true);
    try {
      const res = await exportApi.exportOverview();
      downloadBlob(res.data, 'umumiy_hisobot.xlsx');
    } catch (err) {
      console.error(err);
      alert("Xatolik");
    } finally {
      setExportingOverview(false);
    }
  };

  const handleBackupDownload = async () => {
    setBackingUp(true);
    try {
      const res = await backupApi.downloadBackup();
      downloadBlob(res.data, `tizim_zaxirasi_${new Date().toISOString().split('T')[0]}.json`);
    } catch (err) {
      console.error(err);
      alert("Zaxiraga olishda xatolik");
    } finally {
      setBackingUp(false);
    }
  };

  const handleBackupRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("DIQQAT! Bu jarayon hozirgi barcha ma'lumotlarni o'chirib, fayldagisini yozadi. Davom etasizmi?")) {
      e.target.value = '';
      return;
    }

    setRestoring(true);
    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      await backupApi.restoreBackup(jsonData);
      alert("Barcha ma'lumotlar muvaffaqiyatli tiklandi! Tizimni yangilang.");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Tiklashda xatolik yuz berdi. Fayl noto'g'ri bo'lishi mumkin.");
    } finally {
      setRestoring(false);
      e.target.value = '';
    }
  };

  const handleExportMonthly = async () => {
    setExportingMonthly(true);
    try {
      const res = await exportApi.exportMonthlyReport();
      downloadBlob(res.data, 'oqituvchilar_hisoboti.xlsx');
    } catch (err) {
      console.error(err);
      alert("Xatolik");
    } finally {
      setExportingMonthly(false);
    }
  };

  const handleExportGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId.trim()) return;
    
    setExportingGroup(true);
    try {
      const res = await exportApi.exportGroup(groupId.trim());
      downloadBlob(res.data, `guruh_${groupId}_natijalari.xlsx`);
      setGroupId('');
    } catch (err) {
      console.error(err);
      alert("Guruh topilmadi yoki xatolik");
    } finally {
      setExportingGroup(false);
    }
  };

  return (
    <div>
      <Header title="Eksport Markazi" subtitle="Ma'lumotlarni Excel formatida yuklab olish" />

      <div className="p-8 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Umumiy Hisobot (Faqat admin uchun) */}
          {user?.role === 'admin' && (
            <>
              <div className="glass rounded-2xl p-6 border border-slate-700/50 flex flex-col h-full">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                  <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Umumiy Hisobot</h3>
                <p className="text-sm text-slate-400 mb-6 flex-1">
                  Barcha guruhlar, ulardagi o'quvchilar soni, topshiriqlar va o'rtacha ballar haqida umumlashtirilgan Excel hisobot.
                </p>
                
                <button
                  onClick={handleExportOverview}
                  disabled={exportingOverview}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {exportingOverview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Yuklab olish (.xlsx)
                </button>
              </div>

              <div className="glass rounded-2xl p-6 border border-slate-700/50 flex flex-col h-full col-span-1 md:col-span-2">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                  <FileSpreadsheet className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">O'qituvchilar Oylik Hisoboti</h3>
                <p className="text-sm text-slate-400 mb-6 flex-1">
                  Barcha o'qituvchilarning ko'rsatkichlari (tekshirgan ishlari, o'rtacha ball va sifat darajasi) asosida tuzilgan oylik reytingi.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                  <button
                    onClick={handleExportMonthly}
                    disabled={exportingMonthly}
                    className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {exportingMonthly ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Yuklab olish (.xlsx)
                  </button>
                  <button
                    onClick={() => window.open('/admin/export/monthly-pdf', '_blank')}
                    className="flex-1 py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Chiroyli PDF
                  </button>
                </div>
              </div>
            </>
          )}





        </div>
      </div>
    </div>
  );
}

import { Users, Database, Upload } from 'lucide-react';
