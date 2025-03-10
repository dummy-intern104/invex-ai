
import { useState, useRef, useEffect } from "react";
import { Atom } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@/types";
import { toast } from "sonner";

// Import refactored components
import { PredictionForm } from "./stock-predictor/PredictionForm";
import { FileUploadSection } from "./stock-predictor/FileUploadSection";
import { ResultSection } from "./stock-predictor/ResultSection";
import { StockPredictorHeader } from "./stock-predictor/StockPredictorHeader";
import { PredictionData, StockPredictorProps } from "./stock-predictor/types";

export const StockPredictor = ({ products }: StockPredictorProps) => {
  const [predictionData, setPredictionData] = useState<PredictionData>({
    date: "",
    product_id: 0,
    current_stock: 0,
    previous_sales: 0,
    price: 0,
    custom_product: "",
    is_custom_product: false
  });
  const [predictionResult, setPredictionResult] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  
  // Reference to the results section for scrolling
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Effect to scroll to results when they appear - with slower animation
  useEffect(() => {
    if ((predictionResult || aiAnalysis) && resultsRef.current) {
      // Delayed to ensure components are fully rendered
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 300); // Increased delay for smoother transition
    }
  }, [predictionResult, aiAnalysis]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
        toast.error("Please upload a CSV file");
        return;
      }
      
      setLoading(true);
      
      // Simulate CSV data parsing and set some default values
      setTimeout(() => {
        // Set random values if uploading a file
        setPredictionData({
          ...predictionData,
          current_stock: Math.floor(Math.random() * 50) + 20,
          previous_sales: Math.floor(Math.random() * 30) + 10,
          price: Math.floor(Math.random() * 1000) + 100,
          custom_product: "Imported Product",
          is_custom_product: true
        });
        setAiAnalysis(true);
        setLoading(false);
        toast.success("File uploaded successfully", {
          description: "Your product data has been processed and analyzed",
        });
      }, 1500);
      
      // Reset the file input
      e.target.value = '';
    }
  };

  const isFormComplete = () => {
    if (predictionData.is_custom_product) {
      return (
        predictionData.date !== "" &&
        predictionData.custom_product.trim() !== "" &&
        predictionData.current_stock > 0 &&
        predictionData.previous_sales >= 0 &&
        predictionData.price > 0
      );
    }
    
    return (
      predictionData.date !== "" &&
      predictionData.product_id !== 0 &&
      predictionData.current_stock > 0 &&
      predictionData.previous_sales >= 0 &&
      predictionData.price > 0
    );
  };

  const handleGeneratePrediction = () => {
    if (!isFormComplete()) {
      toast.error("Please fill in all fields", {
        description: "All fields are required to generate an accurate prediction",
      });
      return;
    }

    // Mock prediction logic with longer loading time for smoother experience
    setLoading(true);
    setTimeout(() => {
      setPredictionResult(
        `Based on historical data and current trends, we predict sales of ${Math.ceil(predictionData.previous_sales * 1.2)} units in the next 30 days. Consider stocking at least ${Math.ceil(predictionData.previous_sales * 1.5)} units to maintain optimal inventory levels.`
      );
      setAiAnalysis(true);
      setLoading(false);
      toast.success("Prediction generated", {
        description: "AI has analyzed your data and provided predictions",
      });
    }, 2000); // Increased to 2 seconds for more noticeable effect
  };

  const currentDate = new Date();
  const restockDate = new Date(currentDate);
  restockDate.setDate(currentDate.getDate() + 21);
  
  const reviewDate = new Date(currentDate);
  reviewDate.setDate(currentDate.getDate() + 15);
  
  const nextAnalysisDate = new Date(currentDate);
  nextAnalysisDate.setDate(currentDate.getDate() + 30);

  return (
    <div className="bg-card p-6 rounded-lg border shadow-sm">
      <StockPredictorHeader />

      <div className="bg-background rounded-lg p-6">
        <PredictionForm 
          predictionData={predictionData}
          setPredictionData={setPredictionData}
          products={products}
        />

        <Button
          onClick={handleGeneratePrediction}
          className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white mt-6"
          disabled={loading || !isFormComplete()}
        >
          <Atom className="mr-2 h-4 w-4" />
          {loading ? "Generating..." : "Generate Prediction"}
        </Button>

        <div className="text-center text-muted-foreground my-4">OR</div>

        <FileUploadSection 
          handleFileUpload={handleFileUpload}
          loading={loading}
        />

        <div ref={resultsRef} className="scroll-mt-16">
          <ResultSection 
            predictionResult={predictionResult}
            aiAnalysis={aiAnalysis}
            restockDate={restockDate}
            reviewDate={reviewDate}
            nextAnalysisDate={nextAnalysisDate}
            predictionData={predictionData}
          />
        </div>
      </div>
    </div>
  );
};
