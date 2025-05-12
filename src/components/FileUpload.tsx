
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { UploadCloud, CheckCircle, FileText, AlertTriangle, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type FileType = 'default' | 'history';

interface FileUploadProps {
  onFilesUploaded: (files: { default: File | null, history: File | null }) => void;
  onAnalyzeClick: () => void;
  filesReady: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesUploaded, onAnalyzeClick, filesReady }) => {
  const [files, setFiles] = useState<{ default: File | null, history: File | null }>({
    default: null,
    history: null,
  });

  const defaultInputRef = useRef<HTMLInputElement>(null);
  const historyInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (fileType: FileType, event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const newFiles = {
        ...files,
        [fileType]: event.target.files[0]
      };
      
      setFiles(newFiles);
      
      if (newFiles.default && newFiles.history) {
        onFilesUploaded(newFiles);
      }
    }
  };

  const handleClick = (fileType: FileType) => {
    if (fileType === 'default' && defaultInputRef.current) {
      defaultInputRef.current.click();
    } else if (fileType === 'history' && historyInputRef.current) {
      historyInputRef.current.click();
    }
  };

  const bothFilesUploaded = files.default && files.history;

  return (
    <div className="flex flex-col space-y-6">
      <div className="bg-finance-slate/50 p-4 rounded-lg border border-amber-300 mb-2">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-amber-500 mt-1 mr-2 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-amber-700 mb-1">CSV Format Requirements</h4>
            <p className="text-sm text-gray-600 mb-2">
              Please ensure your CSV files have the following columns:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-700">payment_default.csv:</p>
                <ul className="list-disc list-inside text-xs text-gray-600 ml-2">
                  <li>client_id</li>
                  <li>credit_given</li>
                  <li>gender</li>
                  <li>education</li>
                  <li>marital_status</li>
                  <li>month</li>
                  <li>default</li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700">payment_history.csv:</p>
                <ul className="list-disc list-inside text-xs text-gray-600 ml-2">
                  <li>client_id</li>
                  <li>payment_status</li>
                  <li>bill_amt</li>
                  <li>paid_amt</li>
                  <li>month</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    
      <div className="flex flex-col md:flex-row gap-4 w-full">
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-finance-blue">Payment Default Data</CardTitle>
                <CardDescription>Upload payment_default.csv file</CardDescription>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <Info className="h-4 w-4 text-gray-400" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-sm">
                    <p className="text-xs">
                      File must contain columns: client_id, credit_given, gender, education, marital_status, month, default
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-md bg-finance-slate cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleClick('default')}>
            {!files.default ? (
              <div className="flex flex-col items-center">
                <UploadCloud className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-sm text-gray-500">Click to upload payment_default.csv</p>
              </div>
            ) : (
              <div className="flex flex-col items-center animate-fade-in">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-sm font-medium">{files.default.name}</p>
                <p className="text-xs text-gray-500">{(files.default.size / 1024).toFixed(2)} KB</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <input 
              ref={defaultInputRef}
              type="file" 
              accept=".csv" 
              className="hidden" 
              onChange={(e) => handleFileChange('default', e)}
            />
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => handleClick('default')}
            >
              {files.default ? 'Change File' : 'Select File'}
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-finance-darkblue">Payment History Data</CardTitle>
                <CardDescription>Upload payment_history.csv file</CardDescription>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <Info className="h-4 w-4 text-gray-400" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-sm">
                    <p className="text-xs">
                      File must contain columns: client_id, payment_status, bill_amt, paid_amt, month
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-md bg-finance-slate cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleClick('history')}>
            {!files.history ? (
              <div className="flex flex-col items-center">
                <UploadCloud className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-sm text-gray-500">Click to upload payment_history.csv</p>
              </div>
            ) : (
              <div className="flex flex-col items-center animate-fade-in">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-sm font-medium">{files.history.name}</p>
                <p className="text-xs text-gray-500">{(files.history.size / 1024).toFixed(2)} KB</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <input 
              ref={historyInputRef}
              type="file" 
              accept=".csv" 
              className="hidden" 
              onChange={(e) => handleFileChange('history', e)}
            />
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => handleClick('history')}
            >
              {files.history ? 'Change File' : 'Select File'}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {bothFilesUploaded && (
        <div className="flex justify-center">
          <Button 
            onClick={onAnalyzeClick}
            size="lg"
            className="bg-finance-blue hover:bg-finance-blue/90 text-white font-medium py-2 px-8 rounded-md shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fade-in"
          >
            <FileText className="w-5 h-5 mr-2" />
            Analyze Payment Data
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
