# Urban Heat & Human Activity Analytics
> **A Data-Driven Heat Exposure Risk Assessment System**
> *Full-Stack MERN Architecture | Deterministic Statistical Analytics Engine | Production v1.0*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/Node.js-18.x%20%7C%2020.x-green.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0%2B-forestgreen.svg)](https://www.mongodb.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-brightgreen.svg)](https://leafletjs.com/)

---

## 1. Project Overview & Problem Statement

Rapid global urbanization and the loss of permeable vegetated surfaces have exacerbated the **Urban Heat Island (UHI)** effect. Built surfaces such as asphalt, concrete, and high-density structures absorb shortwave solar radiation during daylight hours and continuously re-radiate thermal energy overnight. In dense metropolitan districts, this thermal retention intersects with high pedestrian foot traffic, vehicular congestion, and structural canyons, multiplying thermal vulnerability.

Traditional approaches either evaluate ambient temperatures in isolation or rely on opaque machine-learning models that lack interpretability for municipal planners. 

**Urban Heat & Human Activity Analytics** provides an explainable, deterministic, full-stack decision-support system. It correlates multi-source environmental conditions (ambient temperature, humidity, precipitation, and NDVI green canopy) with demographic and human mobility dynamics (population density, vehicular traffic, and land-use zoning) to derive a normalized **Heat Exposure Risk Index (HERI)**, project microclimate hazards onto an **interactive geospatial intelligence map**, present municipal KPIs in an **Executive Command Center**, and surface transparent, rule-based **Planning Considerations**.

> [!NOTE]
> **Academic & Non-Medical Scientific Disclaimer**:
> All analytical indices, hotspot scores, and planning recommendations produced by this platform are deterministic statistical derivations designed exclusively for municipal research and urban planning exploration. **They do not constitute medical advice, clinical health assessments, emergency dispatch protocols, or weather forecasting.**

---

## 2. System Architecture

```
+---------------------------------------------------------------------------------------+
|                                    PRESENTATION LAYER                                 |
|                                                                                       |
|   +-------------------------------------------------------------------------------+   |
|   |                  React.js Single Page Application (Vite 6)                    |   |
|   |                                                                               |   |
|   |  - Unified Command Center (/dashboard: 10 KPIs, Trends, HERI, Hotspots, Map) |   |
|   |  - Interactive Map Console (/heat-map: Leaflet, 8 Layers, Side Panel, Table)  |   |
|   |  - Insights & Recommendations (/insights: Dual-tab console, CSV, Print, Audit)|   |
|   |  - Risk Index Console (/risk-index: HERI Rankings, Factor Contributions, CSV) |   |
|   |  - Hotspots Console (/hotspots: Rankings, Percentile Cutoffs, Severity, CSV)  |   |
|   |  - Environmental Analytics (/environment: Trends, NDVI & Humidity scatter)    |   |
|   |  - Human Activity Analytics (/human-activity: Traffic, Structural density)    |   |
|   |  - Data Explorer (/data-explorer: Database-backed table, filters, CSV export) |   |
|   |  - Data Import Hub (/data-import: Ingestion pipeline, mapping, error exports) |   |
|   |  - System Health & Settings (/settings: Engine parameters, weights, telemetry)|   |
|   |  - Dedicated CSS Design System (Tokens, components, layout, @media print)     |   |
|   +---------------------------------------+---------------------------------------+   |
+-------------------------------------------|-------------------------------------------+
                                            | HTTP / REST (JSON over Axios)
                                            v
+---------------------------------------------------------------------------------------+
|                                   APPLICATION LAYER                                   |
|                                                                                       |
|   +-------------------------------------------------------------------------------+   |
|   |                             Node.js & Express.js                              |   |
|   |                                                                               |   |
|   |  - RESTful API Routing & Middleware:                                          |   |
|   |      * /api/dashboard/overview        (Unified Command Center aggregate)      |   |
|   |      * /api/map/*                     (Geospatial areas, summary, GeoJSON)    |   |
|   |      * /api/insights/*                (Deterministic Rule-Based Engine)       |   |
|   |      * /api/recommendations/*         (Planning Considerations Engine)        |   |
|   |      * /api/risk/*                    (HERI composite index, ranking, config) |   |
|   |      * /api/hotspots/*                (Hotspot detection, rankings, summary)  |   |
|   |      * /api/analytics/*               (Correlation, regression, anomalies)    |   |
|   |      * /api/areas/*                   (Area management & profiles)            |   |
|   |      * /api/data/*                    (Environmental observations & quality)  |   |
|   |      * /api/import/*                  (CSV validation, commit, error exports) |   |
|   |      * /api/health                    (Service health & database ping)        |   |
|   +---------------------------------------+---------------------------------------+   |
+-------------------------------------------|-------------------------------------------+
                                            | Mongoose ODM (Indexes & Validations)
                                            v
+---------------------------------------------------------------------------------------+
|                                      DATA LAYER                                       |
|                                                                                       |
|   +-------------------------------------------------------------------------------+   |
|   |                          MongoDB Document Database                            |   |
|   |                                                                               |   |
|   |  - Area Collection: Urban district coordinates (lat/lon), zoning, density     |   |
|   |  - EnvironmentalRecord Collection: Time-series telemetry (700+ observations)  |   |
|   |  - ImportJob Collection: Ingestion audit logs & validation history            |   |
|   +-------------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------------+
```

---

## 3. Key Feature Catalog

### 3.1 Executive Command Center (`/dashboard`)
* **10 Municipal KPIs**: City-wide average temperature, maximum recorded temperature, average HERI, high-risk sector count, identified hotspots, dual-exposure priority count, average green canopy %, average vehicular congestion, population residing in high-risk zones, and total telemetry records.
* **Thermal Trajectory Graph**: Day-by-day temperature trends with mean, min, and max envelopes.
* **Hotspot Score vs. HERI Scatter Matrix**: Direct visual verification separating pure temperature hazard from population vulnerability.
* **Pearson Correlation Indicators**: Directional statistical indicators for Temperature vs. Vegetation ($r < 0$) and Temperature vs. Traffic ($r > 0$).
* **Municipal District Priority Rankings**: Tabbed leaderboards for Top Risk Sectors, Top Hotspots, and Low Vulnerability Baselines.
* **Interactive Map Preview & Executive Print Mode**: Deep-links to the full spatial console and `@media print` clean reports.

### 3.2 Geospatial Intelligence Map (`/heat-map`)
* **8 Leaflet Overlay Modes**:
  1. *Heat Exposure Risk Index (HERI)* (Default composite vulnerability)
  2. *Ambient Temperature (°C)*
  3. *Hotspot Score (0–100)*
  4. *Population Density (residents/km²)*
  5. *Vegetation Canopy (%)*
  6. *Traffic Intensity (0–100)*
  7. *Building Density (%)*
  8. *Land Use Zoning Classification*
* **Special Analytical Mode**: High Heat + High Population dual-isolator ($\ge 34^\circ\text{C}$ & $\ge 9,000\text{ residents/km}^2$).
* **Side Inspection Drawer**: Selected district telemetry breakdown with deep links to Area Details.
* **Accessible Data Table**: Synchronized tabular representation beneath the map for screen readers and filtered CSV exports.
* **GeoJSON Standard Support**: Fully RFC 7946 compliant FeatureCollection endpoint at `/api/map/geojson`.

### 3.3 Heat Exposure Risk Index (HERI) (`/risk-index`)
* **Normalized 0–100 Composite Score**:
  $$\text{HERI} = (w_T \cdot T_{\text{norm}}) + (w_H \cdot H_{\text{norm}}) + (w_P \cdot P_{\text{norm}}) + (w_V \cdot [1 - V_{\text{norm}}]) + (w_{Tr} \cdot Tr_{\text{norm}})$$
* **Configurable Model Weights**: Verified default weights ($0.35$ Temp, $0.15$ Humidity, $0.25$ Pop Density, $0.15$ Vegetation deficit, $0.10$ Traffic).
* **Transparent Risk Tiers**: Extreme ($\ge 75$), Very High ($60\text{--}74.9$), High ($45\text{--}59.9$), Moderate ($30\text{--}44.9$), Low ($< 30$).
* **Factor Contribution Decomposition**: Stacked bar visualizers detailing exactly which parameters drive vulnerability.

### 3.4 Hotspot Detection Engine (`/hotspots`)
* **Empirical Multi-Criteria Detection**:
  - Baseline Mean Exceedance ($\Delta T = T_{\text{area}} - \bar{T}_{\text{city}}$).
  - Relative Thresholding (Top 10th percentile and Top 25th percentile).
  - Persistence Frequency ($\% \text{ observations} \ge 35^\circ\text{C}$).
* **Hotspot Score Formulation**:
  $$\text{Hotspot Score} = (0.50 \cdot \Delta T_{\text{norm}}) + (0.30 \cdot \text{Persistence}_{\text{norm}}) + (0.20 \cdot T_{\text{max, norm}})$$

### 3.5 Rule-Based Insights & Recommendations (`/insights`)
* **5 Analytical Categories**: Heat, Environment, Human Activity, Risk, and Data Quality.
* **Deterministic Provenance**: Every card links to mathematical evidence, sample sizes, and empirical thresholds.
* **Transparent Support Tiers**: Strong ($\ge 30$ records, $\ge 80\%$ complete), Moderate ($\ge 10$ records, $\ge 60\%$), Limited ($< 10$ records).
* **Actionable Municipal Considerations**: Targeted mitigations across Urban Forestry, High-Albedo Cool Roofs, Transit Shading, and Buffer Zoning.

### 3.6 Data Management & Explorer (`/data-explorer`, `/data-import`)
* **CSV Ingestion Pipeline**: Header validation, type coercion, range validation ($T \in [-20, 60]^\circ\text{C}$, $\text{NDVI} \in [0, 100]\%$), and error quarantine.
* **Dynamic Table**: Paginated, sortable tabular data explorer with instant search and CSV streaming.

---

## 4. Tech Stack Breakdown

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | React.js | `^18.3.1` | Component-driven user interface |
| **Build Tool** | Vite | `^6.0.5` | Fast HMR development and optimized production bundling |
| **Routing** | React Router DOM | `^7.1.1` | Client-side SPA navigation and URL parameter sync |
| **Geospatial** | Leaflet & React-Leaflet | `^1.9.4` / `^4.2.1` | Interactive vector and circle-marker mapping |
| **Map Tiles** | CartoDB Dark Matter | Free / Open | High-contrast dark-mode basemap tiles (no API key required) |
| **Backend API** | Node.js / Express.js | `^4.21.2` | RESTful microservice routing, validation, and analytics |
| **Database** | MongoDB | `^6.0+` | NoSQL document storage for spatial coordinates and time-series |
| **Object Modeling**| Mongoose ODM | `^8.9.2` | Schema enforcement, indexes, and validation logic |
| **Styling** | Custom CSS3 | Modern CSS | Responsive CSS custom properties (strictly zero Tailwind dependencies) |

---

## 5. Prerequisites & Quick Start Guide

### Prerequisites
* **Node.js**: v18.x or v20.x installed
* **npm**: v9.x or v10.x
* **MongoDB**: Community Server running locally on port `27017` (or a MongoDB Atlas connection string)

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/your-username/urban-heat-analytics.git
cd urban-heat-analytics

# Install all dependencies (root, backend, and frontend concurrently)
npm run install:all
```

### 2. Configure Environment Variables
Copy the example environment file in `server/`:
```bash
cp server/.env.example server/.env
```
Default configuration:
```ini
PORT=5000
MONGODB_URI=mongodb://localhost:27017/urban_heat_analytics
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### 3. Populate Deterministic Demo Dataset
Populate MongoDB with 10 structured municipal districts and 700+ verified environmental observations:
```bash
npm run seed
```

### 4. Start the Application
Launch both backend and frontend development servers concurrently:
```bash
npm run dev
```

* **Frontend Client Application**: `http://localhost:5173`
* **Backend REST API**: `http://localhost:5000`
* **API Health Check**: `http://localhost:5000/api/health`

---

## 6. REST API Reference

All endpoints return uniform JSON envelopes:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Core API Endpoints

| Category | Method | Endpoint | Query Parameters | Description |
| :--- | :--- | :--- | :--- | :--- |
| **System** | `GET` | `/api/health` | — | Service uptime, status, and MongoDB ping |
| **Dashboard**| `GET` | `/api/dashboard/overview` | `timeframe` | Executive 10 KPIs, trends, top risks, and hotspots |
| **Geospatial**| `GET` | `/api/map/summary` | — | Spatial summary counters and city-wide baseline |
| | `GET` | `/api/map/areas` | `layer`, `search` | District array with spatial coordinates and metrics |
| | `GET` | `/api/map/geojson` | — | Standard RFC 7946 GeoJSON FeatureCollection |
| **HERI Risk**| `GET` | `/api/risk/rankings` | `sortBy`, `order`, `limit` | Computed HERI scores, rank order, and factor breakdown |
| | `GET` | `/api/risk/summary` | — | City-wide mean HERI, tier distribution counts |
| | `GET` | `/api/risk/config` | — | Default and user-defined HERI calculation weights |
| **Hotspots** | `GET` | `/api/hotspots/rankings` | `limit`, `sortBy` | Hotspot scores, temperature deltas, and persistence |
| | `GET` | `/api/hotspots/summary` | — | Cutoff thresholds (90th/75th percentile) and counts |
| **Insights** | `GET` | `/api/insights` | `category`, `priority` | Rule-based analytical insights with evidence |
| | `GET` | `/api/insights/summary` | — | Insight category counters and high-priority breakdown |
| **Planning** | `GET` | `/api/recommendations` | `category`, `priority` | Actionable urban planning considerations |
| | `GET` | `/api/recommendations/summary`| — | Recommendation counters by sector and category |
| **Analytics**| `GET` | `/api/analytics/correlations` | — | Pearson correlation coefficients ($r$) and pairs |
| | `GET` | `/api/analytics/temperatures` | `groupBy` | Mean, min, max temperature aggregations |
| **Data** | `GET` | `/api/data` | `page`, `limit`, `area` | Paginated environmental time-series records |
| | `GET` | `/api/areas` | — | Complete list of monitored municipal districts |

---

## 7. Automated Testing Suite

The codebase includes automated test suites covering analytics, calculations, geospatial endpoints, and client builds:

```bash
# 1. Master API Smoke Suite (13/13 Route Verification)
node scratch/test_master_suite.js

# 2. Phase 9 Deterministic Rule-Based Engine Tests (10/10 PASS)
node server/src/analytics/insights/test_phase9_insights.js

# 3. Phase 7 Geospatial Intelligence & GeoJSON Tests
node scratch/test_phase7_map.js

# 4. Phase 6 HERI Calculation & Weight Sensitivity Tests
node scratch/test_phase6_risk.js

# 5. Phase 5 Hotspot Exceedance & Persistence Tests
node scratch/test_phase5_hotspots.js

# 6. Frontend Production Build Verification
npm run build:client
```

---

## 8. Project Directory Structure

```
Data_Analytics/
├── client/                     # React.js SPA (Vite frontend)
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── common/         # Buttons, badges, error boundaries, KPI cards
│   │   │   ├── layout/         # Header, sidebar, navigation, page layout
│   │   │   └── map/            # Leaflet map container, custom icons, layers
│   │   ├── pages/              # Primary route pages (Dashboard, Map, Risk, etc.)
│   │   ├── services/           # Axios HTTP client and API service wrappers
│   │   ├── styles/             # Modular CSS design system (tokens, components)
│   │   ├── App.jsx             # Route definitions and application shell
│   │   └── main.jsx            # React root entry point
│   ├── index.html              # HTML5 template
│   └── vite.config.js          # Vite config & API reverse proxy
├── server/                     # Node.js & Express.js REST API
│   ├── src/
│   │   ├── analytics/          # Pure analytical algorithms
│   │   │   ├── correlations.js # Pearson correlation coefficient calculation
│   │   │   ├── heri.js         # HERI 0-100 normalization and composite scoring
│   │   │   ├── hotspots.js     # Statistical hotspot identification & persistence
│   │   │   └── insights/       # Rule-based insights & planning considerations
│   │   ├── controllers/        # Route request handlers
│   │   ├── models/             # Mongoose schemas (Area, Record, ImportJob)
│   │   ├── routes/             # REST API route endpoints
│   │   ├── seed/               # Deterministic synthetic dataset generator
│   │   ├── app.js              # Express app initialization and middleware
│   │   └── server.js           # HTTP server bootstrap and MongoDB connection
│   └── .env.example            # Environment configuration template
├── scratch/                    # Verification scripts & integration test suites
├── DEMO_GUIDE.md               # 5-10 minute oral presentation script & Q&A guide
├── VIVA_NOTES.md               # 20 technical defense viva interview questions
├── RESUME_DESCRIPTION.md       # High-impact resume bullet points & project summaries
├── PROJECT_DESCRIPTION.md      # Comprehensive academic portfolio case study
├── .gitignore                  # Production Git ignore rules
└── package.json                # Root package workspace scripts
```

---

## 9. Security, Performance & Browser Compatibility

* **Zero Plaintext Secrets**: All database connection strings and server port configurations reside exclusively in `.env` and are untracked by Git.
* **Input Sanitization & Type Coercion**: Data ingestion validates numerical bounds, prevents prototype pollution, and validates MongoDB ObjectIds.
* **Deterministic Memory Aggregations**: Mathematical operations (Pearson $r$, Min-Max normalization, HERI composite weighting) run synchronously without blocking the event loop.
* **Leaflet Hardware Acceleration**: Vector layer rendering leverages hardware GPU acceleration via CSS transforms.
* **Cross-Browser Verification**: Fully tested and responsive on Chrome/Edge (Chromium 120+), Firefox (120+), and Safari (WebKit 17+).

---

## 10. License & Academic Attribution

This project is developed as an academic and engineering portfolio submission. Released under the [MIT License](LICENSE).
