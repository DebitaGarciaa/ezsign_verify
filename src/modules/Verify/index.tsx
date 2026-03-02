"use client";

import { useState } from "react";
import { Dropzone } from "./components/Dropzone";
import { PdfPreview } from "./components/PdfPreview"; 

const VerifyModule = () => {
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lang, setLang] = useState<'id' | 'en'>('id');

  if (file) {
    return (
      <PdfPreview 
        file={file} 
        onBack={() => setFile(null)} 
        lang={lang} 
      />
    );
  }

  return (
    <div className="w-full flex justify-center items-start py-12 px-6 bg-[#F0F2F5] min-h-screen">
      <div className="w-full max-w-5xl flex flex-col">
        <Dropzone 
          lang={lang} 
          setLang={setLang} 
          errorMessage={errorMessage} // Kirim pesan ke Dropzone
          onUploadSuccess={(uploadedFile) => {
            setFile(uploadedFile);
            setErrorMessage(null);
          }}
          onUploadError={(message) => setErrorMessage(message)}
        />
        
        {/* HAPUS BLOK {errorMessage && ...} DI SINI! */}
        {/* Supaya tidak muncul dua kali di bawah kotak putih */}

      </div> 
    </div>
    
  );
};

export default VerifyModule;