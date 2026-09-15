/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { 
  Upload, 
  Camera, 
  MapPin, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  Info, 
  ShieldAlert, 
  Maximize2, 
  X, 
  Compass, 
  Globe2, 
  Layers, 
  Sparkles,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { AnalysisState, AnalysisResult } from './types';

const POPULAR_BIOMES = [
  { name: 'Amazon Rainforest', tag: 'Tropical Jungle' },
  { name: 'Cold Desert of Ladakh', tag: 'High-Altitude' },
  { name: 'Sundarbans Mangroves', tag: 'Tidal Delta' },
  { name: 'Western Ghats Shola', tag: 'Montane Forest' },
  { name: 'Great Rann of Kutch', tag: 'Salt Marsh' },
  { name: 'Thar Desert Dunes', tag: 'Arid Sand' },
];

export default function App() {
  const [state, setState] = useState<AnalysisState>({
    loading: false,
    error: null,
    result: null,
    imagePreview: null,
  });
  const [textInput, setTextInput] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; caption?: string } | null>(null);
  const [selectedTab, setSelectedTab] = useState<'uploaded' | 'reference'>('reference');

  const executeTextSearch = async (query: string) => {
    if (!query.trim()) return;

    setActiveImageIndex(0);
    setState({
      loading: true,
      error: null,
      result: null,
      imagePreview: null,
    });
    setSelectedTab('reference');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textQuery: query }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to analyze region');
      }

      const result: AnalysisResult = await response.json();
      setState(prev => ({ ...prev, result, loading: false }));
    } catch (err: any) {
      setState(prev => ({ 
        ...prev, 
        error: err.message || 'Analysis failed. Please try again.', 
        loading: false 
      }));
    }
  };

  const handleTextSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeTextSearch(textInput);
  };

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | undefined;
    
    if ('files' in e.target && e.target.files?.[0]) {
      file = e.target.files[0];
    } else if ('dataTransfer' in e && e.dataTransfer.files?.[0]) {
      file = e.dataTransfer.files[0];
    }

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setState(prev => ({ ...prev, error: 'Please upload an image file.' }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      const mimeType = file?.type || 'image/jpeg';

      setActiveImageIndex(0);
      setSelectedTab('uploaded');
      setState({
        loading: true,
        error: null,
        result: null,
        imagePreview: base64String,
      });

      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Data, mimeType }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to analyze image');
        }

        const result: AnalysisResult = await response.json();
        setState(prev => ({ ...prev, result, loading: false }));
      } catch (err: any) {
        setState(prev => ({ 
          ...prev, 
          error: err.message || 'Analysis failed. Please try again.', 
          loading: false 
        }));
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const reset = () => {
    setState({
      loading: false,
      error: null,
      result: null,
      imagePreview: null,
    });
    setTextInput('');
    setActiveImageIndex(0);
    setLightboxImage(null);
  };

  const currentReferenceImage = state.result?.images?.[activeImageIndex];
  const hasImages = (state.result?.images?.length ?? 0) > 0;

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#1D1B16] font-sans antialiased selection:bg-[#E8DEF8]">
      {/* Lightbox Modal for Full Resolution View */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="relative max-w-5xl w-full max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="relative flex-1 bg-black/10 flex items-center justify-center overflow-hidden min-h-[350px]">
                <img
                  src={lightboxImage.url}
                  alt={lightboxImage.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full max-h-[70vh] object-contain"
                />
                <button
                  onClick={() => setLightboxImage(null)}
                  className="absolute top-4 right-4 bg-black/60 hover:bg-black/90 text-white p-2.5 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 bg-white border-t border-[#E6E1D6]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-[#1D1B16]">{lightboxImage.title}</h3>
                    {lightboxImage.caption && (
                      <p className="text-sm text-[#494631] mt-1">{lightboxImage.caption}</p>
                    )}
                  </div>
                  <span className="text-xs font-semibold px-3 py-1.5 bg-[#F7F8F0] text-[#4F6600] rounded-full border border-[#E6E1D6] self-start sm:self-center shrink-0">
                    High Resolution Landscape
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="border-b border-[#E6E1D6] bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={reset}>
            <div className="w-10 h-10 bg-[#4F6600] rounded-xl flex items-center justify-center text-white shadow-md shadow-[#4F6600]/20">
              <Compass size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-[#4F6600]">Biome Expert</h1>
              <p className="text-[10px] text-[#797667] tracking-wider uppercase font-semibold">Terrain & Imagery Intelligence</p>
            </div>
          </div>

          {(state.result || state.imagePreview) && (
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-[#4F6600] hover:text-[#3E5000] bg-[#F7F8F0] hover:bg-[#EBECE0] px-3.5 py-2 rounded-full transition-all border border-[#E6E1D6]"
            >
              <RefreshCw size={14} /> New Query
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Hero Section */}
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-[#1D1B16]">
              Explore Any <span className="text-[#4F6600]">Biome with Imagery</span>
            </h2>
            <p className="text-base md:text-lg text-[#494631] max-w-2xl mx-auto leading-relaxed">
              Search any global or regional landscape by name to retrieve in-depth geographical data alongside authentic landscape photography.
            </p>
          </div>

          {/* Search by Name / Text Query Input */}
          <form onSubmit={handleTextSearch} className="relative max-w-2xl mx-auto">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Enter biome name (e.g., 'Amazon forest', 'Ladakh', 'Sundarbans')..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full pl-12 pr-28 py-4 bg-white border-2 border-[#E6E1D6] focus:border-[#4F6600] rounded-2xl shadow-sm text-base text-[#1D1B16] placeholder-[#797667] focus:outline-none transition-all"
              />
              <Search className="absolute left-4 text-[#797667]" size={20} />
              <button
                type="submit"
                disabled={state.loading || !textInput.trim()}
                className="absolute right-2.5 px-5 py-2.5 bg-[#4F6600] text-white font-bold rounded-xl hover:bg-[#3E5000] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm shadow-md"
              >
                {state.loading ? 'Searching...' : 'Explore'}
              </button>
            </div>
          </form>

          {/* Quick Biome Suggestions */}
          {!state.result && !state.loading && (
            <div className="space-y-3 pt-1">
              <p className="text-xs font-bold text-[#797667] uppercase tracking-widest text-center">
                Popular Landscapes to Explore
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {POPULAR_BIOMES.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      setTextInput(item.name);
                      executeTextSearch(item.name);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#F7F8F0] border border-[#E6E1D6] hover:border-[#4F6600]/40 rounded-full text-xs font-semibold text-[#1D1B16] transition-all hover:scale-105 active:scale-95 shadow-sm"
                  >
                    <span>{item.name}</span>
                    <span className="text-[10px] text-[#797667] font-normal">({item.tag})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Core Interactive Area */}
          <AnimatePresence mode="wait">
            {!state.imagePreview && !state.result && !state.loading ? (
              /* Drag & Drop Upload Zone */
              <motion.div
                key="dropzone"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="pt-2"
              >
                <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-[#E6E1D6]"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#FDFCF8] px-4 font-bold text-[#797667] tracking-wider">
                      Or upload your own landscape photo
                    </span>
                  </div>
                </div>

                <label
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleImageUpload(e);
                  }}
                  className="mt-6 flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-[#D1CCC0] rounded-3xl bg-white cursor-pointer hover:border-[#4F6600] hover:bg-[#F7F8F0]/50 transition-all group shadow-sm"
                >
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-16 h-16 bg-[#F7F8F0] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-[#4F6600]">
                      <Upload size={28} />
                    </div>
                    <p className="mb-1 text-lg font-bold text-[#1D1B16]">
                      Drop your photo here
                    </p>
                    <p className="text-xs text-[#797667]">
                      PNG, JPG, or WEBP up to 10MB
                    </p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              </motion.div>
            ) : (
              /* Results & Active Preview Section */
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid md:grid-cols-2 gap-8 items-start"
              >
                {/* Left Column: Image Viewer with Gallery Selector */}
                <div className="space-y-4">
                  <div className="relative rounded-3xl overflow-hidden bg-white shadow-xl shadow-[#4F6600]/5 border border-[#E6E1D6] group">
                    {/* View Switcher Tabs (if user uploaded photo and also reference photos exist) */}
                    {state.imagePreview && hasImages && (
                      <div className="absolute top-4 left-4 z-20 flex bg-black/60 backdrop-blur-md p-1 rounded-full text-xs font-bold text-white">
                        <button
                          type="button"
                          onClick={() => setSelectedTab('uploaded')}
                          className={`px-3 py-1 rounded-full transition-all ${selectedTab === 'uploaded' ? 'bg-white text-[#1D1B16] shadow-sm' : 'text-white/80 hover:text-white'}`}
                        >
                          Uploaded Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedTab('reference')}
                          className={`px-3 py-1 rounded-full transition-all ${selectedTab === 'reference' ? 'bg-white text-[#1D1B16] shadow-sm' : 'text-white/80 hover:text-white'}`}
                        >
                          Field Photos ({state.result?.images?.length})
                        </button>
                      </div>
                    )}

                    {/* Image Render */}
                    {state.loading ? (
                      <div className="w-full aspect-[4/3] bg-[#F7F8F0] flex flex-col items-center justify-center text-[#4F6600] p-6 text-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                          className="w-16 h-16 rounded-full border-4 border-[#4F6600]/20 border-t-[#4F6600] mb-4 flex items-center justify-center"
                        >
                          <Compass size={28} />
                        </motion.div>
                        <p className="text-lg font-bold text-[#1D1B16]">Analyzing Biome & Loading Photos...</p>
                        <p className="text-xs text-[#797667] mt-1">Retrieving authentic landscape visuals</p>
                      </div>
                    ) : selectedTab === 'uploaded' && state.imagePreview ? (
                      <div className="relative aspect-[4/3] bg-black/5 overflow-hidden">
                        <img
                          src={state.imagePreview}
                          alt="Uploaded user terrain"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => setLightboxImage({ url: state.imagePreview!, title: 'Your Uploaded Landscape' })}
                          className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/90 text-white p-2 rounded-xl backdrop-blur-sm transition-all shadow-md"
                          title="View Full Resolution"
                        >
                          <Maximize2 size={16} />
                        </button>
                      </div>
                    ) : currentReferenceImage ? (
                      <div className="relative aspect-[4/3] bg-black/5 overflow-hidden">
                        <img
                          src={currentReferenceImage.url}
                          alt={currentReferenceImage.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20 pointer-events-none" />
                        
                        {/* Title Overlay */}
                        <div className="absolute bottom-0 inset-x-0 p-4 text-white">
                          <span className="inline-block px-2.5 py-0.5 bg-[#4F6600] text-white text-[10px] font-bold uppercase tracking-wider rounded-md mb-1">
                            Landscape Photography
                          </span>
                          <h4 className="text-base font-bold truncate">{currentReferenceImage.title}</h4>
                          {currentReferenceImage.caption && (
                            <p className="text-xs text-white/80 line-clamp-1 mt-0.5">{currentReferenceImage.caption}</p>
                          )}
                        </div>

                        {/* Expand Button */}
                        <button
                          onClick={() => setLightboxImage(currentReferenceImage)}
                          className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/90 text-white p-2 rounded-xl backdrop-blur-sm transition-all shadow-md z-10"
                          title="Open in High-Resolution Viewer"
                        >
                          <Maximize2 size={16} />
                        </button>
                      </div>
                    ) : (
                      /* Fallback if no images found */
                      <div className="w-full aspect-[4/3] bg-[#F7F8F0] flex flex-col items-center justify-center text-[#4F6600] p-6 text-center">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md mb-3">
                          <MapPin size={32} />
                        </div>
                        <p className="text-lg font-black text-[#1D1B16]">{state.result?.biome}</p>
                        <p className="text-xs text-[#797667]">Terrain Analysis Ready</p>
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Selector Gallery */}
                  {hasImages && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-[#797667]">
                        <span className="flex items-center gap-1.5">
                          <Layers size={14} /> Biome Photo Gallery ({state.result?.images?.length} Photos)
                        </span>
                        <span>Click to view</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {state.result?.images?.map((img, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSelectedTab('reference');
                              setActiveImageIndex(idx);
                            }}
                            className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all group ${
                              selectedTab === 'reference' && activeImageIndex === idx
                                ? 'border-[#4F6600] shadow-md ring-2 ring-[#4F6600]/20 scale-105'
                                : 'border-[#E6E1D6] hover:border-[#4F6600]/50 opacity-80 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={img.url}
                              alt={img.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Detailed Biome Information */}
                <div className="space-y-5">
                  {state.error && (
                    <div className="p-4 bg-[#FFDAD6] text-[#410002] rounded-2xl flex items-center gap-3 border border-[#BA1A1A]/20">
                      <AlertCircle size={20} className="shrink-0" />
                      <p className="text-sm font-medium">{state.error}</p>
                    </div>
                  )}

                  {state.result && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-5"
                    >
                      {state.result.biome && !state.result.errorMessage ? (
                        <>
                          {/* Biome Title & Badges */}
                          <div className="bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#D8E7AB] text-[#151E00] rounded-full text-xs font-bold uppercase tracking-wider">
                                <CheckCircle2 size={13} /> 
                                {state.result.isIndiaLandscape ? 'Indian Biome' : 'Global Biome'}
                              </span>
                              {hasImages && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F7F8F0] text-[#4F6600] rounded-full text-xs font-semibold border border-[#E6E1D6]">
                                  <ImageIcon size={12} /> {state.result.images?.length} Photos Loaded
                                </span>
                              )}
                            </div>
                            <h3 className="text-2xl md:text-3xl font-black text-[#1D1B16] leading-tight">
                              {state.result.biome}
                            </h3>
                          </div>

                          {/* Visual Markers Section */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-[#797667] uppercase tracking-widest flex items-center gap-2">
                              <Camera size={14} className="text-[#4F6600]" /> Identified Visual Markers
                            </h4>
                            <div className="grid gap-2.5">
                              {state.result.visualMarkers.map((marker, idx) => (
                                <motion.div
                                  initial={{ opacity: 0, x: 10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.08 }}
                                  key={idx}
                                  className="flex items-start gap-3 p-3.5 bg-white rounded-2xl border border-[#E6E1D6] hover:border-[#4F6600]/40 transition-colors shadow-sm"
                                >
                                  <div className="w-6 h-6 rounded-full bg-[#F7F8F0] flex items-center justify-center text-[#4F6600] shrink-0 mt-0.5">
                                    <ChevronRight size={14} />
                                  </div>
                                  <span className="text-sm font-medium text-[#1D1B16] leading-snug">{marker}</span>
                                </motion.div>
                              ))}
                            </div>
                          </div>

                          {/* Geographic Context */}
                          <div className="p-5 bg-white rounded-3xl border border-[#E6E1D6] space-y-2 shadow-sm">
                            <h4 className="text-xs font-bold text-[#797667] uppercase tracking-widest flex items-center gap-2">
                              <Info size={14} className="text-[#4F6600]" /> Geographic & Climatic Context
                            </h4>
                            <p className="text-sm text-[#494631] leading-relaxed">
                              {state.result.geographicContext}
                            </p>
                          </div>

                          {/* Environmental & Conservation Status */}
                          <div className="p-5 bg-[#F7F8F0] rounded-3xl border border-[#E6E1D6] space-y-2">
                            <h4 className="text-xs font-bold text-[#4F6600] uppercase tracking-widest flex items-center gap-2">
                              <ShieldAlert size={14} /> Ecological Sensitivity & Status
                            </h4>
                            <p className="text-sm text-[#494631] leading-relaxed">
                              {state.result.environmentalStatus}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="p-8 bg-white rounded-3xl border-2 border-[#BA1A1A]/20 text-center space-y-4 shadow-sm">
                          <div className="w-14 h-14 bg-[#FFDAD6] text-[#BA1A1A] rounded-2xl flex items-center justify-center mx-auto mb-2">
                            <AlertCircle size={28} />
                          </div>
                          <h3 className="text-xl font-black text-[#1D1B16]">Region Could Not Be Confirmed</h3>
                          <p className="text-sm text-[#494631] leading-relaxed">
                            {state.result.errorMessage || "This input could not be matched with a clear physical landform or biome. Please try another specific landscape name or upload a clear photo."}
                          </p>
                          <button
                            onClick={reset}
                            className="px-6 py-2.5 bg-[#4F6600] text-white rounded-full text-sm font-bold hover:bg-[#3E5000] transition-colors shadow-md"
                          >
                            Try Another Query
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-[#E6E1D6] py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-[#4F6600]">
            <Globe2 size={18} />
            <span className="font-bold tracking-tight text-sm">Biome Expert</span>
          </div>
          <p className="text-xs text-[#797667]">
            Comprehensive global geographical intelligence and visual identification.
          </p>
        </div>
      </footer>
    </div>
  );
}
