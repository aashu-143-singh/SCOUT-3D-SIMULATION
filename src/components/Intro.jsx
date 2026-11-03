import heroImage from '../assets/hero.png'

export default function Intro({ onLaunchDashboard, onStartAutopilot }) {
  return (
    <div className="intro-container">
      {/* BACKGROUND SCI-FI GLOWS */}
      <div className="intro-glow-top" />
      <div className="intro-glow-right" />

      {/* TOP HEADER */}
      <header className="intro-topbar">
        <div className="brand">
          <div className="brand-icon">S</div>
          <div>
            <h2>SCOUT<span>.</span></h2>
            <small>MARS EXPLORATION SYSTEM</small>
          </div>
        </div>

        <div className="intro-nav-status">
          <span className="sol-badge">SOL 742 · 14:38 UTC</span>
          <span className="system-pill">● MISSION JZ-01 READY</span>
          <button className="primary-launch-btn" onClick={() => onLaunchDashboard()}>
            ENTER DASHBOARD ❯
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="intro-hero">
        <div className="hero-text-col">
          <div className="hero-badge">
            <span className="pulse-dot" />
            <span>NASA PERSEVERANCE-CLASS · AUTONOMOUS AI NAVIGATION</span>
          </div>

          <h1 className="hero-heading">
            AUTONOMOUS <br />
            <span>MARS ROVER</span> <br />
            MISSION CONTROL
          </h1>

          <p className="hero-description">
            Next-generation autonomous planetary exploration system deployed in Jezero Crater, Mars.
            Integrating interactive 3D WebGL terrain mapping, real-time sensory obstacle detection,
            dual-route navigation analytics, and high-precision telemetry diagnostics.
          </p>

          <div className="hero-cta-group">
            <button className="cta-btn primary" onClick={() => onLaunchDashboard()}>
              <span>INITIALIZE MISSION CONTROL</span>
              <b>▶</b>
            </button>

            <button
              className="cta-btn secondary"
              onClick={() => {
                if (onStartAutopilot) onStartAutopilot()
                else onLaunchDashboard()
              }}
            >
              <span>RUN AUTOPILOT SIMULATION</span>
              <b>✦</b>
            </button>
          </div>

          {/* QUICK TELEMETRY CHIPS */}
          <div className="hero-stats-row">
            <div className="stat-chip">
              <small>TARGET LOCATION</small>
              <strong>Jezero Crater</strong>
              <span>18.38°N 77.58°E</span>
            </div>
            <div className="stat-chip">
              <small>EXPLORATION AREA</small>
              <strong>500 × 500 m</strong>
              <span>20 × 20 Cell Grid</span>
            </div>
            <div className="stat-chip">
              <small>PROPULSION & POWER</small>
              <strong>Nuclear MMRTG</strong>
              <span>100% Core Power</span>
            </div>
            <div className="stat-chip">
              <small>AI SENSORS</small>
              <strong>Active LiDAR & NavCam</strong>
              <span>50m Detection Range</span>
            </div>
          </div>
        </div>

        {/* HERO VISUAL WITH HOLOGRAM & RADAR */}
        <div className="hero-visual-col">
          <div className="visual-wrapper">
            <div className="radar-circle-outer" />
            <div className="radar-circle-inner" />
            <div className="radar-sweep" />

            <img
              src={heroImage}
              alt="SCOUT Mars Rover"
              className="hero-rover-img"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />

            {/* HUD OVERLAYS */}
            <div className="hud-tag top-left-tag">
              <small>SYSTEM ID</small>
              <b>SCOUT-JZ-01</b>
            </div>

            <div className="hud-tag top-right-tag">
              <small>TERRAIN FEED</small>
              <b>3D READY</b>
            </div>

            <div className="hud-tag bottom-left-tag">
              <small>TELEMETRY LINK</small>
              <b>98.4% STABLE</b>
            </div>

            <div className="hud-tag bottom-right-tag">
              <small>STATUS</small>
              <b className="status-green">STANDBY</b>
            </div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES SECTION */}
      <section className="intro-features">
        <div className="features-header">
          <small>INTEGRATED SYSTEM ARCHITECTURE</small>
          <h2>Three Core Exploration Modules</h2>
          <p>Unified simulation bridging 3D environmental physics and mission operations.</p>
        </div>

        <div className="features-grid">
          {/* Card 1 */}
          <div className="feature-card">
            <div className="feature-card-header">
              <div className="feature-number">01</div>
              <span className="feature-badge">THREE.JS 3D WORLD</span>
            </div>
            <h3>Virtual Mars Environment</h3>
            <p>
              High-fidelity 3D simulation of Jezero Crater built with Three.js and React Three Fiber.
              Features elevation-accurate terrain, delta sediment fans, rock fields, crater mountains,
              and multi-angle camera feeds including free orbit, chase cam, and first-person NavCam.
            </p>
            <div className="feature-footer">
              <span>● Interactive 3D Canvas</span>
              <span>● Physical Rocker-Bogie Rover</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="feature-card featured">
            <div className="feature-card-header">
              <div className="feature-number">02</div>
              <span className="feature-badge">INTELLIGENT PATHFINDING</span>
            </div>
            <h3>Autonomous Navigation & Avoidance</h3>
            <p>
              Real-time dual-route evaluation comparing the primary navigation corridor against
              alternative paths. Equipped with 360° proximity radar scanning that detects hazardous
              rock formations up to 50 meters ahead and recalculates safe waypoints.
            </p>
            <div className="feature-footer">
              <span>● Route A vs Route B Analytics</span>
              <span>● Proximity Sensor Array</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="feature-card">
            <div className="feature-card-header">
              <div className="feature-number">03</div>
              <span className="feature-badge">TELEMETRY & LOGS</span>
            </div>
            <h3>Live Telemetry & Diagnostics</h3>
            <p>
              Sub-second telemetry metrics streaming heading angle, terrain pitch and roll angles,
              rover velocity, motor slip, nuclear power drain, and learning memory indicators that track
              navigational efficiency and obstacle encounters.
            </p>
            <div className="feature-footer">
              <span>● Real-Time Pitch & Roll</span>
              <span>● Live Mission Event Log</span>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA BANNER */}
      <section className="intro-bottom-cta">
        <div className="cta-banner-content">
          <div>
            <h3>Ready to take command of the SCOUT mission?</h3>
            <p>Enter Mission Control to view the 3D Mars world, run the navigation simulation, and inspect live rover telemetry.</p>
          </div>
          <button className="cta-btn primary large-btn" onClick={() => onLaunchDashboard()}>
            <span>LAUNCH MISSION CONTROL</span>
            <b>❯</b>
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="intro-footer">
        <span>SCOUT MARS EXPLORATION SYSTEM · JEZERO CRATER EXPEDITION</span>
        <span>VERSION 2.0 · INTEGRATED 3D MISSION CONTROL</span>
      </footer>
    </div>
  )
}
