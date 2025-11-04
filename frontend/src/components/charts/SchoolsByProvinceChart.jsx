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

const wrapLabel = (label, maxLength = 14) => {
  if (!label) {
    return [''];
  }

  const words = `${label}`.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach(word => {
    const tentativeLine = currentLine ? `${currentLine} ${word}` : word;
    if (tentativeLine.length <= maxLength) {
      currentLine = tentativeLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }

      if (word.length > maxLength) {
        const segments = word.match(new RegExp(`.{1,${maxLength}}`, 'g')) || [];
        if (segments.length > 1) {
          lines.push(...segments.slice(0, -1));
        }
        currentLine = segments[segments.length - 1] || '';
      } else {
        currentLine = word;
      }
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [''];
};

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

  // Generate distinct colors per province to visually separate bars
  const generateColors = (count) => {
    const palette = [
      { bg: 'rgba(220, 53, 69, 0.85)', border: 'rgba(220, 53, 69, 1)' },
      { bg: 'rgba(13, 110, 253, 0.85)', border: 'rgba(13, 110, 253, 1)' },
      { bg: 'rgba(25, 135, 84, 0.85)', border: 'rgba(25, 135, 84, 1)' },
      { bg: 'rgba(255, 193, 7, 0.85)', border: 'rgba(255, 193, 7, 1)' },
      { bg: 'rgba(32, 201, 151, 0.85)', border: 'rgba(32, 201, 151, 1)' },
      { bg: 'rgba(111, 66, 193, 0.85)', border: 'rgba(111, 66, 193, 1)' },
      { bg: 'rgba(255, 126, 0, 0.85)', border: 'rgba(255, 126, 0, 1)' },
      { bg: 'rgba(102, 16, 242, 0.85)', border: 'rgba(102, 16, 242, 1)' },
      { bg: 'rgba(253, 126, 20, 0.85)', border: 'rgba(253, 126, 20, 1)' },
      { bg: 'rgba(214, 51, 132, 0.85)', border: 'rgba(214, 51, 132, 1)' },
    ];

    const colors = [];
    const borderColors = [];
    for (let i = 0; i < count; i++) {
      const paletteIndex = i % palette.length;
      colors.push(palette[paletteIndex].bg);
      borderColors.push(palette[paletteIndex].border);
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
    layout: {
      padding: {
        bottom: 16,
      },
    },
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
          title: function(context) {
            return context[0]?.label || '';
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
          autoSkip: false,
          maxRotation: 0,
          minRotation: 0,
          callback: (value) => wrapLabel(value),
        },
        title: {
          display: false,
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
