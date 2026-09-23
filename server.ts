import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { findCuratedBiome, CURATED_BIOMES } from './src/curatedBiomes';

dotenv.config();

const app = express();
const port = 3000;

// Increase limit for base64 images
app.use(express.json({ limit: '10mb' }));

let aiClient: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing. Please add GEMINI_API_KEY to your Vercel Project Settings > Environment Variables.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function generateContentWithRetry(parts: any[], retryCount = 0): Promise<any> {
  const models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  const currentModel = models[Math.min(retryCount, models.length - 1)];

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: currentModel,
      contents: [{ parts }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            biome: { type: Type.STRING },
            visualMarkers: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            geographicContext: { type: Type.STRING },
            environmentalStatus: { type: Type.STRING },
            isIndiaLandscape: { type: Type.BOOLEAN },
            climaticData: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  month: { type: Type.STRING },
                  tempLow: { type: Type.NUMBER, description: "Average monthly low temperature in Celsius" },
                  tempHigh: { type: Type.NUMBER, description: "Average monthly high temperature in Celsius" },
                  precipitation: { type: Type.NUMBER, description: "Average monthly precipitation in mm" }
                },
                required: ['month', 'tempLow', 'tempHigh', 'precipitation']
              }
            },
            searchKeyword: { 
              type: Type.STRING,
              description: "Clean Wikipedia or geographical search term for the landscape or national park (e.g. 'Amazon rainforest', 'Western Ghats', 'Sundarbans')"
            },
            errorMessage: { type: Type.STRING }
          },
          required: ['biome', 'visualMarkers', 'geographicContext', 'environmentalStatus', 'isIndiaLandscape']
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error: any) {
    const errStr = String(error?.message || error || '');
    const isRetryable = error?.status === 503 || 
      error?.status === 429 || 
      errStr.includes('high demand') || 
      errStr.includes('503') || 
      errStr.includes('UNAVAILABLE') || 
      errStr.includes('RESOURCE_EXHAUSTED') ||
      errStr.includes('overloaded');
    
    if (isRetryable && retryCount < 2) {
      const delay = Math.pow(2, retryCount) * 1000;
      console.log(`Retrying with fallback model due to high demand (attempt ${retryCount + 1}). Delay: ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateContentWithRetry(parts, retryCount + 1);
    }
    throw error;
  }
}

async function fetchWithTimeout(url: string, timeoutMs = 3500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'BiomeExpertApp/1.0 (landscape-geography-app)' },
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchBiomeImages(keyword: string | undefined, biomeName: string, textQuery?: string) {
  // 1. Check verified, geographically authenticated curated biome photo catalog
  const curated = findCuratedBiome(textQuery, biomeName) || (keyword ? findCuratedBiome(keyword, undefined) : null);
  if (curated && curated.photos.length > 0) {
    return curated.photos.map(p => ({
      url: p.url,
      title: p.title,
      caption: p.caption
    }));
  }

  const images: Array<{ url: string; title: string; caption?: string }> = [];
  const seenFiles = new Set<string>();
  const badPatterns = /\b(map|locator|flag|coat of arms|seal|emblem|icon|logo|chart|diagram|stamp|location|district|state|border|route|schema|symbol|infobox|svg|gulfs)\b/i;

  const searchCandidates = [
    keyword,
    textQuery,
    biomeName,
    biomeName?.replace(/of.*/i, '').trim(),
  ].filter((t): t is string => Boolean(t && t.trim().length > 1));

  for (const term of searchCandidates) {
    if (images.length >= 4) break;
    const cleanTerm = term.trim();

    // 2. Direct page summary from Wikipedia
    try {
      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanTerm.replace(/\s+/g, '_'))}`;
      const res = await fetchWithTimeout(summaryUrl, 3000);
      if (res && res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          const img = data.originalimage?.source || data.thumbnail?.source;
          if (img && !badPatterns.test(img)) {
            const fn = img.split('/').pop()?.replace(/^\d+px-/, '') || img;
            if (!seenFiles.has(fn)) {
              seenFiles.add(fn);
              images.push({
                url: img,
                title: data.title || cleanTerm,
                caption: data.description || data.extract?.slice(0, 120) || data.title,
              });
            }
          }
        }
      }
    } catch {
      // ignore network errors on individual lookups
    }

    // 3. Direct images embedded inside the canonical article
    try {
      const articleImagesUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(cleanTerm)}&generator=images&gimlimit=30&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=1280&format=json&origin=*`;
      const aiRes = await fetchWithTimeout(articleImagesUrl, 3000);
      if (aiRes && aiRes.ok) {
        const contentType = aiRes.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await aiRes.json();
          const pages = Object.values(data.query?.pages || {}) as any[];
          for (const p of pages) {
            const info = p.imageinfo?.[0];
            if (!info) continue;
            if (badPatterns.test(p.title) || badPatterns.test(info.url || '')) continue;
            if (!info.mime?.startsWith('image/jpeg') && !info.mime?.startsWith('image/webp')) continue;
            if (info.width && info.width < 400) continue;
            const fn = (info.thumburl || info.url || '').split('/').pop() || p.title;
            if (!seenFiles.has(fn)) {
              seenFiles.add(fn);
              const cleanTitle = p.title.replace(/^File:/, '').replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
              images.push({
                url: info.thumburl || info.url,
                title: cleanTitle,
                caption: `${cleanTerm} - ${cleanTitle}`
              });
              if (images.length >= 4) break;
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // 4. Secondary fallback: match closest ecological biome type in curated library
  if (images.length === 0) {
    const fallbackCurated = findCuratedBiome(undefined, biomeName) || findCuratedBiome(undefined, keyword);
    if (fallbackCurated && fallbackCurated.photos.length > 0) {
      return fallbackCurated.photos.map(p => ({
        url: p.url,
        title: p.title,
        caption: p.caption
      }));
    }
  }

  return images;
}

const analyzeHandler: express.RequestHandler = async (req, res) => {
  try {
    const { image, mimeType, textQuery } = req.body;

    if (!image && !textQuery) {
      res.status(400).json({ error: 'Either image or textQuery is required' });
      return;
    }

    const prompt = `You are an AI visual and geographical expert trained in identifying physical landforms and biomes.
    
${image ? 'Analyze the provided image.' : `Analyze the following region/biome: "${textQuery}".`}

Identify the biome or geographical zone with high precision.
If it's in India, provide specific details. If it's a global biome (such as the Amazon rainforest, Sahara Desert, or Serengeti), provide accurate global details.

Provide your response in JSON format with the following structure:
{
  "biome": "Precise name of the biome/region (e.g., 'Amazon Rainforest', 'Cold Desert of Ladakh', 'Sundarbans Mangroves', 'Western Ghats Shola', 'Great Rann of Kutch', 'Thar Desert Dunes')",
  "visualMarkers": ["terrain/vegetation marker 1", "marker 2", "marker 3"],
  "geographicContext": "Detailed explanation of climate, altitude, and physical geography",
  "environmentalStatus": "Conservation notes and climate sensitivity",
  "isIndiaLandscape": true/false,
  "climaticData": [
    { "month": "Jan", "tempLow": 10, "tempHigh": 20, "precipitation": 5 },
    { "month": "Feb", "tempLow": 12, "tempHigh": 22, "precipitation": 10 },
    ... continue for all 12 months with accurate data for this specific biome
  ],
  "searchKeyword": "Exact canonical Wikipedia article title for this location/landform (e.g. 'Amazon rainforest', 'Ladakh', 'Sundarbans', 'Western Ghats', 'Great Rann of Kutch', 'Thar Desert', 'Spiti Valley', 'Kaziranga National Park', 'Valley of Flowers National Park')",
  "errorMessage": "Polite error message if the input is invalid or unclear"
}

For text-only queries, base your "visualMarkers" on typical characteristics one would see in photos of that region.`;

    const parts: any[] = [{ text: prompt }];
    if (image && mimeType) {
      parts.push({ inlineData: { data: image, mimeType } });
    }

    const result = await generateContentWithRetry(parts);

    // Verify & enrich climaticData from verified curated catalog if missing or incomplete
    if (result && result.biome && (!result.climaticData || result.climaticData.length < 12)) {
      const curatedMatch = findCuratedBiome(textQuery, result.biome);
      if (curatedMatch && curatedMatch.climaticData) {
        result.climaticData = curatedMatch.climaticData;
      }
    }

    // Fetch authentic images for the identified biome
    if (result && result.biome) {
      try {
        const fetchedImages = await fetchBiomeImages(result.searchKeyword, result.biome, textQuery);
        result.images = fetchedImages;
      } catch (e) {
        console.error('Image fetch error:', e);
        result.images = [];
      }
    }

    res.json(result);
  } catch (error: any) {
    console.error('Analysis error:', error);
    
    // Check if error can be gracefully resolved via curated catalog for text queries
    if (req.body?.textQuery) {
      const curated = findCuratedBiome(req.body.textQuery);
      if (curated) {
        console.log(`Serving curated fallback for "${req.body.textQuery}" due to API unavailability.`);
        res.json({
          biome: curated.canonicalName,
          visualMarkers: curated.visualMarkers,
          geographicContext: curated.geographicContext,
          environmentalStatus: curated.environmentalStatus,
          isIndiaLandscape: curated.isIndiaLandscape,
          climaticData: curated.climaticData,
          images: curated.photos,
          searchKeyword: curated.canonicalName
        });
        return;
      }
    }

    // Check if error is missing API key
    if (error?.message?.includes('GEMINI_API_KEY environment variable is missing')) {
      res.status(500).json({ 
        error: 'GEMINI_API_KEY is not configured on this server. Please add GEMINI_API_KEY to your Vercel Project Settings > Environment Variables.' 
      });
      return;
    }

    // Handle high demand (503) specifically
    const errStr = String(error?.message || error || '');
    if (error?.status === 503 || error?.status === 429 || errStr.includes('high demand') || errStr.includes('503') || errStr.includes('UNAVAILABLE') || errStr.includes('RESOURCE_EXHAUSTED')) {
      res.status(503).json({ 
        error: 'The AI service is currently experiencing very high demand. Please try again in a moment.' 
      });
      return;
    }

    res.status(500).json({ error: error?.message || 'Failed to analyze request. Please try again later.' });
  }
};

// Route handlers - support both /api prefix and root for Vercel serverless functions
app.post('/api/analyze', analyzeHandler);
app.post('/analyze', analyzeHandler);

const healthHandler: express.RequestHandler = (req, res) => {
  res.json({ 
    status: 'ok', 
    serverless: Boolean(process.env.VERCEL),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY)
  });
};
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

export default app;

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

// Only listen directly when running standalone (not inside Vercel serverless runtime)
if (!process.env.VERCEL) {
  startServer();
}
