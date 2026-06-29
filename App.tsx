
import React, { useState, useCallback } from 'react';
import { ImageUploadSlot } from './components/ImageUploadSlot';
import { generateImage, generateDescription } from './services/geminiService';
import { Sparkles, ImageIcon, Download, Copy, Zap, Loader2, ArrowRight, Check } from 'lucide-react';

type AppMode = 'generate' | 'describe';

interface PresetPrompt {
  id: string;
  title: string;
  badge: string;
  shortDesc: string;
  prompt: string;
}

const PRESET_PROMPTS: PresetPrompt[] = [
  {
    id: 'bayi_gemoi',
    title: 'Model Bayi Gemoi (9:16)',
    badge: 'Sering Digunakan ⭐',
    shortDesc: 'Foto produk dikenakan pada kaki sepasang bayi berdiri sejajar, gemoi & pakai legging.',
    prompt: 'buatkan saya foto dari produk yang di upload, dengan komposisi yang menampilkan sepasang objek produk yang dikenakan pada kaki seorang bayi. Bayi sedang berdiri, dengan kedua kakinya sejajar, menjadikan objek produk sebagai fokus utama di bagian bawah tengah frame. Sudut pengambilan gambar adalah rendah (low angle), agak dari tampak samping produk, sedikit mendongak ke atas, menangkap detail objek produk dan kaki bayi yang montok hingga bagian lutut. Bagian paha dan sedikit pakaian atas bayi juga terlihat di bagian atas frame, memberikan konteks. Fokus tajam pada objek produk dan area sekitar kaki, dengan transisi lembut ke blur pada bagian atas tubuh bayi. Latar belakang terdiri dari permukaan bertekstur seperti karpet berwarna abu-abu gelap di bagian bawah, yang berangsur-angsur menjadi buram ke arah belakang. Di belakang kaki bayi, terdapat latar belakang yang sangat buram (bokeh) dengan gradasi warna abu-abu gelap hingga hitam, menciptakan kedalaman dan membuat objek produk menonjol tanpa gangguan. Pencahayaan yang digunakan adalah cahaya lembut, merata, dan menyebar (diffused light), kemungkinan berasal dari depan atau sedikit atas, menghasilkan highlight alami pada permukaan kulit dan objek produk, terutama pada ornamen bulat yang mungkin ada. Bayangan sangat minim dan lembut, tidak ada bayangan keras yang mengganggu, menciptakan suasana yang cerah, hangat, dan alami, serta menonjolkan tekstur dan detail halus. Kualitas 8k rasio 9:16. Dengan memakai celana legging panjang. Tampilan foto tampak samping dengan kaki gemoi'
  },
  {
    id: 'tangan_memegang',
    title: 'Mockup Pegang Tangan (1:1)',
    badge: 'Populer',
    shortDesc: 'Produk dipegang secara alami dengan fokus tajam dan latar belakang outdoor blur hangat.',
    prompt: 'buatkan saya foto dari produk yang di upload, dengan komposisi yang menampilkan produk dipegang oleh tangan seseorang secara natural. Fokus tajam pada produk, latar belakang outdoor taman yang buram lembut (bokeh) dengan cahaya matahari sore (golden hour).'
  },
  {
    id: 'studio_minimalis',
    title: 'Studio Minimalis (4:3)',
    badge: 'Elegan',
    shortDesc: 'Produk dipajang di atas podium minimalis dengan pencahayaan studio komersial premium.',
    prompt: 'buatkan saya foto dari produk yang di upload, dipajang di atas silinder podium minimalis berwarna pastel, latar belakang warna netral polos, pencahayaan studio komersial yang dramatis dengan bayangan lembut.'
  }
];

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('generate');
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([null, null, null]);
  const [imagePreviews, setImagePreviews] = useState<(string | null)[]>([null, null, null]);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedText, setGeneratedText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = useCallback((index: number, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviews(prev => {
        const newPreviews = [...prev];
        newPreviews[index] = reader.result as string;
        return newPreviews;
      });
      setImageFiles(prev => {
        const newFiles = [...prev];
        newFiles[index] = file;
        return newFiles;
      });
    };
    reader.readAsDataURL(file);
  }, []);

  const handleImageRemove = useCallback((index: number) => {
    setImagePreviews(prev => {
      const newPreviews = [...prev];
      newPreviews[index] = null;
      return newPreviews;
    });
    setImageFiles(prev => {
      const newFiles = [...prev];
      newFiles[index] = null;
      return newFiles;
    });
  }, []);
  
  const handleGenerateClick = async () => {
    const activeImages = imageFiles.filter((f): f is File => f !== null);
    
    if (activeImages.length === 0) {
       setError("Harap unggah setidaknya satu gambar.");
       return;
    }

    if (mode === 'generate' && !prompt.trim()) {
      setError("Harap berikan prompt.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setGeneratedText(null);

    try {
      if (mode === 'generate') {
        const result = await generateImage(prompt, imageFiles);
        setGeneratedImage(result);
      } else {
        const result = await generateDescription(activeImages);
        setGeneratedText(result);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan yang tidak diketahui.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `triattach-generated-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeImagesCount = imageFiles.filter(f => f !== null).length;
  const isGenerationDisabled = isLoading || (mode === 'generate' ? !prompt.trim() : false) || activeImagesCount === 0;

  const getSlotLabel = (index: number) => {
    if (index === 0) return "Referensi 1";
    if (index === 1) return "Referensi 2";
    if (index === 2) return "Wajah Model";
    return "";
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
            TriAttach Image Generator
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Alat AI untuk manipulasi visual. Hasilkan gambar baru atau ekstrak prompt dari gambar yang ada.
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-gray-700 flex flex-col space-y-6">
            
            {/* Mode Tabs */}
            <div className="flex p-1 bg-gray-900/50 rounded-xl">
              <button
                onClick={() => setMode('generate')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  mode === 'generate' 
                    ? 'bg-gray-700 text-white shadow' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                Generate Image
              </button>
              <button
                onClick={() => setMode('describe')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  mode === 'describe' 
                    ? 'bg-gray-700 text-white shadow' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                Image to Prompt
              </button>
            </div>

            <div>
              <label className="block text-lg font-semibold mb-3 text-gray-300">
                1. Unggah Gambar (Maks. 3)
              </label>
              <div className="grid grid-cols-3 gap-4">
                {imagePreviews.map((preview, index) => (
                  <ImageUploadSlot
                    key={index}
                    imagePreview={preview}
                    onImageSelect={(file) => handleImageSelect(index, file)}
                    onImageRemove={() => handleImageRemove(index)}
                    index={index}
                    label={getSlotLabel(index)}
                  />
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-500 italic">
                * Slot ke-3 akan digunakan sebagai referensi wajah model.
              </p>
            </div>            {mode === 'generate' && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300 flex flex-col space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                  <label htmlFor="prompt" className="block text-lg font-semibold text-gray-300 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    2. Tulis Prompt Anda atau Pilih Preset
                  </label>
                  <span className="text-xs text-indigo-400 font-medium">Klik preset untuk mengisi otomatis</span>
                </div>

                {/* Preset List */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {PRESET_PROMPTS.map((preset) => {
                    const isSelected = prompt === preset.prompt;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setPrompt(preset.prompt)}
                        className={`text-left p-3.5 rounded-xl border transition-all duration-300 flex flex-col justify-between h-[120px] relative overflow-hidden group ${
                          isSelected
                            ? 'bg-indigo-950/45 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.25)]'
                            : 'bg-gray-900/40 border-gray-700/80 hover:border-gray-500 hover:bg-gray-900/60'
                        }`}
                      >
                        {/* Selected overlay glow / indicator */}
                        {isSelected && (
                          <div className="absolute right-0 top-0 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg shadow-sm flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Aktif
                          </div>
                        )}
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-gray-100 group-hover:text-indigo-300 transition-colors">
                              {preset.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                            {preset.shortDesc}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-1 w-full">
                          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                            preset.id === 'bayi_gemoi'
                              ? 'bg-purple-900/40 text-purple-300 border border-purple-500/30 animate-pulse'
                              : 'bg-gray-800 text-gray-300'
                          }`}>
                            {preset.badge}
                          </span>
                          <span className="text-[10px] text-indigo-400 font-semibold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                            Terapkan <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="cth., Seekor kucing memakai baju astronot, fotorealistis, sinematik"
                  className="w-full h-36 p-3 bg-gray-900 border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 text-gray-200 placeholder-gray-500 resize-none font-sans text-sm leading-relaxed"
                />
              </div>
            )}

             {mode === 'describe' && (
              <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-4 text-indigo-200 text-sm animate-in fade-in slide-in-from-top-4 duration-300">
                <p>Mode ini akan menganalisis gambar yang Anda unggah dan membuat prompt teks detail yang mendeskripsikan gaya, subjek, dan komposisinya.</p>
              </div>
            )}
            
            <button
              onClick={handleGenerateClick}
              disabled={isGenerationDisabled}
              className={`w-full py-3.5 px-6 font-bold text-lg rounded-xl transition-all duration-300 ease-in-out transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 ${
                isGenerationDisabled
                  ? 'bg-gray-700 cursor-not-allowed text-gray-400 border border-gray-650'
                  : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-900/30'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 text-white" />
                  {mode === 'generate' ? 'Menghasilkan...' : 'Menganalisis...'}
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                  {mode === 'generate' ? 'Hasilkan Gambar' : 'Ekstrak Prompt'}
                </>
              )}
            </button>
             {error && <p className="text-red-400 text-center mt-2">{error}</p>}
          </div>

          {/* Output Panel */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-gray-700 flex flex-col min-h-[400px] lg:min-h-0">
              <h3 className="text-xl font-semibold mb-4 text-gray-300 border-b border-gray-700 pb-2">
                {mode === 'generate' ? 'Hasil Gambar' : 'Hasil Prompt'}
              </h3>
              
              <div className="flex-1 flex flex-col items-center justify-center w-full h-full relative">
                  {isLoading && (
                      <div className="w-full h-full bg-gray-900/50 rounded-lg animate-pulse flex flex-col items-center justify-center min-h-[300px]">
                          <Loader2 className="h-12 w-12 text-indigo-500 animate-spin mb-4" />
                          <span className="text-gray-400 font-medium">Kecerdasan Buatan sedang bekerja...</span>
                          <span className="text-gray-500 text-xs mt-1">Harap tunggu beberapa saat</span>
                      </div>
                  )}

                  {!isLoading && generatedImage && mode === 'generate' && (
                      <div className="w-full h-full flex flex-col items-center">
                        <img src={generatedImage} alt="Generated" className="object-contain w-full h-full rounded-lg shadow-md max-h-[500px]" />
                        <button 
                          onClick={downloadImage}
                          className="mt-6 flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all transform hover:scale-105"
                        >
                          <Download className="h-5 w-5" />
                          Unduh Gambar
                        </button>
                      </div>
                  )}

                  {!isLoading && generatedText && mode === 'describe' && (
                    <div className="w-full h-full flex flex-col">
                      <div className="bg-gray-900 p-4 rounded-lg border border-gray-600 text-gray-200 whitespace-pre-wrap font-mono text-sm overflow-y-auto max-h-[500px] flex-1">
                        {generatedText}
                      </div>
                      <button 
                        onClick={() => navigator.clipboard.writeText(generatedText)}
                        className="mt-3 self-end text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded text-gray-300 transition-colors flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Salin Teks
                      </button>
                    </div>
                  )}

                  {!isLoading && !generatedImage && !generatedText && (
                      <div className="text-center text-gray-500">
                           <ImageIcon className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                           <p>Hasil akan muncul di sini.</p>
                      </div>
                  )}
              </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
