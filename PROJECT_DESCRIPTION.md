# Urban Heat & Human Activity Analytics — Project Portfolio Case Study

> **A Data-Driven Heat Exposure Risk Assessment Platform**

---

## 1. Problem Statement
Urban centers globally face escalating temperatures due to the **Urban Heat Island (UHI)** effect. Impervious concrete, high structural massing, loss of vegetative tree cover, and anthropogenic waste heat from vehicles and HVAC units elevate localized surface temperatures significantly above surrounding rural landscapes.

Traditional meteorological dashboards present raw temperature observations in isolation. However, temperature alone is insufficient to evaluate real-world human risk:
* A desert experiencing $44^\circ\text{C}$ with zero human activity poses no civic emergency.
* An urban transit interchange or dense commercial market experiencing $38^\circ\text{C}$ creates severe cumulative heat exposure for thousands of pedestrians and commuters.

Municipal decision-makers lack integrated platforms that unite environmental conditions, structural density, demographic exposure, and spatial zoning into actionable risk assessments.

---

## 2. Solution Overview
**Urban Heat & Human Activity Analytics** is an end-to-end full-stack data analytics system designed to bridge meteorological observations and urban planning decisions:
1. **Multi-Source Data Architecture**: Ingests and validates time-series telemetry (temperature, humidity, precipitation, traffic flow, vegetation coverage, building density, population density).
2. **Core Analytics Engine**: Computes descriptive statistics, diurnal variations, and Pearson correlation matrices.
3. **Statistical Hotspot Detection**: Flags anomalous municipal sectors using a dynamic 90th percentile threshold and evaluates temporal persistence.
4. **Heat Exposure Risk Index (HERI)**: A composite, explainable 0–100 risk score combining environmental hazard, demographic exposure, and mitigative canopy cover.
5. **Interactive Geospatial Intelligence**: Visualizes 8 analytical layers on a Leaflet map with district inspection sidebars and dual-vulnerability filtering.
6. **Data-Driven Insights & Planning Recommendations**: Deterministic, rule-based algorithms synthesize empirical findings into non-prescriptive municipal cooling considerations.

---

## 3. Key Features

### 🏛️ Unified Analytics Command Center (`/dashboard`)
* **10-KPI Executive Summary Grid**: Mean/peak temperatures, city-wide HERI average, high-risk sector count, active hotspots, average canopy %, and total observations.
* **Trajectory Visualizations**: Daily and monthly thermal baselines with district-by-district multi-line comparisons.
* **Correlation & Relationship Matrix**: Interactive scatter plots illustrating temperature vs. vegetation cover and vehicular congestion.
* **Dual Vulnerability Target**: Identifies districts combining high heat ($\ge 34^\circ\text{C}$) with dense population ($\ge 9,000/\text{km}^2$).

### 🗺️ Interactive Geospatial Intelligence Map (`/heat-map`)
* **8 Dynamic Analytical Layers**: Heat Risk, Temperature, Hotspot Score, Population Density, Traffic Index, Vegetation Cover, Building Density, and Land Use.
* **Interactive District Inspector**: Clicking any marker centers the coordinate view and populates a telemetry side drawer.
* **High Heat + Dense Population Filter**: One-click spatial isolation of priority civic intervention areas.
* **Accessible Data Table & CSV Export**: Tabular view of spatial coordinates and attributes with spreadsheet download.

### 🔥 Urban Heat Hotspot Detection Console (`/hotspots`)
* **Dynamic 90th Percentile Rule**: Automatically computes relative city-wide thermal thresholds.
* **Composite Hotspot Score (0–100)**: Integrates exceedance frequency ($50\%$) and thermal magnitude ($50\%$).
* **Temporal Persistence Modeling**: Distinguishes persistent heat islands from temporary heat spikes.
* **Trajectory Traversal**: Compares historical thermal baselines against 7-day trailing observation windows.

### 🛡️ Heat Exposure Risk Index (HERI) Engine (`/risk-index`)
* **Explainable Mathematical Model**: Combines 7 normalized factors into a 0–100 scale:
  * Ambient Temperature ($35\%$)
  * Population Density ($20\%$)
  * Building Density ($10\%$)
  * Traffic Congestion ($10\%$)
  * Relative Humidity ($10\%$)
  * Vegetation Canopy ($10\%$, protective/inverted)
  * Rainfall ($5\%$, protective/inverted)
