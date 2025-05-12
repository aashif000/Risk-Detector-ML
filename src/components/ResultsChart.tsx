
import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ScoringResult } from './ResultsDisplay';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ResultsChartProps {
  results: ScoringResult[];
}

const ResultsChart: React.FC<ResultsChartProps> = ({ results }) => {
  const chartData = useMemo(() => {
    if (!results.length) return [];

    const defaultCount = results.filter(r => r.default_indicator === 1).length;
    
    return [
      { name: 'Default Risk', value: defaultCount },
      { name: 'No Default Risk', value: results.length - defaultCount },
    ];
  }, [results]);

  const riskLevelData = useMemo(() => {
    if (!results.length) return [];

    const highRisk = results.filter(r => r.probability_default >= 0.7).length;
    const mediumRisk = results.filter(r => r.probability_default >= 0.3 && r.probability_default < 0.7).length;
    const lowRisk = results.filter(r => r.probability_default < 0.3).length;
    
    return [
      { name: 'High Risk', value: highRisk },
      { name: 'Medium Risk', value: mediumRisk },
      { name: 'Low Risk', value: lowRisk },
    ];
  }, [results]);

  const COLORS = ['#DA1E28', '#0F62FE'];
  const RISK_COLORS = ['#DA1E28', '#F1C21B', '#24A148'];

  if (!results.length) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Default Prediction</CardTitle>
          <CardDescription>Distribution of default vs. non-default</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} clients`, ""]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Risk Level Distribution</CardTitle>
          <CardDescription>Breakdown by risk category</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={riskLevelData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {riskLevelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={RISK_COLORS[index]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} clients`, ""]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultsChart;
