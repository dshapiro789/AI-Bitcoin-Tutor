import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface BlockData {
  height: number;
  timestamp: number;
  tx_count: number;
  size: number;
}

interface TransactionVolumeChartProps {
  blocks: BlockData[];
  isDarkMode?: boolean;
}

export function TransactionVolumeChart({ blocks, isDarkMode = false }: TransactionVolumeChartProps) {
  const chartData = React.useMemo(() => {
    if (!blocks || blocks.length === 0) {
      return { labels: [], datasets: [] };
    }

    // Sort blocks by height (oldest first for chronological order)
    const sortedBlocks = [...blocks].sort((a, b) => a.height - b.height);

    const labels = sortedBlocks.map(block => {
      const date = new Date(block.timestamp * 1000);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });

    const transactionCounts = sortedBlocks.map(block => block.tx_count);
    const blockSizes = sortedBlocks.map(block => Math.round(block.size / 1024)); // Convert to KB

    return {
      labels,
      datasets: [
        {
          label: 'Transaction Count',
          data: transactionCounts,
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgba(59, 130, 246, 1)',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          yAxisID: 'y'
        },
        {
          label: 'Block Size (KB)',
          data: blockSizes,
          borderColor: 'rgba(245, 158, 11, 1)',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          pointBackgroundColor: 'rgba(245, 158, 11, 1)',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          yAxisID: 'y1'
        }
      ]
    };
  }, [blocks]);

  const options: ChartOptions<'line'> = {
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
          },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      title: {
        display: true,
        text: 'Recent Block Transaction Volume',
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
        mode: 'index',
        intersect: false,
        callbacks: {
          title: function(context) {
            const blockIndex = context[0].dataIndex;
            const block = [...blocks].sort((a, b) => a.height - b.height)[blockIndex];
            return `Block #${block?.height.toLocaleString()}`;
          },
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (label.includes('Transaction Count')) {
              return `${label}: ${value.toLocaleString()} txs`;
            } else if (label.includes('Block Size')) {
              return `${label}: ${value.toLocaleString()} KB`;
            }
            return `${label}: ${value}`;
          },
          afterBody: function(context) {
            const blockIndex = context[0].dataIndex;
            const block = [...blocks].sort((a, b) => a.height - b.height)[blockIndex];
            if (block) {
              const date = new Date(block.timestamp * 1000);
              return `Time: ${date.toLocaleString()}`;
            }
            return '';
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
          },
          maxTicksLimit: 8
        },
        title: {
          display: true,
          text: 'Time (Recent Blocks)',
          color: isDarkMode ? '#e5e7eb' : '#374151',
          font: {
            size: 12,
            weight: '600'
          }
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
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
          display: false
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: isDarkMode ? '#d1d5db' : '#6b7280',
          font: {
            size: 11
          }
        },
        title: {
          display: false
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

  if (chartData.labels.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-2">📈</div>
          <p className="text-sm text-gray-500">No transaction volume data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Line data={chartData} options={options} />
    </div>
  );
}