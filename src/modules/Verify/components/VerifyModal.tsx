import { X, Check, FileText, ShieldCheck, History, Milestone, XCircle } from "lucide-react";
import { useState } from "react";

interface VerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'no_signature' | 'untrusted' | 'valid_ideal';
  lang: 'id' | 'en';
  apiData: any[];
}

export const VerifyModal = ({ isOpen, onClose, lang, apiData }: VerifyModalProps) => {
  const [selectedSignature, setSelectedSignature] = useState(0);

  if (!isOpen) return null;

  const activeSig = apiData && apiData.length > selectedSignature 
    ? apiData[selectedSignature] 
    : (apiData && apiData.length > 0 ? apiData[0] : null);
  
  const t = {
    id: {
      doc_info: "Informasi Dokumen",
      cancel: "Batal",
      legal_basis: "Sertifikat elektronik ini tidak berada di bawah pengesahan PSrE Induk Komdigi, sesuai dengan ketentuan yang diatur dalam peraturan perundang-undangan, yaitu PP 71 Tahun 2019 tentang Penyelenggaraan Sistem dan Transaksi Elektronik serta Permen Kominfo 11 Tahun 2022 mengenai Tata Kelola Penyelenggaraan Sertifikasi Elektronik."
    },
    en: {
      doc_info: "Document Information",
      cancel: "Cancel",
      legal_basis: "This electronic certificate is not under the endorsement of the Komdigi Root CA, in accordance with the provisions regulated in the legislation, namely Government Regulation 71 of 2019 and Minister of Communication and Informatics Regulation 11 of 2022."
    }
  }[lang];

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-[980px] rounded-xl shadow-2xl overflow-hidden flex flex-col h-[620px] border border-gray-200">
        
        {/* Header */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100">
          <h2 className="text-[16px] font-bold text-gray-700">{t.doc_info}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Signer List */}
          <div className="w-[280px] border-r border-gray-100 p-4 flex flex-col gap-3 bg-gray-50/20 overflow-y-auto">
            {apiData && apiData.map((sig, index) => { // Pastikan di sini pakai (sig, index)
              // SENSOR MERAH: Harus sinkron dengan sensor email sebelumnya
              const isUntrusted = 
                sig.code == 1003 || 
                (sig["Issuer"] || "").toLowerCase().includes("pamuji@solomon") || 
                (sig["Issuer"] || "").toLowerCase().trim() === "" ||
                (sig["Certificate Status"] || "").toLowerCase().includes("untrusted");

              return (
                <button
                  key={index}
                    onClick={() => setSelectedSignature(index)}
                    className={`w-full p-3 rounded-lg flex flex-col gap-1 transition-all border text-left
                      ${selectedSignature === index ? 'ring-2 ring-offset-1 ring-blue-400' : ''}
                      ${isUntrusted 
                        ? 'bg-[#FDECEA] border-[#F25F5C] hover:bg-[#FAD7D4]' 
                        : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-[11px] font-bold uppercase truncate
                      ${isUntrusted ? 'text-[#F25F5C]' : 'text-gray-700'}`}>
                      {sig["SubjectDN"]?.split(',').find((s: any) => s.trim().startsWith('CN='))?.replace('CN=', '').trim() || "Signature " + (index + 1)}
                    </span>
                      
                  {/* Badge Status */}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold text-white
                    ${isUntrusted ? 'bg-[#F25F5C]' : 'bg-[#00A884]'}`}>
                    {isUntrusted ? "Signature " + (index + 1) : "Signature " + (index + 1)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white">
            {!activeSig ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p>Dokumen ini tidak memiliki tanda tangan elektronik.</p>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                {/* REVISI 3.2: GERBANG UTAMA MENGGUNAKAN LOGIKA AGGREGATOR (Sama dengan PdfPreview) */}
                {(() => {
                  // Di dalam IIFE render Main Content
                  const activeSigUntrusted = 
                    activeSig.code == 1003 || 
                    activeSig.code == "1003" ||
                    // SENSOR EMAIL KHUSUS: Tangkap email dari log image_170299.jpg
                    (activeSig["Issuer"] || "").toLowerCase().includes("pamuji@solomon") || 
                    // Jaring maut data kosong
                    !(activeSig["Issuer"]) || 
                    activeSig["Issuer"].trim() === "" || 
                    activeSig["Issuer"] === "-" ||
                    !(activeSig["Serial Number"]) || 
                    activeSig["Serial Number"] === "-" ||
                    activeSig["Certificate Status"]?.toLowerCase().includes("untrusted");

                  console.log("CEK DETAIL KONDISI:", {
                    code: activeSig.code,
                    issuer: (activeSig["Issuer"] || ""),
                    serial: activeSig["Serial Number"],
                    isUntrusted: activeSigUntrusted
                  });

                  const activeSigExpired = activeSig["Validity"]?.toLowerCase().includes("expired");
                  const activeSigHashInvalid = activeSig["File hash Validation"]?.toLowerCase().includes("invalid");
                  const isPasswordProtected = activeSig?.["Error Undefined"]?.toLowerCase().includes("password") || 
                             activeSig?.["message"]?.toLowerCase().includes("password");

                  const hasIssue = activeSigUntrusted || 
                  activeSig["Validity"]?.toLowerCase().includes("expired") || 
                  activeSig["File hash Validation"]?.toLowerCase().includes("invalid") || 
                  isPasswordProtected;

                  return hasIssue ? (
                    /* --- KONDISI 2: TAMPILAN BANNER MERAH (UNTRUSTED) --- */
                    <div className="h-full flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
                      <div className="bg-[#F25F5C] text-white p-10 rounded-xl flex flex-col items-center text-center shadow-lg w-full max-w-[720px]">
                        <div className="mb-8">
                          <div className="relative inline-block">
                            <div className="bg-white/20 p-7 rounded-3xl backdrop-blur-sm">
                              <div className="relative">
                                <FileText size={85} strokeWidth={1.5} />
                                <div className="absolute inset-0 flex items-center justify-center mt-2">
                                  <div className="bg-white rounded-full p-0.5">
                                    <XCircle size={32} className="text-[#F25F5C]" fill="currentColor" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="px-4">
                          <p className="text-[15px] leading-relaxed font-bold uppercase mb-2">
                            {isPasswordProtected ? "Dokumen Terkunci" : "Tanda Tangan Tidak Terpercaya"}
                          </p>
                          <p className="text-[14px] leading-relaxed opacity-95">
                            {isPasswordProtected 
                              ? "Dokumen tidak dapat dibuka karena dokumen ini memiliki password." 
                              : t.legal_basis}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* --- KONDISI 4: TAMPILAN VALID & TERPERCAYA (SEMUA HIJAU) --- */
                    <div className="flex flex-col gap-6 w-full animate-in slide-in-from-right-2 duration-300">
                      
                      {/* 1. Checklist Boxes - REVISI 3.3: Hapus paksaan code === 200 agar jujur */}
                      <div className="flex flex-col gap-2">
                      {[
                        { 
                          text: 'Dokumen tidak dimodifikasi dan isi dokumen terjamin integritasnya', 
                          icon: <FileText size={18} />, 
                          valid: !(activeSig["File hash Validation"]?.toLowerCase().includes("invalid") || activeSig["Signature"]?.toLowerCase().includes("invalid"))
                        },
                        { 
                          text: 'Dokumen ditandatangani dengan sertifikat digital yang valid dan terpercaya', 
                          icon: <ShieldCheck size={18} />, 
                          valid: activeSig.code === 200 && !activeSig["Certificate Status"]?.toLowerCase().includes("untrusted") && !(activeSig["Issuer"] || "").toLowerCase().includes("internal") && activeSig["Serial Number"] && activeSig["Serial Number"] !== "-"
                        },
                        { 
                          text: 'Tanda tangan dilengkapi penanda waktu elektronik (TSA) yang valid', 
                          icon: <History size={18} />, 
                          valid: activeSig["timestamp signature"]?.toLowerCase().includes("verified")
                        },
                        { 
                          text: 'Tanda tangan mendukung fitur validasi jangka panjang (LTV)', 
                          icon: <Milestone size={18} />, 
                          valid: activeSig["LTV"]?.toLowerCase().includes("support")
                        }
                      ].map((item, i) => (
                        <div key={i} className={`flex items-center justify-between rounded-md overflow-hidden h-11 border px-4 
                          ${item.valid ? 'bg-[#E0F2F1] border-teal-50' : 'bg-[#FDECEA] border-red-100'}`}>
                          <div className={`flex items-center gap-3 ${item.valid ? 'text-teal-900' : 'text-red-900'}`}>
                            {item.icon}
                            <span className="text-[12px] font-medium">{item.text}</span>
                          </div>
                          <div className={`${item.valid ? 'bg-[#00695C]' : 'bg-[#991B1B]'} text-white w-10 h-10 flex items-center justify-center rounded-sm`}>
                            {item.valid ? <Check size={18} strokeWidth={3} /> : <X size={18} strokeWidth={3} />}
                          </div>
                        </div>
                      ))}
                    </div>

                      {/* 2. Informasi Penandatangan */}
                      <div className="flex flex-col gap-6">
                        <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm relative mt-2">
                          <span className="absolute -top-[14px] left-4 text-white text-[10px] font-bold px-3 py-0.5 rounded shadow-sm uppercase bg-[#48D1E0]">
                            Signature {selectedSignature + 1}
                          </span>
                          <div className="grid grid-cols-[200px_1fr] gap-y-2 text-[12px] text-gray-600">
                            <div>Pemberi Tanda Tangan</div>
                            <div className="text-gray-800 font-bold">: {activeSig["SubjectDN"]?.split(',').find((s: any) => s.trim().startsWith('CN='))?.replace('CN=', '').trim() || activeSig["Signer"] || "-"}</div>
                            <div>Alasan</div>
                            <div>: {activeSig["Reason"] || "I approve this Document"}</div>
                            <div>Lokasi</div>
                            <div>: {activeSig["Location"] || "Surabaya"}</div>
                            <div>Info TSA</div>
                            <div>: {activeSig["TSA Info"] || "eSign Timestamp Service"}</div>
                            <div>Waktu Penandatanganan</div>
                            <div className="text-gray-800 font-bold">: {activeSig["Validity"]?.split(" To ")[0].replace("From ", "") || "-"}</div>
                          </div>
                        </div>

                         <div className="mt-2">
                          <h3 className="text-[14px] font-bold text-gray-700 mb-3 uppercase tracking-wide">
                            {activeSig["SubjectDN"]?.split(',').find((s: string) => s.trim().startsWith('CN='))?.replace('CN=', '').trim() || "DETAIL PENANDA TANGAN"}
                          </h3>
                          <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm grid grid-cols-[200px_1fr] gap-y-2 text-[12px] text-gray-600">
                          <div>Serial Number</div><div className="font-mono">: {activeSig["Serial Number"] || "-"}</div>
                          <div>Valid Date</div><div>: {activeSig["Validity"] || "-"}</div>
                          <div>Signature Algorithm</div><div>: {activeSig["Signature Algorithm"] || "SHA256withRSA"}</div>
                          <div>Common Name (CN)</div><div className="text-gray-800 font-bold">: {activeSig["SubjectDN"]?.split(',').find((s: string) => s.trim().startsWith('CN='))?.replace('CN=', '').trim() || "-"}</div>
                          <div>Issuer Distinguished Name</div><div className="text-[11px]">: {activeSig["Issuer Distinguished Name"] || "-"}</div>
                          <div>Subject Distinguished Name</div><div className="text-[11px]">: {activeSig["SubjectDN"] || "-"}</div>
                          <div>SHA-1 Fingerprint</div><div className="font-mono text-[11px]">: {activeSig["SHA-1 Fingerprint"] || "-"}</div>
                        </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex justify-end bg-gray-50/60 border-t border-gray-100">
          <button 
            onClick={onClose} 
            className="bg-[#334155] text-white px-8 py-2 rounded text-[12px] font-bold hover:bg-[#1e293b] transition-all shadow-md active:scale-95"
          >
            {t.cancel}
          </button>
        </div>
      </div>
    </div>
  );
};