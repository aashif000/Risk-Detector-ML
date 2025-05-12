
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, FileText, AlertTriangle, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ProcessingStatusProps {
  isProcessing: boolean;
  stage: string;
  progress: number;
  filesReady?: boolean;
  error?: string | null;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ 
  isProcessing, 
  stage,
  progress,
  filesReady = false,
  error = null
}) => {
  if (!isProcessing && !filesReady && !error) return null;
  
  return (
    <Card className="w-full animate-fade-in">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center">
          {error ? (
            <>
              <AlertTriangle className="h-8 w-8 text-finance-red mb-2 animate-pulse" />
              <h3 className="text-lg font-medium text-finance-red">Error Processing Files</h3>
              <p className="text-sm text-muted-foreground mt-2 text-center">{error}</p>
              <div className="bg-finance-slate/80 mt-4 p-3 rounded-md w-full max-w-xl">
                <p className="text-xs text-gray-600">
                  <strong>Common issues:</strong>
                </p>
                <ul className="list-disc list-inside text-xs text-gray-600 mt-1">
                  <li>Make sure your CSV files are formatted correctly with all required columns</li>
                  <li>Check for special characters or encoding issues in your CSV</li>
                  <li>Ensure the column names match exactly (client_id, credit_given, etc.)</li>
                  <li>Try with a different CSV delimiter (comma, semicolon, tab)</li>
                </ul>
                
                <div className="mt-3 bg-blue-50 p-2 rounded-md border border-blue-200">
                  <div className="flex items-start">
                    <Info className="h-4 w-4 text-blue-500 mt-0.5 mr-2" />
                    <div>
                      <p className="text-xs font-medium text-blue-700">CSV Format Tips</p>
                      <p className="text-xs text-blue-600 mt-1">
                        We now support multiple CSV formats and will automatically try different delimiters (comma, semicolon, tab, pipe).
                        If you're still seeing errors, try converting your CSV to use comma separators.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : isProcessing ? (
            <>
              <Loader2 className="h-8 w-8 text-finance-blue animate-spin mb-2" />
              <h3 className="text-lg font-medium">{stage}</h3>
              
              <div className="w-full max-w-md mt-4">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2 text-center">{progress}% complete</p>
                {progress > 10 && progress < 100 && (
                  <div className="mt-3 text-xs text-center text-gray-500">
                    {progress < 40 ? (
                      <span>Parsing and validating CSV data...</span>
                    ) : progress < 70 ? (
                      <span>Creating feature engineering pipeline...</span>
                    ) : (
                      <span>Training model and generating predictions...</span>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : filesReady ? (
            <>
              <CheckCircle className="h-8 w-8 text-green-500 mb-2 animate-scale-in" />
              <h3 className="text-lg font-medium">Files Ready for Analysis</h3>
              
              <div className="mt-3 flex items-center space-x-2">
                <FileText className="h-5 w-5 text-finance-blue" />
                <span className="text-sm text-muted-foreground">Files validated and ready for processing</span>
              </div>
              
              <div className="mt-4 bg-finance-slate/50 p-3 rounded-md w-full max-w-lg">
                <p className="text-sm text-gray-700">
                  Click the "Analyze Payment Data" button to start processing the data and generate default predictions.
                </p>
              </div>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProcessingStatus;
