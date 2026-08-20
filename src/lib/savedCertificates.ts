export interface SavedCertificate {
  id: string;
  fileName: string;
  fileSize: string;
  mimeType: string;
  fileData: string;
  rawText: string;
  savedAt: string;
}

function storageKey(userId: string) {
  return `workzen-saved-certificates-${userId}`;
}

export function getSavedCertificates(userId: string): SavedCertificate[] {
  try {
    const value = localStorage.getItem(storageKey(userId));
    if (!value) return [];

    const certificates = JSON.parse(value) as SavedCertificate[];

    if (!Array.isArray(certificates)) return [];
    return certificates;
  } catch {
    return [];
  }
}

export function saveCertificates(
  userId: string,
  certificates: SavedCertificate[]
) {
  localStorage.setItem(storageKey(userId), JSON.stringify(certificates));
}

export function addSavedCertificate(
  userId: string,
  certificate: SavedCertificate
) {
  const certificates = getSavedCertificates(userId);
  saveCertificates(userId, [certificate, ...certificates]);
}

export function deleteSavedCertificate(userId: string, certificateId: string) {
  const remainingCertificates = getSavedCertificates(userId).filter(
    (certificate) => certificate.id !== certificateId
  );

  saveCertificates(userId, remainingCertificates);
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('The certificate file could not be read.'));

    reader.readAsDataURL(file);
  });
}