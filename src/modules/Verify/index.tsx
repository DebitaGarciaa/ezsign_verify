"use client";

import { useState } from "react";
import { Dropzone } from "./components/Dropzone";
import { PdfPreview } from "./components/PdfPreview"; 

const VerifyModule = () => {
  const [file, setFile] = useState<File | null>(null);

  // 1. Logika untuk PDF Preview (TANPA PEMBATAS LEBAR)
  if (file) {
    return (
      <PdfPreview 
        file={file} 
        onBack={() => setFile(null)} 
      />
    );
  }

  // 2. Logika untuk Dropzone (DENGAN PEMBATAS LEBAR agar tetap rapi)
  return (
    <div className="w-full flex justify-center py-12 px-6 bg-[#F0F2F5] min-h-screen">
      <div className="w-full max-w-5xl">
        <Dropzone onUploadSuccess={(uploadedFile) => setFile(uploadedFile)} />
      </div>
    </div>
  );
};

export default VerifyModule;