import { useEffect, useState } from "react";
import "./App.css";

const SIZE = 20;

const chosenRoute = [
  [0,19],[1,18],[2,17],[3,16],[4,15],
  [5,14],[6,13],[7,12],[8,11],[9,10],
  [10,9],[11,8],[12,7],[13,6],[14,5],
  [15,4],[16,3],[17,2],[18,2],[19,3]
];

const alternateRoute = [
  [0,19],[1,18],[2,18],[3,17],[4,16],
  [5,15],[6,14],[7,13],[8,12],[9,11],
  [10,10],[11,9],[12,8],[13,7],[14,6],
  [15,5],[16,4],[17,3],[18,3],[19,3]
];

const rocks = [
  [1,1],[4,0],[5,1],[7,1],[13,2],[16,0],
  [17,4],[7,5],[11,6],[12,8],[3,9],[8,10],
  [10,12],[12,12],[3,13],[7,14],[8,14],
  [11,15],[14,16],[17,17],[4,18],[13,18],
  [1,15],[15,12],[5,7],[9,3],[14,9],[18,11],
  [2,6],[6,17],[10,4],[16,8],[5,12],[18,5]
];

function getTerrain(x, y) {
  const n = (x * 31 + y * 17 + x * y * 7) % 100;

  if ((x >= 14 && y >= 12) || (x < 7 && y > 15))
    return "rust";

  if (n < 12) return "hazard";
  if (n < 29) return "caution";
  if (n < 56) return "safe";

  return "rough";
}

const cells = Array.from({ length: SIZE * SIZE }, (_, i) => {
  const x = i % SIZE;
  const y = Math.floor(i / SIZE);

  return { x, y, terrain: getTerrain(x, y) };
});

function Metric({ label, value, unit = "", color = "" }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong className={color}>{value}{unit}</strong>
    </div>
  );
}

function SectionTitle({ number, title, tag }) {
  return (
    <div className="number-heading">
      <b>{number}</b>
      <h3>{title}</h3>
      {tag && <span className="section-tag">{tag}</span>}
    </div>
  );
}

