  import { X, Check, FileText, ShieldCheck, History, Milestone, XCircle, FileCheck, Clock, Zap, } from "lucide-react";
  import { useState } from "react";

  interface VerifyModalProps {
    isOpen: boolean;
    onClose: () => void;
    status: 'no_signature' | 'untrusted' | 'valid_ideal';
    lang: 'id' | 'en';
    apiData: any[];
  }

  const reverseDN = (dn: string | undefined) => {
    if (!dn) return "-";
    // Memecah berdasarkan koma, membalik urutan, dan menggabungkannya kembali
    return dn.split(',').map(s => s.trim()).reverse().join(', ');
  };

  // Fungsi mengubah format tanggal menjadi: DD/MM/YYYY HH:mm:ss
const formatDate = (dateInput: any) => {
  if (!dateInput || dateInput === "-") return "-";
  
  try {
    // Jika inputnya angka (Unix Timestamp dari API kamu)
    const date = new Date(Number(dateInput));
    
    // Cek apakah tanggalnya valid
    if (isNaN(date.getTime())) return dateInput; 

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  } catch (e) {
    return dateInput;
  }
};

  export const VerifyModal = ({ isOpen, onClose, lang, apiData }: VerifyModalProps) => {
    const [selectedSignature, setSelectedSignature] = useState(0);

    if (!isOpen) return null;
    const activeSig = apiData && apiData[selectedSignature] ? apiData[selectedSignature] : null;

    const getField = (keys: string[]) => {
  if (!activeSig) return "-";
  
  // Ambil semua kunci yang ada di data API kamu
  const allKeys = Object.keys(activeSig);
  const subObj = activeSig["Details"] || activeSig["Certificate Information"] || {};
  const subKeys = Object.keys(subObj);

  for (const searchKey of keys) {
    // Normalisasi: buat jadi huruf kecil dan hapus spasi
    const normalizedSearch = searchKey.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Cari di level utama
    const foundKey = allKeys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedSearch);
    if (foundKey && activeSig[foundKey] && activeSig[foundKey] !== "-") return activeSig[foundKey];

    // Cari di dalam sub-objek (Details)
    const foundSubKey = subKeys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedSearch);
    if (foundSubKey && subObj[foundSubKey] && subObj[foundSubKey] !== "-") return subObj[foundSubKey];
  }
  return "-";
};

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
                    <div className="flex items-center justify-between w-full gap-2"> {/* Tambahkan gap-2 */}
                    <span className={`text-[11px] font-bold uppercase truncate flex-1 
                      ${isUntrusted ? 'text-[#F25F5C]' : 'text-gray-700'}`}>
                      {/* Logika Ringkas & Aman dari Eror Regexp */}
                      {(sig["SubjectDN"]?.includes('CN=') 
                          ? sig["SubjectDN"].split('CN=')[1].split(',')[0] 
                          : (sig["Signer "] || sig["Signer"] || "Signature " + (index + 1))
                      )}
                    </span>
                        
                    {/* Badge Status - Ubah rounded menjadi rounded-full */}
                    <span className={`text-[9px] px-3 py-0.5 rounded-full font-bold text-white whitespace-nowrap flex-shrink-0
                      ${isUntrusted ? 'bg-[#F25F5C]' : 'bg-[#48D1E0]'}`}>
                      Signature {index + 1}
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

                    const hashStatus = activeSig?.["File hash Validation"]?.toLowerCase() || "";
                    const isModified = hashStatus.includes("modified");
                    const hasAnnotation = hashStatus.includes("annotation") || hashStatus.includes("freetext");
                    const activeSigExpired = activeSig["Validity"]?.toLowerCase().includes("expired");
                    const activeSigHashInvalid = activeSig["File hash Validation"]?.toLowerCase().includes("invalid");

                    const hasIssue = activeSigUntrusted || 
                      activeSig["Validity"]?.toLowerCase().includes("expired") || 
                      activeSig["File hash Validation"]?.toLowerCase().includes("invalid");

                    // 1. Logika Integritas (Judul berubah otomatis)
                    let integrityTitle = "Dokumen belum di modifikasi";
                    let integrityValid = true;

                    if (isModified && hasAnnotation) {
                        integrityTitle = "Dokumen sudah di modifikasi dengan anotasi";
                        integrityValid = true; // Sesuai tiket: masih hijau tapi judul berubah
                    } else if (isModified) {
                        integrityTitle = "Dokumen di modifikasi dan isi dokumen sudah tidak dijamin integritasnya";
                        integrityValid = false; // Merah
                    }

                    // 2. Logika TSA (Judul Berubah jika Gagal)
                    const isTSAValid = activeSig?.["timestamp signature"]?.toLowerCase().includes("verified") || activeSig?.["TSA Info"] !== "-";
                    const tsaTitle = isTSAValid 
                        ? "Tanda tangan dilengkapi penanda waktu elektronik dari TSA berinduk" 
                        : "Tanda tangan tidak dilengkapi penanda waktu elektronik dari TSA berinduk";

                    // 3. Logika LTV (Judul Berubah jika Gagal)
                    const isLTVSupport = activeSig?.["LTV"]?.toLowerCase().includes("support");
                    const ltvTitle = isLTVSupport 
                        ? "Tanda tangan mendukung fitur LTV" 
                        : "Tanda tangan tidak mendukung fitur LTV";

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
                            <p className="text-[15px] leading-relaxed font-medium italic opacity-95">
                              {t.legal_basis}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* --- KONDISI 4: TAMPILAN VALID & TERPERCAYA (SEMUA HIJAU) --- */
                      <div className="flex flex-col gap-6 w-full animate-in slide-in-from-right-2 duration-300">
                        
                       <div className="flex flex-col gap-3">
                        {[
                          { text: integrityTitle, valid: integrityValid, icon: <FileCheck size={16} /> },
                          { text: "Dokumen dengan sertifikat digital terpercaya", valid: !hasIssue, icon: <ShieldCheck size={16} /> },
                          { text: tsaTitle, valid: isTSAValid, icon: <Clock size={16} /> },
                          { text: ltvTitle, valid: isLTVSupport, icon: <Zap size={16} /> }
                        ].map((item, i) => (
                        <div 
                          key={i} 
                          className={`flex items-start justify-between gap-4 p-3 rounded-md border flex-nowrap min-h-[44px]
                            ${item.valid ? 'bg-[#E0F2F1] border-teal-50' : 'bg-[#FDECEA] border-red-100'}`}
                        >
                          {/* Bagian Kiri: Ikon dan Teks */}
                          <div className={`flex items-start gap-3 flex-1 ${item.valid ? 'text-teal-900' : 'text-red-900'}`}>
                            <div className="mt-0.5 flex-shrink-0 opacity-70">
                              {item.icon}
                            </div>
                            <span className="text-[12px] font-medium leading-tight">
                              {item.text}
                            </span>
                          </div>

                          {/* Bagian Kanan: Kotak Centang/X */}
                          <div className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center mt-0.5
                            ${item.valid ? 'bg-[#00695C]' : 'bg-[#991B1B]'} text-white shadow-sm`}
                          >
                            {item.valid ? (
                              <Check size={14} strokeWidth={4} />
                            ) : (
                              <X size={14} strokeWidth={4} />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                        {/* 2. Informasi Penandatangan */}
                        <div className="flex flex-col gap-6 mt-6">
                          <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm relative">
                            {/* Tambahkan whitespace-nowrap agar angka 1 tidak turun */}
                            <span className="absolute -top-[27px] left-4 text-white text-[10px] font-bold px-4 py-0.5 rounded-full shadow-sm bg-[#48D1E0] whitespace-nowrap">
                              Signature {selectedSignature + 1}
                            </span>
                            <div className="grid grid-cols-[200px_1fr] gap-y-2 text-[12px]">
                              <div>Pemberi Tanda Tangan</div>
                              <div className="text-gray-800 flex gap-1">
                                <span className="flex-shrink-0">:</span>
                                <span className="break-all">
                                  {activeSig["SubjectDN"]?.split(',').find((s: any) => s.trim().startsWith('CN='))?.replace('CN=', '').trim() || activeSig["Signer "] || activeSig["Signer"] || "-"}
                                </span>
                              </div>
                              
                              <div>Alasan</div>
                              <div className="text-gray-800 flex gap-1">
                                <span className="flex-shrink-0">:</span>
                                <span className="break-all">{activeSig["Reason"] || activeSig["Alasan"] || "-"}</span>
                              </div>
                              
                              <div>Lokasi</div>
                              <div className="text-gray-800 flex gap-1">
                                <span className="flex-shrink-0">:</span>
                                <span className="break-all">{activeSig["Location"] || activeSig["Lokasi"] || "-"}</span>
                              </div>
                              
                              <div>Info TSA</div>
                              <div className="text-gray-800 flex gap-1">
                                <span className="flex-shrink-0">:</span>
                                <span className="break-all">{activeSig["TSA Info"] || "-"}</span>
                              </div>
                              
                              <div>Waktu Penandatanganan</div>
                              <div className="text-gray-800 flex gap-1">
                                <span className="flex-shrink-0">:</span>
                                <span className="break-all">
                                  {(() => {
                                    if (activeSig?.rootTimestamp) return formatDate(activeSig.rootTimestamp);
                                    const backupTime = getField(["timestamp", "stempel_waktu", "Signing Time", "timestamp signature"]);
                                    if (backupTime !== "-" && backupTime !== "verified") return formatDate(backupTime);
                                    return "-";
                                  })()}
                                </span>
                              </div>

                              <div>Stempel Waktu</div>
                              <div className="text-gray-800 flex gap-1">
                               <span className="flex-shrink-0">:</span>
                               <span className="break-all">{activeSig["stempel_waktu"] || "-"}</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-2">
                            <h3 className="text-[14px] font-bold text-gray-700 mb-3 uppercase tracking-wide">
                              {/* Gunakan variabel bantuan agar kode tidak panjang di JSX */}
                              {activeSig["SubjectDN"]?.split(',').find((s: string) => s.trim().startsWith('CN='))?.replace('CN=', '').trim() 
                                || activeSig["Signer "] 
                                || activeSig["Signer"]
                                || "DETAIL PENANDA TANGAN"}
                            </h3>
                            <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm grid grid-cols-[200px_1fr] gap-y-2 text-[12px] text-gray-600">
                              <div>Serial Number</div>
                              <div className="text-gray-800 flex gap-1">
                                <span className="flex-shrink-0">:</span>
                                <span className="break-all">{activeSig["Serial Number"] || activeSig["serial_number"] || "-"}</span>
                              </div>

                              <div>Valid Date</div>
                              <div className="text-gray-800 flex gap-1">
                                <span className="flex-shrink-0">:</span>
                                <span className="break-all">
                                  {(() => {
                                    const v = activeSig["Validity"] || "";
                                    if (v.includes("From") && v.includes("To")) {
                                      const parts = v.split(" To ");
                                     return `${formatDate(parts[0].replace("From ", ""))} - ${formatDate(parts[1])}`;
                                    }
                                    return formatDate(v);
                                  })()}
                                </span>
                              </div>
                                                          
                              <div>Signature Algorithm</div>
                              <div className="text-gray-800 flex gap-1">
                                <span className="flex-shrink-0">:</span>
                                <span className="break-all">{activeSig["Signature Algorithm"] || activeSig["signature_algorithm"] || "SHA256withRSA"}</span>
                              </div>
                              
                              <div>Common Name (CN)</div>
                              <div className="text-gray-800 flex gap-1">
                                <span className="flex-shrink-0">:</span>
                                <span className="break-all">
                                  {activeSig["SubjectDN"]?.split(',').find((s: string) => s.trim().startsWith('CN='))?.replace('CN=', '').trim() || activeSig["Signer"] || "-"}
                                </span>
                              </div>

                              <div>Issuer Distinguished Name</div>
                              <div className="text-gray-800 flex gap-1">
                                <span className="flex-shrink-0">:</span>
                                <span className="break-all">{reverseDN(activeSig["Issuer Distinguished Name"] || activeSig["Issuer"] || activeSig["issuer_dn"])}</span>
                              </div>
                              
                              <div>Subject Distinguished Name</div>
                              <div className="text-gray-800 flex gap-1">
                                <span className="flex-shrink-0">:</span>
                                <span className="break-all">{activeSig["SubjectDN"] || "-"}</span>
                              </div>
                              
                              <div>SHA-1 Fingerprint</div>
                              <div className="font-mono text-[11px] text-gray-800 flex gap-1">
                                <span className="flex-shrink-0">:</span>
                                <span className="break-all">{getField(["SHA-1 Fingerprint", "sha1", "fingerprint"])}</span>
                              </div>
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