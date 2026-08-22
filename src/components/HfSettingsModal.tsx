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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-[#2B3558] bg-[#181A2F] p-6 shadow-2xl animate-scale-in text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#242E49] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-300">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-white">Coach Model & Role Settings</h3>
              <p className="text-xs text-slate-400">Tailor your AI resume coach for your career goals</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-[#242E49] hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin">
          {/* Target Job Role */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Target Job Title / Role
            </label>
            <input
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer, Full-Stack Developer"
              className="mt-1.5 h-10 w-full rounded-xl border border-[#2B3558] bg-[#0B0D1B] px-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              The AI will tailor ATS scoring, keyword matching, and bullet rewrites specifically for this role.
            </p>
          </div>

          {/* Model Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
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
                      ? 'border-violet-500 bg-violet-500/15 ring-1 ring-violet-500'
                      : 'border-[#242E49] bg-[#111427]/80 hover:border-violet-500/40 hover:bg-[#111427]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{m.name}</span>
                    <span className="rounded-full bg-[#181A2F] px-2 py-0.5 text-[10px] font-semibold text-violet-300 border border-violet-500/30">
                      {m.badge}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">{m.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Built-in Status or Custom API Key */}
          {BUILT_IN_HF_KEY && !showAdvancedKey ? (
            <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs text-emerald-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span className="font-semibold">Baked-in Hugging Face AI Active</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAdvancedKey(true)}
                className="text-[11px] font-medium text-emerald-400 underline hover:text-emerald-300"
              >
                Change Key
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-[#242E49] bg-[#111427]/80 p-3.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
                  <Key className="h-3.5 w-3.5 text-violet-400" />
                  Hugging Face API Key
                </label>
                <a
                  href="https://huggingface.co/settings/tokens"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-400 hover:underline"
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
                  className="h-10 flex-1 rounded-xl border border-[#2B3558] bg-[#0B0D1B] px-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={testing || (!apiKey.trim() && !BUILT_IN_HF_KEY)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#2B3558] bg-[#181A2F] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-[#242E49] hover:text-white disabled:opacity-50 transition"
                >
                  {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" /> : <Zap className="h-3.5 w-3.5 text-amber-400" />}
                  Test
                </button>
              </div>

              {testResult && (
                <div
                  className={`mt-2.5 flex items-start gap-2 rounded-lg p-2.5 text-xs ${
                    testResult.success
                      ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {testResult.success ? (
                    <Check className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                  )}
                  <span className="leading-tight">{testResult.message}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#242E49] pt-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-[#2B3558] bg-[#111427] px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-[#242E49] hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-glow transition hover:from-violet-500 hover:to-indigo-500"
          >
            {savedSuccess ? <Check className="h-4 w-4 text-white" /> : <Sparkles className="h-4 w-4" />}
            {savedSuccess ? 'Saved!' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}
