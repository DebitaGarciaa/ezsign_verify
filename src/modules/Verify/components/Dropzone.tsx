// src/modules/Verify/components/Dropzone.tsx
import Image from "next/image";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { X } from "lucide-react";
import { translations } from "@/constants/translations";

export interface VerificationResult {
  status: 'no_signature' | 'untrusted' | 'valid';
  signatures: Array<{
    name: string;
    isModified: boolean;
    isTrusted: boolean;
    hasTSA: boolean;
    hasLTV: boolean;
  }>;
}

interface DropzoneProps {
  onUploadSuccess: (file: File, result: VerificationResult) => void;
}

export const Dropzone = ({ onUploadSuccess }: DropzoneProps) => {
  const [lang, setLang] = useState<'id' | 'en'>('id');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  
  const t = translations[lang];

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: any[]) => {
    // 1. PENANGANAN FILE DITOLAK (NON-PDF ATAU >15MB)
    if (fileRejections.length > 0) {
      const error = fileRejections[0].errors[0];

      if (error.code === "file-invalid-type") {
        alert(lang === 'id' 
          ? "Format dokumen tidak didukung. Silakan unggah file PDF." 
          : "Document format not supported. Please upload a PDF file.");
      } else if (error.code === "file-too-large") {
        alert(lang === 'id' 
          ? "Ukuran dokumen melebihi batas. Silakan unggah file PDF dengan ukuran maksimal 15 MB." 
          : "Document size exceeds limit. Please upload a PDF file with a maximum size of 15 MB.");
      } else {
        alert(lang === 'id' 
          ? "Format dokumen tidak didukung. Silakan unggah file PDF dengan ukuran maksimal 15 MB." 
          : "Format not supported. Please upload a PDF file with a maximum size of 15 MB.");
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer, useSystemFonts: true });
        
        // Menunggu metadata PDF dimuat untuk cek password
        await loadingTask.promise;

        // JIKA LOLOS (Tidak ada password): Kirim dummy Kondisi 1
        onUploadSuccess(file, { status: 'no_signature', signatures: [] });

      } catch (error: any) {
        // 2. DETEKSI PASSWORD
        if (error.name === "PasswordException") {
          alert(lang === 'id'
            ? "Dokumen tidak dapat dibuka karena dokumen ini memiliki password"
            : "The document cannot be opened because it has a password");
          return;
        } 
        console.error("PDF Load Error:", error);
        alert(lang === 'id' ? "Gagal memproses dokumen." : "Failed to process document.");
      }
    }
  }, [onUploadSuccess, lang]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] }, // Hanya dokumen PDF
    maxSize: 15 * 1024 * 1024, // Maksimal 15 MB
    multiple: false // Hanya satu dokumen
  });
  
  return (
    <div className="flex items-center justify-center w-full h-screen bg-[#F0F2F5] font-sans relative">
      <div className="w-full max-w-[1000px] bg-white rounded-md shadow-[0_15px_30px_-5px_rgba(0,0,0,0.07)] pt-4 pb-10 px-10 flex flex-col items-start border border-gray-100/50">

        {/* 1. Header Section dengan Switcher */}
        <div className="mb-6 w-full flex justify-between items-start">
          <div className="text-left">
            <div className="mb-1 flex items-center gap-0">
              <Image src="/LogoSign.png" alt="ezSign Icon" width={42} height={42} priority className="object-contain" />
              <span className="text-[32px] font-bold text-[#1E293B] tracking-tighter -ml-1">Sign</span>
            </div>
            <h1 className="text-[20px] font-bold text-[#334155] tracking-tight leading-[1.1]">ezSign verifyDocument</h1>
            <p className="text-[#94A3B8] text-[13px] mt-2 font-medium leading-[1.1]">
              {lang === 'id' ? 'Verifikasi Dokumen Tanda Tangan anda secara Digital' : 'Verify your Signature Document Digitally'}
            </p>
          </div>

          <div className="flex items-center bg-[#E8EAED] rounded-full p-0.5 h-8 w-[80px] shadow-inner relative mt-1">
            <button onClick={() => setLang('en')} className={`flex-1 h-full text-[10px] font-bold rounded-full transition-all z-10 ${lang === 'en' ? 'bg-[#1A73E8] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>EN</button>
            <button onClick={() => setLang('id')} className={`flex-1 h-full text-[10px] font-bold rounded-full transition-all z-10 ${lang === 'id' ? 'bg-[#1A73E8] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>ID</button>
          </div>
        </div>

        {/* 2. Upload Box */}
        <div {...getRootProps()} className={`group w-full border-2 border-dashed rounded transition-all duration-200 cursor-pointer py-16 flex flex-col items-center justify-center ${isDragActive ? 'border-[#38BDF8] bg-[#EDF2F7]' : 'border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#EDF2F7]'}`} style={{ borderStyle: 'dashed' }}>
          <input {...getInputProps()} />
          <div className="mb-6">
            <svg width="60" height="75" viewBox="0 0 48 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M30 0H4C1.79086 0 0 1.79086 0 4V56C0 58.2091 1.79086 60 4 60H44C46.2091 60 48 58.2091 48 56V18L30 0Z" fill="#94A3B8" />
              <path d="M33 0V15H48L33 0Z" fill="#BCC8D6" />
              <rect x="10" y="30" width="28" height="4" rx="1" fill="#F8FAFC" className="group-hover:fill-[#EDF2F7] transition-colors" />
              <rect x="10" y="38" width="28" height="4" rx="1" fill="#F8FAFC" className="group-hover:fill-[#EDF2F7] transition-colors" />
              <rect x="10" y="46" width="28" height="4" rx="1" fill="#F8FAFC" className="group-hover:fill-[#EDF2F7] transition-colors" />
            </svg>
          </div>
          <p className="text-[15px] font-bold text-[#334155] leading-tight text-center">
            {isDragActive ? (lang === 'id' ? "Lepaskan file PDF di sini" : "Drop the PDF file here") : (
              <>{lang === 'id' ? 'Tarik & Letakkan file di sini atau ' : 'Drag & Drop file here or '}<span className="text-[#38BDF8] group-hover:text-[#0EA5E9]">{lang === 'id' ? 'Pilih File' : 'Choose file'}</span></>
            )}
          </p>
          <p className="text-[#94A3B8] text-[14px] mt-2 font-medium leading-tight text-center">
            {lang === 'id' ? 'Unggah Dokumen (Hanya dokumen dengan tipe PDF dan Maksimal 15 MB)' : 'Upload Document (Only PDF documents and Maximum 15 MB)'}
          </p>
        </div>

        {/* 3. Tombol Panduan (Trigger Pop-up) */}
        <div className="mt-4">
          <button 
            onClick={() => setIsGuideOpen(true)}
            className="flex items-stretch rounded-none overflow-hidden transition-all shadow-sm group border-none"
          >
            <div className="bg-[#48D1E0] group-hover:bg-[#3dbcc9] text-white px-5 py-2.5 text-[13px] font-bold flex items-center">
              {t.guideTitle}
            </div>
            <div className="bg-[#3BB9C7] group-hover:bg-[#35a8b4] text-white px-3 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </div>
          </button>
        </div>
      </div>

      {/* POP-UP MODAL PANDUAN PENGGUNAAN */}
      {isGuideOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-[500px] rounded-xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200">
            <div className="bg-[#48D1E0] px-6 py-4 flex justify-between items-center text-white">
              <h2 className="text-lg font-bold flex items-center gap-2">
                {t.guideTitle}
              </h2>
              <button onClick={() => setIsGuideOpen(false)} className="hover:bg-black/10 p-1 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {t.steps.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#48D1E0]/10 text-[#3BB9C7] rounded-full flex items-center justify-center font-bold text-sm border border-[#48D1E0]/20">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#334155] text-[15px]">{step.title}</h3>
                    <p className="text-[#94A3B8] text-[13px] leading-relaxed mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t border-gray-100 italic text-[12px] text-gray-500">
                {t.footerDesc}
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button onClick={() => setIsGuideOpen(false)} className="bg-[#334155] hover:bg-[#1E293B] text-white px-6 py-2 rounded-lg text-sm font-bold transition-colors">
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};