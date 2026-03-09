'use client';

import { Check, X, AlertCircle, FileCheck, ShieldCheck, Clock, Zap, FileText } from "lucide-react";  import { useState } from "react";
  import { useTranslation } from 'react-i18next';

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
  const formatDate = (dateInput: any, lang: 'id' | 'en') => {
    if (!dateInput || dateInput === "-") return "-";
    
    try {
      // 1. Coba ubah ke angka dulu
      let date = new Date(Number(dateInput));
      
      // 2. Kalau gagal (karena isinya teks seperti "Wed Jul 30... WIB")
      if (isNaN(date.getTime())) {
        // Kita buang teks "WIB" atau "GMT" agar sistem bisa baca tanggalnya saja
        const cleanedInput = String(dateInput).replace(/WIB|GMT|UTC/g, '').trim(); 
        date = new Date(cleanedInput); 
      }

      // 3. Kalau setelah dibersihkan tetap tidak valid, kembalikan teks asli
      if (isNaN(date.getTime())) return dateInput; 

      // 4. Tampilkan sesuai bahasa yang dipilih (Dinamis Inggris/Indo)
      return new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-US', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(date).replace(/\./g, ':');
    } catch (e) {
      return dateInput;
    }
  };

  // Fungsi pembantu agar kodingan rapi
  const formatWithIntl = (date: Date, lang: 'id' | 'en') => {
    return new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-US', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date).replace(/\./g, ':');
  };

  export const VerifyModal = ({ isOpen, onClose, status, lang, apiData }: VerifyModalProps) => {
    const [selectedSignature, setSelectedSignature] = useState(0);
    const { t, i18n } = useTranslation('common');

    if (!isOpen) return null;
    const activeSig = apiData && apiData[selectedSignature] ? apiData[selectedSignature] : null;

    const normalizeKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

    const hasValue = (value: any) => (
      value !== "-" && value !== "" && value !== null && value !== undefined
    );

    const toStatusText = (value: any) => {
      if (!hasValue(value)) return "";
      if (typeof value === "boolean") return value ? "true" : "false";
      if (typeof value === "number") return String(value);
      return String(value).toLowerCase().trim();
    };

    const isSignatureUntrusted = (sig: any) => {
      if (!sig || typeof sig !== 'object') return false;
      const certStatusText = toStatusText(sig["Certificate Status"]);
      return (
        sig.code == 1003 ||
        sig.code == "1003" ||
        (sig["Issuer"] || "").toLowerCase().includes("pamuji@solomon") ||
        certStatusText.includes("untrusted") ||
        certStatusText.includes("revoked") ||
        certStatusText.includes("invalid")
      );
    };

    const getField = (keys: string[]) => {
      if (!activeSig) return "-";
      
      // Function rekursif untuk mencari di nested object
      const searchInObject = (obj: any, searchKey: string): any => {
        if (!obj || typeof obj !== 'object') return null;
        
        const normalizedSearch = normalizeKey(searchKey);
        
        // Cari di level ini
        for (const key of Object.keys(obj)) {
          const normalizedKey = normalizeKey(key);
          if (normalizedKey === normalizedSearch) {
            const value = obj[key];
            if (hasValue(value)) {
              return value;
            }
          }
        }
        
        // Cari di nested objects
        for (const key of Object.keys(obj)) {
          if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            const result = searchInObject(obj[key], searchKey);
            if (result) return result;
          }
        }
        
        return null;
      };

      // Coba setiap key yang diminta
      for (const searchKey of keys) {
        const result = searchInObject(activeSig, searchKey);
        if (result) {
          console.log(`✅ Found "${searchKey}":`, result);
          return result;
        }
      }
      
      console.log(`❌ Not found for keys:`, keys);
      return "-";
    };
    const labels = {
      id: {
        doc_info: "Informasi Dokumen",
        cancel: "Batal",
        legal_basis: "Sertifikat elektronik ini tidak berada di bawah pengesahan PSrE Induk Komdigi, sesuai dengan ketentuan yang diatur dalam peraturan perundang-undangan, yaitu PP 71 Tahun 2019 tentang Penyelenggaraan Sistem dan Transaksi Elektronik serta Permen Kominfo 11 Tahun 2022 mengenai Tata Kelola Penyelenggaraan Sertifikasi Elektronik.",
        integrity_ok: "Dokumen belum di modifikasi",
        integrity_annotated: "Dokumen sudah di modifikasi dengan anotasi",
        integrity_failed: "Dokumen di modifikasi dan isi dokumen sudah tidak dijamin integritasnya",
        trusted_cert: "Dokumen dengan sertifikat digital terpercaya",
        trusted_cert_failed: "Dokumen dengan sertifikat digital tidak terpercaya",
        tsa_valid: "Tanda tangan dilengkapi penanda waktu elektronik dari TSA berinduk",
        tsa_failed: "Tanda tangan tidak dilengkapi penanda waktu elektronik dari TSA berinduk",
        ltv_valid: "Tanda tangan mendukung fitur LTV",
        ltv_failed: "Tanda tangan tidak mendukung fitur LTV",

        signer: "Pemberi Tanda Tangan",
        reason: "Alasan",
        location: "Lokasi",
        tsa_info: "Info TSA",
        signing_time: "Waktu Penandatanganan",
        timestamp: "Stempel Waktu",

        detail_title: "DETAIL PENANDA TANGAN",
        serial_number: "Nomor Seri",
        validity_period: "Masa Berlaku",
        sig_algorithm: "Algoritma Tanda Tangan",
        common_name: "Nama Umum (CN)",
        verified_issuer: "Nama Penerbit Terverifikasi",
        verified_subject: "Nama Subjek Terverifikasi",
        sha1_fingerprint: "Sidik Jari SHA-1",
      },
      en: {
        doc_info: "Document Information",
        cancel: "Cancel",
        legal_basis: "This electronic certificate is not under the approval of the Komdigi Main PSrE, in accordance with the provisions stipulated in the laws and regulations, namely PP 71 of 2019 concerning the Implementation of Electronic Systems and Transactions and Permen Kominfo 11 of 2022 concerning the Governance of the Implementation of Electronic Certification.",
        integrity_ok: "Document has not been modified",
        integrity_annotated: "Document has been modified with annotations",
        integrity_failed: "Document modified and content integrity is no longer guaranteed",
        trusted_cert: "Document with trusted digital certificate",
        trusted_cert_failed: "Document with untrusted digital certificate",
        tsa_valid: "Signature is equipped with electronic time stamp from root TSA",
        tsa_failed: "Signature is not equipped with electronic time stamp from root TSA",
        ltv_valid: "Signature supports LTV feature",
        ltv_failed: "Signature does not support LTV feature",

        signer: "Signer",
        reason: "Reason",
        location: "Location",
        tsa_info: "TSA Info",
        signing_time: "Signing Time",
        timestamp: "Timestamp",

        detail_title: "SIGNER DETAILS",
        serial_number: "Serial Number",
        validity_period: "Validity Period",
        sig_algorithm: "Signature Algorithm",
        common_name: "Common Name (CN)",
        verified_issuer: "Verified Issuer Name",
        verified_subject: "Verified Subject Name",
        sha1_fingerprint: "SHA-1 Fingerprint",
      }
    }[lang] || {};// Bagian [lang] ini KUNCI agar dia update otomatis!

    const showOnlyRedBox = status === 'no_signature';

    return (
      <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-[980px] rounded-xl shadow-2xl overflow-hidden flex flex-col h-[620px] border border-gray-200">
          
          {/* Header */}
          <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100">
            <h2 className="text-[16px] font-bold text-gray-700">{labels.doc_info}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {showOnlyRedBox ? (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white">
                <div className="h-full flex items-center justify-center animate-in fade-in zoom-in duration-300">
                  <div className="bg-[#F25F5C] text-white p-10 rounded-xl flex flex-col items-center text-center shadow-lg w-full max-w-[720px] border border-[#F25F5C]/20">
                    <div className="mb-8 relative inline-block bg-white/10 p-10 rounded-[40px] backdrop-blur-md border border-white/20">
                      <FileText size={100} strokeWidth={1} className="opacity-90" />
                      <div className="absolute -left-4 -bottom-4 bg-white rounded-full p-1 shadow-xl">
                        <div className="bg-[#F25F5C] rounded-full p-1.5 flex items-center justify-center">
                          <X size={28} className="text-white" strokeWidth={3} />
                        </div>
                      </div>
                    </div>
                    <p className="text-[15px] leading-relaxed font-medium italic opacity-95">{labels.legal_basis}</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Sidebar Signer List */}
                <div className="w-[280px] border-r border-gray-100 p-4 flex flex-col gap-3 bg-gray-50/20 overflow-y-auto">
                  {apiData && apiData.map((sig, index) => {
                    const isUntrusted = isSignatureUntrusted(sig);

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
                        <div className="flex items-center justify-between w-full gap-2">
                          <span className={`text-[11px] font-bold uppercase truncate flex-1 
                            ${isUntrusted ? 'text-[#F25F5C]' : 'text-gray-700'}`}>
                            {(sig["SubjectDN"]?.includes('CN=') 
                                ? sig["SubjectDN"].split('CN=')[1].split(',')[0] 
                                : (sig["Signer "] || sig["Signer"] || "Signature " + (index + 1))
                            )}
                          </span>
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
                  {(() => {
                    const hasKeyword = (text: string, keyword: string) => {
                      if (!text || !keyword) return false;
                      return text.includes(keyword);
                    };

                    const certificateStatusText = toStatusText(activeSig["Certificate Status"]);
                    const activeSigUntrusted = 
                      activeSig.code == 1003 || 
                      activeSig.code == "1003" ||
                      (activeSig["Issuer"] || "").toLowerCase().includes("pamuji@solomon") || 
                      hasKeyword(certificateStatusText, "untrusted") ||
                      hasKeyword(certificateStatusText, "revoked") ||
                      hasKeyword(certificateStatusText, "invalid");

                    console.log("CEK DETAIL KONDISI:", {
                      code: activeSig.code,
                      issuer: (activeSig["Issuer"] || ""),
                      serial: activeSig["Serial Number"],
                      isUntrusted: activeSigUntrusted
                    });

                    // ========== DEBUG: LIHAT STRUKTUR DATA LENGKAP ==========
                    console.log("🔍 FULL activeSig DATA:", JSON.stringify(activeSig, null, 2));
                    console.log("🔍 ALL KEYS:", Object.keys(activeSig));

                    if (activeSigUntrusted) {
                      return (
                        <div className="h-full flex items-center justify-center animate-in fade-in zoom-in duration-300">
                          <div className="bg-[#F25F5C] text-white p-10 rounded-xl flex flex-col items-center text-center shadow-lg w-full max-w-[720px] border border-[#F25F5C]/20">
                            <div className="mb-8 relative inline-block bg-white/10 p-10 rounded-[40px] backdrop-blur-md border border-white/20">
                              <FileText size={100} strokeWidth={1} className="opacity-90" />
                              <div className="absolute -left-4 -bottom-4 bg-white rounded-full p-1 shadow-xl">
                                <div className="bg-[#F25F5C] rounded-full p-1.5 flex items-center justify-center">
                                  <X size={28} className="text-white" strokeWidth={3} />
                                </div>
                              </div>
                            </div>
                            <p className="text-[15px] leading-relaxed font-medium italic opacity-95">{labels.legal_basis}</p>
                          </div>
                        </div>
                      );
                    }

                    // ============ LOGIKA PINTAR UNTUK MEMBACA KONDISI PDF ============
                    
                    // 1️⃣ INTEGRITAS DOKUMEN (Hijau/Orange/Merah)
                    const hashValidationRaw = getField([
                      "File hash Validation", 
                      "file_hash", 
                      "hash_status", 
                      "hash_validation", 
                      "document_integrity",
                      "integrity_status",
                      "validation_status",
                      "integrity"
                    ]);

                    const hashValidation = toStatusText(hashValidationRaw);
                    
                    console.log("🔍 Hash Validation:", hashValidation);
                    
                    // Deteksi apakah dokumen dimodifikasi
                    const hasHashValidationField = hasValue(hashValidationRaw);
                    const isModified = hasHashValidationField && (
                      hasKeyword(hashValidation, "modified") || 
                      hasKeyword(hashValidation, "changed") || 
                      hasKeyword(hashValidation, "altered") ||
                      hasKeyword(hashValidation, "dimodifikasi")
                    );
                    
                    // Deteksi apakah hanya anotasi/coretan ringan (ORANGE)
                    const hasAnnotation = isModified && (
                      hasKeyword(hashValidation, "annotation") || 
                      hasKeyword(hashValidation, "freetext") || 
                      hasKeyword(hashValidation, "markup") ||
                      hasKeyword(hashValidation, "comment") ||
                      hasKeyword(hashValidation, "anotasi")
                    );
                    
                    // Deteksi modifikasi berat yang merusak integritas (MERAH)
                    const isHeavyModified = isModified && !hasAnnotation;
                    
                    console.log("🔍 Integrity Check:", { isModified, hasAnnotation, isHeavyModified });
                    
                    // 2️⃣ SERTIFIKAT (Hijau/Orange)
                    // Sudah ditangani oleh activeSigUntrusted di atas
                    
                    // 3️⃣ TSA (Hijau/Orange)
                    const tsaSignatureRaw = getField([
                      "timestamp signature", 
                      "tsa_signature", 
                      "tsa_status",
                      "timestampSignature",
                      "timestamp_validation",
                      "tsa_validation",
                      "Timestamp Signature"
                    ]);

                    const tsaSignature = toStatusText(tsaSignatureRaw);
                    
                    const tsaInfo = getField([
                      "TSA Info", 
                      "tsa_info", 
                      "timestamp_authority", 
                      "tsa",
                      "TSAInfo",
                      "tsa_name",
                      "Timestamp Authority"
                    ]);

                    const tsaInfoText = toStatusText(tsaInfo);
                    
                    console.log("🔍 TSA Data:", { tsaSignature, tsaInfo });
                    
                    const tsaNegative =
                      hasKeyword(tsaSignature, "not") ||
                      hasKeyword(tsaSignature, "failed") ||
                      hasKeyword(tsaSignature, "invalid") ||
                      hasKeyword(tsaSignature, "untrusted") ||
                      hasKeyword(tsaSignature, "false") ||
                      hasKeyword(tsaInfoText, "not") ||
                      hasKeyword(tsaInfoText, "failed") ||
                      hasKeyword(tsaInfoText, "invalid");

                    const tsaPositive =
                      hasKeyword(tsaSignature, "verified") || 
                      hasKeyword(tsaSignature, "valid") || 
                      hasKeyword(tsaSignature, "trusted") ||
                      hasKeyword(tsaSignature, "terverifikasi") ||
                      hasKeyword(tsaSignature, "ok") ||
                      hasKeyword(tsaSignature, "true");

                    const isTSAValid =
                      (hasValue(tsaSignatureRaw) && !tsaNegative && tsaPositive) ||
                      (hasValue(tsaInfo) && String(tsaInfo).length > 5 && !tsaNegative);
                    
                    // 4️⃣ LTV (Hijau/Orange)
                    const ltvStatusRaw = getField([
                      "LTV", 
                      "ltv_support", 
                      "long_term_validation", 
                      "ltv_enabled",
                      "LTV Support",
                      "ltv_status",
                      "LTV Status",
                      "ltv_validation",
                      "is_ltv",
                      "isLTVEnabled"
                    ]);

                    const ltvStatus = toStatusText(ltvStatusRaw);
                    
                    console.log("🔍 LTV Status:", ltvStatus);
                    
                    const isLTVSupport = hasValue(ltvStatusRaw) && (
                      !hasKeyword(ltvStatus, "not") &&
                      !hasKeyword(ltvStatus, "false") &&
                      !hasKeyword(ltvStatus, "no ") &&
                      (
                        hasKeyword(ltvStatus, "support") || 
                        hasKeyword(ltvStatus, "enabled") || 
                        hasKeyword(ltvStatus, "yes") ||
                        hasKeyword(ltvStatus, "true") ||
                        hasKeyword(ltvStatus, "mendukung") ||
                        hasKeyword(ltvStatus, "valid") ||
                        hasKeyword(ltvStatus, "ok")
                      )
                    );

                    // ============ DAFTAR STATUS ITEMS UNTUK CEKLIS ============
                    const statusItems = [
                      { 
                        // ✅ CEKLIS 1: INTEGRITAS DOKUMEN (Hijau/Orange/Merah)
                        text: !isModified 
                          ? labels.integrity_ok                    // HIJAU: File asli, belum dimodifikasi
                          : (hasAnnotation 
                              ? labels.integrity_annotated         // ORANGE: Ada coretan/anotasi ringan
                              : labels.integrity_failed),          // MERAH: Dimodifikasi berat, integritas rusak
                        
                        valid: !isHeavyModified,                   // valid=false hanya untuk MERAH
                        isWarning: isModified && hasAnnotation,    // isWarning=true untuk ORANGE
                        icon: <FileCheck size={16} />
                      },
                      { 
                        // ✅ CEKLIS 2: SERTIFIKAT DIGITAL (Hijau/Orange)
                        text: !activeSigUntrusted 
                          ? labels.trusted_cert                    // HIJAU: Sertifikat terpercaya
                          : labels.trusted_cert_failed,            // ORANGE: Sertifikat tidak terpercaya
                        
                        valid: !activeSigUntrusted,
                        isWarning: activeSigUntrusted,             // ORANGE jika untrusted
                        icon: <ShieldCheck size={16} />
                      },
                      { 
                        // ✅ CEKLIS 3: TSA (Hijau/Orange)
                        text: isTSAValid 
                          ? labels.tsa_valid                       // HIJAU: Ada TSA berinduk
                          : labels.tsa_failed,                     // ORANGE: Tidak ada TSA
                        
                        valid: isTSAValid,
                        isWarning: !isTSAValid,                    // ORANGE jika tidak ada TSA
                        icon: <Clock size={16} /> 
                      },
                      { 
                        // ✅ CEKLIS 4: LTV (Hijau/Orange)
                        text: isLTVSupport 
                          ? labels.ltv_valid                       // HIJAU: Mendukung LTV
                          : labels.ltv_failed,                     // ORANGE: Tidak mendukung LTV
                        
                        valid: isLTVSupport,
                        isWarning: !isLTVSupport,                  // ORANGE jika tidak support LTV
                        icon: <Zap size={16} />
                      }
                    ]; 
                    return (
                      <>
                        <div className="flex flex-col gap-6 w-full animate-in slide-in-from-right-2 duration-300">
                          <div className="flex flex-col gap-3">
                            {statusItems.map((item, i) => (
                              <div 
                                key={i} 
                                className={`flex items-start justify-between gap-4 p-3 rounded-md border flex-nowrap min-h-[44px]
                                  ${item.isWarning 
                                    ? 'bg-[#FFF3E0] border-orange-100'
                                    : item.valid 
                                      ? 'bg-[#E0F2F1] border-teal-50'
                                      : 'bg-[#FDECEA] border-red-100'}`}
                              >
                                {/* Bagian Kiri: Ikon dan Teks */}
                                <div className={`flex items-start gap-3 flex-1 
                                  ${item.isWarning 
                                    ? 'text-orange-900'
                                    : item.valid 
                                      ? 'text-teal-900'
                                      : 'text-red-900'}`}
                                >
                                  <div className="mt-0.5 flex-shrink-0 opacity-70">
                                    {item.icon}
                                  </div>
                                  <span className="text-[12px] font-medium leading-tight">
                                    {item.text}
                                  </span>
                                </div>

                                {/* Bagian Kanan: Icon Status (Ceklis/Warning/Error) */}
                                <div className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center mt-0.5 shadow-sm text-white
                                  ${item.isWarning 
                                    ? 'bg-orange-500'
                                    : item.valid 
                                      ? 'bg-[#00695C]'
                                      : 'bg-[#991B1B]'}`}
                                >       
                                  {item.isWarning ? (
                                    <AlertCircle size={14} strokeWidth={4} />
                                  ) : item.valid ? (
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
                              <span className="absolute -top-[27px] left-4 text-white text-[10px] font-bold px-4 py-0.5 rounded-full shadow-sm bg-[#48D1E0] whitespace-nowrap">
                                Signature {selectedSignature + 1}
                              </span>
                              <div className="grid grid-cols-[200px_1fr] gap-y-2 text-[12px]">
                                <div>{labels.signer}</div>
                                <div className="text-gray-800 flex gap-1">
                                  <span className="flex-shrink-0">:</span>
                                  <span className="break-all">
                                    {(() => {
                                      // Coba berbagai cara untuk mendapatkan nama signer
                                      const subjectDN = activeSig["SubjectDN"] || activeSig["subjectDN"] || activeSig["Subject"];
                                      console.log("🔍 SubjectDN:", subjectDN);
                                      
                                      if (subjectDN && subjectDN.includes('CN=')) {
                                        return subjectDN.split('CN=')[1].split(',')[0].trim();
                                      }
                                      
                                      // Fallback langsung
                                      const directSigner = activeSig["Signer"] || activeSig["Signer "] || activeSig["signer_name"];
                                      if (directSigner && directSigner !== "-") return directSigner;
                                      
                                      // Gunakan getField sebagai last resort
                                      const result = getField([
                                        "Signer", 
                                        "Signer ", 
                                        "signer_name", 
                                        "Penandatangan",
                                        "Common Name",
                                        "CN",
                                        "name",
                                        "penandatangan"
                                      ]);
                                      
                                      return result !== "-" ? result : "-";
                                    })()}
                                  </span>
                                </div>
                                
                                <div>{labels.reason}</div>
                                <div className="text-gray-800 flex gap-1">
                                  <span className="flex-shrink-0">:</span>
                                  <span className="break-all">
                                    {(() => {
                                      const direct = activeSig["Reason"] || activeSig["Alasan"] || activeSig["reason"];
                                      return direct && direct !== "-" ? direct : getField(["Reason", "Alasan", "reason", "signing_reason"]);
                                    })()}
                                  </span>
                                </div>
                                
                                <div>{labels.location}</div>
                                <div className="text-gray-800 flex gap-1">
                                  <span className="flex-shrink-0">:</span>
                                  <span className="break-all">
                                    {(() => {
                                      const direct = activeSig["Location"] || activeSig["Lokasi"] || activeSig["location"];
                                      return direct && direct !== "-" ? direct : getField(["Location", "Lokasi", "location", "signing_location"]);
                                    })()}
                                  </span>
                                </div>
                                
                                <div>{labels.tsa_info}</div>
                                <div className="text-gray-800 flex gap-1">
                                  <span className="flex-shrink-0">:</span>
                                  <span className="break-all">
                                    {(() => {
                                      const direct = activeSig["TSA Info"] || activeSig["tsa_info"];
                                      return direct && direct !== "-" ? direct : getField(["TSA Info", "tsa_info", "timestamp_authority", "tsa", "TSAInfo"]);
                                    })()}
                                  </span>
                                </div>
                                
                                <div>{labels.signing_time}</div>
                                <div className="text-gray-800 flex gap-1">
                                  <span className="flex-shrink-0">:</span>
                                  <span className="break-all">
                                    {(() => {
                                      // Cari waktu penandatanganan dari berbagai field
                                      if (activeSig?.rootTimestamp) return formatDate(activeSig.rootTimestamp, lang);
                                      
                                      const direct = activeSig["Signing Time"] || activeSig["signing_time"];
                                      if (direct && direct !== "-") return formatDate(direct, lang);
                                      
                                      const timeField = getField([
                                        "Signing Time",
                                        "signing_time",
                                        "timestamp", 
                                        "stempel_waktu", 
                                        "timestamp signature",
                                        "Waktu Penandatanganan",
                                        "waktu"
                                      ]);
                                      
                                      if (timeField !== "-" && timeField !== "verified" && timeField !== "Verified") {
                                        return formatDate(timeField, lang);
                                      }
                                      return "-";
                                    })()}
                                  </span>
                                </div>

                                <div>{labels.timestamp}</div>
                                <div className="text-gray-800 flex gap-1">
                                  <span className="flex-shrink-0">:</span>
                                  <span className="break-all">
                                    {(() => {
                                      const direct = activeSig["stempel_waktu"] || activeSig["Stempel Waktu"];
                                      return direct && direct !== "-" ? direct : getField(["stempel_waktu", "Stempel Waktu", "timestamp", "time_stamp"]);
                                    })()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-2">
                              <h3 className="text-[14px] font-bold text-gray-700 mb-3 uppercase tracking-wide">
                                {/* Judul Detail yang sekarang dinamis */}
                                {(() => {
                                  const subjectDN = activeSig["SubjectDN"];
                                  if (subjectDN?.includes('CN=')) {
                                    return subjectDN.split('CN=')[1].split(',')[0].trim();
                                  }
                                  return getField([
                                    "Signer", 
                                    "Signer ", 
                                    "signer_name", 
                                    "Penandatangan",
                                    "Common Name"
                                  ]) || labels.detail_title;
                                })()}
                              </h3>
                              <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm grid grid-cols-[200px_1fr] gap-y-2 text-[12px] text-gray-600">
                                {/* 1. Nomor Seri */}
                                <div>{labels.serial_number}</div>
                                <div className="text-gray-800 flex gap-1">
                                  <span className="flex-shrink-0">:</span>
                                  <span className="break-all">
                                    {getField(["Serial Number", "serial_number", "serialNumber", "Nomor Seri"])}
                                  </span>
                                </div>

                                {/* 2. Masa Berlaku */}
                                <div>{labels.validity_period}</div>
                                <div className="text-gray-800 flex gap-1">
                                  <span className="flex-shrink-0">:</span>
                                  <span className="break-all">
                                    {(() => {
                                      const v = getField(["Validity", "validity", "valid_period", "Masa Berlaku"]);
                                      if (v === "-") return "-";
                                      
                                      if (v.includes("From") && v.includes("To")) {
                                        const parts = v.split(" To ");
                                        return `${formatDate(parts[0].replace("From ", ""), lang)} - ${formatDate(parts[1], lang)}`;
                                      }
                                      return formatDate(v, lang);
                                    })()}
                                  </span>
                                </div>
                                                          
                                {/* 3. Algoritma Tanda Tangan */}
                                <div>{labels.sig_algorithm}</div>
                                <div className="text-gray-800 flex gap-1">
                                  <span className="flex-shrink-0">:</span>
                                  <span className="break-all">
                                    {getField(["Signature Algorithm", "signature_algorithm", "signatureAlgorithm", "Algoritma"]) || "SHA256withRSA"}
                                  </span>
                                </div>
                              
                                {/* 4. Nama Umum (CN) */}
                                <div>{labels.common_name}</div>
                                <div className="text-gray-800 flex gap-1">
                                  <span className="flex-shrink-0">:</span>
                                  <span className="break-all">
                                    {(() => {
                                      const subjectDN = activeSig["SubjectDN"];
                                      if (subjectDN?.includes('CN=')) {
                                        return subjectDN.split('CN=')[1].split(',')[0].trim();
                                      }
                                      return getField(["Signer", "Signer ", "Common Name", "CN", "common_name"]);
                                    })()}
                                  </span>
                                </div>

                                {/* 5. Nama Penerbit Terverifikasi */}
                                <div>{labels.verified_issuer}</div>
                                <div className="text-gray-800 flex gap-1">
                                  <span className="flex-shrink-0">:</span>
                                  <span className="break-all">
                                    {reverseDN(getField(["Issuer Distinguished Name", "Issuer", "issuer_dn", "IssuerDN", "Penerbit"]))}
                                  </span>
                                </div>

                                {/* 6. Nama Subjek Terverifikasi */}
                                <div>{labels.verified_subject}</div>
                                <div className="text-gray-800 flex gap-1">
                                  <span className="flex-shrink-0">:</span>
                                  <span className="break-all">
                                    {getField(["SubjectDN", "Subject", "subject_dn", "subjectDN", "Subjek"])}
                                  </span>
                                </div>
                              
                                {/* 7. Sidik Jari SHA-1 */}
                                <div>{labels.sha1_fingerprint}</div>
                                <div className="font-mono text-[11px] text-gray-800 flex gap-1">
                                  <span className="flex-shrink-0">:</span>
                                  <span className="break-all">
                                    {getField(["SHA-1 Fingerprint", "sha1", "fingerprint", "SHA1", "sha1_fingerprint"])}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
                </div>
              </>
            )}
            
          </div>
                      
          {/* Footer */}
          <div className="px-6 py-4 flex justify-end bg-gray-50/60 border-t border-gray-100">
            <button 
              onClick={onClose} 
              className="bg-[#334155] text-white px-8 py-2 rounded text-[12px] font-bold hover:bg-[#1e293b] transition-all shadow-md active:scale-95"
            >
              {labels.cancel}
            </button>
          </div>
        </div>
      </div>
    );
  };