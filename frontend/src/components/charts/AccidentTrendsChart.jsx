import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
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

const AccidentTrendsChart = ({ data }) => {
  // Group accidents by month
  const accidentsByMonth = {};
  const deathsByMonth = {};
  const injuredByMonth = {};

  data.forEach(accident => {
    if (!accident.accident_date) return;

    const date = new Date(accident.accident_date);
    const monthYear = `${date.toLocaleString('en-US', { month: 'short' })} ${date.getFullYear()}`;

    if (!accidentsByMonth[monthYear]) {
      accidentsByMonth[monthYear] = 0;
      deathsByMonth[monthYear] = 0;
      injuredByMonth[monthYear] = 0;
    }

    accidentsByMonth[monthYear]++;
    deathsByMonth[monthYear] += accident.death_count || 0;
    injuredByMonth[monthYear] += accident.injured_count || 0;
  });

  // Sort by date and get last 12 months
  const sortedMonths = Object.keys(accidentsByMonth).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateA - dateB;
  }).slice(-12);

  const chartData = {
    labels: sortedMonths,
    datasets: [
      {
        label: 'Total Accidents',
        data: sortedMonths.map(month => accidentsByMonth[month]),
        borderColor: 'rgb(220, 53, 69)',
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Deaths',
        data: sortedMonths.map(month => deathsByMonth[month]),
        borderColor: 'rgb(13, 110, 253)',
        backgroundColor: 'rgba(13, 110, 253, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Injured',
        data: sortedMonths.map(month => injuredByMonth[month]),
        borderColor: 'rgb(255, 193, 7)',
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  if (sortedMonths.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <i className="bi bi-graph-up" style={{ fontSize: '3rem' }}></i>
        <p className="mt-2">No accident data available for trends</p>
      </div>
    );
  }

  return (
    <div style={{ height: '300px' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default AccidentTrendsChart;
