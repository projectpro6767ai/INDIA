/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
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
  Image as ImageIcon,
  Bookmark,
  BookmarkCheck,
  Trash2,
  LogIn,
  LogOut,
  FolderHeart,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ClimaticChart from './components/ClimaticChart';
import { findCuratedBiome } from './curatedBiomes';
import type { AnalysisState, AnalysisResult } from './types';
import { 
  auth, 
  onAuthStateChanged, 
  signInWithGoogle, 
  logOut, 
  type User,
  saveBiomeRecord, 
  deleteSavedBiomeRecord, 
  subscribeSavedBiomes, 
  type SavedBiomeDoc,
  logAnalyticsEvent 
} from './firebase';

const POPULAR_BIOMES = [
  { name: 'Amazon Rainforest', tag: 'Tropical Jungle' },
  { name: 'Cold Desert of Ladakh', tag: 'High-Altitude' },
  { name: 'Sundarbans Mangroves', tag: 'Tidal Delta' },
  { name: 'Western Ghats Shola', tag: 'Montane Forest' },
  { name: 'Great Rann of Kutch', tag: 'White Salt Desert' },
  { name: 'Thar Desert Dunes', tag: 'Arid Sand Dunes' },
  { name: 'Spiti Valley', tag: 'Trans-Himalayan' },
  { name: 'Kaziranga Grasslands', tag: 'Alluvial Savanna' },
  { name: 'Valley of Flowers', tag: 'Alpine Meadow' },
  { name: 'Sahara Desert', tag: 'Erg Sand Sea' },
  { name: 'Serengeti Savanna', tag: 'Acacia Plain' },
  { name: 'Taiga Boreal Forest', tag: 'Subarctic Conifer' },
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

  // Firebase Auth & Firestore Saved Biomes State
  const [user, setUser] = useState<User | null>(null);
  const [savedBiomes, setSavedBiomes] = useState<SavedBiomeDoc[]>([]);
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [authError, setAuthError] = useState<string | null>(null);

  // Subscribe to Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to Firestore saved biomes when user is logged in
  useEffect(() => {
    if (!user) {
      setSavedBiomes([]);
      return;
    }

    const unsubscribe = subscribeSavedBiomes(
      user.uid,
      (items) => {
        setSavedBiomes(items);
      },
      (err) => {
        console.error("Failed to sync saved biomes from Firestore:", err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
      logAnalyticsEvent('login', { method: 'Google' });
    } catch (err: any) {
      // Gracefully handle voluntary user cancellation without throwing alarming errors
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('popup-closed-by-user') ||
        err?.message?.includes('cancelled-popup-request')
      ) {
        console.debug('Google sign-in popup was dismissed by user.');
        return;
      }

      if (
        err?.code === 'auth/unauthorized-domain' ||
        err?.message?.includes('unauthorized-domain')
      ) {
        setAuthError('Domain Authorization Required: Add your Vercel domain to Firebase Console > Authentication > Settings > Authorized domains.');
        return;
      }

      if (
        err?.code === 'auth/popup-blocked' ||
        err?.message?.includes('popup-blocked')
      ) {
        setAuthError('The sign-in popup was blocked by your browser. Please enable popups for this site and try again.');
        return;
      }

      console.warn('Sign in was not completed:', err?.message || err);
      setAuthError(err?.message || 'Google sign in could not be completed. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      setIsSavedDrawerOpen(false);
    } catch (err: any) {
      console.error("Sign out failed:", err);
    }
  };

  const executeTextSearch = async (query: string) => {
    if (!query.trim()) return;

    logAnalyticsEvent('search_biome', { query });
    setActiveImageIndex(0);
    setSavingStatus('idle');
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

      const contentType = response.headers.get('content-type') || '';

      if (!response.ok) {
        let errMsg = 'Failed to analyze region';
        try {
          if (contentType.includes('application/json')) {
            const errorData = await response.json();
            if (errorData.error) errMsg = errorData.error;
          } else {
            const text = await response.text();
            if (response.status === 404 || text.includes('404')) {
              errMsg = 'API endpoint not found. Ensure serverless functions and GEMINI_API_KEY environment variable are deployed.';
            } else {
              errMsg = `Server error (status ${response.status}).`;
            }
          }
        } catch {
          errMsg = `Server error (${response.status}).`;
        }
        throw new Error(errMsg);
      }

      if (!contentType.includes('application/json')) {
        const offlineCurated = findCuratedBiome(query);
        if (offlineCurated) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: null,
            result: {
              biome: offlineCurated.canonicalName,
              isIndiaLandscape: offlineCurated.isIndiaLandscape,
              visualMarkers: offlineCurated.visualMarkers,
              geographicContext: offlineCurated.geographicContext,
              environmentalStatus: offlineCurated.environmentalStatus,
              climaticData: offlineCurated.climaticData,
              images: offlineCurated.photos,
            },
            imagePreview: null,
          }));
          return;
        }
        throw new Error('Server returned an unexpected non-JSON response. Please verify deployment settings.');
      }

      const result: AnalysisResult = await response.json();

      // Validate result format on client
      const rawBiome = String(result?.biome || '').trim();
      const isInvalid = !rawBiome || 
        ['n/a', 'na', 'none', 'unknown', 'invalid', 'null', 'undefined', 'not applicable', 'unidentified'].includes(rawBiome.toLowerCase());
      if (isInvalid) {
        result.biome = '';
        result.errorMessage = result.errorMessage || `"${query}" is not recognized as a natural landscape or biome. Please enter a valid biome (e.g., Western Ghats, Amazon Rainforest, Cold Desert of Ladakh, Thar Desert, or Sundarbans).`;
        result.images = [];
        result.climaticData = [];
      } else {
        // Client-side fallback enrichment if climaticData or images are missing
        const curatedMatch = findCuratedBiome(query, result?.biome);
        if (curatedMatch) {
          if (!result.climaticData || result.climaticData.length === 0) {
            result.climaticData = curatedMatch.climaticData;
          }
          if (!result.images || result.images.length === 0) {
            result.images = curatedMatch.photos;
          }
        }
      }

      if (result.biome) {
        logAnalyticsEvent('biome_identified', { 
          biome: result.biome, 
          isIndia: result.isIndiaLandscape,
          hasImages: (result.images?.length ?? 0) > 0 
        });
      }
      setState(prev => ({ ...prev, result, loading: false }));
    } catch (err: any) {
      logAnalyticsEvent('search_error', { error: err.message });
      
      // Client-side instant offline/resilience fallback for curated biomes
      const offlineCurated = findCuratedBiome(query);
      if (offlineCurated) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: null,
          result: {
            biome: offlineCurated.canonicalName,
            isIndiaLandscape: offlineCurated.isIndiaLandscape,
            visualMarkers: offlineCurated.visualMarkers,
            geographicContext: offlineCurated.geographicContext,
            environmentalStatus: offlineCurated.environmentalStatus,
            climaticData: offlineCurated.climaticData,
            images: offlineCurated.photos,
          },
          imagePreview: null,
        }));
        return;
      }

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
      setSavingStatus('idle');
      logAnalyticsEvent('upload_image', { mimeType });
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

        const contentType = response.headers.get('content-type') || '';

        if (!response.ok) {
          let errMsg = 'Failed to analyze image';
          try {
            if (contentType.includes('application/json')) {
              const errorData = await response.json();
              if (errorData.error) errMsg = errorData.error;
            } else {
              const text = await response.text();
              if (response.status === 404 || text.includes('404')) {
                errMsg = 'API endpoint not found. Ensure serverless functions and GEMINI_API_KEY environment variable are deployed.';
              } else {
                errMsg = `Server error (status ${response.status}).`;
              }
            }
          } catch {
            errMsg = `Server error (${response.status}).`;
          }
          throw new Error(errMsg);
        }

        if (!contentType.includes('application/json')) {
          throw new Error('Server returned an unexpected non-JSON response. Please verify deployment settings.');
        }

        const result: AnalysisResult = await response.json();

        // Validate that image resulted in an actual biome
        const rawBiome = String(result?.biome || '').trim();
        const isInvalid = !rawBiome || 
          ['n/a', 'na', 'none', 'unknown', 'invalid', 'null', 'undefined', 'not applicable', 'unidentified'].includes(rawBiome.toLowerCase());
        if (isInvalid) {
          result.biome = '';
          result.errorMessage = result.errorMessage || "The uploaded image does not appear to show an outdoor natural landscape or biome. Please upload a clear photo of natural terrain, vegetation, or a landform.";
          result.images = [];
          result.climaticData = [];
        } else {
          // Enrich climaticData from curated catalog if missing
          if (!result.climaticData || result.climaticData.length === 0) {
            const curatedMatch = findCuratedBiome(undefined, result.biome);
            if (curatedMatch && curatedMatch.climaticData) {
              result.climaticData = curatedMatch.climaticData;
            }
          }
        }

        if (result.biome) {
          logAnalyticsEvent('biome_identified_from_image', { 
            biome: result.biome, 
            isIndia: result.isIndiaLandscape 
          });
        }
        setState(prev => ({ ...prev, result, loading: false }));
      } catch (err: any) {
        logAnalyticsEvent('upload_analyze_error', { error: err.message });
        setState(prev => ({ 
          ...prev, 
          error: err.message || 'Analysis failed. Please try again.', 
          loading: false 
        }));
      }
    };
    reader.readAsDataURL(file);
  }, []);

  // Save current biome to Firestore
  const handleSaveToFirestore = async () => {
    if (!state.result || !state.result.biome) return;

    if (!user) {
      await handleGoogleSignIn();
      return;
    }

    setSavingStatus('saving');
    try {
      const currentPhoto = state.imagePreview || state.result.images?.[0]?.url;
      await saveBiomeRecord({
        biomeName: state.result.biome,
        isIndiaLandscape: Boolean(state.result.isIndiaLandscape),
        visualMarkers: state.result.visualMarkers || [],
        geographicContext: state.result.geographicContext || '',
        environmentalStatus: state.result.environmentalStatus || '',
        imageUrl: currentPhoto,
      });
      setSavingStatus('saved');
      logAnalyticsEvent('save_biome', { biome: state.result.biome });
    } catch (err) {
      console.error("Error saving to Firestore:", err);
      setSavingStatus('error');
    }
  };

  const handleDeleteSavedBiome = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteSavedBiomeRecord(id);
    } catch (err) {
      console.error("Error deleting saved biome:", err);
    }
  };

  const loadSavedBiome = (saved: SavedBiomeDoc) => {
    const curatedMatch = findCuratedBiome(saved.biomeName, saved.biomeName);
    setState({
      loading: false,
      error: null,
      result: {
        biome: saved.biomeName,
        isIndiaLandscape: saved.isIndiaLandscape,
        visualMarkers: saved.visualMarkers,
        geographicContext: saved.geographicContext,
        environmentalStatus: saved.environmentalStatus,
        climaticData: curatedMatch?.climaticData,
        images: saved.imageUrl ? [{ url: saved.imageUrl, title: saved.biomeName }] : (curatedMatch?.photos || []),
      },
      imagePreview: saved.imageUrl || null,
    });
    setSelectedTab(saved.imageUrl?.startsWith('data:') ? 'uploaded' : 'reference');
    setIsSavedDrawerOpen(false);
  };

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
    setSavingStatus('idle');
  };

  const currentReferenceImage = state.result?.images?.[activeImageIndex];
  const hasImages = (state.result?.images?.length ?? 0) > 0;
  const isCurrentBiomeSaved = savedBiomes.some(b => b.biomeName === state.result?.biome);

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

      {/* Saved Biomes Slide-Over Drawer */}
      <AnimatePresence>
        {isSavedDrawerOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSavedDrawerOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs" 
            />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-screen max-w-md bg-[#FDFCF8] border-l border-[#E6E1D6] shadow-2xl flex flex-col"
              >
                <div className="p-6 border-b border-[#E6E1D6] bg-white flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#4F6600]">
                    <Database size={20} />
                    <h3 className="font-black text-lg text-[#1D1B16]">Saved Biomes</h3>
                    <span className="text-xs bg-[#F7F8F0] text-[#4F6600] px-2 py-0.5 rounded-full border border-[#E6E1D6] font-bold">
                      {savedBiomes.length}
                    </span>
                  </div>
                  <button 
                    onClick={() => setIsSavedDrawerOpen(false)}
                    className="p-2 hover:bg-[#F7F8F0] rounded-full text-[#797667] transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {!user ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-[#E6E1D6] space-y-3">
                      <LogIn className="mx-auto text-[#4F6600]" size={32} />
                      <p className="font-bold text-[#1D1B16]">Sign in to View Saved Biomes</p>
                      <p className="text-xs text-[#797667]">
                        Sign in with your Google account to sync your saved biomes securely in Firestore.
                      </p>
                      <button
                        onClick={handleGoogleSignIn}
                        className="mt-2 px-5 py-2.5 bg-[#4F6600] text-white rounded-full font-bold text-xs hover:bg-[#3E5000] transition-colors shadow-md"
                      >
                        Sign in with Google
                      </button>
                    </div>
                  ) : savedBiomes.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-[#E6E1D6] space-y-3">
                      <FolderHeart className="mx-auto text-[#797667]" size={32} />
                      <p className="font-bold text-[#1D1B16]">No Saved Biomes Yet</p>
                      <p className="text-xs text-[#797667]">
                        Explore any landform or upload a photo, then tap "Save to Firestore" to bookmark it here.
                      </p>
                    </div>
                  ) : (
                    savedBiomes.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => loadSavedBiome(item)}
                        className="bg-white p-4 rounded-2xl border border-[#E6E1D6] hover:border-[#4F6600] transition-all cursor-pointer group shadow-xs hover:shadow-md relative"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D8E7AB] text-[#151E00] uppercase tracking-wider">
                              {item.isIndiaLandscape ? 'Indian Biome' : 'Global Biome'}
                            </span>
                            <h4 className="font-bold text-[#1D1B16] text-base group-hover:text-[#4F6600] transition-colors">
                              {item.biomeName}
                            </h4>
                            <p className="text-xs text-[#797667] line-clamp-2">
                              {item.geographicContext}
                            </p>
                          </div>
                          <button
                            onClick={(e) => handleDeleteSavedBiome(item.id, e)}
                            className="text-[#797667] hover:text-[#BA1A1A] p-1.5 hover:bg-[#FFDAD6]/50 rounded-lg transition-colors"
                            title="Delete from Firestore"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="border-b border-[#E6E1D6] bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={reset}>
            <div className="w-10 h-10 bg-[#4F6600] rounded-xl flex items-center justify-center text-white shadow-md shadow-[#4F6600]/20">
              <Compass size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-[#4F6600]">Biome Expert</h1>
              <p className="text-[10px] text-[#797667] tracking-wider uppercase font-semibold">Terrain & Imagery Intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {/* Saved Biomes Drawer Toggle */}
            <button
              onClick={() => setIsSavedDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs md:text-sm font-bold text-[#4F6600] bg-[#F7F8F0] hover:bg-[#EBECE0] px-3.5 py-2 rounded-full transition-all border border-[#E6E1D6]"
            >
              <Bookmark size={15} />
              <span className="hidden sm:inline">Saved</span>
              {savedBiomes.length > 0 && (
                <span className="w-5 h-5 bg-[#4F6600] text-white rounded-full text-[10px] flex items-center justify-center">
                  {savedBiomes.length}
                </span>
              )}
            </button>

            {/* Auth Button */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F7F8F0] rounded-full border border-[#E6E1D6]">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'User'} 
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full object-cover" 
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#4F6600] text-white text-xs flex items-center justify-center font-bold">
                      {user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="text-xs font-bold text-[#1D1B16] hidden md:inline max-w-[120px] truncate">
                    {user.displayName || user.email}
                  </span>
                </div>
                <button
                  onClick={handleGoogleSignIn}
                  className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-[#4F6600] hover:text-[#3E5000] px-2.5 py-1 rounded-full hover:bg-[#EBECE0] bg-[#F7F8F0] border border-[#E6E1D6] transition-colors"
                  title="Switch to another Google Account"
                >
                  Switch
                </button>
                <button
                  onClick={handleSignOut}
                  className="p-2 hover:bg-[#FFDAD6]/50 rounded-full text-[#BA1A1A] transition-colors"
                  title="Sign out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                className="inline-flex items-center gap-1.5 text-xs md:text-sm font-bold bg-[#4F6600] hover:bg-[#3E5000] text-white px-3.5 py-2 rounded-full transition-all shadow-sm"
              >
                <LogIn size={15} />
                <span>Sign in</span>
              </button>
            )}

            {(state.result || state.imagePreview) && (
              <button
                onClick={reset}
                className="inline-flex items-center gap-1.5 text-xs md:text-sm font-bold text-[#4F6600] hover:text-[#3E5000] bg-[#F7F8F0] hover:bg-[#EBECE0] px-3 py-2 rounded-full transition-all border border-[#E6E1D6]"
                title="New Query"
              >
                <RefreshCw size={14} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {authError && (
            <div className="p-4 bg-[#FFDAD6] text-[#410002] rounded-2xl flex items-center justify-between gap-3 border border-[#BA1A1A]/20">
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle size={18} className="shrink-0" />
                <span>{authError}</span>
              </div>
              <button onClick={() => setAuthError(null)} className="text-xs font-bold hover:underline">
                Dismiss
              </button>
            </div>
          )}

          {/* Hero Section */}
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-[#1D1B16]">
              Explore Any <span className="text-[#4F6600]">Biome with Imagery</span>
            </h2>
            <p className="text-base md:text-lg text-[#494631] max-w-2xl mx-auto leading-relaxed">
              Search any global or regional landscape by name or photo to view geological intelligence, authentic photography, and save findings directly to Firestore.
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
                          {/* Biome Title & Action Bar */}
                          <div className="bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-4">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
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

                              {/* Firestore Save / Bookmark Button */}
                              <button
                                onClick={handleSaveToFirestore}
                                disabled={savingStatus === 'saving'}
                                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs border ${
                                  isCurrentBiomeSaved || savingStatus === 'saved'
                                    ? 'bg-[#D8E7AB] text-[#151E00] border-[#D8E7AB]'
                                    : 'bg-[#F7F8F0] text-[#4F6600] border-[#E6E1D6] hover:bg-[#4F6600] hover:text-white'
                                }`}
                              >
                                {savingStatus === 'saving' ? (
                                  <>
                                    <RefreshCw size={13} className="animate-spin" />
                                    <span>Saving...</span>
                                  </>
                                ) : isCurrentBiomeSaved || savingStatus === 'saved' ? (
                                  <>
                                    <BookmarkCheck size={14} />
                                    <span>Saved in Firestore</span>
                                  </>
                                ) : (
                                  <>
                                    <Bookmark size={14} />
                                    <span>Save to Firestore</span>
                                  </>
                                )}
                              </button>
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
                            {state.result.climaticData && (
                              <ClimaticChart data={state.result.climaticData} />
                            )}
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

      {/* Footer with Live Firebase Connection Information */}
      <footer className="mt-20 border-t border-[#E6E1D6] py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-[#4F6600]">
            <Globe2 size={18} />
            <span className="font-bold tracking-tight text-sm">Biome Expert</span>
          </div>
          <p className="text-xs text-[#797667]">
            Comprehensive global geographical intelligence and visual identification.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-[11px] text-[#797667]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Firebase Provisioned & Enabled</span>
            </span>
            <span className="hidden sm:inline">•</span>
            <span>Firestore DB: <code className="bg-[#F7F8F0] px-1.5 py-0.5 rounded border border-[#E6E1D6] font-mono text-[#4F6600]">india999-e2749</code></span>
            <span className="hidden sm:inline">•</span>
            <span>Security Rules: <span className="font-semibold text-emerald-700">Enforced & Active</span></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
