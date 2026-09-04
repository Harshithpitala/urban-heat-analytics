# Urban Heat & Human Activity Analytics — Presentation & Demo Guide

> **A Step-by-Step 5–10 Minute Walkthrough Script for Evaluators, Recruiters & Technical Audiences**

---

## 1. Demo Setup Checklist (Pre-Presentation)
Before presenting, ensure the local environment is clean and running:

1. **Verify MongoDB is running**:
   Ensure MongoDB service is active locally on `localhost:27017` or configured via `server/.env`.
2. **Reset to Clean Synthetic Dataset**:
   ```bash
   npm run seed
   ```
   *Confirms 10 municipal districts and 700 time-series observations are freshly seeded.*
3. **Start the Application**:
   ```bash
   npm run dev
   ```
   *Express API starts on port `5000`; Vite frontend starts on `http://localhost:5173`.*
4. **Open Browser**:
   Open Chrome/Edge to `http://localhost:5173`.

---

## 2. Minute-by-Minute Presentation Script

### Minute 1: The Problem Statement & Landing Page (`/`)
* **What to show**: The Landing Page hero section, problem overview cards, and "What We Analyze" parameters.
* **What to say**:
  > *"Rapid urban expansion causes the Urban Heat Island effect, where asphalt roads, high structural density, and vehicular congestion trap heat, creating severe microclimate heating. However, heat alone doesn't capture real-world human risk. Our project—**Urban Heat & Human Activity Analytics**—correlates multi-source environmental conditions with human mobility patterns and structural density to assess true heat exposure risk across municipal districts."*
* **Action**: Click the **"Explore Dashboard"** button.

---

### Minute 2: The Unified Command Center (`/dashboard`)
* **What to show**: The 10-KPI header grid, primary temperature trajectory chart, and dual-vulnerability callout.
* **What to say**:
  > *"This is our Unified Analytics Command Center. It synthesizes live telemetry from our MongoDB database. The KPI grid provides instantaneous visibility into mean and peak temperatures, city-wide risk averages, and our signature Dual Vulnerability Target—identifying districts that combine surface temperatures $\ge 34^\circ\text{C}$ with population densities exceeding $9,000\text{ people/km}^2$."*
* **Action**: Scroll down to the Hotspot Score vs. HERI scatter plot and district rankings table.

---

### Minute 3: Hotspot Detection Engine (`/hotspots`)
* **What to show**: Hotspot rankings table, 90th percentile threshold pill, and severity distribution.
* **What to say**:
  > *"In Phase 5, we engineered a statistical Hotspot Detection system. Instead of relying on arbitrary static cutoffs, our engine dynamically evaluates the 90th percentile thermal baseline. Sectors like East Industrial Corridor and Central Financial District exhibit persistent thermal anomalies due to heavy asphalt paving and industrial waste heat."*
* **Action**: Click **"Inspect"** on East Industrial Corridor to open its detailed modal showing historical vs. recent 7-day trajectories.

---

### Minute 4: Heat Exposure Risk Index (HERI) (`/risk-index`)
* **What to show**: HERI ranking table, factor contribution breakdown, and weight configuration panel.
* **What to say**:
  > *"Our core signature analytical model is the **Heat Exposure Risk Index (HERI)**—a transparent, 0–100 composite index. Unlike purely physical models, HERI balances 7 weighted dimensions: Ambient Temperature (35%), Population Density (20%), Building Density (10%), Traffic Intensity (10%), Humidity (10%), Vegetation Canopy (10%, protective), and Rainfall (5%). Notice that Metro Transit Interchange ranks #1 in heat exposure risk because its high temperatures directly overlap with dense commuter transit footfall."*
* **Action**: Click **"Configure Model Weights"** to show how planners can customize policy weights deterministically.

---

### Minute 5: Interactive Geospatial Intelligence Map (`/heat-map`)
* **What to show**: The Leaflet geospatial console with layer switcher, marker side panel, and High Heat + Dense Population mode.
* **What to say**:
  > *"Our numerical models project onto a geospatial intelligence layer. Planners can toggle across 8 active visual layers: Heat Risk, Temperature, Hotspot Score, Population, Traffic, Vegetation, Building %, and Land Use. Clicking any marker centers the coordinate view and populates an analytical inspector drawer. Clicking 'High Heat + Dense Population' immediately filters the map to pinpoint immediate municipal intervention targets."*

---

### Minute 6: Data-Driven Insights & Planning Recommendations (`/insights`)
* **What to show**: The dual-tab console toggling between Key Insights and Action Recommendations.
* **What to say**:
  > *"To ensure decision-makers can understand the statistical results, Phase 9 delivers a deterministic Insight and Recommendation engine. We do not use hallucination-prone LLMs; every finding is backed by mathematical rules and tagged with a transparent Data Support tier (Strong, Moderate, or Limited). Furthermore, the Action Recommendations tab generates non-prescriptive municipal planning considerations—such as evaluating cool roof membranes, pedestrian shade canopies, and bioswales."*
* **Action**: Click **"Inspect"** on an insight card to reveal data provenance and calculation methodology, then click **"Export CSV"** to demonstrate spreadsheet downloads.

---

### Minute 7: Data Explorer & CSV Ingestion Pipeline (`/data-explorer` & `/data-import`)
* **What to show**: The database-backed Data Explorer table and the CSV Data Import portal.
* **What to say**:
  > *"The platform includes a database-backed Data Explorer with full column filtering, multi-district search, and pagination. To ingest new records, our Data Import portal features a multi-stage pipeline: Schema Validation, Type Coercion, Spatial Bounds Checking, and Row-Level Error Reporting, preventing dirty data from corrupting the analytical database."*

---

### Minute 8: Architectural Summary & Engineering Wrap-Up
* **What to say**:
  > *"In summary, this is a full-stack MERN platform built with production-grade engineering principles: zero Tailwind CSS (custom CSS design system), responsive across all breakpoints, strict error boundaries, 100% deterministic test coverage, and clear academic disclaimers. Thank you, and I am happy to take any questions."*

---

## 3. Anticipated Questions & Quick Answers

| Question | Recommended Concise Answer |
| :--- | :--- |
| **Why is vegetation protective in HERI?** | *"Vegetation provides evapotranspirative cooling and solar shading. In our min-max formula, higher vegetation reduces the composite hazard score."* |
| **Why not use AI/LLMs to generate insights?** | *"LLMs hallucinate and cannot guarantee mathematical determinism. In municipal planning and academic analytics, transparent, reproducible, rule-based derivations are essential."* |
| **What is the difference between Hotspot Score and HERI?** | *"Hotspot Score measures purely thermal magnitude and persistence. HERI measures human exposure vulnerability by incorporating demographic density, urban morphology, and green buffers."* |
