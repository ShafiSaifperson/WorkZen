import { useState } from 'react';
import { X, Key, Cpu, ExternalLink, Check, Sparkles, AlertCircle, Loader2, Zap, ShieldCheck } from 'lucide-react';
import {
  HF_MODELS,
  type HfModelId,
  getStoredHfApiKey,
  setStoredHfApiKey,
  getStoredHfModel,
  setStoredHfModel,
  getStoredTargetRole,
  setStoredTargetRole,
  testHfToken,
  BUILT_IN_HF_KEY,
} from '@/lib/hfClient';

interface HfSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function HfSettingsModal({ isOpen, onClose, onSaved }: HfSettingsModalProps) {
  const [apiKey, setApiKey] = useState(getStoredHfApiKey());
  const [selectedModel, setSelectedModel] = useState<HfModelId>(getStoredHfModel());
  const [targetRole, setTargetRole] = useState(getStoredTargetRole());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showAdvancedKey, setShowAdvancedKey] = useState(!BUILT_IN_HF_KEY);

  if (!isOpen) return null;

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    const keyToTest = apiKey || BUILT_IN_HF_KEY;
    const result = await testHfToken(keyToTest, selectedModel);
    setTestResult(result);
    setTesting(false);
  }

  function handleSave() {
    setStoredHfApiKey(apiKey);
    setStoredHfModel(selectedModel);
    setStoredTargetRole(targetRole);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onSaved();
      onClose();
    }, 600);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-ink-200 bg-white p-6 shadow-xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-ink-900">Coach Model & Role Settings</h3>
              <p className="text-xs text-ink-400">Tailor your AI resume coach for your career goals</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Target Job Role */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-700">
              Target Job Title / Role
            </label>
            <input
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer, Full-Stack Developer"
              className="mt-1.5 h-10 w-full rounded-xl border border-ink-200 bg-ink-50 px-3 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
            />
            <p className="mt-1 text-[11px] text-ink-400">
              The AI will tailor ATS scoring, keyword matching, and bullet rewrites specifically for this role.
            </p>
          </div>

          {/* Model Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-700">
              Select Hugging Face Model
            </label>
            <div className="mt-2 space-y-2">
              {HF_MODELS.map((m) => (
                <div
                  key={m.id}
                  onClick={() => {
                    setSelectedModel(m.id);
                    setTestResult(null);
                  }}
                  className={`cursor-pointer rounded-xl border p-3 transition ${
                    selectedModel === m.id
                      ? 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-500'
                      : 'border-ink-200 hover:bg-ink-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink-900">{m.name}</span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-brand-700 border border-brand-200">
                      {m.badge}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-ink-500">{m.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Built-in Status or Custom API Key */}
          {BUILT_IN_HF_KEY && !showAdvancedKey ? (
            <div className="flex items-center justify-between rounded-xl border border-accent-200 bg-accent-50/70 p-3 text-xs text-accent-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-accent-600" />
                <span className="font-semibold">Baked-in Hugging Face AI Active</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAdvancedKey(true)}
                className="text-[11px] font-medium text-accent-700 underline hover:text-accent-900"
              >
                Change Key
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-ink-200 bg-ink-50/60 p-3.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-700">
                  <Key className="h-3.5 w-3.5 text-brand-600" />
                  Hugging Face API Key
                </label>
                <a
                  href="https://huggingface.co/settings/tokens"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:underline"
                >
                  Get free token <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="mt-2 flex gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="h-10 flex-1 rounded-xl border border-ink-200 bg-white px-3 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={testing || (!apiKey.trim() && !BUILT_IN_HF_KEY)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-ink-50 disabled:opacity-50"
                >
                  {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5 text-amber-500" />}
                  Test
                </button>
              </div>

              {testResult && (
                <div
                  className={`mt-2.5 flex items-start gap-2 rounded-lg p-2.5 text-xs ${
                    testResult.success
                      ? 'bg-accent-50 text-accent-800 border border-accent-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {testResult.success ? (
                    <Check className="h-4 w-4 shrink-0 text-accent-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                  )}
                  <span className="leading-tight">{testResult.message}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-ink-100 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-ink-200 px-4 py-2 text-xs font-semibold text-ink-600 hover:bg-ink-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-brand-700"
          >
            {savedSuccess ? <Check className="h-4 w-4 text-white" /> : <Sparkles className="h-4 w-4" />}
            {savedSuccess ? 'Saved!' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}
