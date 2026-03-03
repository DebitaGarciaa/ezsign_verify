export const verifyDocument = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file); // Pastikan pakai 'file' sesuai Postman

  const response = await fetch('/api-proxy/docverify/document', {
    method: 'POST',
    body: formData,
  });

  // Langsung kembalikan SEMUA hasil JSON-nya
  return await response.json(); 
};