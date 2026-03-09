
'use client';

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
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [thumbnails, setThumbnails] = useState<HTMLCanvasElement[]>([]);
  const pdfContentRef = useRef<HTMLDivElement>(null);
  const renderTasksRef = useRef<Map<number, any>>(new Map()); // Track render tasks untuk cleanup
  const thumbnailContainerRef = useRef<HTMLDivElement>(null); // Ref untuk sidebar thumbnail container
  const canvasRefsRef = useRef<(HTMLCanvasElement | null)[]>([]);
  const renderCycleRef = useRef(0);

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
    let isDisposed = false;

    if (initialApiData && initialApiData.length > 0) {
      let tempFinalStatus: VerifyStatus = 'valid_ideal';

      for (const sig of initialApiData) {
        const issuer = (sig["Issuer"] || "").toLowerCase();
        const serial = (sig["Serial Number"] || "").toString().toLowerCase();
        const certStatus = (sig["Certificate Status"] || "").toLowerCase();
        const hashValidation = (sig["File hash Validation"] || "").toLowerCase();

        // 1. Logika deteksi MERAH (Untrusted)
        const isUntrusted = 
          sig.code == 1003 || 
          sig.code == "1003" ||
          issuer.includes("pamuji@solomon") || 
          issuer.trim() === "" || 
          serial === "" || 
          serial === "-" ||
          certStatus.includes("untrusted") ||
          (sig.code == 1004 && !hashValidation.includes("annotation"));

        // 2. Logika deteksi ORANGE (Hanya Anotasi)
        const isWarning = 
          sig.code == 1004 && (hashValidation.includes("annotation") || hashValidation.includes("freetext"));

        if (isUntrusted) {
          tempFinalStatus = 'untrusted';
          break; 
        } else if (isWarning) {
          tempFinalStatus = 'untrusted'; // Banner tetap merah, detail jadi orange
        }
      }
      setCurrentStatus(tempFinalStatus);
      setApiData(initialApiData);
    } else {
      setCurrentStatus('no_signature');
    }

  const loadAndRenderPdf = async () => {
    try {
      // Dynamic import pdfjs hanya saat dibutuhkan (di browser)
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      if (isDisposed) return;
      
      setPdfDoc(pdf);
      setNumPages(pdf.numPages);
      canvasRefsRef.current = Array(pdf.numPages).fill(null);
      
      // Generate semua thumbnails
      const thumbArray: HTMLCanvasElement[] = [];
      for (let i = 0; i < pdf.numPages; i++) {
        try {
          const page = await pdf.getPage(i + 1);
          const viewport = page.getViewport({ scale: 0.2 });
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (!context) continue;
          
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          const renderContext: any = {
            canvasContext: context,
            viewport: viewport
          };
          
          const renderTask = page.render(renderContext);
          await renderTask.promise;
          if (isDisposed) return;
          
          thumbArray.push(canvas);
        } catch (error) {
          console.error(`Error generating thumbnail for page ${i}:`, error);
        }
      }
      if (!isDisposed) {
        setThumbnails(thumbArray);
      }
      
      // Render semua halaman akan dilakukan oleh useEffect di bawah
    } catch (error) {
      console.error("Error loading PDF:", error);
    }
  };
  
  loadAndRenderPdf();

  // Pastikan bagian return ini berada di paling akhir fungsi useEffect
  return () => {
    isDisposed = true;
    renderCycleRef.current += 1;
    renderTasksRef.current.forEach((task) => {
      try {
        task.cancel();
      } catch (e) {
        // Ignore cancel errors
      }
    });
    renderTasksRef.current.clear();
    URL.revokeObjectURL(url);
  };
}, [file, initialApiData]); // Tutup useEffect dengan benar

  // Fungsi untuk render page ke canvas - dengan cleanup untuk mencegah "same canvas" error
  const renderPage = async (pdf: any, pageNum: number, cycleId: number, zoomLevel: number) => {
    try {
      const canvasElement = canvasRefsRef.current[pageNum];
      if (!canvasElement) {
        console.warn(`Canvas for page ${pageNum} not found`);
        return;
      }
      
      // Cancel render task yang lama jika ada
      const existingTask = renderTasksRef.current.get(pageNum);
      if (existingTask) {
        try {
          existingTask.cancel();
          await existingTask.promise;
        } catch (e) {
          // Ignore cancel errors
        }
        renderTasksRef.current.delete(pageNum);
      }

      if (cycleId !== renderCycleRef.current) return;
      
      const page = await pdf.getPage(pageNum + 1);
      if (cycleId !== renderCycleRef.current) return;

      const scale = zoomLevel / 100;
      const viewport = page.getViewport({ scale });
      
      const context = canvasElement.getContext('2d');
      if (!context) {
        console.error(`Could not get canvas context for page ${pageNum}`);
        return;
      }
      
      canvasElement.width = viewport.width;
      canvasElement.height = viewport.height;
      
      const renderContext: any = {
        canvasContext: context,
        viewport: viewport,
        canvas: canvasElement
      };
      
      const renderTask = page.render(renderContext);
      renderTasksRef.current.set(pageNum, renderTask);
      
      await renderTask.promise;
      
      // Remove dari map setelah selesai
      if (renderTasksRef.current.get(pageNum) === renderTask) {
        renderTasksRef.current.delete(pageNum);
      }
    } catch (error: any) {
      // Ignore error jika task di-cancel
      if (error?.name !== 'RenderingCancelledException') {
        console.error(`Error rendering page ${pageNum}:`, error);
      }
    }
  };

  // Render semua halaman saat PDF loaded atau zoom berubah - dengan cleanup
  useEffect(() => {
    if (pdfDoc) {
      const cycleId = ++renderCycleRef.current;

      // Cancel semua render tasks yang sedang berjalan
      renderTasksRef.current.forEach((task) => {
        try {
          task.cancel();
        } catch (e) {
          // Ignore cancel errors
        }
      });
      renderTasksRef.current.clear();
      
      // Render semua halaman
      for (let i = 0; i < numPages; i++) {
        renderPage(pdfDoc, i, cycleId, zoom);
      }
    }
    
    // Cleanup saat component unmount atau dependencies berubah
    return () => {
      renderCycleRef.current += 1;
      renderTasksRef.current.forEach((task) => {
        try {
          task.cancel();
        } catch (e) {
          // Ignore cancel errors
        }
      });
      renderTasksRef.current.clear();
    };
  }, [zoom, pdfDoc, numPages]);

  // Handle scroll untuk auto-detect halaman yang sedang dilihat
  useEffect(() => {
    const handleScroll = () => {
      if (!viewerRef.current || !pdfContentRef.current) return;
      
      const scrollTop = viewerRef.current.scrollTop;
      const viewportHeight = viewerRef.current.clientHeight;
      const centerPosition = scrollTop + viewportHeight / 2;
      
      // Hitung halaman berdasarkan posisi tengah viewport
      const pageHeight = pdfContentRef.current.clientHeight / numPages;
      const estimatedPage = Math.floor(centerPosition / pageHeight);
      const newPage = Math.max(0, Math.min(estimatedPage, numPages - 1));
      
      if (newPage !== activePage) {
        setActivePage(newPage);
      }
    };

    const viewer = viewerRef.current;
    if (viewer) {
      viewer.addEventListener('scroll', handleScroll);
      return () => viewer.removeEventListener('scroll', handleScroll);
    }
  }, [activePage, numPages]);

  // Auto-scroll sidebar thumbnail saat activePage berubah
  useEffect(() => {
    if (thumbnailContainerRef.current && activePage >= 0) {
      const thumbnailElement = thumbnailContainerRef.current.children[activePage] as HTMLElement;
      if (thumbnailElement) {
        thumbnailElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [activePage]);

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
          <div ref={thumbnailContainerRef} className="flex-1 overflow-y-auto custom-scrollbar py-6 flex flex-col items-center gap-8">
            {Array.from({ length: numPages }).map((_, index) => (
              <div 
                key={index} 
                onClick={() => {
                  setActivePage(index);
                  // Scroll ke halaman di main viewer
                  if (viewerRef.current && pdfContentRef.current) {
                    const pageHeight = pdfContentRef.current.clientHeight / numPages;
                    viewerRef.current.scrollTop = index * pageHeight;
                  }
                }} 
                className="flex flex-col items-center cursor-pointer group"
              >
                <div className={`w-[110px] aspect-[1/1.41] bg-white border-2 transition-all duration-200 shadow-sm overflow-hidden relative flex items-center justify-center
                  ${activePage === index ? 'border-[#48D1E0] ring-2 ring-[#48D1E0]' : 'border-gray-300 group-hover:border-[#48D1E0]'}`}
                >
                  {/* Render thumbnail dari canvas */}
                  {thumbnails[index] && (
                    <img 
                      src={thumbnails[index].toDataURL()} 
                      alt={`Halaman ${index + 1}`}
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
                <span className={`text-[11px] mt-2 font-bold ${activePage === index ? 'text-[#1A73E8]' : 'text-[#3C4043]'}`}>{index + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. PDF Viewer Area (KANAN) - CANVAS RENDERING TANPA IFRAME */}
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

          {/* Area Konten PDF - CANVAS MURNI TANPA WARNING - BISA SCROLL MULTIPLE PAGES */}
          <div ref={pdfContentRef} className="py-8 w-full flex flex-col items-center px-4"> 
            {pdfDoc && Array.from({ length: numPages }).map((_, index) => (
              <div key={index} className="mb-8 w-full flex flex-col items-center">
                <div 
                  className="shadow-2xl bg-white transition-all duration-300 flex justify-center"
                  style={{ 
                    transformOrigin: 'top center',
                    minHeight: '400px'
                  }}
                >
                  <canvas 
                    id={`pdf-page-${index}`}
                    ref={(el) => {
                      canvasRefsRef.current[index] = el;
                    }}
                    className="border border-gray-200"
                  />
                </div>
                <div className="text-xs text-gray-500 mt-2">Halaman {index + 1}</div>
              </div>
            ))}
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