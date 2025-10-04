import React, { useEffect, useRef } from 'react';

// Make Chart.js available globally for the component
declare const Chart: any;

interface ChartProps {
  type: 'bar' | 'doughnut' | 'horizontalBar';
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
      hoverOffset?: number;
    }[];
  };
  options?: any;
  chartRef?: React.RefObject<HTMLCanvasElement>;
}

export const ChartComponent: React.FC<ChartProps> = ({ type, data, options, chartRef }) => {
  const internalChartContainer = useRef<HTMLCanvasElement>(null);
  const chartContainer = chartRef || internalChartContainer;
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    if (chartContainer.current) {
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        
        const ctx = chartContainer.current.getContext('2d');
        if (ctx) {
            const chartType = type === 'horizontalBar' ? 'bar' : type;
            
            const defaultOptions = {
                responsive: true,
                plugins: {
                    legend: {
                        labels: {
                            color: '#4b5563', // slate-600
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#6b7280' }, // slate-500
                        grid: { color: 'rgba(0, 0, 0, 0.05)'}
                    },
                    y: {
                        ticks: { color: '#6b7280' }, // slate-500
                        grid: { color: 'rgba(0, 0, 0, 0.05)'}
                    }
                }
            };
            
            const finalOptions = {
                ...defaultOptions,
                ...options,
                indexAxis: type === 'horizontalBar' ? 'y' as const : 'x' as const,
            };

            if (type === 'doughnut') {
                delete finalOptions.scales;
            }
            
            chartInstance.current = new Chart(ctx, {
                type: chartType,
                data: data,
                options: finalOptions
            });
        }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, type, options, chartContainer]);

  return <canvas ref={chartContainer}></canvas>;
};