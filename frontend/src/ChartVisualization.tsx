import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import './ChartVisualization.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ChartVisualizationProps {
  data: any[];
  columns: string[];
}

type ChartType = 'bar' | 'line' | 'pie' | 'table';

const ChartVisualization: React.FC<ChartVisualizationProps> = ({ data, columns }) => {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [chartData, setChartData] = useState<any>(null);
  const [isChartable, setIsChartable] = useState(false);

  const generateChartData = React.useCallback((numericColumns: string[]) => {
    // Find the best label column (usually the first non-numeric column)
    const labelColumn = columns.find(col => 
      !numericColumns.includes(col)
    ) || columns[0];

    const valueColumn = numericColumns[0];

    // Limit to top 15 rows for better visualization
    const limitedData = data.slice(0, 15);

    const labels = limitedData.map(row => {
      const val = row[labelColumn];
      // Truncate long labels
      return String(val).length > 30 ? String(val).substring(0, 27) + '...' : String(val);
    });

    const values = limitedData.map(row => {
      const val = row[valueColumn];
      return typeof val === 'number' ? val : parseFloat(val) || 0;
    });

    // Generate colors
    const colors = generateColors(values.length);

    const chartDataset = {
      labels,
      datasets: [
        {
          label: valueColumn.replace(/_/g, ' ').toUpperCase(),
          data: values,
          backgroundColor: colors.background,
          borderColor: colors.border,
          borderWidth: 2,
          tension: 0.4, // For line chart smoothing
        }
      ]
    };

    setChartData(chartDataset);
  }, [data, columns]);

  useEffect(() => {
    const analyzeData = () => {
      if (!data || data.length === 0 || !columns || columns.length === 0) {
        setIsChartable(false);
        return;
      }

      // Check if data is suitable for charting
      // Need at least one numeric column and one label column
      const numericColumns = columns.filter(col => {
        return data.some(row => typeof row[col] === 'number' && !isNaN(row[col]));
      });

      if (numericColumns.length === 0) {
        setIsChartable(false);
        return;
      }

      setIsChartable(true);
      generateChartData(numericColumns);
    };

    analyzeData();
  }, [data, columns, generateChartData]);

  const generateColors = (count: number) => {
    const baseColors = [
      '#667eea', '#764ba2', '#f093fb', '#4facfe',
      '#43e97b', '#fa709a', '#fee140', '#30cfd0',
      '#a8edea', '#ff6b6b', '#4ecdc4', '#ffe66d'
    ];

    const background = [];
    const border = [];

    for (let i = 0; i < count; i++) {
      const baseColor = baseColors[i % baseColors.length];
      background.push(baseColor + '99'); // Add transparency
      border.push(baseColor);
    }

    return { background, border };
  };

  const chartOptions: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 2,
    layout: {
      padding: 10
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#e0e0e0',
          font: {
            size: 12,
            family: "'Space Grotesk', sans-serif"
          },
          boxWidth: 15,
          padding: 10
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#e0e0e0',
        borderColor: '#667eea',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US').format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: chartType !== 'pie' ? {
      x: {
        ticks: {
          color: '#a0a0a0',
          font: {
            size: 11
          },
          maxRotation: 45,
          minRotation: 0,
          autoSkip: true,
          maxTicksLimit: 15
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          display: false
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#a0a0a0',
          font: {
            size: 11
          },
          callback: function(value: any) {
            return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(value as number);
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    } : undefined
  };

  if (!isChartable) {
    return (
      <div className="chart-not-available">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 3v18h18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M18 17l-5-5-4 4-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p>No chartable data available</p>
        <small>Results need numeric values for visualization</small>
      </div>
    );
  }

  const renderChart = () => {
    if (!chartData) return null;

    switch (chartType) {
      case 'bar':
        return <Bar data={chartData} options={chartOptions} />;
      case 'line':
        return <Line data={chartData} options={chartOptions} />;
      case 'pie':
        return <Pie data={chartData} options={chartOptions} />;
      default:
        return null;
    }
  };

  return (
    <div className="chart-visualization">
      <div className="chart-controls">
        <div className="chart-type-selector">
          <button
            className={chartType === 'bar' ? 'active' : ''}
            onClick={() => setChartType('bar')}
            title="Bar Chart"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="4" y="12" width="4" height="8" />
              <rect x="10" y="8" width="4" height="12" />
              <rect x="16" y="4" width="4" height="16" />
            </svg>
          </button>
          <button
            className={chartType === 'line' ? 'active' : ''}
            onClick={() => setChartType('line')}
            title="Line Chart"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 17 9 11 13 15 21 7" />
              <circle cx="3" cy="17" r="2" fill="currentColor" />
              <circle cx="9" cy="11" r="2" fill="currentColor" />
              <circle cx="13" cy="15" r="2" fill="currentColor" />
              <circle cx="21" cy="7" r="2" fill="currentColor" />
            </svg>
          </button>
          <button
            className={chartType === 'pie' ? 'active' : ''}
            onClick={() => setChartType('pie')}
            title="Pie Chart"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" opacity="0.3" />
              <path d="M12 2 A 10 10 0 0 1 22 12 L 12 12 Z" />
            </svg>
          </button>
        </div>
        <div className="chart-info">
          <span className="chart-rows-count">{data.length} rows</span>
          {data.length > 15 && (
            <span className="chart-limit-notice">Showing top 15</span>
          )}
        </div>
      </div>

      <div className="chart-container">
        {renderChart()}
      </div>
    </div>
  );
};

export default ChartVisualization;
