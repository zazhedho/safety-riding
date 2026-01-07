import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const EventTypeDistributionChart = ({ data = [] }) => {
  // Data is already aggregated from backend: [{event_type, count}]
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <i className="bi bi-pie-chart" style={{ fontSize: '3rem' }}></i>
        <p className="mt-2">No event data available</p>
      </div>
    );
  }

  const types = data.map(d => d.event_type || 'Unknown');
  const counts = data.map(d => d.count || 0);

  // Color palette
  const colors = [
    'rgba(220, 53, 69, 0.8)',   // Red
    'rgba(13, 110, 253, 0.8)',  // Blue
    'rgba(255, 193, 7, 0.8)',   // Yellow
    'rgba(25, 135, 84, 0.8)',   // Green
    'rgba(111, 66, 193, 0.8)',  // Purple
    'rgba(13, 202, 240, 0.8)',  // Cyan
    'rgba(253, 126, 20, 0.8)',  // Orange
    'rgba(214, 51, 132, 0.8)',  // Pink
  ];

  const borderColors = [
    'rgb(220, 53, 69)',
    'rgb(13, 110, 253)',
    'rgb(255, 193, 7)',
    'rgb(25, 135, 84)',
    'rgb(111, 66, 193)',
    'rgb(13, 202, 240)',
    'rgb(253, 126, 20)',
    'rgb(214, 51, 132)',
  ];

  const chartData = {
    labels: types,
    datasets: [
      {
        label: 'Events',
        data: counts,
        backgroundColor: colors.slice(0, types.length),
        borderColor: borderColors.slice(0, types.length),
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div style={{ height: '300px' }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

export default EventTypeDistributionChart;
