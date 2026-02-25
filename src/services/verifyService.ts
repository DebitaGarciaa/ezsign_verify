export const verifyDocument = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('file', file); 

    const response = await fetch('/api-proxy/docverify/document', { 
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    
    if (result.data) { 
      return result.data; 
    }
  
    if (result.message && result.message.toLowerCase().includes("not found")) {
      return []; 
    }
    
    return []; 
  } catch (error) {
    console.error("Service Error:", error);
    return []; 
  }
};