import { useEffect, useState, useMemo, useCallback } from "react";
import MarsWorld from "./marsworld.jsx";

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
  if ((x >= 14 && y >= 12) || (x < 7 && y > 15)) return "rust";
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

export default function Dashboard({ onReturnToIntro }) {
  const [activeRouteKey, setActiveRouteKey] = useState("A"); // "A" | "B"
  const activeRoute = activeRouteKey === "A" ? chosenRoute : alternateRoute;

  const [status, setStatus] = useState("IDLE"); // "IDLE" | "MOVING" | "PAUSED" | "COMPLETED"
  const [step, setStep] = useState(0);
  const [speed, setSpeed] = useState(1);

  const [showChosen, setShowChosen] = useState(true);
  const [showAlternate, setShowAlternate] = useState(true);
  const [showRocks, setShowRocks] = useState(true);

  // Live telemetry feed received from 3D Rover
  const [telemetry, setTelemetry] = useState({
    heading: "42°",
    pitch: "+12.4°",
    roll: "+3.2°",
    speed: "0.00",
    gridCell: "1, 20",
    worldPos: [-62, 62],
  });

  // Obstacles detected by 3D sensors
  const [detectedObstacles, setDetectedObstacles] = useState([
    { id: "rock-0", distanceMeters: 48, gridX: 4, gridY: 18 },
    { id: "rock-1", distanceMeters: 52, gridX: 1, gridY: 15 },
  ]);

  // Dynamic learning indicators
  const [learningMetrics, setLearningMetrics] = useState({
    safeMoves: 12,
    slipEvents: 3,
    rocksDetected: 14,
    riskManaged: 4,
    turnsExecuted: 6,
    stopsCleared: 2,
    pathEfficiency: 94,
    scansPerformed: 28,
  });

  const [logs, setLogs] = useState([
    "SCOUT Mission Control initialized",
    "Jezero Crater 3D terrain physics connected",
    "Nuclear MMRTG online · 100% Core power",
    "Autonomous navigation ready at Start (0, 19)"
  ]);

  const addLog = useCallback((message) => {
    setLogs((old) => [message, ...old].slice(0, 8));
  }, []);

  const position = activeRoute[Math.min(step, activeRoute.length - 1)] || [0, 19];
  const progress = Math.round((step / (activeRoute.length - 1)) * 100);
  const energy = Math.max(22, 100 - Math.round(progress * 0.76));

  // Step change handler called by 3D rover as it traverses waypoints
  const handleStepChange = useCallback((newStep) => {
    setStep(newStep);
    setLearningMetrics((prev) => ({
      ...prev,
      safeMoves: prev.safeMoves + 1,
      scansPerformed: prev.scansPerformed + 1,
      slipEvents: prev.slipEvents + (Math.random() > 0.8 ? 1 : 0),
    }));
  }, []);

  // Telemetry handler called by 3D rover physics loop
  const handleTelemetryUpdate = useCallback((data) => {
    setTelemetry((prev) => ({ ...prev, ...data }));
  }, []);

  // Obstacle scan handler called by 3D rover sensors
  const handleObstacleScan = useCallback((detectedList) => {
    if (detectedList && detectedList.length > 0) {
      setDetectedObstacles(detectedList);
    }
  }, []);

  // Completion effect
  useEffect(() => {
    if (status === "MOVING" && step >= activeRoute.length - 1) {
      setStatus("COMPLETED");
      addLog("Mission Objective Complete: Jezero Goal reached successfully!");
    }
  }, [step, status, activeRoute.length, addLog]);

  // Controls
  const startMission = () => {
    if (status === "COMPLETED" || step >= activeRoute.length - 1) {
      setStep(0);
    }
    setStatus("MOVING");
    addLog(`Autonomous navigation initiated along Route ${activeRouteKey} at ${speed}× speed`);
  };

  const pauseMission = () => {
    setStatus("PAUSED");
    addLog("Mission paused: Rover stationary on terrain hold");
  };

  const resetMission = () => {
    setStatus("IDLE");
    setStep(0);
    addLog("Mission reset: Rover repositioned at Jezero Start waypoint");
  };

  const handleSwitchRoute = (routeKey) => {
    if (status === "MOVING") {
      pauseMission();
    }
    setActiveRouteKey(routeKey);
    setStep(0);
    addLog(`Active navigation path switched to Route ${routeKey}`);
  };

  const makePoints = (route) =>
    route.map(([x, y]) => `${(x + 0.5) * 5},${(y + 0.5) * 5}`).join(" ");

  return (
    <main className="scout">
      {/* HEADER WITH VIEW SWITCHER */}
      <header className="topbar">
        <div className="brand" onClick={onReturnToIntro} style={{ cursor: "pointer" }} title="Return to Mission Briefing">
          <div className="brand-icon">S</div>
          <div>
            <h2>SCOUT<span>.</span></h2>
            <small>MARS EXPLORATION SYSTEM</small>
          </div>
        </div>

        {/* VIEW NAVIGATION TABS */}
        <div className="view-switcher-bar">
          <button className="view-tab" onClick={onReturnToIntro} title="View mission briefing & specs">
            ✦ BRIEFING / INTRO
          </button>
          <button className="view-tab active" title="Active mission control">
            ❖ MISSION CONTROL
          </button>
        </div>

        <div className="system-status">
          <span>SOL 742 · MISSION JZ-01</span>
          <b>● SYSTEM ONLINE</b>
        </div>
      </header>

      {/* SECTION 1: 3D VIRTUAL MARS WORLD (NOW FULLY INTEGRATED IN PLACEHOLDER!) */}
      <section className="world-section">
        <div className="section-heading">
          <div>
            <small>01 / TERRAIN ENVIRONMENT</small>
            <h1>VIRTUAL MARS WORLD (3D SIMULATION)</h1>
          </div>

          <div className="world-header-tags">
            <span className="route-status-pill">
              ACTIVE: ROUTE {activeRouteKey} ({activeRouteKey === "A" ? "~475m" : "~525m"})
            </span>
            <span className="area-tag">
              JEZERO CRATER &nbsp; 500 × 500 M
            </span>
          </div>
        </div>

        {/* 3D WINDOW HOLDING THE LIVE THREE.JS MARS WORLD */}
        <div className="world-window">
          {/* THE 3D MARS WORLD CANVAS COMPONENT */}
          <div className="world-3d">
            <MarsWorld
              status={status}
              step={step}
              route={activeRoute}
              speed={speed}
              onStepChange={handleStepChange}
              onTelemetryUpdate={handleTelemetryUpdate}
              onObstacleScan={handleObstacleScan}
              addLog={addLog}
              showRocks={showRocks}
              gridRocks={rocks}
            />
          </div>

          {/* OVERLAY CORNER HUD LABELS */}
          <div className="world-label top-left">
            SCOUT / 3D VISUAL FEED
          </div>
          <div className="world-label bottom-left">
            TERRAIN / JEZERO CRATER ELEVATION SYNC
          </div>
          <div className="world-label bottom-right">
            ● FEED ONLINE ({status})
          </div>
        </div>
      </section>

      {/* SECTION 2: 2D MISSION NAVIGATION & CONTROLS */}
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
            <span className="highlight-pill">ELEVATION MAPPED</span>
          </div>
        </div>

        {/* FIRST ROW: 2D GRID MAP + OVERVIEW & TELEMETRY */}
        <div className="top-dashboard-row">
          {/* 2D TERRAIN GRID PANEL */}
          <section className="panel map-panel">
            <div className="panel-heading">
              <div>
                <small>LIVE TERRAIN INTELLIGENCE</small>
                <h2>Jezero Crater / Grid Map</h2>
              </div>
              <span className="live-tag">
                ● {status === "MOVING" ? "ACTIVE TRACKING" : "SIMULATION STANDBY"}
              </span>
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
                  {cells.map((cell) => (
                    <div
                      key={`${cell.x}-${cell.y}`}
                      className={`terrain-cell ${cell.terrain}`}
                    />
                  ))}
                </div>

                <svg className="route-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {showAlternate && (
                    <polyline
                      points={makePoints(alternateRoute)}
                      className={`alternate-route ${activeRouteKey === "B" ? "active-route-line" : ""}`}
                    />
                  )}

                  {showChosen && (
                    <polyline
                      points={makePoints(chosenRoute)}
                      className={`chosen-route ${activeRouteKey === "A" ? "active-route-line" : ""}`}
                    />
                  )}
                </svg>

                {showRocks &&
                  rocks.map(([x, y], i) => (
                    <div
                      key={i}
                      className="rock"
                      style={{
                        left: `${(x + 0.5) * 5}%`,
                        top: `${(y + 0.5) * 5}%`,
                      }}
                    />
                  ))}

                {/* START MARKER */}
                <div className="map-marker start-marker" style={{ left: "2.5%", top: "97.5%" }}>
                  <span>START</span>
                  <b>●</b>
                </div>

                {/* GOAL MARKER */}
                <div className="map-marker goal-marker" style={{ left: "97.5%", top: "17.5%" }}>
                  <span>GOAL</span>
                  <b>◆</b>
                </div>

                {/* SYNCHRONIZED 2D ROVER MARKER */}
                <div
                  className="rover-marker"
                  style={{
                    left: `${(position[0] + 0.5) * 5}%`,
                    top: `${(position[1] + 0.5) * 5}%`,
                  }}
                  title={`Rover at (${position[0] * 25}m, ${position[1] * 25}m)`}
                >
                  ✦
                </div>
              </div>
            </div>

            <div className="route-legend">
              <span>● START (0, 19)</span>
              <span>◆ DESTINATION (19, 3)</span>
              <span><i className="chosen-key" /> ROUTE A ({activeRouteKey === "A" ? "ACTIVE" : "STANDBY"})</span>
              <span><i className="alternate-key" /> ROUTE B ({activeRouteKey === "B" ? "ACTIVE" : "STANDBY"})</span>
            </div>

            {/* SIMULATION CONTROLS */}
            <div className="map-controls">
              <div className="control-group">
                <button
                  className={`run-button ${status === "MOVING" ? "running" : ""}`}
                  onClick={startMission}
                  disabled={status === "MOVING"}
                >
                  ▶ {status === "PAUSED" ? "RESUME" : status === "COMPLETED" ? "RESTART" : "RUN"}
                </button>

                <button onClick={pauseMission} disabled={status !== "MOVING"}>
                  ❚❚ PAUSE
                </button>

                <button onClick={resetMission}>↺ RESET</button>

                <label>
                  SPEED
                  <select
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
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
                  onClick={() => setShowChosen((v) => !v)}
                >
                  ROUTE A
                </button>

                <button
                  className={showAlternate ? "active" : ""}
                  onClick={() => setShowAlternate((v) => !v)}
                >
                  ROUTE B
                </button>

                <button
                  className={showRocks ? "active" : ""}
                  onClick={() => setShowRocks((v) => !v)}
                >
                  ROCKS
                </button>
              </div>
            </div>

            {/* PROGRESS TRACK */}
            <div className="progress-section">
              <div>
                <span>MISSION PROGRESS (ROUTE {activeRouteKey})</span>
                <b>{progress}%</b>
              </div>
              <div className="progress-track">
                <i style={{ width: `${progress}%` }} />
              </div>
            </div>
          </section>

          {/* ASIDE: OVERVIEW & TELEMETRY */}
          <aside className="overview-column">
            {/* MISSION OVERVIEW PANEL */}
            <section className="panel overview-panel">
              <div className="panel-heading">
                <div>
                  <small>03 / LIVE READOUT</small>
                  <h2>MISSION OVERVIEW</h2>
                </div>
                <span className="sim-tag">SYNCED WITH 3D</span>
              </div>

              <div className="overview-grid">
                <Metric
                  label="ROVER STATUS"
                  value={status}
                  color={status === "MOVING" ? "green" : status === "COMPLETED" ? "green" : "amber"}
                />
                <Metric
                  label="CURRENT POSITION"
                  value={`(${position[0] * 25}, ${position[1] * 25})`}
                  unit=" m"
                />
                <Metric
                  label="DISTANCE COVERED"
                  value={step * 25}
                  unit=" m"
                />
                <Metric
                  label="DISTANCE TO GOAL"
                  value={Math.max(0, (activeRoute.length - 1 - step) * 25)}
                  unit=" m"
                />
              </div>

              <div className="overview-progress">
                <div>
                  <span>WAYPOINT MILESTONE</span>
                  <b>{step} / {activeRoute.length - 1}</b>
                </div>
                <div className="progress-track">
                  <i style={{ width: `${progress}%` }} />
                </div>
              </div>
            </section>

            {/* LIVE ROVER TELEMETRY (DYNAMICALLY FEEDS FROM 3D ROVER) */}
            <section className="panel telemetry-panel">
              <SectionTitle number="04" title="ROVER TELEMETRY" tag="LIVE SENSORS" />

              <div className="telemetry-grid">
                <Metric label="HEADING" value={telemetry.heading} color="green" />
                <Metric
                  label="VELOCITY"
                  value={status === "MOVING" ? telemetry.speed : "0.00"}
                  unit=" m/s"
                />
                <Metric
                  label="TERRAIN PITCH"
                  value={telemetry.pitch}
                  color={Math.abs(parseFloat(telemetry.pitch)) > 15 ? "red" : "green"}
                />
                <Metric label="TERRAIN ROLL" value={telemetry.roll} />
                <Metric label="CORE TEMP" value="-59" unit=" °C" />
                <Metric
                  label="WHEEL SLIP"
                  value={status === "MOVING" ? (telemetry.pitch.includes("+1") ? "4.2%" : "0.0%") : "0.0%"}
                />
                <Metric label="COMMS SIGNAL" value="98%" color="green" />
                <Metric label="GRID CELL" value={telemetry.gridCell} />
              </div>
            </section>
          </aside>
        </div>

        {/* LOWER DASHBOARD SECTIONS */}
        <div className="lower-dashboard">
          {/* OBSTACLE DETECTION PANEL */}
          <section className="panel lower-panel">
            <SectionTitle number="05" title="OBSTACLE DETECTION" tag="RADAR SCAN" />

            <div className="obstacle-content">
              <div className="obstacle-highlight">
                <span>DETECTED FORMATIONS</span>
                <strong>{rocks.length}</strong>
                <small>Surface hazards mapped</small>
              </div>

              <div className="four-grid">
                <Metric label="RADAR RANGE" value="50" unit=" m" />
                <Metric label="NEARBY HAZARDS" value={detectedObstacles.length} color="amber" />
                <Metric label="DANGER RADIUS" value="< 15" unit=" m" color="red" />
                <Metric label="TOTAL ROCKS" value={rocks.length} />
              </div>
            </div>

            <div className="detection-list">
              {detectedObstacles.map((obs, idx) => (
                <div className="detection-text" key={obs.id || idx}>
                  <i />
                  <span>
                    <b>Rock formation</b> — ({obs.gridX * 25}, {obs.gridY * 25}) m · <strong>{obs.distanceMeters} m away</strong>
                  </span>
                  <em>DETECTED</em>
                </div>
              ))}
            </div>
          </section>

          {/* ENERGY MANAGEMENT PANEL */}
          <section className="panel lower-panel">
            <SectionTitle number="06" title="ENERGY MANAGEMENT" tag="MMRTG NUCLEAR" />

            <div className="energy-overview">
              <div className="energy-value">
                <strong>{energy}%</strong>
                <small>BATTERY / RTG STORAGE</small>
              </div>
              <span className={`energy-state ${energy > 40 ? "" : "low"}`}>
                {energy > 40 ? "POWER NOMINAL" : "LOW POWER RESERVE"}
              </span>
            </div>

            <div className="energy-track">
              <i style={{ width: `${energy}%` }} />
            </div>

            <div className="energy-breakdown">
              <Metric label="ENERGY CONSUMED" value={`${100 - energy}%`} />
              <Metric label="NEEDED TO GOAL" value="18%" />
              <Metric label="EST. AT GOAL" value="24%" color="green" />
              <Metric label="RTG CONSTANT" value="+110 W" />
            </div>
          </section>

          {/* LEARNING & PERFORMANCE INDICATORS */}
          <section className="panel lower-panel">
            <SectionTitle number="07" title="LEARNING & PERFORMANCE" tag="AI ANALYTICS" />

            <div className="learning-summary">
              <div>
                <strong>{learningMetrics.pathEfficiency}%</strong>
                <span>EFFICIENCY INDEX</span>
              </div>
              <p>Autonomous navigation performance indicators across Jezero Crater.</p>
            </div>

            <div className="learning-bars">
              {[
                { name: "SAFE", val: Math.min(12, learningMetrics.safeMoves) },
                { name: "SLIP", val: Math.min(10, learningMetrics.slipEvents) },
                { name: "ROCK", val: Math.min(12, learningMetrics.rocksDetected) },
                { name: "RISK", val: Math.min(10, learningMetrics.riskManaged) },
                { name: "TURN", val: Math.min(10, learningMetrics.turnsExecuted) },
                { name: "STOP", val: Math.min(8, learningMetrics.stopsCleared) },
                { name: "PATH", val: 10 },
                { name: "SCAN", val: Math.min(12, Math.round(learningMetrics.scansPerformed / 2)) },
              ].map((item, i) => (
                <div className="bar-item" key={i}>
                  <b>{item.val}</b>
                  <i style={{ height: `${item.val * 10}px` }} />
                  <small>{item.name}</small>
                </div>
              ))}
            </div>
          </section>

          {/* MISSION LOGS PANEL */}
          <section className="panel lower-panel">
            <SectionTitle number="08" title="MISSION LOGS" tag={`${logs.length} EVENTS`} />

            <div className="logs-list">
              {logs.map((log, i) => (
                <div className="log-row" key={`${log}-${i}`}>
                  <i />
                  <span>{log}</span>
                  <small>{i === 0 ? "LATEST" : "LOGGED"}</small>
                </div>
              ))}
            </div>
          </section>

          {/* INTERACTIVE ROUTE COMPARISON PANEL */}
          <section className="panel comparison-panel">
            <div className="comparison-header">
              <div>
                <small>09 / NAVIGATION ANALYSIS</small>
                <h2>ROUTE COMPARISON & SELECTION</h2>
                <p>Click below to choose which path the 3D rover navigates.</p>
              </div>
              <span className="comparison-badge">DUAL-ROUTE AI PLANNER</span>
            </div>

            <div className="comparison-cards">
              {/* ROUTE A CARD */}
              <div
                className={`route-card selected-route-card ${activeRouteKey === "A" ? "is-active" : ""}`}
                onClick={() => handleSwitchRoute("A")}
                style={{ cursor: "pointer" }}
              >
                <div className="route-card-top">
                  <div className="route-name">
                    <i className="chosen-key" />
                    <span>ROUTE A (DIRECT)</span>
                  </div>
                  <em>{activeRouteKey === "A" ? "ACTIVE ROUTE" : "CLICK TO SELECT"}</em>
                </div>

                <strong className="route-distance">~475 <small>m</small></strong>
                <span className="route-description">Optimized direct trajectory</span>

                <div className="route-stat-line">
                  <span>Distance</span>
                  <b>475 m</b>
                </div>
                <div className="route-stat-line">
                  <span>Estimated Energy</span>
                  <b>73%</b>
                </div>
                <div className="route-stat-line">
                  <span>Terrain Hazard</span>
                  <b className="positive">LOW RISK</b>
                </div>

                <div className="route-distance-bar">
                  <i style={{ width: "90%" }} />
                </div>
              </div>

              {/* ROUTE B CARD */}
              <div
                className={`route-card alternate-route-card ${activeRouteKey === "B" ? "is-active" : ""}`}
                onClick={() => handleSwitchRoute("B")}
                style={{ cursor: "pointer" }}
              >
                <div className="route-card-top">
                  <div className="route-name">
                    <i className="alternate-key" />
                    <span>ROUTE B (ALTERNATE)</span>
                  </div>
                  <em>{activeRouteKey === "B" ? "ACTIVE ROUTE" : "CLICK TO SELECT"}</em>
                </div>

                <strong className="route-distance">~525 <small>m</small></strong>
                <span className="route-description">Circumnavigation bypass route</span>

                <div className="route-stat-line">
                  <span>Distance</span>
                  <b>525 m</b>
                </div>
                <div className="route-stat-line">
                  <span>Estimated Energy</span>
                  <b>80%</b>
                </div>
                <div className="route-stat-line">
                  <span>Terrain Hazard</span>
                  <b className="caution-text">MODERATE</b>
                </div>

                <div className="route-distance-bar alternate-distance-bar">
                  <i style={{ width: "100%" }} />
                </div>
              </div>
            </div>

            <div className="comparison-result">
              <div className="result-icon">↗</div>
              <div>
                <strong>ROUTE {activeRouteKey} IS CURRENTLY ACTIVE</strong>
                <p>
                  The 3D Mars world and 2D grid are synchronized with Route {activeRouteKey}.
                  Clicking either route card above recalculates waypoints and updates the 3D trajectory instantly.
                </p>
              </div>
              <div className="difference-value">
                <strong>50 m</strong>
                <span>DISTANCE DELTA</span>
              </div>
            </div>
          </section>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <span>SCOUT / AUTONOMOUS MARS ROVER EXPLORATION SYSTEM</span>
        <span>JEZERO CRATER · EXPEDITION JZ-01 · THREE.JS + MISSION CONTROL</span>
      </footer>
    </main>
  );
}
