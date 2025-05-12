
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { AlertCircle, Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FixedSizeList as List } from 'react-window';
import { Separator } from '@/components/ui/separator';

export interface ScoringResult {
  client_id: number;
  probability_default: number;
  default_indicator: number;
}

interface ResultsDisplayProps {
  results: ScoringResult[];
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  if (!results.length) return null;

  const filteredResults = results.filter(result => 
    result.client_id.toString().includes(searchTerm)
  );

  const downloadCSV = () => {
    const headers = ['client_id', 'probability_default', 'default_indicator'];
    const csvContent = [
      headers.join(','),
      ...results.map(row => [
        row.client_id,
        row.probability_default.toFixed(4),
        row.default_indicator
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `default_predictions_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Column widths for consistent table layout
  const columnWidths = {
    clientId: '25%',
    probability: '30%',
    indicator: '20%',
    risk: '25%'
  };

  return (
    <Card className="w-full animate-fade-in">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Scoring Results</CardTitle>
            <CardDescription>Predictions for {results.length} clients</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={downloadCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by client ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: columnWidths.clientId }}>Client ID</TableHead>
                <TableHead style={{ width: columnWidths.probability }}>Default Probability</TableHead>
                <TableHead style={{ width: columnWidths.indicator }}>Default Indicator</TableHead>
                <TableHead style={{ width: columnWidths.risk }}>Risk Level</TableHead>
              </TableRow>
            </TableHeader>
          </Table>
          
          {filteredResults.length > 0 ? (
            <div className="max-h-64 overflow-auto">
              <Table>
                <List
                  height={256}
                  width="100%"
                  itemCount={filteredResults.length}
                  itemSize={48}
                  className="scrollbar-thin"
                  overscanCount={5}
                >
                  {({ index, style }) => {
                    const result = filteredResults[index];
                    return (
                      <TableRow style={{
                        ...style, 
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%'
                      }}>
                        <TableCell style={{ width: columnWidths.clientId }}>{result.client_id}</TableCell>
                        <TableCell style={{ width: columnWidths.probability }}>{result.probability_default.toFixed(4)}</TableCell>
                        <TableCell style={{ width: columnWidths.indicator }}>{result.default_indicator}</TableCell>
                        <TableCell style={{ width: columnWidths.risk }}>
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              result.probability_default >= 0.7 ? 'bg-finance-red' : 
                              result.probability_default >= 0.3 ? 'bg-yellow-500' : 
                              'bg-finance-green'
                            }`} />
                            {result.probability_default >= 0.7 ? 'High' : 
                             result.probability_default >= 0.3 ? 'Medium' : 
                             'Low'}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  }}
                </List>
              </Table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <div className="flex flex-col items-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p>No matching results found</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultsDisplay;
