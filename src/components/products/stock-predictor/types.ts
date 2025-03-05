
import { Product } from "@/types";

export interface StockPredictorProps {
  products: Product[];
}

export interface PredictionData {
  date: string;
  product_id: number;
  current_stock: number;
  previous_sales: number;
  price: number;
  custom_product: string;
  is_custom_product: boolean;
}

export interface FormSectionProps {
  predictionData: PredictionData;
  setPredictionData: React.Dispatch<React.SetStateAction<PredictionData>>;
  products: Product[];
}

export interface FileUploadSectionProps {
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loading: boolean;
}

export interface ResultSectionProps {
  predictionResult: string | null;
  aiAnalysis: boolean;
  restockDate: Date;
  reviewDate: Date;
  nextAnalysisDate: Date;
}
