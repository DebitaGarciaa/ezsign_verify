
// src/modules/Verify/components/PdfPreview.tsx
import { X, ZoomIn, ZoomOut, Maximize, Scan } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { VerifyModal } from "./VerifyModal"; // Import file modal yang baru dibuat
import { verifyDocument } from "@/services/verifyService";

type VerifyStatus = 'no_signature' | 'untrusted' | 'valid_ideal'| 'loading';

interface PdfPreviewProps {
  file: File;
  onBack: () => void;
  status?: VerifyStatus; // Tambah ?
  lang?: 'id' | 'en';    // Tambah ?
  apiData?: any[];       // Tambah ?
}

export const PdfPreview = ({ file, onBack, status: initialStatus = 'loading', lang: initialLang = 'id', apiData: initialApiData = [] }: PdfPreviewProps) => {
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [lang, setLang] = useState<'id' | 'en'>(initialLang);
  const [numPages, setNumPages] = useState<number>(1);
  const [activePage, setActivePage] = useState<number>(0);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [zoom, setZoom] = useState<number>(100);
  const [currentStatus, setCurrentStatus] = useState<VerifyStatus>(('loading')); //Untuk menyimpan status verifikasi yang diterima dari props
  const [apiData, setApiData] = useState<any[]>(initialApiData);
  const viewerRef = useRef<HTMLDivElement>(null);

  // Kamus terjemahan untuk banner utama
  const t = {
    id: {
      no_sig: "Tidak ditemukan tanda tangan elektronik",
      found_sig: "Ditemukan tanda tangan elektronik",
      detail: "Detail"
    },
    en: {
      no_sig: "No electronic signature found",
      found_sig: "Electronic signature found",
      detail: "Detail"
    }
  }[lang];

  // PdfPreview.tsx
useEffect(() => {
  const url = URL.createObjectURL(file);
  setPdfUrl(url);

  // JANGAN PANGGIL verifyDocument LAGI DI SINI!
  // Cukup gunakan props apiData yang sudah kita oper dari index.tsx
 // PdfPreview.tsx - Di dalam useEffect
// Di PdfPreview.tsx - Ganti blok if (initialApiData...)
if (initialApiData && initialApiData.length > 0) {
  console.log("DATA MASUK KE PREVIEW:", initialApiData); // CEK DI F12!
  
  let tempFinalStatus: VerifyStatus = 'valid_ideal';

  for (const sig of initialApiData) {
    // Ambil status dengan sangat hati-hati (cek semua kemungkinan nama field)
    const certStatus = (sig["Certificate Status"] || sig["certificate_status"] || "").toLowerCase();
    const issuer = (sig["Issuer"] || sig["issuer"] || "").toLowerCase();
    
    // LOGIKA PENENTU WARNA:
    // Jika ada kata 'untrusted' atau 'invalid', langsung MERAH
    const isUntrusted = 
      certStatus.includes("untrusted") || 
      certStatus.includes("invalid") ||
      issuer.includes("pamuji@solomon");

    if (isUntrusted) {
      tempFinalStatus = 'untrusted';
      break;
    }
  }

  // PAKSA PERUBAHAN STATUS
  console.log("STATUS AKHIR DISESUAIKAN KE:", tempFinalStatus);
  setCurrentStatus(tempFinalStatus);
  setApiData(initialApiData);
} else {
  console.log("DATA KOSONG, TETAP BIRU");
  setCurrentStatus('no_signature');
}
  // Load PDF viewer saja
  const loadPdf = async () => {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    setNumPages(pdf.numPages);
  };
  loadPdf();

  return () => URL.revokeObjectURL(url);
}, [file, initialApiData.length]);

  const scrollToPage = (pageIndex: number) => {
    setActivePage(pageIndex);
    if (viewerRef.current) {
      const scrollHeight = viewerRef.current.scrollHeight;
      const targetScroll = (pageIndex / numPages) * scrollHeight;
      viewerRef.current.scrollTo({ top: targetScroll, behavior: "smooth" });
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col w-screen h-screen bg-[#BDC1C6] overflow-hidden font-sans z-[999]">
      
      {/* 1. Header Toolbar - Tetap Identik dengan Figma */}
      <div className="bg-white h-11 px-4 flex justify-between items-center z-20 border-b border-gray-300 w-full shrink-0 shadow-sm">
        <div className="text-[13px] text-[#3C4043] font-medium truncate w-1/4">
          {file.name}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(prev => Math.min(prev + 10, 200))} className="w-10 h-6 flex items-center justify-center border border-[#48D1E0] rounded-full text-[#48D1E0] hover:bg-[#48D1E0]/10 transition-all shadow-sm">
            <ZoomIn size={14} strokeWidth={2.5} />
          </button>
          <button onClick={() => setZoom(prev => Math.max(prev - 10, 50))} className="w-10 h-6 flex items-center justify-center border border-[#48D1E0] rounded-full text-[#48D1E0] hover:bg-[#48D1E0]/10 transition-all shadow-sm">
            <ZoomOut size={14} strokeWidth={2.5} />
          </button>
          <button onClick={() => setZoom(100)} className="w-10 h-6 flex items-center justify-center border border-[#48D1E0] rounded-full text-[#48D1E0] hover:bg-[#48D1E0]/10 transition-all shadow-sm">
            <Scan size={14} strokeWidth={2.5} />
          </button>
          <div className="flex items-center gap-2 ml-1">
            <div className="w-14 h-6 flex items-center justify-center border border-[#48D1E0] rounded-lg bg-white shadow-sm font-bold text-gray-500 text-[12px]">
              {activePage + 1}
            </div>
            <span className="text-[12px] font-bold text-[#48D1E0]">/ {numPages}</span>
          </div>
        </div>

        <div className="w-1/4 flex justify-end items-center gap-4">
          <div className="flex items-center bg-[#E8EAED] rounded-full p-0.5 h-7 w-[75px] shadow-inner border border-gray-200 relative">
            <div className={`absolute top-0.5 bottom-0.5 w-[35px] bg-[#1A73E8] rounded-full transition-all duration-300 shadow-sm ${lang === 'en' ? 'left-0.5' : 'left-[37px]'}`} />
            <button onClick={() => setLang('en')} className={`flex-1 h-full text-[9px] font-bold rounded-full transition-all relative z-10 ${lang === 'en' ? 'text-white' : 'text-gray-500'}`}>EN</button>
            <button onClick={() => setLang('id')} className={`flex-1 h-full text-[9px] font-bold rounded-full transition-all relative z-10 ${lang === 'id' ? 'text-white' : 'text-gray-500'}`}>ID</button>
          </div>
          <button onClick={onBack} className="bg-[#F25F5C] hover:bg-red-600 text-white w-6 h-6 flex items-center justify-center rounded transition-all shadow-sm"><X size={14} strokeWidth={3} /></button>
        </div> 
      </div>

      <div className="flex flex-1 w-full overflow-hidden">
        {/* 2. Sidebar Thumbnails (KIRI) */}
        <div className="w-[190px] bg-[#D1D5DB] border-r border-gray-300 flex flex-col relative shrink-0">
          <div className="flex-1 overflow-y-auto custom-scrollbar py-6 flex flex-col items-center gap-8">
            {Array.from({ length: numPages }).map((_, index) => (
              <div key={index} onClick={() => scrollToPage(index)} className="flex flex-col items-center cursor-pointer group">
                <div className={`w-[110px] aspect-[1/1.41] bg-white border-2 transition-all duration-200 shadow-sm overflow-hidden relative
                  ${activePage === index ? 'border-[#48D1E0]' : 'border-gray-300 group-hover:border-[#48D1E0]'}`}
                >
                  <iframe src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH&page=${index + 1}`} scrolling="no" style={{ width: '400%', height: '400%', transform: 'scale(0.25)', transformOrigin: 'top left', border: 'none', pointerEvents: 'none', overflow: 'hidden' }} className="absolute top-0 left-0" />
                </div>
                <span className={`text-[11px] mt-2 font-bold ${activePage === index ? 'text-[#1A73E8]' : 'text-[#3C4043]'}`}>{index + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. PDF Viewer Area (KANAN) - SEKARANG BANNER ADA DI DALAM SINI */}
        <div ref={viewerRef} className="flex-1 overflow-y-auto bg-[#BDC1C6] custom-scrollbar flex flex-col items-center scroll-smooth relative">
          
          {/* Banner Status - Mendeteksi Kondisi 2 (Merah) atau Kondisi 3/4 (Hijau) secara dinamis */}
          <div className={`w-full 
            ${currentStatus === 'loading' 
              ? 'bg-gray-500' // Abu-abu saat proses API (3 detik pertama)
              : currentStatus === 'no_signature' 
                ? 'bg-[#48D1E0]' // Kondisi 1: Biru
                : currentStatus === 'untrusted' 
                  ? 'bg-[#F25F5C]' // Kondisi 2 & 3: Merah
                  : 'bg-[#00A884]' // Kondisi 4: Hijau
            } text-white px-6 py-2 flex justify-between items-center sticky top-0 z-10 shadow-sm transition-colors duration-300`}>
              
              <span className="text-[13px] font-medium tracking-wide">
                {currentStatus === 'loading' 
                  ? "Sedang memverifikasi dokumen..." 
                  : currentStatus === 'no_signature' ? t.no_sig : t.found_sig}
              </span>

              {currentStatus !== 'no_signature' && currentStatus !== 'loading' && (
                <button 
                  onClick={() => setIsDetailOpen(true)} 
                  className="bg-white text-black px-3 py-1 rounded text-[11px] font-bold hover:bg-gray-100 transition-all shadow-sm"
                >
                  {t.detail}
                </button>
              )}
          </div>

          {/* Area Konten PDF */}
          <div className="py-8 w-full flex flex-col items-center px-4"> 
            {pdfUrl && (
              <div className="shadow-2xl relative overflow-hidden bg-white transition-all duration-300" 
                   style={{ width: `${zoom}%`, maxWidth: '1200px', minWidth: '400px', aspectRatio: `1 / ${numPages * 1.41}` }}>
                <iframe src={`${pdfUrl}#toolbar=0&navpanes=0&view=FitH&scrollbar=0`} scrolling="no" style={{ width: '100%', height: '100%', border: 'none' }} className="pointer-events-none" />
              </div>
            )}
          </div>
        </div>
      </div> 
          
      {/* --- INTEGRASI MODAL TERPISAH --- */}
      <VerifyModal 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
        status={currentStatus as any} 
        lang={lang} 
        apiData={apiData}
      />
    </div>
  );
};