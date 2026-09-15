import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3000;

// Increase limit for base64 images
app.use(express.json({ limit: '10mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function generateContentWithRetry(parts: any[], retryCount = 0): Promise<any> {
  const models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
  const currentModel = models[Math.min(retryCount, models.length - 1)];

  try {
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
    const isRetryable = error?.status === 503 || error?.message?.includes('high demand') || error?.message?.includes('503');
    
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
  const images: Array<{ url: string; title: string; caption?: string }> = [];
  const seenFiles = new Set<string>();

  const searchCandidates = [
    keyword,
    textQuery,
    biomeName,
    biomeName?.replace(/of.*/i, '').trim(),
  ].filter((t): t is string => Boolean(t && t.trim().length > 1));

  for (const term of searchCandidates) {
    if (images.length >= 4) break;
    const cleanTerm = term.trim();

    // 1. Check direct page summary
    try {
      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanTerm.replace(/\s+/g, '_'))}`;
      const res = await fetchWithTimeout(summaryUrl);
      if (res && res.ok) {
        const data = await res.json();
        const img = data.originalimage?.source || data.thumbnail?.source;
        if (img && !img.includes('.svg') && !img.includes('.ogg')) {
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
    } catch (err) {
      // ignore network errors on individual lookups
    }

    // 2. Search related landscape articles
    try {
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${encodeURIComponent(cleanTerm + ' landscape')}&gsrlimit=6&prop=pageimages&piprop=thumbnail|original&pithumbsize=1280`;
      const sRes = await fetchWithTimeout(searchUrl);
      if (sRes && sRes.ok) {
        const sData = await sRes.json();
        const pages = Object.values(sData.query?.pages || {}) as any[];
        for (const p of pages) {
          const imgUrl = p.thumbnail?.source || p.original?.source;
          if (imgUrl && !imgUrl.includes('.svg') && !imgUrl.includes('.ogg')) {
            const fn = imgUrl.split('/').pop()?.replace(/^\d+px-/, '') || imgUrl;
            if (!seenFiles.has(fn)) {
              seenFiles.add(fn);
              images.push({
                url: imgUrl,
                title: p.title,
                caption: p.title,
              });
              if (images.length >= 4) break;
            }
          }
        }
      }
    } catch (err) {
      // ignore
    }
  }

  return images;
}

app.post('/api/analyze', async (req, res) => {
  try {
    const { image, mimeType, textQuery } = req.body;

    if (!image && !textQuery) {
      return res.status(400).json({ error: 'Either image or textQuery is required' });
    }

    const prompt = `You are an AI visual and geographical expert trained in identifying physical landforms and biomes.
    
${image ? 'Analyze the provided image.' : `Analyze the following region/biome: "${textQuery}".`}

Identify the biome or geographical zone. 
If it's in India, provide specific details. If it's a global biome (like the Amazon forest), provide accurate global details.

Provide your response in JSON format with the following structure:
{
  "biome": "Name of the biome/region",
  "visualMarkers": ["marker 1", "marker 2", "marker 3"],
  "geographicContext": "Detailed explanation of climate, altitude, and physical geography",
  "environmentalStatus": "Conservation notes and climate sensitivity",
  "isIndiaLandscape": true/false (Set to true if it is an Indian landscape, false otherwise),
  "searchKeyword": "Concise canonical name for search (e.g. 'Amazon rainforest', 'Ladakh cold desert', 'Sundarbans', 'Thar Desert')",
  "errorMessage": "Polite error message if the input is invalid or unclear"
}

For text-only queries, base your "visualMarkers" on typical characteristics one would see in photos of that region.`;

    const parts: any[] = [{ text: prompt }];
    if (image && mimeType) {
      parts.push({ inlineData: { data: image, mimeType } });
    }

    const result = await generateContentWithRetry(parts);

    // Fetch authentic images for the identified biome
    if (result && result.biome && result.isIndiaLandscape !== false) {
      try {
        const fetchedImages = await fetchBiomeImages(result.searchKeyword, result.biome, textQuery);
        result.images = fetchedImages;
      } catch (e) {
        console.error('Image fetch error:', e);
        result.images = [];
      }
    } else if (result && result.biome) {
      // Also fetch images for global biomes (e.g. Amazon forest)
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
    
    // Handle high demand (503) specifically
    if (error?.status === 503 || error?.message?.includes('high demand') || error?.message?.includes('503')) {
      return res.status(503).json({ 
        error: 'The AI service is currently experiencing very high demand. Please try again in a minute.' 
      });
    }

    res.status(500).json({ error: 'Failed to analyze request. Please try again later.' });
  }
});

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

startServer();
