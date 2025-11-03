import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const SchoolsByProvinceChart = ({ data }) => {
  // Group schools by province
  const schoolsByProvince = {};

  data.forEach(school => {
    const provinceName = school.province_name || 'Unknown';
    if (!schoolsByProvince[provinceName]) {
      schoolsByProvince[provinceName] = 0;
    }
    schoolsByProvince[provinceName]++;
  });

  // Sort by count and get top 10
  const sortedProvinces = Object.entries(schoolsByProvince)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const provinceNames = sortedProvinces.map(([name]) => name);
  const schoolCounts = sortedProvinces.map(([, count]) => count);

  // Generate gradient colors (from red to lighter red)
  const generateColors = (count) => {
    const colors = [];
    const borderColors = [];
    for (let i = 0; i < count; i++) {
      const intensity = 0.9 - (i * 0.05); // Gradually lighter
      colors.push(`rgba(220, 53, 69, ${intensity})`);
      borderColors.push('rgb(220, 53, 69)');
    }
    return { colors, borderColors };
  };

  const { colors, borderColors } = generateColors(provinceNames.length);

  const chartData = {
    labels: provinceNames,
    datasets: [
      {
        label: 'Number of Schools',
        data: schoolCounts,
        backgroundColor: colors,
        borderColor: borderColors,
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed.y || 0;
            return `Schools: ${value}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
  };

  if (provinceNames.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <i className="bi bi-geo-alt" style={{ fontSize: '3rem' }}></i>
        <p className="mt-2">No school data available</p>
      </div>
    );
  }

  return (
    <div style={{ height: '300px' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default SchoolsByProvinceChart;
