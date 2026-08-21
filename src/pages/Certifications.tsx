import { useEffect, useRef, useState } from 'react';
import {
  Award,
  Copy,
  ExternalLink,
  FileText,
  FileUp,
  Image,
  Trash2,
  Upload,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { extractTextFromFile, sanitizeAndCleanText } from '@/lib/resumeParser';
import {
  addSavedCertificate,
  deleteSavedCertificate,
  fileToDataUrl,
  getSavedCertificates,
  type SavedCertificate,
} from '@/lib/savedCertificates';

const MAX_CERTIFICATE_SIZE = 2 * 1024 * 1024;

export function CertificationsPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [certificates, setCertificates] = useState<SavedCertificate[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setCertificates(getSavedCertificates(user.id));
    }
  }, [user]);

  async function handleFile(file: File) {
    if (!user) return;

    if (file.size > MAX_CERTIFICATE_SIZE) {
      window.alert('Please choose a certificate smaller than 2 MB.');
      return;
    }

    setUploading(true);

    try {
      const fileData = await fileToDataUrl(file);

      let rawText = '';

      try {
        rawText = sanitizeAndCleanText(await extractTextFromFile(file));
      } catch {
        // Image certificates do not always contain extractable text.
        rawText = '';
      }

      const certificate: SavedCertificate = {
        id: crypto.randomUUID(),
        fileName: file.name,
        fileSize: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        mimeType: file.type || 'application/octet-stream',
        fileData,
        rawText,
        savedAt: new Date().toLocaleString(),
      };

      addSavedCertificate(user.id, certificate);
      setCertificates((currentCertificates) => [
        certificate,
        ...currentCertificates,
      ]);
    } catch (error) {
      console.error('Certificate upload failed:', error);

      window.alert(
        error instanceof Error
          ? error.message
          : 'The certificate could not be saved. Please try again.'
      );
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleCopyText(certificate: SavedCertificate) {
    if (!certificate.rawText) {
      window.alert('No readable text could be extracted from this certificate.');
      return;
    }

    try {
      await navigator.clipboard.writeText(certificate.rawText);
      window.alert('Certificate text copied to your clipboard.');
    } catch {
      window.prompt(
        'Copy this certificate text:',
        certificate.rawText
      );
    }
  }

  function handleDelete(certificate: SavedCertificate) {
    if (!user) return;

    const confirmed = window.confirm(
      `Delete "${certificate.fileName}" from your saved certificates?`
    );

    if (!confirmed) return;

    deleteSavedCertificate(user.id, certificate.id);

    setCertificates((currentCertificates) =>
      currentCertificates.filter(
        (currentCertificate) => currentCertificate.id !== certificate.id
      )
    );
  }

  function previewCertificate(certificate: SavedCertificate) {
    if (certificate.mimeType.startsWith('image/')) {
      return (
        <img
          src={certificate.fileData}
          alt={certificate.fileName}
          className="max-h-[500px] w-full rounded-xl object-contain"
        />
      );
    }

    if (certificate.mimeType.includes('pdf')) {
      return (
        <iframe
          title={certificate.fileName}
          src={certificate.fileData}
          className="h-[500px] w-full rounded-xl border border-ink-200"
        />
      );
    }

    if (certificate.rawText) {
      return (
        <pre className="max-h-[500px] overflow-auto whitespace-pre-wrap rounded-xl border border-ink-200 bg-ink-50 p-4 font-sans text-sm leading-6 text-ink-700">
          {certificate.rawText}
        </pre>
      );
    }

    return (
      <div className="rounded-xl border border-ink-200 bg-ink-50 p-5 text-sm text-ink-500">
        This file type cannot be previewed inside WorkZen. Use “Open file” to
        view it.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-violet-400">Profile</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-white">
          Add Certifications
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Save educational, professional, and extracurricular certificates for
          quick viewing and copying later.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.md,.html,.htm,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      <button
        type="button"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-ink-200 bg-white px-6 py-10 text-center shadow-card transition hover:border-brand-400 hover:bg-brand-50/40 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600">
          <Upload className="h-6 w-6" />
        </div>

        <div>
          <p className="text-sm font-bold text-ink-900">
            {uploading ? 'Saving certificate...' : 'Upload a certificate'}
          </p>
          <p className="mt-1 text-xs text-ink-500">
            PDF, DOCX, TXT, image files, Markdown, or HTML · Maximum 2 MB
          </p>
        </div>
      </button>

      {certificates.length === 0 ? (
        <div className="rounded-2xl border border-ink-200 bg-white p-8 text-center shadow-card">
          <Award className="mx-auto h-9 w-9 text-ink-300" />
          <p className="mt-3 font-semibold text-ink-800">
            No certificates uploaded yet
          </p>
          <p className="mt-1 text-sm text-ink-500">
            Upload your first educational or extracurricular certificate above.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {certificates.map((certificate) => (
            <section
              key={certificate.id}
              className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card"
            >
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
                    {certificate.mimeType.startsWith('image/') ? (
                      <Image className="h-5 w-5" />
                    ) : (
                      <FileText className="h-5 w-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-bold text-ink-900">
                      {certificate.fileName}
                    </p>
                    <p className="text-xs text-ink-500">
                      {certificate.fileSize} · Saved {certificate.savedAt}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <a
                    href={certificate.fileData}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-700 transition hover:bg-ink-50"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open file
                  </a>

                  <button
                    type="button"
                    disabled={!certificate.rawText}
                    onClick={() => handleCopyText(certificate)}
                    className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-700 transition hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Copy className="h-4 w-4" />
                    Copy text
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(certificate)}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>

              {previewCertificate(certificate)}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}