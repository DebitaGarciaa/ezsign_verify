"use client";

import { useState } from "react";
import { Dropzone } from "./components/Dropzone";
import { PdfPreview } from "./components/PdfPreview"; 
import dynamic from 'next/dynamic';

const VerifyModule = () => {
  // 1. PASTIKAN TIGA BARIS INI ADA (Jangan terhapus!)
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lang, setLang] = useState<'id' | 'en'>('id');
  const [apiData, setApiData] = useState<any[]>([]); // Untuk centang hijau

  if (file) {
    return (
      <PdfPreview 
        file={file} 
        apiData={apiData} 
        onBack={() => { setFile(null); setApiData([]); }} 
        lang={lang} 
      />
    );
  }

  return (
    <div className="w-full flex justify-center items-start py-12 px-6 bg-[#F0F2F5] min-h-screen">
      <div className="w-full max-w-5xl flex flex-col">
        {/* 2. PAKAI KODE INI (Pastikan props errorMessage juga dikirim) */}
        <Dropzone 
          lang={lang} 
          setLang={setLang} 
          errorMessage={errorMessage} // Tambahkan baris ini!
          onUploadSuccess={(uploadedFile, result) => {
            setFile(uploadedFile);
            setErrorMessage(null);
            setApiData((result as any).data || []);
          }}
          onUploadError={(message) => setErrorMessage(message)}
        />
      </div> 
    </div>
  );
};
export default VerifyModule;