'use client';

// src/modules/Verify/components/Dropzone.tsx
import Image from "next/image";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { X } from "lucide-react";
import { translations } from "@/constants/translations";
import { verifyDocument } from "@/services/verifyService"; //

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
  onUploadError: (message: string) => void;
  errorMessage: string | null;
  lang: 'id' | 'en';
  setLang: (lang: 'id' | 'en') => void;
}

export const Dropzone = ({ 
  onUploadSuccess, 
  onUploadError, 
  lang, 
  setLang 
}: DropzoneProps) => {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const t = translations[lang];

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: any[]) => {
  setErrorMessage(null);

  // 1. Cek Penolakan Otomatis dari Dropzone
  if (fileRejections.length > 0) {
    const error = fileRejections[0].errors[0];
    if (error.code === "file-invalid-type") {
      setErrorMessage(lang === 'id' ? "Dokumen yang anda unggah tidak diperbolehkan" : "The document you uploaded is not allowed");
    } else if (error.code === "file-too-large") {
      setErrorMessage(lang === 'id' ? "Format dokumen tidak didukung. Silakan unggah file PDF dengan ukuran maksimal 15 MB." : "The document format is not supported. Please upload a PDF file with a maximum size of 15 MB.");
    }
    return;
  }

  if (acceptedFiles.length > 0) {
    const file = acceptedFiles[0];

    // 2. Cek Manual Tipe PDF
    if (file.type !== 'application/pdf') {
      setErrorMessage(lang === 'id' ? "Dokumen yang anda unggah tidak diperbolehkan" : "The document you uploaded is not allowed");
      return;
    }

    // 3. Cek Manual Ukuran 15MB
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErrorMessage(lang === 'id' ? "Format dokumen tidak didukung. Silakan unggah file PDF dengan ukuran maksimal 15 MB." : "The document format is not supported. Please upload a PDF file with a maximum size of 15 MB.");
      return;
    }

    try {
      // 4. Proses PDF untuk cek Metadata/Password
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      const arrayBuffer = await file.arrayBuffer();
      await pdfjs.getDocument({ data: arrayBuffer, useSystemFonts: true }).promise;
      
      // 5. Jika lolos (bukan password), Panggil API Jasuindo
      const result = await verifyDocument(file);
      console.log("CEK RESULT ASLI DARI API:", result);

      // Kirim hasil ke index.tsx (Untuk Kondisi 1-4)
      onUploadSuccess(file, result as any);

    } catch (error: any) {
      // 6. Penanganan Error Password
      if (error.name === "PasswordException") {
        setErrorMessage(lang === 'id' ? "Dokumen tidak dapat dibuka karena dokumen ini memiliki password" : "The document cannot be opened because it is password protected.");
        return;
      } 
      setErrorMessage(lang === 'id' ? "Gagal memproses dokumen." : "Failed to process document.");
    }
  }
}, [onUploadSuccess, lang]);

  const getTranslatedError = () => {
    if (!errorMessage) return "";

    // Logika pengecekan kata kunci (Sesuai kode punyamu)
    const isPassword = errorMessage.includes("password");
    const isSize = errorMessage.includes("maksimal") || errorMessage.includes("exceeds") || errorMessage.includes("15 MB");
    const isAllowed = errorMessage.includes("allowed") || errorMessage.includes("diperbolehkan") || errorMessage.includes("format");

    if (lang === 'id') {
      if (isPassword) return "Dokumen tidak dapat dibuka karena dokumen ini memiliki password";
      if (isSize) return "Ukuran dokumen melebihi batas maksimal 15 MB.";
      if (isAllowed) return "Dokumen yang anda unggah tidak diperbolehkan.";
      return errorMessage;
    } else {
      if (isPassword) return "The document cannot be opened because it has a password";
      if (isSize) return "Document size exceeds the maximum limit of 15 MB.";
      return "The document you uploaded is not allowed.";
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
  onDrop,
  // maxSize: 15 * 1024 * 1024, // <--- KOMENTARI ATAU HAPUS BARIS INI
  multiple: false 
  });
  
  return (
    <div className="w-full flex justify-center bg-[#F0F2F5] font-sans">
      <div className="w-full max-w-[1000px] bg-white rounded-md shadow-[0_15px_30px_-5px_rgba(0,0,0,0.07)] pt-4 pb-10 px-10 flex flex-col items-start border border-gray-100/50">

        {/* 1. Header Section dengan Switcher */}
       <div className="mb-3.5 w-full flex justify-between items-start">
        <div className="text-left">
          <div className="mb-2 flex items-center gap-0">
            {/* PASTIKAN SRC MENGARAH KE /LogoSign.png */}
            <Image 
              src="/LogoSign.png" 
              alt="ezSign Icon" 
              width={120} // Sesuaikan lebar agar tidak terlalu kecil
              height={42} 
              priority 
              className="object-contain" 
            />
          </div>
            <div className="text-left flex flex-col gap-[4px]"> {/* Gap 4px sesuai Figma */}
              <h1 className="text-[16px] font-medium text-[#343A40] tracking-tight leading-[17.6px]">
                ezSign verifyDocument
              </h1>
              <p className="text-[#94A3B8] text-[13px] font-normal leading-[19.5px]">
                {lang === 'id' 
                  ? 'Verifikasi Dokumen Tanda Tangan anda secara Digital' 
                  : 'Verify your Signature Document Digitally'}
              </p>
            </div>
          </div>

          <div className="flex items-center bg-[#E8EAED] rounded-full p-0.5 h-7 w-[80px] shadow-inner relative mt-5">
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
         <p className="text-[15px] font-bold text-[#343A40] leading-[16.5px] tracking-[0.2px] text-center">
            {isDragActive ? (lang === 'id' ? "Lepaskan file PDF di sini" : "Drop the PDF file here") : (
              <>
                {lang === 'id' ? 'Tarik & Letakkan file di sini atau ' : 'Drag & Drop file here or '}
                <span className="text-[#38BDF8] group-hover:text-[#0EA5E9] font-bold"> {/* Pastikan span juga bold */}
                  {lang === 'id' ? 'Pilih File' : 'Choose file'}
                </span>
              </>
            )}
          </p>

          {/* Teks Keterangan Format & Size */}
          <p className="text-[#94A3B8] text-[13px] mt-2 font-normal leading-[19.5px] tracking-[0.2px] text-center font-sans"> {/* Gunakan font-sans/Arial jika tersedia */}
            {lang === 'id' 
              ? 'Unggah Dokumen (Hanya dokumen dengan tipe PDF dan Maksimal 15 MB)' 
              : 'Supported formats: Pdf and Maximum file size: 15MB'}
          </p>
        </div>

        {/* Error Message Section - Sudah mencakup semua kondisi (Password, 15MB, Format) */}
        {errorMessage && (
          <p className="text-[#F25F5C] text-[13px] mt-4 font-medium text-left animate-in fade-in duration-300">
            {getTranslatedError()}
          </p>
        )}

        {/* 2. Tombol Panduan (Tetap seperti aslinya) */}
        <div className="mt-4">
          <button 
            onClick={() => setIsGuideOpen(true)}
            className="flex items-stretch rounded-none overflow-hidden transition-all shadow-sm group border-none"
          >
            <div className="bg-[#3ACCE5] hover:bg-[#2EB5CC] text-[#FFFFFF] px-[20px] py-[10px] text-[13px] font-normal font-inter flex items-center transition-colors">
              {t.guideTitle}
            </div>
            <div className="bg-[#3BBED6] group-hover:bg-[#35a8b4] text-white px-3 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </div>
          </button>
        </div>
      </div>

      {isGuideOpen && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
    <div className="bg-white w-full max-w-[500px] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden relative border border-slate-100 animate-in zoom-in-95 duration-200">
      
      {/* 1. Header dengan Garis Biru Panjang */}
      <div className="px-8 pt-6 pb-2 flex justify-between items-start">
        <div className="w-full">
          <h2 className="text-[18px] font-bold text-[#343A40] font-inter tracking-tight">
            {lang === 'id' ? 'Panduan Penggunaan' : 'User Guide'}
          </h2>
          <div className="h-[3px] w-full bg-[#3ACCE5] rounded-full mt-1"></div>
        </div>
        <button 
          onClick={() => setIsGuideOpen(false)} 
          className="text-slate-400 hover:text-slate-600 p-1 rounded-full transition-all ml-4"
        >
          <X size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* 2. Content Area: Logika Bahasa EN/ID */}
      <div className="px-8 py-4">
        <div className="space-y-5">
          
          <div className="space-y-3 text-[13.5px] text-slate-600 font-inter leading-relaxed">
            {(lang === 'id' ? [
              "Siapkan Dokumen",
              "Format PDF, tidak terkunci, dan sesuai batas ukuran.",
              "Klik Upload/Pilih File dan pilih PDF dari perangkat Anda.",
              "Tunggu sistem memeriksa tanda tangan elektronik dan integritas dokumen.",
              "Lihat Hasil",
              "Cek status validasi dan informasi tanda tangan."
            ] : [
              "Prepare Document",
              "PDF format, unlocked, and within size limits.",
              "Click Upload/Choose File and select PDF from your device.",
              "Wait for the system to check electronic signatures and document integrity.",
              "View Results",
              "Check validation status and signature information."
            ]).map((text, i) => (
              /* Menggunakan Flex agar teks yang turun ke baris baru tetap sejajar di samping nomor */
              <div key={i} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-4 font-bold text-slate-400">{i + 1}.</span>
                <p className="flex-1">{text}</p>
              </div>
            ))}
          </div>

          {/* Section: Bantuan Lebih Lanjut */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <h3 className="text-[12px] font-bold uppercase tracking-[1px] text-[#3ACCE5] mb-2 font-inter">
              {lang === 'id' ? 'Bantuan Lebih Lanjut' : 'Further Assistance'}
            </h3>
            <div className="space-y-2 text-[13px] text-slate-600 font-inter leading-relaxed">
              <p>
                {lang === 'id' 
                  ? 'Jika anda mengalami kendala saat proses verifikasi, anda dapat mengirimkan email ke ' 
                  : 'If you encounter issues during the verification process, you can send an email to '}
                <a href="mailto:helpdesk@ezsign.id" className="text-[#3ACCE5] font-bold hover:underline">helpdesk@ezsign.id</a>
              </p>
              <p>
                {lang === 'id'
                  ? 'Dengan melampirkan dokumen PDF yang anda unggah dan bukti pesan error (jika ada).'
                  : 'By attaching the PDF document you uploaded and proof of the error message (if any).'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Footer */}
      <div className="px-8 py-5 flex justify-end">
        <button 
          onClick={() => setIsGuideOpen(false)} 
          className="bg-slate-700 hover:bg-slate-800 text-white px-8 py-2 rounded-lg text-[13px] font-bold transition-all shadow-md active:scale-95"
        >
          {lang === 'id' ? 'Tutup' : 'Close'}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};