* **Factor Contribution Waterfall**: Explicitly visualizes which dimensions contribute to an area's final score.
* **Configurable Policy Weights**: Allows municipal planners to adjust factor weights and inspect alternative policy scenarios.

### 💡 Data-Driven Insights & Planning Recommendations (`/insights`)
* **5 Insight Categories**: Heat, Environment, Human Activity, Risk, and Data Quality.
* **Transparent Data Support Tiers**: Distinguishes findings backed by `Strong Data Support` ($\ge 30$ observations, $\ge 80\%$ completeness) from limited observations.
* **Non-Prescriptive Action Planning**: Recommends targeted urban cooling measures (cool roofs, tree canopy corridors, pedestrian misting stations, industrial buffer zones) with explicit supporting metrics and planning horizons.
* **Report Printing & Export**: Built-in `@media print` layout and CSV generators.

### 📥 Robust Data Ingestion & Quality Explorer (`/data-explorer` & `/data-import`)
* **4-Stage Import Pipeline**: Schema verification, data type coercion, geographical bounds checking, and spatial deduplication.
* **Row-Level Error Export**: Allows users to download a rejected-rows audit CSV with precise row numbers and failure reasons.
* **Data Explorer Console**: Multi-column sorting, pagination, and real-time substring search across all database records.

---

## 4. Architecture & Technology Stack

```
+-----------------------------------------------------------------------------+
|                               FRONTEND (SPA)                                |
|  React.js 18  |  Vite 6  |  React Router 6  |  React-Leaflet 4  |  Recharts |
|  - Custom CSS Design System (Zero Tailwind, fully accessible)               |
|  - Global React Error Boundary & Responsive Layout Engine                   |
+--------------------------------------+--------------------------------------+
                                       | REST API (HTTP / JSON)
                                       v
+-----------------------------------------------------------------------------+
|                              BACKEND API SERVER                             |
|  Node.js  |  Express.js 4  |  Multer  |  Morgan Logger  |  CORS Middleware  |
|  - Controllers: Analytics, Hotspots, Risk, Map, Insights, Recommendations   |
|  - Pipeline: Multi-stage CSV validation & row-level feedback                |
+--------------------------------------+--------------------------------------+
                                       | Mongoose ODM (Indexes & Validations)
                                       v
+-----------------------------------------------------------------------------+
|                             DATABASE STORAGE                                |
|  MongoDB 8  |  Time-Series Collections  |  Compound Indexes | GeoJSON 2dsphere |
+-----------------------------------------------------------------------------+
```

---

## 5. Verification & Test Coverage
The platform includes deterministic automated test suites:
* **Master API Smoke Suite (`scratch/test_master_suite.js`)**: 13/13 endpoints verified (Health, Dashboard, Areas, Data, Analytics, Hotspots, Risk, Map, Insights, Recommendations, Error Handling).
* **Phase 9 Insights & Recommendations Suite (`test_phase9_insights.js`)**: 10/10 tests passed (Categorization, non-prescriptive wording, cache invalidation, single ID inspection).
* **Phase 6 HERI Model Suite (`test_phase6_risk.js`)**: 8/8 tests passed (0–100 bounding, factor contribution summing, weight configuration).
* **Phase 7 Geospatial Map Suite (`test_phase7_map.js`)**: 4/4 tests passed (RFC 7946 GeoJSON, marker coordinates, layer attributes).
* **Production Build (`npm run build`)**: 790 modules transformed, compiling cleanly in under 10 seconds.

---

## 6. Limitations & Future Roadmap
* **Centroid Point Geometry**: Municipal districts are modeled as geographic centroids with circular representations. Future enhancements could ingest official municipal ward polygon shapefiles.
* **Synthetic Demonstration Records**: The active database runs on a calibrated, deterministic synthetic dataset of 700+ observations across 11 districts. Real-world continuous satellite telemetry feeds (e.g., Copernicus Sentinel-2) represent a logical production extension.
* **Linear Weighting Model**: HERI uses a linear weighted summation; incorporating non-linear thermal comfort models (such as Physiologically Equivalent Temperature - PET) could provide additional depth.
