import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { feedbackAPI } from '@/services/api';
import Button from '@/components/Button';
import Card from '@/components/Card';
import ScoreBar from '@/components/ScoreBar';

export default function ContentReview() {
  const MAX_VIDEO_MB = 250;
  const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024;
  const inputPanelRef = useRef<HTMLDivElement | null>(null);
  const [contentText, setContentText] = useState('');
  const [format, setFormat] = useState<'reel' | 'carousel' | 'story'>('reel');
  const [analysisType, setAnalysisType] = useState<'text' | 'video'>('video');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const analyzeTextMutation = useMutation({
    mutationFn: (data: { text: string; format: string }) => feedbackAPI.analyzeText(data),
  });

  const analyzeVideoMutation = useMutation({
    mutationFn: (formData: FormData) => feedbackAPI.analyze(formData),
  });

  const analyzeMutation = analysisType === 'text' ? analyzeTextMutation : analyzeVideoMutation;
  const maxUploadErrorMessage = `Video-ul este prea mare. Limita este ${MAX_VIDEO_MB}MB.`;

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_VIDEO_BYTES) {
        setUploadError(maxUploadErrorMessage);
        setVideoFile(null);
        setVideoPreview(null);
        return;
      }
      setUploadError(null);
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (analysisType === 'text') {
      if (!contentText.trim()) return;
      analyzeTextMutation.mutate({ text: contentText, format });
    } else {
      if (!videoFile || uploadError) return;
      const formData = new FormData();
      formData.append('file', videoFile); // Backend expects 'file', not 'video'
      formData.append('format', format);
      analyzeVideoMutation.mutate(formData);
    }
  };

  const handleReset = () => {
    setContentText('');
    setVideoFile(null);
    setVideoPreview(null);
    setUploadError(null);
    analyzeTextMutation.reset();
    analyzeVideoMutation.reset();
  };

  const scrollToInputPanel = () => {
    window.setTimeout(() => {
      inputPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  useEffect(() => {
    if (!analyzeMutation.isSuccess) {
      return;
    }

    inputPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [analyzeMutation.isSuccess]);

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="console-hero mb-6">
          <div className="console-orb left-[-4rem] top-[-3rem] h-24 w-24 bg-cyan-300/18 animate-float-slow" />
          <div className="console-orb right-0 top-8 h-20 w-20 bg-emerald-300/16 animate-float-delay" />
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="console-badge">Content Feedback</span>
          </div>
          <h1 className="mt-1 mb-3 text-3xl font-bold text-white font-display sm:text-4xl">
            Feedback instant pe conținutul tău.{' '}
            <span className="bg-gradient-to-r from-[#8CF8D4] via-[#72CAFF] to-[#A78BFA] bg-clip-text text-transparent">Nu mai posta pe orbește.</span>
          </h1>
          <p className="max-w-2xl text-base text-slate-300/78">
            Scrie textul postării — primești scor, sugestii concrete și CTA optimizat înainte să publici.
          </p>
          <p className="mt-1 text-xs text-slate-300/72">
            🤖 Powered by AI • Personalizat pentru nișa ta
          </p>
        </div>

        {/* Analysis Type Selector */}
        <div className="max-w-3xl mx-auto mb-6">
          <Card>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setAnalysisType('video');
                  scrollToInputPanel();
                }}
                className={`console-option p-4 ${
                  analysisType === 'video'
                    ? 'console-option-active'
                    : ''
                }`}
              >
                <div className="text-3xl mb-2">🎥</div>
                <p className="text-white font-semibold">Video Analysis</p>
                <p className="text-gray-400 text-xs mt-1">Upload + Whisper transcription</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAnalysisType('text');
                  scrollToInputPanel();
                }}
                className={`console-option p-4 ${
                  analysisType === 'text'
                    ? 'console-option-active'
                    : ''
                }`}
              >
                <div className="text-3xl mb-2">📝</div>
                <p className="text-white font-semibold">Text Analysis</p>
                <p className="text-gray-400 text-xs mt-1">Paste script directly</p>
              </button>
            </div>
          </Card>
        </div>

        {!analyzeMutation.isSuccess ? (
          <div ref={inputPanelRef} className="max-w-3xl mx-auto scroll-mt-24">
            <Card className="console-panel-strong">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10">
                  <span className="text-3xl">{analysisType === 'video' ? '🎥' : '📊'}</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white font-display">
                    {analysisType === 'video' ? 'Video Analysis' : 'Text Analysis'}
                  </h2>
                  <p className="text-gray-300 text-sm">
                    {analyzeMutation.isPending 
                      ? (analysisType === 'video' ? 'Se transcrie și analizează...' : 'Se analizează...')
                      : (analysisType === 'video' ? 'Upload video pentru transcription' : 'Scrie textul postării')}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Format Selection */}
                <div>
                  <label className="block text-white font-semibold mb-3">Tip de conținut</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['reel', 'carousel', 'story'] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFormat(f)}
                        className={`console-option p-4 ${
                          format === f
                            ? 'console-option-active'
                            : ''
                        }`}
                      >
                        <div className="text-2xl mb-2">
                          {f === 'reel' ? '🎥' : f === 'carousel' ? '📸' : '⚡'}
                        </div>
                        <p className="text-white font-semibold capitalize">{f}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Video Upload (if video mode) */}
                {analysisType === 'video' && (
                  <div>
                    <label className="block text-white font-semibold mb-3">
                      Upload Video 🎥
                    </label>
                    {!videoPreview ? (
                      <div className="rounded-[24px] border-2 border-dashed border-cyan-300/18 p-8 text-center transition-colors hover:border-cyan-300/42">
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoChange}
                          className="hidden"
                          id="video-upload"
                        />
                        <label htmlFor="video-upload" className="cursor-pointer">
                          <div className="text-6xl mb-4">🎬</div>
                          <p className="text-white font-semibold mb-2">
                            Click to upload video
                          </p>
                          <p className="text-gray-400 text-sm">
                            MP4, MOV, AVI • Max {MAX_VIDEO_MB}MB
                          </p>
                          <p className="text-brand-500 text-xs mt-2">
                            ✨ Whisper will transcribe audio automatically
                          </p>
                        </label>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <video
                          src={videoPreview}
                          controls
                          className="w-full rounded-lg bg-black"
                        />
                        <div className="console-option flex items-center justify-between p-3">
                          <div>
                            <p className="text-white text-sm font-semibold">{videoFile?.name}</p>
                            <p className="text-gray-400 text-xs">
                              {(videoFile!.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setVideoFile(null);
                              setVideoPreview(null);
                            }}
                            className="text-red-500 hover:text-red-400 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                    {uploadError && (
                      <p className="text-red-400 text-xs mt-2">
                        {uploadError}
                      </p>
                    )}
                  </div>
                )}

                {/* Text Input (if text mode) */}
                {analysisType === 'text' && (
                  <div>
                    <label className="block text-white font-semibold mb-3">
                      Textul postării (hook + script + CTA)
                    </label>
                    <textarea
                      value={contentText}
                      onChange={(e) => setContentText(e.target.value)}
                      placeholder={`Exemplu pentru ${format.toUpperCase()}:\n\n${
                        format === 'reel'
                          ? 'Hook: De ce nu slăbești?\n\nScript:\nScena 1: Sari micul dejun → Corp stochează grăsime\nScena 2: Alegi cardio → Pierzi mușchi, nu grăsime\nScena 3: Te înfometezi → Metabolism scade\n\nCTA: Vrei să slăbești CORECT? Scrie PLAN în DM'
                          : format === 'carousel'
                          ? 'Slide 1: 5 greșeli care îți sabotează slăbitul\nSlide 2: ❌ Sari micul dejun\nSlide 3: ❌ Doar cardio\nSlide 4: ❌ Dietă extremă\nSlide 5: ✅ Soluția?\nSlide 6: Scrie PLAN în DM pentru program personalizat'
                          : 'Scene 1: Problemă (3s) - Te-ai săturat de diete?\nScene 2: Agitație (3s) - Toate dietele eșuează\nScene 3: Soluție (5s) - Există o metodă\nScene 4: CTA (4s) - Scrie SLĂBIRE în DM'
                      }`}
                      rows={12}
                      className="console-input min-h-[18rem] resize-none"
                    />
                    <p className="text-gray-400 text-sm mt-2">
                      {contentText.length} caractere • Include hook, script și CTA
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={analysisType === 'text' ? !contentText.trim() : !videoFile}
                  isLoading={analyzeMutation.isPending}
                >
                  {analyzeMutation.isPending 
                    ? (analysisType === 'video' ? '🎙️ Se transcrie și analizează...' : 'Se analizează...') 
                    : (analysisType === 'video' ? '🎥 Transcrie & Analizează Video' : 'Analizează Textul')}
                </Button>
              </form>

              {analyzeMutation.isError && (
                <div className="mt-6 rounded-[22px] border border-red-500/40 bg-red-500/10 p-4">
                  <p className="text-red-500 text-sm font-semibold mb-2">
                    ❌ Analiza a eșuat
                  </p>
                  <p className="text-red-400 text-xs">
                    {(analyzeMutation.error as any)?.response?.status === 413
                      ? maxUploadErrorMessage
                      : (analyzeMutation.error as any)?.response?.data?.error || 
                        (analyzeMutation.error as any)?.message || 
                        'Verifică formatul fișierului și încearcă din nou.'}
                  </p>
                  {(analyzeMutation.error as any)?.response?.data?.details && (
                    <details className="mt-2">
                      <summary className="text-red-400 text-xs cursor-pointer hover:text-red-300">
                        Detalii tehnice (pentru debugging)
                      </summary>
                      <pre className="text-red-300 text-xs mt-2 overflow-auto max-h-40 p-2 bg-red-900/20 rounded">
                        {(analyzeMutation.error as any).response.data.details}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </Card>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            {/* Analysis Complete Header */}
            <div className="mb-6">
              <Card className="border-cyan-300/28 bg-[linear-gradient(135deg,rgba(114,202,255,0.12),rgba(9,18,34,0.88))]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#8CF8D4,#72CAFF)]">
                      <span className="text-2xl text-slate-950">✓</span>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">Analiză completă</h3>
                      <p className="text-gray-300 text-sm capitalize">
                        {format} • {analysisType === 'video' ? 'Video cu transcription' : `${contentText.length} caractere`}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={handleReset}>
                    Analizează alt conținut
                  </Button>
                </div>
              </Card>
            </div>

            {/* Transcription (if video was analyzed) */}
            {analysisType === 'video' && analyzeMutation.data?.data?.transcription && (
              <Card className="mb-6">
                <h3 className="text-xl font-bold text-white mb-4 font-display flex items-center gap-2">
                  <span className="text-2xl">🎙️</span>
                  Transcription (Whisper AI)
                </h3>
                <div className="console-option p-4">
                  <p className="whitespace-pre-wrap leading-relaxed text-slate-300/78">
                    {analyzeMutation.data.data.transcription}
                  </p>
                </div>
                <p className="text-gray-400 text-xs mt-2">
                  ✨ Transcribed automatically using OpenAI Whisper
                </p>
              </Card>
            )}

            {/* Scores */}
            <Card className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-6 font-display">
                Scoruri de Performanță
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <ScoreBar label="Claritate" score={analyzeMutation.data.data.clarityScore} />
                <ScoreBar label="Relevanță" score={analyzeMutation.data.data.relevanceScore} />
                <ScoreBar label="Încredere" score={analyzeMutation.data.data.trustScore} />
                <ScoreBar label="CTA" score={analyzeMutation.data.data.ctaScore} />
              </div>
            </Card>

            {/* Suggestions */}
            {analyzeMutation.data.data.suggestions && (
              <Card className="mb-6">
                <h3 className="text-xl font-bold text-white mb-4 font-display flex items-center gap-2">
                  <span className="text-2xl">💡</span>
                  Sugestii de Îmbunătățire
                </h3>
                <ul className="space-y-3">
                  {analyzeMutation.data.data.suggestions.map(
                    (s: { type: 'error' | 'warning' | 'success'; category: string; text: string }, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <span
                          className={
                            s.type === 'error'
                              ? 'text-red-500 text-xl flex-shrink-0'
                              : s.type === 'warning'
                                ? 'text-yellow-500 text-xl flex-shrink-0'
                                : 'text-brand-500 text-xl flex-shrink-0'
                          }
                        >
                          →
                        </span>
                        <div>
                          <p className="text-gray-200">{s.text}</p>
                          {s.category && (
                            <p className="text-gray-500 text-xs mt-1">Categorie: {s.category}</p>
                          )}
                        </div>
                      </li>
                    )
                  )}
                </ul>
              </Card>
            )}

            {/* Summary */}
            {analyzeMutation.data.data.summary && (
              <Card>
                <h3 className="text-xl font-bold text-white mb-4 font-display">
                  Rezumat
                </h3>
                <p className="text-gray-300 leading-relaxed">{analyzeMutation.data.data.summary}</p>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
