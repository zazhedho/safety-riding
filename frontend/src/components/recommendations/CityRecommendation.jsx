const formatUnits = (value) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Number(value || 0));
const formatPercentage = (value) => `${Number(value || 0).toFixed(1)}%`;

const CityRecommendation = ({ schools, marketShare, accidentRecommendations = [] }) => {
  const getTopSchoolsByCity = (cityId) => {
    return schools
      .filter(s => s.city_id === cityId && !s.is_educated)
      .sort((a, b) => (b.student_count || 0) - (a.student_count || 0))
      .slice(0, 10);
  };

  const getUneducatedSchoolsCity = () => {
    const byCity = {};
    schools.forEach(s => {
      if (s.city_id) {
        if (!byCity[s.city_id]) {
          byCity[s.city_id] = { city_id: s.city_id, city_name: s.city_name, uneducated: 0, educated: 0, total_students: 0 };
        }
        if (s.is_educated) {
          byCity[s.city_id].educated++;
        } else {
          byCity[s.city_id].uneducated++;
          byCity[s.city_id].total_students += s.student_count || 0;
        }
      }
    });
    const sorted = Object.values(byCity).sort((a, b) => b.uneducated - a.uneducated);
    return sorted[0] || null;
  };

  const marketShareCity = marketShare?.topCities?.[0] || null;
  const uneducatedCity = getUneducatedSchoolsCity();
  const accidentCity = accidentRecommendations?.[0] || null;

  const SchoolList = ({ cityId }) => {
    const list = getTopSchoolsByCity(cityId);
    if (!list.length) return <p className="text-muted small mb-0">No uneducated schools in this city</p>;
    return (
      <div className="school-list-box border rounded p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
        <ol className="mb-0 ps-3 small">
          {list.map((s, idx) => (
            <li key={s.id || idx}>{s.name} <span className="text-muted">({formatUnits(s.student_count)} students)</span></li>
          ))}
        </ol>
      </div>
    );
  };

  if (!marketShareCity && !uneducatedCity && !accidentCity) {
    return (
      <div className="alert alert-info">
        <i className="bi bi-info-circle me-2"></i>
        No recommendations available. All cities are well covered!
      </div>
    );
  }

  return (
    <div className="row g-4">
      {marketShareCity && (
        <div className="col-lg-4">
          <div className="card border-primary h-100">
            <div className="card-header bg-primary bg-opacity-10">
              <h5 className="mb-0"><i className="bi bi-graph-up-arrow me-2 text-primary"></i>Priority: Market Share Honda</h5>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h4 className="mb-1">{marketShareCity.city_name}</h4>
                  <p className="text-muted mb-0 small"><i className="bi bi-geo-alt me-1"></i>{marketShareCity.province_name}</p>
                </div>
                <span className="badge bg-primary">{formatPercentage(marketShareCity.market_share)}</span>
              </div>
              <div className="row g-2 mb-3">
                <div className="col-6">
                  <div className="p-2 bg-light rounded text-center">
                    <div className="small text-muted"><i className="bi bi-building me-1"></i>Honda</div>
                    <div className="fw-bold text-primary">{formatPercentage(marketShareCity.market_share)}</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-2 bg-light rounded text-center">
                    <div className="small text-muted"><i className="bi bi-building me-1"></i>Competitor</div>
                    <div className="fw-bold text-secondary">{formatPercentage(marketShareCity.competitor_share)}</div>
                  </div>
                </div>
              </div>
              <div className="alert alert-primary py-2 mb-3">
                <small>City with lowest market share. Safety riding education can increase brand awareness.</small>
              </div>
              <h6 className="text-muted mb-2"><i className="bi bi-mortarboard me-2"></i>Top 10 Priority Schools:</h6>
              <SchoolList cityId={marketShareCity.city_id} />
            </div>
          </div>
        </div>
      )}

      {uneducatedCity && (
        <div className="col-lg-4">
          <div className="card border-warning h-100">
            <div className="card-header bg-warning bg-opacity-10">
              <h5 className="mb-0"><i className="bi bi-mortarboard me-2 text-warning"></i>Priority: Uneducated Schools</h5>
            </div>
            <div className="card-body">
              {(() => {
                const topSchools = getTopSchoolsByCity(uneducatedCity.city_id);
                const topStudents = topSchools.reduce((sum, s) => sum + (s.student_count || 0), 0);
                return (
                  <>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h4 className="mb-1">{uneducatedCity.city_name}</h4>
                        <p className="text-muted mb-0 small"><i className="bi bi-people me-1"></i>{formatUnits(topStudents)} students to reach</p>
                      </div>
                      <span className="badge bg-warning">{uneducatedCity.uneducated} Schools</span>
                    </div>
                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <div className="p-2 bg-light rounded text-center">
                          <div className="small text-muted"><i className="bi bi-check-circle me-1"></i>Educated</div>
                          <div className="fw-bold text-success">{uneducatedCity.educated}</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-2 bg-light rounded text-center">
                          <div className="small text-muted"><i className="bi bi-x-circle me-1"></i>Uneducated</div>
                          <div className="fw-bold text-warning">{uneducatedCity.uneducated}</div>
                        </div>
                      </div>
                    </div>
                    <div className="alert alert-warning py-2 mb-3">
                      <small>City with most uneducated schools. Prioritize for next month's event.</small>
                    </div>
                    <h6 className="text-muted mb-2"><i className="bi bi-mortarboard me-2"></i>Top 10 Priority Schools:</h6>
                    <SchoolList cityId={uneducatedCity.city_id} />
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {accidentCity && (
        <div className="col-lg-4">
          <div className="card border-danger h-100">
            <div className="card-header bg-danger bg-opacity-10">
              <h5 className="mb-0"><i className="bi bi-exclamation-triangle me-2 text-danger"></i>Priority: Accident Blackspot</h5>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h4 className="mb-1">{accidentCity.city_name}</h4>
                  <p className="text-muted mb-0 small"><i className="bi bi-exclamation-circle me-1"></i>Score: {accidentCity.score}</p>
                </div>
                <span className="badge bg-danger">{accidentCity.total_count} Accidents</span>
              </div>
              <div className="row g-2 mb-3">
                <div className="col-6">
                  <div className="p-2 bg-light rounded text-center">
                    <div className="small text-muted"><i className="bi bi-shield-fill me-1"></i>POLDA (80%)</div>
                    <div className="fw-bold text-danger">{accidentCity.polda_count || 0}</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-2 bg-light rounded text-center">
                    <div className="small text-muted"><i className="bi bi-shop me-1"></i>AHASS (20%)</div>
                    <div className="fw-bold text-warning">{accidentCity.ahass_count || 0}</div>
                  </div>
                </div>
              </div>
              <div className="alert alert-danger py-2 mb-3">
                <small>City with highest accident rate. Safety riding education is urgently needed.</small>
              </div>
              <h6 className="text-muted mb-2"><i className="bi bi-mortarboard me-2"></i>Top 10 Priority Schools:</h6>
              <SchoolList cityId={accidentCity.city_id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CityRecommendation;
