export interface BiomeImage {
  url: string;
  title: string;
  caption?: string;
}

export interface ClimaticDataPoint {
  month: string;
  tempLow: number;
  tempHigh: number;
  precipitation: number;
}

export interface AnalysisResult {
  biome: string;
  visualMarkers: string[];
  geographicContext: string;
  environmentalStatus: string;
  isIndiaLandscape: boolean;
  climaticData?: ClimaticDataPoint[];
  errorMessage?: string;
  images?: BiomeImage[];
}

export interface AnalysisState {
  loading: boolean;
  error: string | null;
  result: AnalysisResult | null;
  imagePreview: string | null;
}

