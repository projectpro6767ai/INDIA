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

// Handle Netlify function path rewriting if invoked via /.netlify/functions/api
app.use((req, res, next) => {
  if (req.url.startsWith('/.netlify/functions/api')) {
    req.url = req.url.replace(/^\/\.netlify\/functions\/api/, '') || '/';
  }
  next();
});

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

function safeParseJson(rawText: string): any {
  if (!rawText) throw new Error('Empty response from model');

  let text = rawText.trim();
  // Strip markdown codeblocks if present
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  }

  // 1. Direct JSON parse
  try {
    return JSON.parse(text);
  } catch (initialErr) {
    // 2. Slice between first '{' and last '}'
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(text.substring(start, end + 1));
      } catch {}
    }

    // 3. Repair incomplete/truncated JSON string by stripping any incomplete trailing property
    try {
      let candidate = text.substring(start !== -1 ? start : 0);
      
      // If there's an unterminated string or incomplete property, find the last valid comma
      const lastColon = candidate.lastIndexOf(':');
      const lastQuote = candidate.lastIndexOf('"');
      if (lastColon > 0 && lastQuote > lastColon) {
        const lastComma = candidate.lastIndexOf(',', lastColon);
        if (lastComma > 0) {
          candidate = candidate.substring(0, lastComma);
        }
      }

      // Close open brackets and braces
      let openBrackets = (candidate.match(/\[/g) || []).length - (candidate.match(/\]/g) || []).length;
      let openBraces = (candidate.match(/\{/g) || []).length - (candidate.match(/\}/g) || []).length;
      while (openBrackets > 0) { candidate += ']'; openBrackets--; }
      while (openBraces > 0) { candidate += '}'; openBraces--; }

      return JSON.parse(candidate);
    } catch {}

    // 4. Regex extraction fallback for critical fields if repairing JSON fails
    const biomeMatch = text.match(/"biome"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
    if (biomeMatch && biomeMatch[1]) {
      const isIndiaMatch = text.match(/"isIndiaLandscape"\s*:\s*(true|false)/);
      const geoMatch = text.match(/"geographicContext"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
      const envMatch = text.match(/"environmentalStatus"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
      const keyMatch = text.match(/"searchKeyword"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
      return {
        biome: biomeMatch[1],
        visualMarkers: [],
        geographicContext: geoMatch ? geoMatch[1] : '',
        environmentalStatus: envMatch ? envMatch[1] : '',
        isIndiaLandscape: isIndiaMatch ? isIndiaMatch[1] === 'true' : false,
        climaticData: [],
        searchKeyword: keyMatch ? keyMatch[1] : biomeMatch[1],
        errorMessage: ''
      };
    }

    throw initialErr;
  }
}

let quotaExceededCooldownUntil = 0;

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
        maxOutputTokens: 2048,
        temperature: 0.2,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            biome: { 
              type: Type.STRING,
              description: "Concise name of the biome/region (e.g. 'Western Ghats', 'Tibetan Plateau') or empty string if invalid"
            },
            visualMarkers: { 
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 to 5 concise physical markers"
            },
            geographicContext: { 
              type: Type.STRING,
              description: "Concise 2-3 sentence overview of climate, elevation, and terrain"
            },
            environmentalStatus: { 
              type: Type.STRING,
              description: "Concise 1-2 sentence conservation summary"
            },
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
              description: "1 to 3 words canonical Wikipedia article title (e.g. 'Western Ghats', 'Tibetan Plateau'). Never write sentences or explanations."
            },
            errorMessage: { 
              type: Type.STRING,
              description: "Short error message if invalid, otherwise empty string"
            }
          },
          required: ['biome', 'visualMarkers', 'geographicContext', 'environmentalStatus', 'isIndiaLandscape']
        }
      }
    });
    return safeParseJson(response.text);
  } catch (error: any) {
    const errString = String(error?.message || error || '');
    const isQuotaExceeded = error?.status === 429 || 
      errString.includes('429') || 
      errString.includes('quota') || 
      errString.includes('RESOURCE_EXHAUSTED');

    // On quota exhaustion, do not retry failed API calls. Immediately set cooldown and yield to catalog fallback
    if (isQuotaExceeded) {
      quotaExceededCooldownUntil = Date.now() + 60 * 1000;
      const quotaErr = new Error('QUOTA_LIMIT_EXCEEDED');
      (quotaErr as any).isQuota = true;
      throw quotaErr;
    }

    const isRetryable = error?.status === 503 || 
      error instanceof SyntaxError ||
      errString.includes('SyntaxError') ||
      errString.includes('JSON') ||
      errString.includes('high demand') || 
      errString.includes('503') || 
      errString.includes('UNAVAILABLE') || 
      errString.includes('overloaded');
    
    if (isRetryable && retryCount < 1) {
      const delay = 1000;
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

  const cleanKeyword = (keyword || '').length > 50 || (keyword || '').includes('.')
    ? (keyword || '').split(/[,.\n]/)[0].trim()
    : keyword?.trim();

  const searchCandidates = [
    cleanKeyword,
    textQuery,
    biomeName?.replace(/[,(].*/, '').trim(),
    biomeName?.replace(/of.*/i, '').trim(),
    biomeName,
  ].filter((t): t is string => Boolean(t && t.trim().length > 1 && t.trim().length <= 60 && !t.includes('.')));

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

const analysisCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

async function generateFallbackBiome(query: string): Promise<any> {
  const clean = (query || '').trim();

  // 1. Direct curated match
  const directCurated = findCuratedBiome(clean);
  if (directCurated) {
    return {
      biome: directCurated.canonicalName,
      visualMarkers: directCurated.visualMarkers,
      geographicContext: directCurated.geographicContext,
      environmentalStatus: directCurated.environmentalStatus,
      isIndiaLandscape: directCurated.isIndiaLandscape,
      climaticData: directCurated.climaticData,
      images: directCurated.photos,
      searchKeyword: directCurated.canonicalName,
      errorMessage: ''
    };
  }

  // 2. Fuzzy match in CURATED_BIOMES
  const lower = clean.toLowerCase();
  for (const entry of CURATED_BIOMES) {
    if (lower.includes(entry.id) || 
        entry.canonicalName.toLowerCase().includes(lower) ||
        entry.aliases.some(a => lower.includes(a.toLowerCase()) || a.toLowerCase().includes(lower))) {
      return {
        biome: entry.canonicalName,
        visualMarkers: entry.visualMarkers,
        geographicContext: entry.geographicContext,
        environmentalStatus: entry.environmentalStatus,
        isIndiaLandscape: entry.isIndiaLandscape,
        climaticData: entry.climaticData,
        images: entry.photos,
        searchKeyword: entry.canonicalName,
        errorMessage: ''
      };
    }
  }

  // 3. Live Wikipedia lookup
  try {
    const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(clean.replace(/\s+/g, '_'))}`;
    const res = await fetchWithTimeout(wikiUrl, 3000);
    if (res && res.ok) {
      const data = await res.json();
      if (data.extract) {
        const title = data.title || clean;
        const isIndia = /india|himalay|kashmir|ghats|deccan|kerala|punjab|assam|bengal|rajasthan|gujarat|ladakh|tamil|sahyadri/i.test(data.extract + ' ' + title);
        const sampleClimate = (isIndia ? CURATED_BIOMES.find(b => b.isIndiaLandscape) : CURATED_BIOMES[0])?.climaticData || [];
        const fetchedImages = await fetchBiomeImages(title, title, clean);

        const sentences = data.extract.split('.').filter((s: string) => s.trim().length > 15);
        const visualMarkers = sentences.slice(0, 4).map((s: string) => s.trim());

        return {
          biome: title,
          visualMarkers: visualMarkers.length > 0 ? visualMarkers : [
            'Distinctive physical terrain and regional elevation',
            'Native regional vegetation and canopy structure',
            'Characteristic geological strata and drainage networks'
          ],
          geographicContext: data.extract,
          environmentalStatus: `Protected geographical ecosystem subject to seasonal monsoonal patterns and ecological preservation.`,
          isIndiaLandscape: isIndia,
          climaticData: sampleClimate,
          images: fetchedImages.length > 0 ? fetchedImages : (data.thumbnail?.source ? [{ url: data.thumbnail.source, title, caption: data.description || title }] : []),
          searchKeyword: title,
          errorMessage: ''
        };
      }
    }
  } catch (e) {
    console.error('Wikipedia fallback lookup failed:', e);
  }

  // 4. Default baseline fallback
  const fallback = CURATED_BIOMES.find(b => b.isIndiaLandscape) || CURATED_BIOMES[0];
  return {
    biome: clean,
    visualMarkers: fallback.visualMarkers,
    geographicContext: `Geographical and ecological terrain profile for ${clean}. Defined by distinctive regional topography, seasonal temperature regimes, and indigenous botanical communities.`,
    environmentalStatus: 'Ecosystem undergoing periodic climate observation and conservation assessment.',
    isIndiaLandscape: /india/i.test(clean),
    climaticData: fallback.climaticData,
    images: fallback.photos,
    searchKeyword: clean,
    errorMessage: ''
  };
}

const analyzeHandler: express.RequestHandler = async (req, res) => {
  try {
    const { image, mimeType, textQuery } = req.body;

    if (!image && !textQuery) {
      res.status(400).json({ error: 'Either image or textQuery is required' });
      return;
    }

    // Check fast memory cache for text queries
    if (textQuery && !image) {
      const cacheKey = `text:${textQuery.trim().toLowerCase()}`;
      const cached = analysisCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        res.json(cached.data);
        return;
      }
    }

    // If quota cooldown is active, serve instant curated catalog response
    if (Date.now() < quotaExceededCooldownUntil) {
      if (textQuery) {
        const fallbackResult = await generateFallbackBiome(textQuery);
        res.json(fallbackResult);
        return;
      }
      if (image) {
        const defaultBiome = CURATED_BIOMES.find(b => b.isIndiaLandscape) || CURATED_BIOMES[0];
        res.json({
          biome: defaultBiome.canonicalName,
          visualMarkers: defaultBiome.visualMarkers,
          geographicContext: defaultBiome.geographicContext,
          environmentalStatus: defaultBiome.environmentalStatus,
          isIndiaLandscape: defaultBiome.isIndiaLandscape,
          climaticData: defaultBiome.climaticData,
          images: defaultBiome.photos,
          searchKeyword: defaultBiome.canonicalName,
          errorMessage: ''
        });
        return;
      }
    }

    const prompt = `You are an AI visual and geographical expert trained in identifying physical landforms, ecosystems, and natural biomes.
    
${image ? 'Analyze the provided image.' : `Analyze the following region, country, state, or landscape: "${textQuery}".`}

CRITICAL INSTRUCTIONS:
- DO NOT echo, repeat, or output base64 data, image binary data, or long strings in any response field. Keep all text descriptions concise (under 50 words) and searchKeyword strictly 1 to 3 words.
1. The input can be:
   - A specific natural biome or landform (e.g., 'Western Ghats', 'Sundarbans', 'Cold Desert of Ladakh', 'Amazon Rainforest', 'Thar Desert').
   - A country, state, province, or geographic territory (e.g., 'China', 'Maharashtra', 'India', 'Japan', 'California', 'Rajasthan', 'Kerala', 'Egypt', 'Australia', 'Brazil').
   WHEN a country, state, or region is provided, identify its primary, most ecologically defining natural landscape/biome (for example: for 'Maharashtra', identify the 'Northern Western Ghats & Deccan Plateau (Sahyadri Range)'; for 'China', identify the 'Tibetan Plateau & Himalayan Steppe' or 'South China Karst'; for 'California', identify 'California Chaparral & Sierra Nevada Montane Forests').
2. ONLY if the input is purely non-geographical and has zero natural landscape association (e.g., greetings like 'hello', manufactured inanimate objects like 'car', indoor scenes, abstract words, or arbitrary text):
   - Set "biome" to "" (empty string).
   - Set "errorMessage" to a polite explanation stating that "${textQuery || 'the provided input'}" is not a recognized geographical location, state, or biome, and suggest examples of valid locations.
   - Set "visualMarkers" to [].
   - Set "climaticData" to [].
   - Set "searchKeyword" to "".
   - Set "isIndiaLandscape" to false.
3. If the input IS a valid geographical place, region, country, state, or natural biome:
   - Identify the exact biome or physical landscape name with high precision.
   - If located within India (such as Maharashtra, Ladakh, Western Ghats, Thar, Assam, Kerala), set "isIndiaLandscape" to true. If global (such as China, Amazon, Sahara, Japan, Serengeti), set "isIndiaLandscape" to false.
   - Provide 3 to 5 distinct physical visual markers (terrain features, native vegetation, geological formations).
   - Provide realistic 12-month climaticData (monthly temperature low/high in °C and precipitation in mm).
   - Set "searchKeyword" to a concise 1 to 4 word canonical Wikipedia article title (e.g., 'Western Ghats', 'Tibetan Plateau', 'Sundarbans', 'Thar Desert'). DO NOT write full sentences or explanations in searchKeyword.
   - Set "errorMessage" to "".

Provide your response in JSON format with the following structure:
{
  "biome": "Precise name of the biome/region (e.g., 'Western Ghats (Sahyadri Range)', 'Tibetan Plateau & Alpine Steppe', 'Thar Desert Dunes') or empty string if invalid",
  "visualMarkers": ["terrain/vegetation marker 1", "marker 2", "marker 3"],
  "geographicContext": "Detailed explanation of climate, altitude, and physical geography",
  "environmentalStatus": "Conservation notes and climate sensitivity",
  "isIndiaLandscape": true/false,
  "climaticData": [
    { "month": "Jan", "tempLow": 10, "tempHigh": 20, "precipitation": 5 },
    { "month": "Feb", "tempLow": 12, "tempHigh": 22, "precipitation": 10 }
  ],
  "searchKeyword": "Concise 1-4 word canonical Wikipedia article title (e.g. 'Western Ghats', 'Tibetan Plateau', 'Sundarbans')",
  "errorMessage": ""
}`;

    const parts: any[] = [{ text: prompt }];
    if (image && mimeType) {
      parts.push({ inlineData: { data: image, mimeType } });
    }

    const result = await generateContentWithRetry(parts);

    // Sanitize searchKeyword to prevent long paragraph hallucinations from breaking image queries
    let cleanKeyword = String(result?.searchKeyword || '').trim();
    if (cleanKeyword.length > 50 || cleanKeyword.includes('.') || cleanKeyword.includes('\n')) {
      cleanKeyword = String(textQuery || result?.biome || '').replace(/[,(].*/, '').trim();
    }
    if (result) {
      result.searchKeyword = cleanKeyword;
    }

    // Validate that the result is an actual physical landscape or biome
    const rawBiome = String(result?.biome || '').trim();
    const isInvalidBiome = !rawBiome || 
      ['n/a', 'na', 'none', 'unknown', 'invalid', 'null', 'undefined', 'not applicable', 'not a biome', 'unidentified'].includes(rawBiome.toLowerCase());

    if (isInvalidBiome) {
      result.biome = '';
      result.errorMessage = result?.errorMessage || 
        (textQuery 
          ? `"${textQuery}" could not be identified as a geographical landscape or biome. Please enter a valid place, state, or biome (e.g., Maharashtra, Western Ghats, Ladakh, China, Amazon Rainforest, Thar Desert, or Sundarbans).`
          : "The uploaded image does not appear to show an outdoor natural landscape or biome. Please upload a clear photo of natural terrain, vegetation, or a landform.");
      result.images = [];
      result.climaticData = [];
      result.visualMarkers = [];
      res.json(result);
      return;
    }

    // Verify & enrich climaticData from verified curated catalog if missing or incomplete
    if (result.biome && (!result.climaticData || result.climaticData.length < 12)) {
      const curatedMatch = findCuratedBiome(textQuery, result.biome);
      if (curatedMatch && curatedMatch.climaticData) {
        result.climaticData = curatedMatch.climaticData;
      }
    }

    // Fetch authentic images for the identified biome
    if (result.biome) {
      try {
        const fetchedImages = await fetchBiomeImages(result.searchKeyword, result.biome, textQuery);
        result.images = fetchedImages;
      } catch (e) {
        console.error('Image fetch error:', e);
        result.images = [];
      }
    }

    // Store in fast cache for text queries
    if (textQuery && !image && result.biome) {
      const cacheKey = `text:${textQuery.trim().toLowerCase()}`;
      if (analysisCache.size > 200) {
        const oldestKey = analysisCache.keys().next().value;
        if (oldestKey) analysisCache.delete(oldestKey);
      }
      analysisCache.set(cacheKey, { data: result, timestamp: Date.now() });
    }

    res.json(result);
  } catch (error: any) {
    const errorDetail = String(error?.message || error || '');
    const isQuota = (error as any)?.isQuota || error?.status === 429 || errorDetail.includes('429') || errorDetail.includes('quota') || errorDetail.includes('RESOURCE_EXHAUSTED');
    if (isQuota) {
      quotaExceededCooldownUntil = Date.now() + 60 * 1000;
    }
    
    // Resilient fallback for text queries (survives 429 quota exhaustion, 503 high demand, timeouts)
    if (req.body?.textQuery) {
      try {
        const fallbackResult = await generateFallbackBiome(req.body.textQuery);
        const cacheKey = `text:${req.body.textQuery.trim().toLowerCase()}`;
        analysisCache.set(cacheKey, { data: fallbackResult, timestamp: Date.now() });
        res.json(fallbackResult);
        return;
      } catch {
        const defaultBiome = CURATED_BIOMES.find(b => b.isIndiaLandscape) || CURATED_BIOMES[0];
        res.json({
          biome: req.body.textQuery.trim(),
          visualMarkers: defaultBiome.visualMarkers,
          geographicContext: defaultBiome.geographicContext,
          environmentalStatus: defaultBiome.environmentalStatus,
          isIndiaLandscape: defaultBiome.isIndiaLandscape,
          climaticData: defaultBiome.climaticData,
          images: defaultBiome.photos,
          searchKeyword: req.body.textQuery.trim(),
          errorMessage: ''
        });
        return;
      }
    }

    // Check if image upload can be gracefully resolved via curated biome fallback
    if (req.body?.image) {
      console.log('Serving resilient curated fallback for image due to model error.');
      const defaultBiome = CURATED_BIOMES.find(b => b.isIndiaLandscape) || CURATED_BIOMES[0];
      res.json({
        biome: defaultBiome.canonicalName,
        visualMarkers: defaultBiome.visualMarkers,
        geographicContext: defaultBiome.geographicContext,
        environmentalStatus: defaultBiome.environmentalStatus,
        isIndiaLandscape: defaultBiome.isIndiaLandscape,
        climaticData: defaultBiome.climaticData,
        images: defaultBiome.photos,
        searchKeyword: defaultBiome.canonicalName,
        errorMessage: ''
      });
      return;
    }

    // Check if error is missing API key
    if (error?.message?.includes('GEMINI_API_KEY environment variable is missing')) {
      res.status(500).json({ 
        error: 'GEMINI_API_KEY is not configured on this server. Please add GEMINI_API_KEY to your Vercel Project Settings > Environment Variables.' 
      });
      return;
    }

    // Handle high demand (503) specifically
    if (error?.status === 503 || error?.status === 429 || errorDetail.includes('high demand') || errorDetail.includes('503') || errorDetail.includes('UNAVAILABLE') || errorDetail.includes('RESOURCE_EXHAUSTED')) {
      res.status(503).json({ 
        error: 'The AI service is currently experiencing very high demand. Please try again in a moment.' 
      });
      return;
    }

    const cleanError = (errorDetail.includes('SyntaxError') || errorDetail.includes('JSON') || errorDetail.includes('Unterminated'))
      ? 'Unable to parse landscape features. Please try uploading a different photo or entering a location name.'
      : (error?.message || 'Failed to analyze request. Please try again later.');

    res.status(500).json({ error: cleanError });
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

// Only listen directly when running standalone (not inside Vercel/Netlify serverless runtime)
if (!process.env.VERCEL && !process.env.NETLIFY) {
  startServer();
}
