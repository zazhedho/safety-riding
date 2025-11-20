import { useMemo } from 'react';

const PriorityMatrixChart = ({ data, threshold = 87 }) => {
  // Categorize districts into quadrants based on backend priority_level and market_share
  const quadrants = useMemo(() => {
    if (!data || !Array.isArray(data)) return { critical: [], high: [], medium: [], low: [] };

    const result = {
      critical: [], // Priority Level: Critical (Score 75-100)
      high: [],     // Priority Level: High (Score 50-74)
      medium: [],   // Priority Level: Medium (Score 25-49)
      low: []       // Priority Level: Low (Score 0-24)
    };

    // Group by backend priority_level to match the table
    data.forEach(item => {
      const priorityLevel = item.priority_level?.toLowerCase() || 'low';

      if (priorityLevel === 'critical') {
        result.critical.push(item);
      } else if (priorityLevel === 'high') {
        result.high.push(item);
      } else if (priorityLevel === 'medium') {
        result.medium.push(item);
      } else {
        result.low.push(item);
      }
    });

    // Sort each quadrant by priority score descending
    Object.keys(result).forEach(key => {
      result[key].sort((a, b) => b.priority_score - a.priority_score);
    });

    return result;
  }, [data, threshold]);

  const renderQuadrant = (items, title, colorClass, icon, description) => (
    <div className={`priority-quadrant ${colorClass}`}>
      <div className="quadrant-header">
        <i className={`bi ${icon} me-2`}></i>
        <strong>{title}</strong>
        <span className="badge bg-light text-dark ms-2">{items.length}</span>
      </div>
      <div className="quadrant-description">
        <small className="text-muted">{description}</small>
      </div>
      <div className="quadrant-content">
        {items.length > 0 ? (
          <div className="district-list">
            {items.slice(0, 5).map((item, idx) => (
              <div key={idx} className="district-item">
                <div className="district-name">{item.district_name}</div>
                <div className="district-metrics">
                  <small className="text-muted">
                    MS: {item.market_share?.toFixed(1)}% |
                    Acc: {item.total_accidents} |
                    Score: {item.priority_score}
                  </small>
                </div>
              </div>
            ))}
            {items.length > 5 && (
              <small className="text-muted">+ {items.length - 5} more districts</small>
            )}
          </div>
        ) : (
          <div className="text-center text-muted py-3">
            <small>No districts in this category</small>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="priority-matrix-container">
      <style>{`
        .priority-matrix-container {
          position: relative;
          padding: 20px 0;
        }

        .matrix-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          gap: 15px;
          min-height: 500px;
          position: relative;
        }

        .matrix-axes {
          position: relative;
          margin-bottom: 10px;
        }

        .axis-label {
          position: absolute;
          font-weight: 600;
          font-size: 0.9rem;
          color: #495057;
        }

        .axis-label.y-axis {
          left: 50%;
          top: -30px;
          transform: translateX(-50%);
        }

        .axis-label.x-axis {
          left: 50%;
          bottom: -30px;
          transform: translateX(-50%);
        }

        .priority-quadrant {
          border: 2px solid;
          border-radius: 8px;
          padding: 15px;
          background: white;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
        }

        .priority-quadrant:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transform: translateY(-2px);
        }

        .priority-quadrant.critical {
          border-color: #dc3545;
          background: linear-gradient(135deg, #fff5f5 0%, #ffffff 100%);
        }

        .priority-quadrant.high {
          border-color: #ffc107;
          background: linear-gradient(135deg, #fffbf0 0%, #ffffff 100%);
        }

        .priority-quadrant.medium {
          border-color: #0dcaf0;
          background: linear-gradient(135deg, #f0fcff 0%, #ffffff 100%);
        }

        .priority-quadrant.low {
          border-color: #198754;
          background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
        }

        .quadrant-header {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          font-size: 1rem;
        }

        .critical .quadrant-header { color: #dc3545; }
        .high .quadrant-header { color: #ffc107; }
        .medium .quadrant-header { color: #0dcaf0; }
        .low .quadrant-header { color: #198754; }

        .quadrant-description {
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e9ecef;
        }

        .quadrant-content {
          flex: 1;
          overflow-y: auto;
          max-height: 300px;
        }

        .district-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .district-item {
          padding: 8px;
          background: white;
          border-radius: 4px;
          border-left: 3px solid currentColor;
          transition: all 0.2s ease;
        }

        .critical .district-item { border-left-color: #dc3545; }
        .high .district-item { border-left-color: #ffc107; }
        .medium .district-item { border-left-color: #0dcaf0; }
        .low .district-item { border-left-color: #198754; }

        .district-item:hover {
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transform: translateX(2px);
        }

        .district-name {
          font-weight: 600;
          font-size: 0.875rem;
          margin-bottom: 2px;
        }

        .district-metrics {
          font-size: 0.75rem;
        }

        .matrix-legend {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.875rem;
        }

        .legend-color {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          border: 2px solid currentColor;
        }

        .matrix-axis-labels {
          position: relative;
          margin: 20px 0;
        }

        .y-axis-container {
          position: absolute;
          left: -80px;
          top: 50%;
          transform: translateY(-50%) rotate(-90deg);
          width: 200px;
          text-align: center;
        }

        .x-axis-container {
          text-align: center;
          margin-top: 10px;
        }

        .axis-title {
          font-weight: 600;
          color: #495057;
          font-size: 0.9rem;
        }

        .axis-values {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: #6c757d;
          margin-top: 5px;
        }
      `}</style>

      <div className="text-center mb-4">
        <h5>
          <i className="bi bi-grid-3x3-gap me-2"></i>
          Priority Distribution Matrix
        </h5>
        <p className="text-muted mb-0">
          Districts grouped by calculated priority score (Market Share + Students + Accidents)
        </p>
      </div>

      <div className="matrix-grid">
        {/* Top-Left: CRITICAL */}
        {renderQuadrant(
          quadrants.critical,
          'CRITICAL PRIORITY',
          'critical',
          'bi-exclamation-triangle-fill',
          'Score 75-100: Requires immediate attention and action'
        )}

        {/* Top-Right: MEDIUM */}
        {renderQuadrant(
          quadrants.medium,
          'MEDIUM PRIORITY',
          'medium',
          'bi-info-circle-fill',
          'Score 25-49: Plan and schedule education programs'
        )}

        {/* Bottom-Left: HIGH */}
        {renderQuadrant(
          quadrants.high,
          'HIGH PRIORITY',
          'high',
          'bi-exclamation-circle-fill',
          'Score 50-74: Address soon with focused interventions'
        )}

        {/* Bottom-Right: LOW */}
        {renderQuadrant(
          quadrants.low,
          'LOW PRIORITY',
          'low',
          'bi-check-circle-fill',
          'Score 0-24: Monitor and maintain current status'
        )}
      </div>

      <div className="text-center mt-3">
        <small className="text-muted">
          <strong>Priority Score Calculation:</strong> Market Share (40pts) + Student Population (30pts) + Accident Severity (30pts)
        </small>
      </div>

      <div className="matrix-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ borderColor: '#dc3545' }}></div>
          <span>Critical Priority</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ borderColor: '#ffc107' }}></div>
          <span>High Priority</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ borderColor: '#0dcaf0' }}></div>
          <span>Medium Priority</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ borderColor: '#198754' }}></div>
          <span>Low Priority</span>
        </div>
      </div>
    </div>
  );
};

export default PriorityMatrixChart;
