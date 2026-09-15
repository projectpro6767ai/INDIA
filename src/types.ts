export interface BiomeImage {
  url: string;
  title: string;
  caption?: string;
}

export interface AnalysisResult {
  biome: string;
  visualMarkers: string[];
  geographicContext: string;
  environmentalStatus: string;
  isIndiaLandscape: boolean;
  errorMessage?: string;
  images?: BiomeImage[];
}

export interface AnalysisState {
  loading: boolean;
  error: string | null;
  result: AnalysisResult | null;
  imagePreview: string | null;
}

