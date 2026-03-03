"use client";

import { useState } from "react";
import { Dropzone } from "./components/Dropzone";
import { PdfPreview } from "./components/PdfPreview"; 

const VerifyModule = () => {
  const [file, setFile] = useState<File | null>(null);
  // 1. TAMBAHKAN INI: State untuk menyimpan hasil dari Jasuindo
  const [apiData, setApiData] = useState<any[]>([]); 

  if (file) {
    return (
      <PdfPreview 
        file={file} 
        apiData={apiData} // 2. KIRIM DATA KE PREVIEW agar centang hijau bisa muncul
        onBack={() => {
          setFile(null);
          setApiData([]); // Reset data saat balik
        }} 
      />
    );
  }

  return (
    <div className="w-full flex justify-center py-12 px-6 bg-[#F0F2F5] min-h-screen">
      <div className="w-full max-w-5xl">
        {/* 3. TANGKAP HASILNYA: Ambil data signatures dari result */}
        <Dropzone onUploadSuccess={(uploadedFile, result) => {
          setFile(uploadedFile);
          setApiData((result as any).data || []);
        }} />
      </div>
    </div>
  );
};

export default VerifyModule;