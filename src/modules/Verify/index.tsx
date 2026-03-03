"use client";

import { useState } from "react";
import { Dropzone } from "./components/Dropzone";
import { PdfPreview } from "./components/PdfPreview"; 

const VerifyModule = () => {
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lang, setLang] = useState<'id' | 'en'>('id');
  
  // 1. TAMBAHKAN KEMBALI STATE INI
  const [apiData, setApiData] = useState<any[]>([]); 

  if (file) {
    return (
      <PdfPreview 
        file={file} 
        apiData={apiData} // 2. KIRIM DATA HASIL API KE SINI
        onBack={() => {
          setFile(null);
          setApiData([]); // Reset data saat balik
        }} 
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
          errorMessage={errorMessage}
          // 3. TANGKAP RESULT DARI DROPZONE
          onUploadSuccess={(uploadedFile, result) => {
            setFile(uploadedFile);
            setErrorMessage(null);
            // 4. PAKSA MASUKKAN DATA KE STATE
            setApiData((result as any).data || []); 
          }}
          onUploadError={(message) => setErrorMessage(message)}
        />
      </div> 
    </div>
  );
};

export default VerifyModule;