export default function App() {
  const [status, setStatus] = useState("IDLE");
  const [step, setStep] = useState(0);
  const [speed, setSpeed] = useState(1);

  const [showChosen, setShowChosen] = useState(true);
  const [showAlternate, setShowAlternate] = useState(true);
  const [showRocks, setShowRocks] = useState(true);

  const [logs, setLogs] = useState([
    "Mission control initialized",
    "Jezero Crater terrain loaded",
    "Navigation simulation ready"
  ]);

  const position = chosenRoute[step];

  const progress = Math.round(
    (step / (chosenRoute.length - 1)) * 100
  );

  const energy = Math.max(27, 100 - Math.round(progress * 0.73));

  const addLog = (message) => {
    setLogs(old => [message, ...old].slice(0, 5));
  };

  useEffect(() => {
    if (status !== "MOVING") return;

    const timer = setInterval(() => {
      setStep(old => Math.min(old + 1, chosenRoute.length - 1));
    }, 1000 / speed);

    return () => clearInterval(timer);
  }, [status, speed]);

  useEffect(() => {
    if (status === "MOVING" && step === chosenRoute.length - 1) {
      setStatus("COMPLETED");
      addLog("Destination reached successfully");
    }
  }, [step, status]);

  const startMission = () => {
    if (status === "COMPLETED") setStep(0);

    setStatus("MOVING");
    addLog("Rover movement started");
  };

  const pauseMission = () => {
    setStatus("PAUSED");
    addLog("Mission paused");
  };

  const resetMission = () => {
    setStatus("IDLE");
    setStep(0);
    addLog("Mission reset");
  };

  const makePoints = (route) =>
    route.map(([x, y]) =>
      `${(x + 0.5) * 5},${(y + 0.5) * 5}`
    ).join(" ");

  return (
    <main className="scout">

      {/* HEADER */}

      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">S</div>
          <div>
            <h2>SCOUT<span>.</span></h2>
            <small>MARS EXPLORATION SYSTEM</small>
          </div>
        </div>

        <div className="top-center">
          <i /> MISSION CONTROL
        </div>

        <div className="system-status">
          <span>MISSION / JZ-01</span>
          <b>● SYSTEM ONLINE</b>
        </div>
      </header>

      {/* LARGE 3D WORLD */}

      <section className="world-section">
        <div className="section-heading">
          <div>
            <small>01 / TERRAIN ENVIRONMENT</small>
            <h1>VIRTUAL MARS WORLD</h1>
          </div>

          <span className="area-tag">
            JEZERO CRATER &nbsp; 500 × 500 M
          </span>
        </div>

        <div className="world-window">
          <div className="mars-orb" />

          <div className="world-content">
            <small>3D ENVIRONMENT CONNECTION POINT</small>
            <h2>MARS TERRAIN SIMULATION</h2>
            <p>Your teammate's Three.js world will appear here.</p>
            <span>JEZERO CRATER · 500 M × 500 M</span>
          </div>

          <div className="world-label top-left">
            SCOUT / VISUAL FEED
          </div>
          <div className="world-label top-right">3D MODULE</div>
          <div className="world-label bottom-left">
            TERRAIN / JEZERO CRATER
          </div>
          <div className="world-label bottom-right">
            ● FEED STANDBY
          </div>
        </div>
      </section>

      {/* DASHBOARD */}

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <small>02 / MISSION CONTROL</small>
            <h1>MISSION NAVIGATION</h1>
          </div>

          <div className="map-info">
            <span>20 × 20 CELLS</span>
            <span>25 M / CELL</span>
            <span>500 × 500 M</span>
          </div>
        </div>

        {/* FIRST ROW: GRID + OVERVIEW */}

        <div className="top-dashboard-row">

          {/* TERRAIN GRID */}

          <section className="panel map-panel">
            <div className="panel-heading">
              <div>
                <small>LIVE TERRAIN INTELLIGENCE</small>
                <h2>Jezero Crater / Grid Map</h2>
              </div>
              <span className="live-tag">● SIMULATION</span>
            </div>

            <div className="terrain-legend">
              <span><i className="safe-box" /> SAFE</span>
              <span><i className="caution-box" /> CAUTION</span>
              <span><i className="hazard-box" /> HAZARD</span>
              <span><i className="rough-box" /> ROUGH TERRAIN</span>
            </div>

            <div className="horizontal-coordinates">
              <span>0m</span>
              <span>125m</span>
              <span>250m</span>
              <span>375m</span>
              <span>500m</span>
            </div>

            <div className="map-layout">
              <div className="vertical-coordinates">
                <span>0m</span>
                <span>125m</span>
                <span>250m</span>
                <span>375m</span>
                <span>500m</span>
              </div>

              <div className="terrain-map">
                <div className="terrain-grid">
                  {cells.map(cell => (
                    <div
                      key={`${cell.x}-${cell.y}`}
                      className={`terrain-cell ${cell.terrain}`}
                    />
                  ))}
                </div>

                <svg
                  className="route-svg"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  {showAlternate && (
                    <polyline
                      points={makePoints(alternateRoute)}
                      className="alternate-route"
                    />
                  )}

                  {showChosen && (
                    <polyline
                      points={makePoints(chosenRoute)}
                      className="chosen-route"
                    />
                  )}
                </svg>

                {showRocks && rocks.map(([x, y], i) => (
                  <div
                    key={i}
                    className="rock"
                    style={{
                      left: `${(x + 0.5) * 5}%`,
                      top: `${(y + 0.5) * 5}%`
                    }}
                  />
                ))}

                <div
                  className="map-marker start-marker"
                  style={{ left: "2.5%", top: "97.5%" }}
                >
                  <span>START</span>
                  <b>●</b>
                </div>

                <div
                  className="map-marker goal-marker"
                  style={{ left: "97.5%", top: "17.5%" }}
                >
                  <span>GOAL</span>
                  <b>◆</b>
                </div>

                <div
                  className="rover-marker"
                  style={{
                    left: `${(position[0] + 0.5) * 5}%`,
                    top: `${(position[1] + 0.5) * 5}%`
                  }}
                >
                  ✦
                </div>
              </div>
            </div>

            <div className="route-legend">
              <span>● START POINT</span>
              <span>◆ DESTINATION</span>
              <span><i className="chosen-key" /> CHOSEN ROUTE</span>
              <span><i className="alternate-key" /> ALTERNATE ROUTE</span>
            </div>

            <div className="map-controls">
              <div className="control-group">
                <button className="run-button" onClick={startMission}>
                  ▶ {status === "PAUSED" ? "RESUME" : "RUN"}
                </button>

                <button
                  onClick={pauseMission}
                  disabled={status !== "MOVING"}
                >
                  PAUSE
                </button>

                <button onClick={resetMission}>RESET</button>

                <label>
                  SPEED
                  <select
                    value={speed}
                    onChange={e => setSpeed(Number(e.target.value))}
                  >
                    <option value="1">1×</option>
                    <option value="2">2×</option>
                    <option value="4">4×</option>
                  </select>
                </label>
              </div>

              <div className="control-group">
                <button
                  className={showChosen ? "active" : ""}
                  onClick={() => setShowChosen(v => !v)}
                >
                  CHOSEN ROUTE
                </button>

                <button
                  className={showAlternate ? "active" : ""}
                  onClick={() => setShowAlternate(v => !v)}
                >
                  ALT ROUTE
                </button>

                <button
                  className={showRocks ? "active" : ""}
                  onClick={() => setShowRocks(v => !v)}
                >
                  ROCKS
                </button>
              </div>
            </div>

            <div className="progress-section">
              <div>
                <span>MISSION PROGRESS</span>
                <b>{progress}%</b>
              </div>
              <div className="progress-track">
                <i style={{ width: `${progress}%` }} />
              </div>
            </div>
          </section>

          {/* MISSION OVERVIEW + TELEMETRY */}

          <aside className="overview-column">
            <section className="panel overview-panel">
              <div className="panel-heading">
                <div>
                  <small>03 / LIVE READOUT</small>
                  <h2>MISSION OVERVIEW</h2>
                </div>
                <span className="sim-tag">SIMULATED</span>
              </div>

              <div className="overview-grid">
                <Metric
                  label="ROVER STATUS"
                  value={status}
                  color="green"
                />
                <Metric
                  label="CURRENT POSITION"
                  value={`(${position[0] * 25}, ${position[1] * 25})`}
                />
                <Metric
                  label="DISTANCE TRAVELLED"
                  value={step * 25}
                  unit=" m"
                />
                <Metric
                  label="DISTANCE REMAINING"
                  value={(19 - step) * 25}
                  unit=" m"
                />
              </div>

              <div className="overview-progress">
                <div>
                  <span>MISSION COMPLETION</span>
                  <b>{progress}%</b>
                </div>
                <div className="progress-track">
                  <i style={{ width: `${progress}%` }} />
                </div>
              </div>
            </section>

            <section className="panel telemetry-panel">
              <SectionTitle number="04" title="ROVER TELEMETRY" tag="LIVE DATA" />

              <div className="telemetry-grid">
                <Metric label="HEADING" value="42°" />
                <Metric
                  label="SPEED"
                  value={status === "MOVING" ? "0.45" : "0.00"}
                  unit=" m/s"
                />
                <Metric label="PITCH" value="22.6°" color="red" />
                <Metric label="ROLL" value="9.0°" />
                <Metric label="TEMPERATURE" value="-59" unit=" °C" />
                <Metric label="WHEEL SLIP" value="0%" />
                <Metric label="COMMS" value="92%" color="green" />
                <Metric
                  label="GRID CELL"
                  value={`${position[0] + 1}, ${position[1] + 1}`}
                />
              </div>
            </section>
          </aside>
        </div>

        {/* ALL REMAINING SECTIONS BELOW THE FIRST ROW */}

        <div className="lower-dashboard">

          {/* OBSTACLE DETECTION */}

          <section className="panel lower-panel">
            <SectionTitle number="05" title="OBSTACLE DETECTION" tag="TERRAIN SCAN" />

            <div className="obstacle-content">
              <div className="obstacle-highlight">
                <span>DETECTED OBJECTS</span>
                <strong>{rocks.length}</strong>
                <small>Rock formations on grid</small>
              </div>

              <div className="four-grid">
                <Metric label="SENSOR RANGE" value="50" unit=" m" />
                <Metric label="DETECTED" value={rocks.length} color="amber" />
                <Metric label="WITHIN 75 M" value="2" color="red" />
                <Metric label="TOTAL ROCKS" value={rocks.length} />
              </div>
            </div>

            <div className="detection-list">
              <div className="detection-text">
                <i />
                <span><b>Rock formation</b> — (450, 0) m · 50 m away</span>
                <em>DETECTED</em>
              </div>
              <div className="detection-text">
                <i />
                <span><b>Rock formation</b> — (400, 50) m · 50 m away</span>
                <em>DETECTED</em>
              </div>
            </div>
          </section>

          {/* ENERGY MANAGEMENT */}

          <section className="panel lower-panel">
            <SectionTitle number="06" title="ENERGY MANAGEMENT" tag="POWER SYSTEM" />

            <div className="energy-overview">
              <div className="energy-value">
                <strong>{energy}%</strong>
                <small>ENERGY REMAINING</small>
              </div>
              <span className="energy-state">
                {energy > 40 ? "POWER STABLE" : "LOW POWER"}
              </span>
            </div>

            <div className="energy-track">
              <i style={{ width: `${energy}%` }} />
            </div>

            <div className="energy-breakdown">
              <Metric label="ENERGY USED" value={`${100 - energy}%`} />
              <Metric label="NEEDED TO GOAL" value="18%" />
              <Metric label="EST. AT GOAL" value="27%" color="green" />
              <Metric label="SOLAR INPUT" value="+0 W" />
            </div>
          </section>

          {/* LEARNING & PERFORMANCE */}

          <section className="panel lower-panel">
            <SectionTitle number="07" title="LEARNING & PERFORMANCE" tag="ANALYTICS" />

            <div className="learning-summary">
              <div>
                <strong>08</strong>
                <span>PERFORMANCE INDICATORS</span>
              </div>
              <p>Illustrative indicators from the current simulation.</p>
            </div>

            <div className="learning-bars">
              {[8, 6, 5, 3, 3, 2, 10, 6].map((n, i) => (
                <div className="bar-item" key={i}>
                  <b>{n}</b>
                  <i style={{ height: `${n * 11}px` }} />
                  <small>
                    {["SAFE", "SLIP", "ROCK", "RISK", "TURN", "STOP", "PATH", "SCAN"][i]}
                  </small>
                </div>
              ))}
            </div>
          </section>

          {/* MISSION LOGS */}

          <section className="panel lower-panel">
            <SectionTitle number="08" title="MISSION LOGS" tag={`${logs.length} EVENTS`} />

            <div className="logs-list">
              {logs.map((log, i) => (
                <div className="log-row" key={`${log}-${i}`}>
                  <i />
                  <span>{log}</span>
                  <small>{i === 0 ? "LATEST" : "EVENT"}</small>
                </div>
              ))}
            </div>
          </section>

          {/* PREMIUM ROUTE COMPARISON */}

          <section className="panel comparison-panel">
            <div className="comparison-header">
              <div>
                <small>09 / NAVIGATION ANALYSIS</small>
                <h2>ROUTE COMPARISON</h2>
                <p>Compare the two available navigation paths.</p>
              </div>
              <span className="comparison-badge">ROUTE ANALYSIS</span>
            </div>

            <div className="comparison-cards">
              <div className="route-card selected-route-card">
                <div className="route-card-top">
                  <div className="route-name">
                    <i className="chosen-key" />
                    <span>ROUTE A</span>
                  </div>
                  <em>SELECTED ROUTE</em>
                </div>

                <strong className="route-distance">~475 <small>m</small></strong>
                <span className="route-description">Chosen navigation path</span>

                <div className="route-stat-line">
                  <span>Distance</span>
                  <b>475 m</b>
                </div>
                <div className="route-stat-line">
                  <span>Estimated energy</span>
                  <b>73%</b>
                </div>
                <div className="route-stat-line">
                  <span>Route preference</span>
                  <b className="positive">SELECTED</b>
                </div>

                <div className="route-distance-bar">
                  <i style={{ width: "90%" }} />
                </div>
              </div>

              <div className="route-card alternate-route-card">
                <div className="route-card-top">
                  <div className="route-name">
                    <i className="alternate-key" />
                    <span>ROUTE B</span>
                  </div>
                  <em>ALTERNATE</em>
                </div>

                <strong className="route-distance">~525 <small>m</small></strong>
                <span className="route-description">Alternative navigation path</span>

                <div className="route-stat-line">
                  <span>Distance</span>
                  <b>525 m</b>
                </div>
                <div className="route-stat-line">
                  <span>Estimated energy</span>
                  <b>80%</b>
                </div>
                <div className="route-stat-line">
                  <span>Route preference</span>
                  <b className="caution-text">ALTERNATE</b>
                </div>

                <div className="route-distance-bar alternate-distance-bar">
                  <i style={{ width: "100%" }} />
                </div>
              </div>
            </div>

            <div className="comparison-result">
              <div className="result-icon">↗</div>
              <div>
                <strong>ROUTE A IS THE CURRENTLY SELECTED PATH</strong>
                <p>
                  The displayed distance and energy figures are illustrative
                  estimates for this frontend simulation, not live rover measurements.
                </p>
              </div>
              <div className="difference-value">
                <strong>50 m</strong>
                <span>DISTANCE DIFFERENCE</span>
              </div>
            </div>
          </section>
        </div>
      </section>

      <footer className="footer">
        <span>SCOUT / MARS ROVER EXPLORATION SIMULATION</span>
        <span>JEZERO CRATER · MISSION JZ-01</span>
      </footer>
    </main>
  );
}