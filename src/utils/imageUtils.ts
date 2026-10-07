export async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const mimeType = file.type || 'image/jpeg';
      const base64 = result.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
      resolve({ base64, mimeType });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

export async function urlToBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const mimeType = blob.type || 'image/jpeg';
      const base64 = result.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
      resolve({ base64, mimeType });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(blob);
  });
}
