const DistrictRecommendation = ({ schools, events, accidents }) => {
  // Calculate recommendation based on uneducated schools
  const getUneducatedSchoolsRecommendation = () => {
    // Get school IDs that have events
    const educatedSchoolIds = new Set(events.map(evt => evt.school_id));

    // Group uneducated schools by district
    const uneducatedByDistrict = {};

    schools.forEach(school => {
      if (!educatedSchoolIds.has(school.id)) {
        const districtKey = `${school.district_id || 'unknown'}`;
        const districtName = school.district_name || 'Unknown District';
        const cityName = school.city_name || 'Unknown City';
        const provinceName = school.province_name || 'Unknown Province';

        if (!uneducatedByDistrict[districtKey]) {
          uneducatedByDistrict[districtKey] = {
            district_id: school.district_id,
            district_name: districtName,
            city_name: cityName,
            province_name: provinceName,
            count: 0,
            schools: []
          };
        }

        uneducatedByDistrict[districtKey].count++;
        uneducatedByDistrict[districtKey].schools.push(school.name);
      }
    });

    // Sort by count and get top recommendation
    const sorted = Object.values(uneducatedByDistrict)
      .filter(d => d.district_id && d.district_id !== 'unknown')
      .sort((a, b) => b.count - a.count);

    return sorted.length > 0 ? sorted[0] : null;
  };

  // Calculate recommendation based on accident frequency
  const getAccidentFrequencyRecommendation = () => {
    // Group accidents by district
    const accidentsByDistrict = {};

    accidents.forEach(accident => {
      const districtKey = `${accident.district_id || 'unknown'}`;
      const districtName = accident.district_name || 'Unknown District';
      const cityName = accident.city_name || 'Unknown City';
      const provinceName = accident.province_name || 'Unknown Province';

      if (!accidentsByDistrict[districtKey]) {
        accidentsByDistrict[districtKey] = {
          district_id: accident.district_id,
          district_name: districtName,
          city_name: cityName,
          province_name: provinceName,
          count: 0,
          deaths: 0,
          injured: 0
        };
      }

      accidentsByDistrict[districtKey].count++;
      accidentsByDistrict[districtKey].deaths += accident.death_count || 0;
      accidentsByDistrict[districtKey].injured += accident.injured_count || 0;
    });

    // Sort by count and get top recommendation
    const sorted = Object.values(accidentsByDistrict)
      .filter(d => d.district_id && d.district_id !== 'unknown')
      .sort((a, b) => b.count - a.count);

    return sorted.length > 0 ? sorted[0] : null;
  };

  const uneducatedRec = getUneducatedSchoolsRecommendation();
  const accidentRec = getAccidentFrequencyRecommendation();

  if (!uneducatedRec && !accidentRec) {
    return (
      <div className="alert alert-info">
        <i className="bi bi-info-circle me-2"></i>
        No recommendations available. All districts are well covered!
      </div>
    );
  }

  return (
    <div className="row g-4">
      {/* Recommendation 1: Uneducated Schools */}
      {uneducatedRec && (
        <div className="col-lg-6">
          <div className="card border-warning h-100">
            <div className="card-header bg-warning bg-opacity-10">
              <h5 className="mb-0">
                <i className="bi bi-mortarboard me-2 text-warning"></i>
                Priority: Uneducated Schools
              </h5>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-start mb-3">
                <div className="flex-grow-1">
                  <h4 className="mb-1">{uneducatedRec.district_name}</h4>
                  <p className="text-muted mb-2">
                    <i className="bi bi-geo-alt me-1"></i>
                    {uneducatedRec.city_name}, {uneducatedRec.province_name}
                  </p>
                </div>
                <div className="text-end">
                  <div className="badge bg-warning fs-5 px-3 py-2">
                    {uneducatedRec.count} Schools
                  </div>
                </div>
              </div>

              <div className="alert alert-warning mb-3">
                <strong>Why this district?</strong>
                <p className="mb-0 small">
                  This district has <strong>{uneducatedRec.count} schools</strong> that have never received safety riding education.
                  Organizing an event here would maximize impact.
                </p>
              </div>

              <div className="recommendation-details">
                <h6 className="text-muted mb-2">
                  <i className="bi bi-lightbulb me-2"></i>Action Items:
                </h6>
                <ul className="small mb-0">
                  <li>Schedule safety riding event for next month</li>
                  <li>Target all {uneducatedRec.count} uneducated schools</li>
                  <li>Coordinate with local education office</li>
                  <li>Prepare materials for large group education</li>
                </ul>
              </div>
            </div>
            <div className="card-footer bg-transparent">
              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  <i className="bi bi-calendar-check me-1"></i>
                  Recommended for next month
                </small>
                <span className="badge bg-warning">High Priority</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendation 2: High Accident Rate */}
      {accidentRec && (
        <div className="col-lg-6">
          <div className="card border-danger h-100">
            <div className="card-header bg-danger bg-opacity-10">
              <h5 className="mb-0">
                <i className="bi bi-exclamation-triangle me-2 text-danger"></i>
                Priority: High Accident Rate
              </h5>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-start mb-3">
                <div className="flex-grow-1">
                  <h4 className="mb-1">{accidentRec.district_name}</h4>
                  <p className="text-muted mb-2">
                    <i className="bi bi-geo-alt me-1"></i>
                    {accidentRec.city_name}, {accidentRec.province_name}
                  </p>
                </div>
                <div className="text-end">
                  <div className="badge bg-danger fs-5 px-3 py-2">
                    {accidentRec.count} Accidents
                  </div>
                </div>
              </div>

              <div className="alert alert-danger mb-3">
                <strong>Why this district?</strong>
                <p className="mb-0 small">
                  This district has recorded <strong>{accidentRec.count} accidents</strong> with{' '}
                  <strong>{accidentRec.deaths} deaths</strong> and{' '}
                  <strong>{accidentRec.injured} injuries</strong>.
                  Immediate safety education is critical.
                </p>
              </div>

              <div className="recommendation-details">
                <h6 className="text-muted mb-2">
                  <i className="bi bi-lightbulb me-2"></i>Action Items:
                </h6>
                <ul className="small mb-0">
                  <li>Prioritize this district for immediate intervention</li>
                  <li>Focus on accident prevention strategies</li>
                  <li>Collaborate with local traffic police</li>
                  <li>Conduct intensive safety awareness campaign</li>
                </ul>
              </div>

              <div className="mt-3">
                <div className="row g-2 text-center">
                  <div className="col-6">
                    <div className="p-2 bg-light rounded">
                      <div className="text-danger fw-bold fs-5">{accidentRec.deaths}</div>
                      <small className="text-muted">Deaths</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-2 bg-light rounded">
                      <div className="text-warning fw-bold fs-5">{accidentRec.injured}</div>
                      <small className="text-muted">Injured</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-footer bg-transparent">
              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  <i className="bi bi-calendar-check me-1"></i>
                  Recommended for next month
                </small>
                <span className="badge bg-danger">Critical Priority</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DistrictRecommendation;
