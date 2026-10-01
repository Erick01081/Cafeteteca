export type BloomRatio = '1:2' | '1:3' | '1:4';

export const BLOOM_RATIOS: BloomRatio[] = ['1:2', '1:3', '1:4'];

export interface PourStep {
  n: number; // 0 = bloom, 1..N = vertidos posteriores
  label: string; // "Bloom" | "Vertido 1" | ...
  stepWaterG: number; // agua añadida en este paso
  cumulativeWaterG: number; // agua acumulada hasta este paso
}

export interface Recipe {
  doseGrams: number;
  ratio: number;
  bloomRatio: BloomRatio;
  bloomWaterG: number;
  pourCount: number;
  totalWaterG: number;
  pours: PourStep[];
}

export interface OcrFieldsFound {
  name: boolean;
  roaster: boolean;
  variety: boolean;
  country: boolean;
  region: boolean;
  municipality: boolean;
  farm: boolean;
  producer: boolean;
  process: boolean;
  altitude: boolean;
  tastingNotes: boolean;
}

export interface Coffee {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  roaster: string | null;
  country: string | null;
  region: string | null;
  municipality: string | null;
  farm: string | null;
  producer: string | null;
  variety: string | null;
  process: string | null;
  altitude: string | null;
  tastingNotes: string | null;
  photoPath: string | null;
  photoWidth: number | null;
  photoHeight: number | null;
  ocrRawText: string | null;
  ocrConfidence: 'alta' | 'media' | 'baja' | null;
  ocrFieldsFound: OcrFieldsFound | null;
  isSample: boolean;
}

export interface CoffeeInput {
  name: string;
  roaster?: string | null;
  country?: string | null;
  region?: string | null;
  municipality?: string | null;
  farm?: string | null;
  producer?: string | null;
  variety?: string | null;
  process?: string | null;
  altitude?: string | null;
  tastingNotes?: string | null;
  photoPath?: string | null;
  photoWidth?: number | null;
  photoHeight?: number | null;
  ocrRawText?: string | null;
  ocrConfidence?: string | null;
  ocrFieldsFound?: OcrFieldsFound | null;
}

export interface PreparationPour {
  n: number;
  label: string;
  stepWaterG: number;
  cumulativeWaterG: number;
}

export interface Preparation {
  id: string;
  createdAt: string;
  updatedAt: string;
  coffeeId: string | null;
  brewedAt: string;
  dripper: string;
  dripperOther: string | null;
  grindText: string;
  waterTempC: number | null;
  doseGrams: number;
  ratio: number;
  bloomRatio: BloomRatio;
  bloomWaterG: number;
  pourCount: number;
  totalWaterG: number;
  pours: PreparationPour[];
  totalTimeSec: number | null;
  notesFlavor: string | null;
  notesAroma: string | null;
  notesBody: string | null;
  notesExtraction: string | null;
  notesChange: string | null;
  notesOther: string | null;
  isSample: boolean;
}

export interface PreparationInput {
  coffeeId?: string | null;
  brewedAt: string;
  dripper: string;
  dripperOther?: string | null;
  grindText: string;
  waterTempC?: number | null;
  doseGrams: number;
  ratio: number;
  bloomRatio: BloomRatio;
  bloomWaterG: number;
  pourCount: number;
  totalWaterG: number;
  pours: PreparationPour[];
  totalTimeSec?: number | null;
  notesFlavor?: string | null;
  notesAroma?: string | null;
  notesBody?: string | null;
  notesExtraction?: string | null;
  notesChange?: string | null;
  notesOther?: string | null;
}
