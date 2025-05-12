
import Papa from 'papaparse';

self.onmessage = async (e: MessageEvent) => {
  const { file, fileType } = e.data;
  
  try {
    const result = await parseCSVInWorker(file);
    self.postMessage({ 
      status: 'success', 
      data: result, 
      fileType 
    });
  } catch (error) {
    self.postMessage({ 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error', 
      fileType 
    });
  }
};

const parseCSVInWorker = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    // Try different delimiters if the default one fails
    const delimiters = [',', ';', '\t', '|'];
    let currentDelimiterIndex = 0;
    let lastError: any = null;
    
    const tryParse = () => {
      const currentDelimiter = delimiters[currentDelimiterIndex];
      
      Papa.parse(file, {
        header: true,
        delimiter: currentDelimiter,
        skipEmptyLines: true,
        dynamicTyping: true,
        transformHeader: header => header.trim(),
        transform: value => typeof value === 'string' ? value.trim() : value,
        complete: (results) => {
          if (results.errors && results.errors.length > 0 && 
              (results.data.length === 0 || Object.keys(results.data[0]).length <= 1)) {
            // Try next delimiter if parsing failed
            currentDelimiterIndex++;
            if (currentDelimiterIndex < delimiters.length) {
              tryParse();
            } else {
              // All delimiters failed
              reject(new Error(`CSV parsing error: ${lastError || 'Could not determine CSV format'}`));
            }
          } else if (!results.data || results.data.length === 0) {
            reject(new Error('CSV file appears to be empty or invalid'));
          } else {
            // Log success for debugging
            console.log(`Successfully parsed with delimiter: ${currentDelimiter}`);
            resolve(results.data as any[]);
          }
        },
        error: (error) => {
          lastError = error.message;
          currentDelimiterIndex++;
          if (currentDelimiterIndex < delimiters.length) {
            tryParse();
          } else {
            reject(new Error(`CSV parsing error: ${error.message}`));
          }
        }
      });
    };
    
    // Start parsing with the first delimiter
    tryParse();
  });
};

// Make TypeScript happy in the worker context
export {};
