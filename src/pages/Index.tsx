
import React, { useState } from 'react';
import { toast } from 'sonner';
import FileUpload from '@/components/FileUpload';
import ProcessingStatus from '@/components/ProcessingStatus';
import ResultsDisplay, { ScoringResult } from '@/components/ResultsDisplay';
import ResultsChart from '@/components/ResultsChart';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, FileText } from 'lucide-react';
import { parseCSV, validateDefaultCSV, validateHistoryCSV } from '@/utils/csvParser';
import { ModelProcessor } from '@/utils/modelProcessor';

const Index = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [filesReady, setFilesReady] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ default: File | null, history: File | null }>({
    default: null,
    history: null
  });
  const [processingStage, setProcessingStage] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [results, setResults] = useState<ScoringResult[]>([]);
  const [modelProcessor] = useState(() => new ModelProcessor());

  const handleFilesUploaded = (files: { default: File | null, history: File | null }) => {
    setUploadedFiles(files);
    setProcessingError(null);
    
    // Validate files are present
    if (files.default && files.history) {
      toast.success('Both files uploaded successfully! Click "Analyze Payment Data" to begin processing.');
      setFilesReady(true);
    }
  };

  const handleAnalyzeClick = async () => {
    if (!uploadedFiles.default || !uploadedFiles.history) {
      toast.error('Please upload both required files first.');
      return;
    }

    try {
      setIsProcessing(true);
      setFilesReady(false);
      setProcessingError(null);
      setProcessingStage('Parsing CSV files');
      setProcessingProgress(10);
      
      // Parse CSV files
      const defaultRawData = await parseCSV(uploadedFiles.default);
      setProcessingProgress(25);
      const historyRawData = await parseCSV(uploadedFiles.history);
      setProcessingProgress(40);
      
      // Validate CSV structures
      setProcessingStage('Validating data');
      const defaultData = validateDefaultCSV(defaultRawData);
      const historyData = validateHistoryCSV(historyRawData);
      setProcessingProgress(55);
      
      // Train model
      setProcessingStage('Training model');
      await modelProcessor.trainModel(defaultData, historyData);
      setProcessingProgress(85);
      
      // Generate predictions
      setProcessingStage('Generating predictions');
      const predictions = await modelProcessor.generatePredictions(defaultData, historyData);
      setProcessingProgress(100);
      
      // Update results
      setResults(predictions);
      toast.success('Analysis completed successfully');
      
    } catch (error) {
      console.error('Error processing files:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setProcessingError(errorMessage);
      toast.error(`Error: ${errorMessage}`);
      
      // Reset the files ready state to allow re-uploading
      setFilesReady(true);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-finance-slate py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-finance-blue mb-2">Default Risk Predictor</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload your payment data files to predict default probabilities using machine learning.
          </p>
        </div>
        
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Data Requirements
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardDescription className="px-6 pb-6">
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>payment_default.csv - Contains client information and default status</li>
                <li>payment_history.csv - Contains payment history for clients</li>
                <li>Files must include all required columns with proper formatting</li>
              </ul>
            </CardDescription>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Scoring Information
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardDescription className="px-6 pb-6">
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>The model analyzes payment history and client data</li>
                <li>Predicts probability of default (0-1)</li>
                <li>Default indicator = 1 when probability ≥ 0.5</li>
              </ul>
            </CardDescription>
          </Card>
        </div>

        {/* File Upload */}
        <FileUpload 
          onFilesUploaded={handleFilesUploaded} 
          onAnalyzeClick={handleAnalyzeClick}
          filesReady={filesReady}
        />
        
        {/* Processing Status */}
        <ProcessingStatus 
          isProcessing={isProcessing}
          stage={processingStage}
          progress={processingProgress}
          filesReady={filesReady && !isProcessing}
          error={processingError}
        />
        
        {/* Results Section */}
        {results.length > 0 && !isProcessing && (
          <div className="space-y-6 animate-fade-in">
            <ResultsChart results={results} />
            <ResultsDisplay results={results} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
