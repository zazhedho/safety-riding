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

const BudgetUtilizationChart = ({ data }) => {
  // Group budgets by event and sum amounts
  const budgetByEvent = {};

  data.forEach(budget => {
    const eventName = budget.event?.title || 'Unknown Event';
    if (!budgetByEvent[eventName]) {
      budgetByEvent[eventName] = {
        budgetAmount: 0,
        actualSpent: 0,
      };
    }
    budgetByEvent[eventName].budgetAmount += budget.budget_amount || 0;
    budgetByEvent[eventName].actualSpent += budget.actual_spent || 0;
  });

  // Get top 10 events by budget amount
  const sortedEvents = Object.entries(budgetByEvent)
    .sort((a, b) => b[1].budgetAmount - a[1].budgetAmount)
    .slice(0, 10);

  const eventNames = sortedEvents.map(([name]) => name);
  const budgetAmounts = sortedEvents.map(([, data]) => data.budgetAmount);
  const actualSpents = sortedEvents.map(([, data]) => data.actualSpent);

  const chartData = {
    labels: eventNames,
    datasets: [
      {
        label: 'Budget Allocated',
        data: budgetAmounts,
        backgroundColor: 'rgba(13, 110, 253, 0.7)',
        borderColor: 'rgb(13, 110, 253)',
        borderWidth: 1,
      },
      {
        label: 'Actual Spent',
        data: actualSpents,
        backgroundColor: 'rgba(220, 53, 69, 0.7)',
        borderColor: 'rgb(220, 53, 69)',
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
        position: 'top',
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y || 0;
            return `${label}: Rp ${value.toLocaleString('id-ID')}`;
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
          callback: function(value) {
            return 'Rp ' + (value / 1000000).toFixed(1) + 'M';
          },
        },
      },
      x: {
        ticks: {
          autoSkip: false,
          maxRotation: 0,
          minRotation: 0,
          callback: (value) => wrapLabel(value),
        },
      },
    },
  };

  if (eventNames.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <i className="bi bi-bar-chart" style={{ fontSize: '3rem' }}></i>
        <p className="mt-2">No budget data available</p>
      </div>
    );
  }

  return (
    <div style={{ height: '300px' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default BudgetUtilizationChart;
