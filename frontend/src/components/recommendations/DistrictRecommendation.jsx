const formatUnits = (value) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Number(value || 0));
const formatPercentage = (value) => `${Number(value || 0).toFixed(1)}%`;
const formatDifferenceLabel = (difference) => {
  const diff = Number(difference || 0);
  if (diff > 0) return `${formatUnits(diff)} more`;
  if (diff < 0) return `${formatUnits(Math.abs(diff))} fewer`;
  return 'On par';
};

// Weight constants for suggestion scoring
const POLDA_WEIGHT = 0.8;  // 80% from POLDA data
const AHASS_WEIGHT = 0.2;  // 20% from AHASS/Dealer data

const DistrictRecommendation = ({ schools, events, accidents, poldaAccidents = [], marketShare }) => {
  // Calculate weighted accident score combining POLDA (80%) and AHASS (20%)
  const getWeightedAccidentRecommendation = () => {
    // Aggregate POLDA data by city_id (now that we have location data)
    const poldaByCity = {};
    poldaAccidents.forEach(p => {
      const cityId = p.city_id || 'unknown';
      const cityName = p.city_name || p.police_unit || 'Unknown';
      const provinceName = p.province_name || 'NTB';
      
      if (!poldaByCity[cityId]) {
        poldaByCity[cityId] = {
          city_id: cityId,
          city_name: cityName,
          province_name: provinceName,
          police_unit: p.police_unit,
          total_accidents: 0,
          total_deaths: 0,
          total_severe_injury: 0,
          total_minor_injury: 0
        };
      }
      poldaByCity[cityId].total_accidents += p.total_accidents || 0;
      poldaByCity[cityId].total_deaths += p.total_deaths || 0;
      poldaByCity[cityId].total_severe_injury += p.total_severe_injury || 0;
      poldaByCity[cityId].total_minor_injury += p.total_minor_injury || 0;
    });

    // Aggregate AHASS data by city_id
    const ahassByCity = {};
    accidents.forEach(acc => {
      const cityId = acc.city_id || 'unknown';
      const cityName = acc.city_name || 'Unknown City';
      const provinceName = acc.province_name || 'Unknown Province';

      if (!ahassByCity[cityId]) {
        ahassByCity[cityId] = {
          city_id: cityId,
          city_name: cityName,
          province_name: provinceName,
          count: 0,
          deaths: 0,
          injured: 0
        };
      }
      ahassByCity[cityId].count++;
      ahassByCity[cityId].deaths += acc.death_count || 0;
      ahassByCity[cityId].injured += acc.injured_count || 0;
    });

    // Calculate max values for normalization
    const poldaValues = Object.values(poldaByCity);
    const ahassValues = Object.values(ahassByCity);
    
    const maxPoldaAccidents = Math.max(...poldaValues.map(p => p.total_accidents), 1);
    const maxPoldaDeaths = Math.max(...poldaValues.map(p => p.total_deaths), 1);
    const maxAhassCount = Math.max(...ahassValues.map(a => a.count), 1);
    const maxAhassDeaths = Math.max(...ahassValues.map(a => a.deaths), 1);

    // Combine data by city_id with weighted scores
    const combinedByCity = {};
    
    // Add POLDA data
    poldaValues.forEach(p => {
      const accidentScore = (p.total_accidents / maxPoldaAccidents) * 0.6;
      const deathScore = (p.total_deaths / maxPoldaDeaths) * 0.4;
      const poldaScore = (accidentScore + deathScore) * POLDA_WEIGHT;
      
      combinedByCity[p.city_id] = {
        city_id: p.city_id,
        city_name: p.city_name,
        province_name: p.province_name,
        police_unit: p.police_unit,
        polda_accidents: p.total_accidents,
        polda_deaths: p.total_deaths,
        polda_score: poldaScore,
        ahass_count: 0,
        ahass_deaths: 0,
        ahass_score: 0,
        total_score: poldaScore
      };
    });
    
    // Add/merge AHASS data
    ahassValues.filter(a => a.city_id !== 'unknown').forEach(a => {
      const countScore = (a.count / maxAhassCount) * 0.6;
      const deathScore = (a.deaths / maxAhassDeaths) * 0.4;
      const ahassScore = (countScore + deathScore) * AHASS_WEIGHT;
      
      if (combinedByCity[a.city_id]) {
        combinedByCity[a.city_id].ahass_count = a.count;
        combinedByCity[a.city_id].ahass_deaths = a.deaths;
        combinedByCity[a.city_id].ahass_score = ahassScore;
        combinedByCity[a.city_id].total_score += ahassScore;
      } else {
        combinedByCity[a.city_id] = {
          city_id: a.city_id,
          city_name: a.city_name,
          province_name: a.province_name,
          police_unit: '',
          polda_accidents: 0,
          polda_deaths: 0,
          polda_score: 0,
          ahass_count: a.count,
          ahass_deaths: a.deaths,
          ahass_score: ahassScore,
          total_score: ahassScore
        };
      }
    });

    // Sort by total weighted score
    const sorted = Object.values(combinedByCity)
      .filter(c => c.city_id !== 'unknown')
      .sort((a, b) => b.total_score - a.total_score);

    return {
      topCity: sorted[0],
      allCities: sorted.slice(0, 5),
      poldaTotal: poldaValues.reduce((sum, p) => sum + p.total_accidents, 0),
      ahassTotal: ahassValues.reduce((sum, a) => sum + a.count, 0)
    };
  };

  // Calculate recommendation based on uneducated schools
  const getUneducatedSchoolsRecommendation = () => {
    const uneducatedByDistrict = {};

    schools.forEach(school => {
      const isEducated = school.is_educated === true;

      if (!isEducated) {
        const districtName = school.district_name || 'Unknown District';
        const cityName = school.city_name || 'Unknown City';
        const provinceName = school.province_name || 'Unknown Province';
        const districtKey = `${districtName}|${cityName}|${provinceName}`;

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
        uneducatedByDistrict[districtKey].schools.push(school.name || 'Unnamed School');
      }
    });

    const sorted = Object.values(uneducatedByDistrict)
      .filter(d => d.district_name && d.district_name !== 'Unknown District')
      .sort((a, b) => b.count - a.count);

    return sorted.length > 0 ? sorted[0] : null;
  };

  const getMarketShareRecommendation = () => {
    if (!marketShare || !marketShare.topDistricts || marketShare.topDistricts.length === 0) {
      return null;
    }

    const sorted = [...marketShare.topDistricts].sort((a, b) => {
      const shareA = Number(a.market_share || 0);
      const shareB = Number(b.market_share || 0);
      return shareB - shareA;
    });

    return sorted[0];
  };

  const uneducatedRec = getUneducatedSchoolsRecommendation();
  const weightedAccident = getWeightedAccidentRecommendation();
  const marketShareRec = getMarketShareRecommendation();

  if (!uneducatedRec && !weightedAccident.topCity && !marketShareRec) {
    return (
      <div className="alert alert-info">
        <i className="bi bi-info-circle me-2"></i>
        No recommendations available. All districts are well covered!
      </div>
    );
  }

  return (
    <div className="row g-4">
      {/* Recommendation 1: Market Share Opportunity */}
      {marketShareRec && (
        <div className="col-lg-4">
          <div className="card border-primary h-100">
            <div className="card-header bg-primary bg-opacity-10">
              <h5 className="mb-0">
                <i className="bi bi-graph-up-arrow me-2 text-primary"></i>
                Priority: Market Share Growth
              </h5>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-start mb-3">
                <div className="flex-grow-1">
                  <h4 className="mb-1">{marketShareRec.district_name}</h4>
                  <p className="text-muted mb-2">
                    <i className="bi bi-geo-alt me-1"></i>
                    {marketShareRec.city_name}, {marketShareRec.province_name}
                  </p>
                </div>
                <div className="text-end">
                  <div className="badge bg-primary fs-6 px-3 py-2">
                    {formatUnits(marketShareRec.total_sales)} Units
                  </div>
                  <div className="text-muted small mt-1">
                    Share {formatPercentage(marketShareRec.market_share)}
                  </div>
                </div>
              </div>

              <div className="alert alert-primary mb-3">
                <strong>Why this district?</strong>
                <p className="mb-0 small">
                  This district contributes <strong>{formatPercentage(marketShareRec.market_share)}</strong> of total sales, with
                  competitors capturing {formatPercentage(marketShareRec.competitor_share)}. Focused engagement can reinforce brand loyalty.
                </p>
              </div>

              <div className="recommendation-details mb-3">
                <h6 className="text-muted mb-2">
                  <i className="bi bi-bar-chart-line me-2"></i>Market Insights:
                </h6>
                <ul className="small mb-0">
                  <li>Total competitor units: {formatUnits(marketShareRec.competitor_sales)}</li>
                  <li>Monthly difference: {formatDifferenceLabel(marketShareRec.monthly_difference)} vs competitor</li>
                  <li>Current share: {formatPercentage(marketShareRec.market_share)}</li>
                </ul>
              </div>

              <div className="recommendation-details">
                <h6 className="text-muted mb-2">
                  <i className="bi bi-lightbulb me-2"></i>Action Items:
                </h6>
                <ul className="small mb-0">
                  <li>Host community event to reinforce brand presence</li>
                  <li>Offer loyalty incentives to recent buyers</li>
                  <li>Engage local dealers for follow-up campaigns</li>
                </ul>
              </div>
            </div>
            <div className="card-footer bg-transparent">
              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  <i className="bi bi-calendar-check me-1"></i>
                  Suggested for next month
                </small>
                <span className="badge bg-primary">Growth Focus</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendation 2: Uneducated Schools */}
      {uneducatedRec && (
        <div className="col-lg-4">
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

              <div className="recommendation-details mb-3">
                <h6 className="text-muted mb-2">
                  <i className="bi bi-building me-2"></i>Uneducated Schools:
                </h6>
                <div className="alert alert-light mb-0 small" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                  {uneducatedRec.schools && uneducatedRec.schools.length > 0 ? (
                    <ol className="mb-0 ps-3">
                      {uneducatedRec.schools.slice(0, 10).map((schoolName, idx) => (
                        <li key={`school-${idx}-${schoolName}`}>{schoolName}</li>
                      ))}
                      {uneducatedRec.schools.length > 10 && (
                        <li className="text-muted">...and {uneducatedRec.schools.length - 10} more</li>
                      )}
                    </ol>
                  ) : (
                    <p className="mb-0 text-muted">No schools listed</p>
                  )}
                </div>
              </div>

              <div className="recommendation-details">
                <h6 className="text-muted mb-2">
                  <i className="bi bi-lightbulb me-2"></i>Action Items:
                </h6>
                <ul className="small mb-0">
                  <li>Schedule safety riding event for next month</li>
                  <li>Target all {uneducatedRec.count} uneducated schools</li>
                  <li>Coordinate with local education office</li>
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

      {/* Recommendation 3: Weighted Accident Priority (80% POLDA + 20% AHASS) */}
      {weightedAccident.topCity && (
        <div className="col-lg-4">
          <div className="card border-danger h-100">
            <div className="card-header bg-danger bg-opacity-10">
              <h5 className="mb-0">
                <i className="bi bi-exclamation-triangle me-2 text-danger"></i>
                Priority: Accident Hotspot
              </h5>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-start mb-3">
                <div className="flex-grow-1">
                  <h4 className="mb-1">{weightedAccident.topCity.city_name}</h4>
                  <p className="text-muted mb-2">
                    <i className="bi bi-geo-alt me-1"></i>
                    {weightedAccident.topCity.province_name}
                    {weightedAccident.topCity.police_unit && (
                      <span className="ms-1">({weightedAccident.topCity.police_unit})</span>
                    )}
                  </p>
                </div>
                <div className="text-end">
                  <div className="badge bg-danger fs-6 px-3 py-2">
                    Score: {(weightedAccident.topCity.total_score * 100).toFixed(0)}
                  </div>
                </div>
              </div>

              <div className="alert alert-danger mb-3">
                <strong>Combined Analysis (80% POLDA + 20% AHASS)</strong>
                <p className="mb-0 small">
                  Data from both sources are now linked by city/regency for accurate comparison.
                </p>
              </div>

              {/* Data breakdown */}
              <div className="row g-2 mb-3">
                <div className="col-6">
                  <div className="p-2 bg-light rounded text-center">
                    <div className="small text-muted mb-1">
                      <i className="bi bi-shield-fill me-1"></i>POLDA (80%)
                    </div>
                    <div className="fw-bold text-danger">{weightedAccident.topCity.polda_accidents}</div>
                    <div className="small">accidents</div>
                    <div className="small text-muted">{weightedAccident.topCity.polda_deaths} deaths</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-2 bg-light rounded text-center">
                    <div className="small text-muted mb-1">
                      <i className="bi bi-shop me-1"></i>AHASS (20%)
                    </div>
                    <div className="fw-bold text-warning">{weightedAccident.topCity.ahass_count}</div>
                    <div className="small">reports</div>
                    <div className="small text-muted">{weightedAccident.topCity.ahass_deaths} deaths</div>
                  </div>
                </div>
              </div>

              <div className="recommendation-details">
                <h6 className="text-muted mb-2">
                  <i className="bi bi-lightbulb me-2"></i>Action Items:
                </h6>
                <ul className="small mb-0">
                  <li>Prioritize this area for immediate intervention</li>
                  <li>Collaborate with local traffic police</li>
                  <li>Conduct intensive safety awareness campaign</li>
                </ul>
              </div>
            </div>
            <div className="card-footer bg-transparent">
              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  <i className="bi bi-calculator me-1"></i>
                  Total: {weightedAccident.poldaTotal} POLDA + {weightedAccident.ahassTotal} AHASS
                </small>
                <span className="badge bg-danger">Critical</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DistrictRecommendation;
