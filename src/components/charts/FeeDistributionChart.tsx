import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface FeeDistributionChartProps {
  feeHistogram: number[][];
  isDarkMode?: boolean;
}

export function FeeDistributionChart({ feeHistogram, isDarkMode = false }: FeeDistributionChartProps) {
  // Process fee histogram data
  const processedData = React.useMemo(() => {
    if (!feeHistogram || feeHistogram.length === 0) {
      return { labels: [], data: [] };
    }

    // Fee histogram format: [[fee_rate, vsize], ...]
    // Group into fee ranges for better visualization
    const feeRanges = [
      { min: 0, max: 5, label: '0-5 sat/vB' },
      { min: 5, max: 10, label: '5-10 sat/vB' },
      { min: 10, max: 20, label: '10-20 sat/vB' },
      { min: 20, max: 50, label: '20-50 sat/vB' },
      { min: 50, max: 100, label: '50-100 sat/vB' },
      { min: 100, max: Infinity, label: '100+ sat/vB' }
    ];

    const groupedData = feeRanges.map(range => {
      const totalVsize = feeHistogram
        .filter(([feeRate]) => feeRate >= range.min && feeRate < range.max)
        .reduce((sum, [, vsize]) => sum + vsize, 0);
      
      return {
        label: range.label,
        value: Math.round(totalVsize / 1000) // Convert to kvB for readability
      };
    });

    return {
      labels: groupedData.map(item => item.label),
      data: groupedData.map(item => item.value)
    };
  }, [feeHistogram]);

  const chartData = {
    labels: processedData.labels,
    datasets: [
      {
        label: 'Transaction Volume (kvB)',
        data: processedData.data,
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',   // Green for low fees
          'rgba(59, 130, 246, 0.8)',  // Blue
          'rgba(168, 85, 247, 0.8)',  // Purple
          'rgba(245, 158, 11, 0.8)',  // Amber
          'rgba(239, 68, 68, 0.8)',   // Red
          'rgba(156, 163, 175, 0.8)'  // Gray for very high fees
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(156, 163, 175, 1)'
        ],
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
      }
    ]
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: isDarkMode ? '#e5e7eb' : '#374151',
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      title: {
        display: true,
        text: 'Mempool Fee Distribution',
        color: isDarkMode ? '#f3f4f6' : '#111827',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        titleColor: isDarkMode ? '#f3f4f6' : '#111827',
        bodyColor: isDarkMode ? '#e5e7eb' : '#374151',
        borderColor: isDarkMode ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y} kvB`;
          },
          afterLabel: function(context) {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((context.parsed.y / total) * 100).toFixed(1);
            return `${percentage}% of total mempool`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: isDarkMode ? '#374151' : '#f3f4f6',
        },
        ticks: {
          color: isDarkMode ? '#d1d5db' : '#6b7280',
          font: {
            size: 11
          }
        },
        title: {
          display: true,
          text: 'Fee Rate Range',
          color: isDarkMode ? '#e5e7eb' : '#374151',
          font: {
            size: 12,
            weight: '600'
          }
        }
      },
      y: {
        grid: {
          color: isDarkMode ? '#374151' : '#f3f4f6',
        },
        ticks: {
          color: isDarkMode ? '#d1d5db' : '#6b7280',
          font: {
            size: 11
          }
        },
        title: {
          display: true,
          text: 'Volume (kvB)',
          color: isDarkMode ? '#e5e7eb' : '#374151',
          font: {
            size: 12,
            weight: '600'
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    animation: {
      duration: 750,
      easing: 'easeInOutQuart'
    }
  };

  if (processedData.labels.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-2">📊</div>
          <p className="text-sm text-gray-500">No fee distribution data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
}