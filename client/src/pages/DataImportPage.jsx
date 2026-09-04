import React, { useState, useEffect, useRef } from 'react';
import NoticeBanner from '../components/common/NoticeBanner';
import StatusBadge from '../components/common/StatusBadge';
import LoadingState from '../components/common/LoadingState';
import {
  IconUpload,
  IconCheckCircle,
  IconShieldAlert,
  IconDatabase,
  IconArrowRight,
  IconX,
} from '../components/common/Icons';
import {
  uploadAndValidateCSV,
  commitImportJob,
  fetchImportHistory,
  getImportErrorDownloadUrl,
  downloadCSVTemplate,
  fetchDataQuality,
} from '../services/api';

const SYSTEM_FIELDS = [
  { key: 'areaName', label: 'Area Name (Required)' },
  { key: 'city', label: 'City Name' },
  { key: 'zone', label: 'Zone Code' },
  { key: 'latitude', label: 'Latitude Coordinate' },
  { key: 'longitude', label: 'Longitude Coordinate' },
  { key: 'date', label: 'Observation Date/Time (Required)' },
  { key: 'temperature', label: 'Temperature °C (Required)' },
  { key: 'humidity', label: 'Humidity % (Required)' },
  { key: 'rainfall', label: 'Rainfall mm' },
  { key: 'traffic', label: 'Traffic Index (0-100)' },
  { key: 'populationDensity', label: 'Population Density' },
  { key: 'buildingDensity', label: 'Building Density %' },
  { key: 'vegetation', label: 'Vegetation %' },
  { key: 'landUse', label: 'Land Use Zoning' },
];

const DataImportPage = () => {
  // Tabs: 'import' or 'history' or 'quality'
  const [activeTab, setActiveTab] = useState('import');

  // Upload & File state
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [customMapping, setCustomMapping] = useState({});
  const fileInputRef = useRef(null);

  // Processing state: 'idle' | 'validating' | 'validated' | 'importing' | 'completed' | 'error'
  const [processState, setProcessState] = useState('idle');
  const [errorMessage, setErrorMessage] = useState(null);

  // Validation Report state
  const [validationReport, setValidationReport] = useState(null);
  const [duplicateStrategy, setDuplicateStrategy] = useState('skip');
  const [importResult, setImportResult] = useState(null);

  // History & Quality states
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [qualityStats, setQualityStats] = useState(null);

  // Load history & quality on mount
  useEffect(() => {
    loadHistory();
    loadQualityStats();
  }, []);

  const loadHistory = async () => {
    setHistoryLoading(true);
    const res = await fetchImportHistory(1, 15);
    if (res.success) {
      setHistory(res.data);
    }
    setHistoryLoading(false);
  };

  const loadQualityStats = async () => {
    const res = await fetchDataQuality();
    if (res.success) {
      setQualityStats(res.data);
    }
  };

  // Drag & Drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (selectedFile) => {
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setErrorMessage('Invalid file format. Only standard .csv files are supported.');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 10MB limit.');
      return;
    }

    setFile(selectedFile);
    setErrorMessage(null);
    setValidationReport(null);
    setImportResult(null);
    setCustomMapping({});
    setProcessState('idle');
  };

  const handleRemoveFile = () => {
    setFile(null);
    setValidationReport(null);
    setErrorMessage(null);
    setProcessState('idle');
    setCustomMapping({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Run validation
  const handleValidate = async (mappingToUse = customMapping) => {
    if (!file) return;

    setProcessState('validating');
    setErrorMessage(null);

    try {
      const res = await uploadAndValidateCSV(file, mappingToUse);
      if (res.success) {
        setValidationReport(res.data);
        setProcessState('validated');
      } else {
        setErrorMessage(res.message || 'Validation failed');
        setProcessState('error');
      }
    } catch (err) {
      setErrorMessage(err.message);
      setProcessState('error');
    }
  };

  // Update mapping
  const handleMappingChange = (csvHeader, systemField) => {
    const updated = { ...customMapping, [csvHeader]: systemField };
    setCustomMapping(updated);
    // Re-validate with new mapping
    handleValidate(updated);
  };

  const handleResetMapping = () => {
    setCustomMapping({});
    handleValidate({});
  };

  // Commit Import
  const handleCommit = async () => {
    if (!validationReport?.jobId) return;

    setProcessState('importing');
    setErrorMessage(null);

    try {
      const res = await commitImportJob(validationReport.jobId, duplicateStrategy);
      if (res.success) {
        setImportResult(res.data);
        setProcessState('completed');
        loadHistory();
        loadQualityStats();
      } else {
        setErrorMessage(res.message || 'Failed to commit import');
        setProcessState('error');
      }
    } catch (err) {
      setErrorMessage(err.message);
      setProcessState('error');
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Notice Banner */}
      <NoticeBanner
        badgeText="Data Ingestion & Quality"
        message="Upload external environmental CSV datasets, inspect column schemas, validate records, and safely ingest verified telemetry."
      />

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-xs)' }}>
        <button
          className={`btn btn-sm ${activeTab === 'import' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('import')}
        >
          <IconUpload size={16} />
          Import Dataset
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => {
            setActiveTab('history');
            loadHistory();
          }}
        >
          <IconDatabase size={16} />
          Import History ({history.length})
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'quality' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => {
            setActiveTab('quality');
            loadQualityStats();
          }}
        >
          <IconShieldAlert size={16} />
          Database Data Quality
        </button>

        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={downloadCSVTemplate}
            className="btn btn-outline btn-sm"
            title="Download CSV format template with sample records"
          >
            Download CSV Template
          </button>
        </div>
      </div>

      {/* TAB 1: CSV IMPORT WORKFLOW */}
      {activeTab === 'import' && (
        <div>
          {/* STEP 1: Upload Dropzone Card */}
          <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
            <div className="card-header">
              <div>
                <h3 className="card-title">1. Upload CSV Telemetry File</h3>
                <p className="card-subtitle">Supported schema: areaName, city, date, temperature, humidity, rainfall, traffic, landUse</p>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Max file size: 10MB</span>
            </div>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragActive ? 'var(--heat-high)' : 'var(--border-default)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-3xl) var(--space-xl)',
                textAlign: 'center',
                backgroundColor: dragActive ? 'rgba(249, 115, 22, 0.08)' : 'rgba(255, 255, 255, 0.01)',
                transition: 'all var(--transition-fast)',
                cursor: 'pointer',
              }}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(249, 115, 22, 0.12)',
                  color: 'var(--heat-high)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--space-md)',
                }}
              >
                <IconUpload size={28} />
              </div>

              <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '6px' }}>
                {file ? file.name : 'Drag and drop your CSV file here'}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
                {file ? `${(file.size / 1024).toFixed(1)} KB — Click or drag another file to replace` : 'or click to browse local files'}
              </p>

              <div className="flex justify-center gap-sm">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current && fileInputRef.current.click();
                  }}
                >
                  Choose CSV
                </button>
                {file && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile();
                    }}
                  >
                    <IconX size={16} />
                    Remove File
                  </button>
                )}
              </div>
            </div>

            {/* Template Note Requirement */}
            <div style={{ marginTop: 'var(--space-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-disabled)' }}>
                Template contains synthetic example data. Replace it with your own dataset before importing.
              </span>

              {file && processState === 'idle' && (
                <button
                  onClick={() => handleValidate()}
                  className="btn btn-primary btn-sm"
                >
                  Validate Dataset &rarr;
                </button>
              )}
            </div>

            {/* Error Message alert */}
            {errorMessage && (
              <div
                style={{
                  marginTop: 'var(--space-md)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(239, 68, 68, 0.14)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#f87171',
                  fontSize: '0.86rem',
                }}
              >
                <strong>✕ Validation Notice:</strong> {errorMessage}
              </div>
            )}
          </div>

          {/* Validating Spinner */}
          {processState === 'validating' && (
            <div className="card" style={{ marginBottom: 'var(--space-xl)', textAlign: 'center' }}>
              <LoadingState message="Parsing CSV structure, evaluating row bounds, and cross-referencing database duplicates..." />
            </div>
          )}

          {/* STEP 2: Column Validation & Optional Mapping */}
          {validationReport && (
            <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
              <div className="card-header">
                <div>
                  <h3 className="card-title">2. Schema Inspection & Column Mapping</h3>
                  <p className="card-subtitle">
                    {validationReport.columns?.isValid
                      ? '✅ All required columns recognized and verified.'
                      : '⚠️ Some columns require manual mapping or are missing.'}
                  </p>
                </div>
                {Object.keys(customMapping).length > 0 && (
                  <button onClick={handleResetMapping} className="btn btn-outline btn-sm">
                    Reset Mapping
                  </button>
                )}
              </div>

              {/* Column Status Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: 'var(--space-lg)' }}>
                {validationReport.columns?.rawHeaders?.map((header) => {
                  const target = validationReport.columns.effectiveHeaders[header];
                  const isMapped = !!target;
                  return (
                    <div
                      key={header}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        background: isMapped ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.14)',
                        border: `1px solid ${isMapped ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                        color: isMapped ? '#34d399' : '#fbbf24',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>{isMapped ? '✅' : '⚠️'}</span>
                      <strong>{header}</strong>
                      {isMapped && <span style={{ color: 'var(--text-muted)' }}>&rarr; {target}</span>}
                    </div>
                  );
                })}
              </div>

              {/* Mapping Interface for Unrecognized Headers */}
              {validationReport.columns?.unrecognizedColumns?.length > 0 && (
                <div style={{ background: 'var(--bg-surface)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '8px', color: '#fbbf24' }}>
                    Map Unrecognized CSV Headers to System Fields:
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-sm)' }}>
                    {validationReport.columns.unrecognizedColumns.map((unmappedHeader) => (
                      <div key={unmappedHeader} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', minWidth: '100px' }}>
                          {unmappedHeader} &rarr;
                        </span>
                        <select
                          className="filter-select"
                          style={{ flex: 1 }}
                          value={customMapping[unmappedHeader] || ''}
                          onChange={(e) => handleMappingChange(unmappedHeader, e.target.value)}
                        >
                          <option value="">-- Ignore Column --</option>
                          {SYSTEM_FIELDS.map((f) => (
                            <option key={f.key} value={f.key}>{f.label}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Quality Summary Cards & Field-Level Health */}
          {validationReport && (
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                <div className="card" style={{ padding: 'var(--space-md)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Rows</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{validationReport.totalRows}</div>
                </div>
                <div className="card" style={{ padding: 'var(--space-md)' }}>
                  <div style={{ fontSize: '0.78rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 600 }}>✅ Valid Rows</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#34d399' }}>{validationReport.validRows}</div>
                </div>
                <div className="card" style={{ padding: 'var(--space-md)' }}>
                  <div style={{ fontSize: '0.78rem', color: '#fbbf24', textTransform: 'uppercase', fontWeight: 600 }}>⚠️ Warning Rows</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fbbf24' }}>{validationReport.warningRows}</div>
                </div>
                <div className="card" style={{ padding: 'var(--space-md)' }}>
                  <div style={{ fontSize: '0.78rem', color: '#f87171', textTransform: 'uppercase', fontWeight: 600 }}>✕ Invalid Rows</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f87171' }}>{validationReport.invalidRows}</div>
                </div>
                <div className="card" style={{ padding: 'var(--space-md)' }}>
                  <div style={{ fontSize: '0.78rem', color: '#f97316', textTransform: 'uppercase', fontWeight: 600 }}>Duplicate Rows</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f97316' }}>{validationReport.duplicateRows}</div>
                </div>
              </div>

              {/* Field-level error pills */}
              {validationReport.fieldErrorSummary && (
                <div className="card" style={{ padding: 'var(--space-md)', background: 'var(--bg-surface)' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Field-Level Issue Breakdown:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {Object.entries(validationReport.fieldErrorSummary).map(([field, count]) => (
                      <span
                        key={field}
                        style={{
                          fontSize: '0.76rem',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          background: count > 0 ? 'rgba(239, 68, 68, 0.14)' : 'rgba(255, 255, 255, 0.04)',
                          color: count > 0 ? '#f87171' : 'var(--text-muted)',
                        }}
                      >
                        {field}: <strong>{count} errors</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Live Preview Table (First 25-50 rows) */}
          {validationReport?.preview?.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 'var(--space-xl)' }}>
              <div style={{ padding: 'var(--space-md) var(--space-xl)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
                  3. Record Preview & Quality Highlights
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Showing {validationReport.preview.length} of {validationReport.totalRows} rows
                </span>
              </div>

              <div className="table-container" style={{ border: 'none' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Row</th>
                      <th>Status</th>
                      <th>Area</th>
                      <th>Date</th>
                      <th>Temp</th>
                      <th>Humidity</th>
                      <th>Rainfall</th>
                      <th>Traffic</th>
                      <th>Land Use</th>
                      <th>Validation Issues</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validationReport.preview.map((p) => {
                      const isError = p.status === 'Error';
                      const isWarn = p.status === 'Warning';
                      return (
                        <tr
                          key={p.rowNumber}
                          style={{
                            background: isError ? 'rgba(239, 68, 68, 0.08)' : isWarn ? 'rgba(245, 158, 11, 0.05)' : 'transparent',
                          }}
                        >
                          <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{p.rowNumber}</td>
                          <td>
                            {isError && <span style={{ color: '#f87171', fontWeight: 600 }}>✕ Error</span>}
                            {isWarn && <span style={{ color: '#fbbf24', fontWeight: 600 }}>⚠️ Warning</span>}
                            {!isError && !isWarn && <span style={{ color: '#34d399', fontWeight: 600 }}>✅ Valid</span>}
                          </td>
                          <td style={{ fontWeight: 600 }}>{p.area}</td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.date}</td>
                          <td style={{ color: isError ? '#f87171' : 'inherit' }}>{p.temperature}</td>
                          <td>{p.humidity}</td>
                          <td>{p.rainfall}</td>
                          <td>{p.traffic}</td>
                          <td>{p.landUse}</td>
                          <td style={{ fontSize: '0.78rem', color: isError ? '#f87171' : '#fbbf24' }}>
                            {p.issues?.join('; ') || 'None'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 5: Import Confirmation & Strategy Screen */}
          {validationReport && processState !== 'completed' && (
            <div className="card" style={{ marginBottom: 'var(--space-2xl)', border: '1px solid var(--border-glow)' }}>
              <div className="card-header">
                <div>
                  <h3 className="card-title">4. Confirm Database Import</h3>
                  <p className="card-subtitle">Choose duplicate resolution and commit verified records into MongoDB</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
                {/* Duplicate Handling Options */}
                <div>
                  <label className="filter-label" style={{ marginBottom: '8px', display: 'block' }}>
                    Duplicate Handling Strategy:
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="dupStrategy"
                        value="skip"
                        checked={duplicateStrategy === 'skip'}
                        onChange={(e) => setDuplicateStrategy(e.target.value)}
                      />
                      <span><strong>Skip duplicates (Recommended)</strong> — Exclude rows already logged</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="dupStrategy"
                        value="import_all"
                        checked={duplicateStrategy === 'import_all'}
                        onChange={(e) => setDuplicateStrategy(e.target.value)}
                      />
                      <span><strong>Import all valid records</strong> — Insert even if matching timestamp exists</span>
                    </label>
                  </div>
                </div>

                {/* Import Impact Breakdown */}
                <div style={{ background: 'var(--bg-surface)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    EXECUTION PREVIEW:
                  </div>
                  <div style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>
                    &bull; Records to insert: <strong style={{ color: '#34d399' }}>{validationReport.validRows + validationReport.warningRows}</strong><br />
                    &bull; Invalid rows to skip: <strong style={{ color: '#f87171' }}>{validationReport.invalidRows}</strong><br />
                    &bull; Duplicates detected: <strong>{validationReport.duplicateRows}</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                <div className="flex gap-sm">
                  <button
                    onClick={handleCommit}
                    disabled={processState === 'importing' || validationReport.validRows + validationReport.warningRows === 0}
                    className="btn btn-primary"
                  >
                    {processState === 'importing' ? 'Importing into Database...' : 'Import Valid Records'}
                    <IconArrowRight size={18} />
                  </button>
                  <button
                    onClick={handleRemoveFile}
                    disabled={processState === 'importing'}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>

                {/* Download Error Rows Requirement */}
                {validationReport.invalidRows > 0 && validationReport.jobId && (
                  <a
                    href={getImportErrorDownloadUrl(validationReport.jobId)}
                    download
                    className="btn btn-outline btn-sm"
                  >
                    Download Error Rows (.CSV)
                  </a>
                )}
              </div>
            </div>
          )}

          {/* STEP 6: Import Success Summary Dialog */}
          {processState === 'completed' && importResult && (
            <div className="card" style={{ marginBottom: 'var(--space-2xl)', border: '1px solid rgba(16, 185, 129, 0.4)', textAlign: 'center', padding: 'var(--space-3xl)' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--space-md)',
                }}
              >
                <IconCheckCircle size={32} />
              </div>

              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Dataset Successfully Ingested!
              </h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto var(--space-lg)' }}>
                <strong>{importResult.importedRows}</strong> observation records from <code>{importResult.filename}</code> were committed into MongoDB.
                {importResult.skippedRows > 0 && ` (${importResult.skippedRows} invalid or duplicate rows excluded).`}
              </p>

              <div className="flex justify-center gap-sm">
                <button
                  onClick={() => {
                    handleRemoveFile();
                    setActiveTab('history');
                  }}
                  className="btn btn-primary btn-sm"
                >
                  View Import History
                </button>
                <a href="/data-explorer" className="btn btn-secondary btn-sm">
                  Inspect in Data Explorer
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: IMPORT HISTORY TABLE */}
      {activeTab === 'history' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-md) var(--space-xl)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Past Data Ingestion Jobs</h3>
            <button onClick={loadHistory} className="btn btn-outline btn-sm">Refresh History</button>
          </div>

          {historyLoading ? (
            <LoadingState message="Loading import audit log..." />
          ) : history.length === 0 ? (
            <div style={{ padding: 'var(--space-3xl)', textAlign: 'center', color: 'var(--text-muted)' }}>
              No previous import jobs recorded yet.
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Filename</th>
                    <th>Uploaded Date</th>
                    <th>Total Rows</th>
                    <th>Imported</th>
                    <th>Skipped</th>
                    <th>Errors</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((job) => (
                    <tr key={job._id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{job.filename}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(job.uploadedAt).toLocaleString()}
                      </td>
                      <td>{job.totalRows}</td>
                      <td><span style={{ color: '#34d399', fontWeight: 600 }}>{job.importedRows}</span></td>
                      <td>{job.skippedRows}</td>
                      <td>
                        <span style={{ color: job.errorCount > 0 ? '#f87171' : 'inherit' }}>
                          {job.errorCount}
                        </span>
                      </td>
                      <td>
                        <StatusBadge
                          label={job.status}
                          type={job.status === 'Completed' ? 'low' : job.status === 'Failed' ? 'extreme' : 'moderate'}
                        />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {job.errorCount > 0 ? (
                          <a
                            href={getImportErrorDownloadUrl(job._id)}
                            className="btn btn-outline btn-sm"
                            style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                          >
                            Export Errors
                          </a>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-disabled)' }}>Clean Import</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DATABASE DATA QUALITY DASHBOARD */}
      {activeTab === 'quality' && qualityStats && (
        <div>
          {/* Completeness KPI Card */}
          <div className="kpi-grid" style={{ marginBottom: 'var(--space-xl)' }}>
            <div className="card">
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Data Completeness
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#34d399', margin: '4px 0' }}>
                {qualityStats.completeness}%
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Evaluated across all active MongoDB observation records
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Total Records in Database
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0' }}>
                {qualityStats.totalRecords?.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Observations available for spatial analysis
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Extreme Heat Outliers (&gt;50°C)
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f59e0b', margin: '4px 0' }}>
                {qualityStats.anomalies?.extremeHeatOutliers || 0}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Values exceeding normal meteorological ranges
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Duplicate Pairs Found
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f97316', margin: '4px 0' }}>
                {qualityStats.anomalies?.duplicates || 0}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Matching Area + Timestamp combinations
              </div>
            </div>
          </div>

          {/* Records Distribution by City & Land Use */}
          <div className="charts-grid-2col">
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Records by Land Use Category</h3>
                  <p className="card-subtitle">Distribution of observation density across zoning types</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {qualityStats.distributions?.byLandUse?.map((item) => (
                  <div key={item.landUse} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{item.landUse}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.count} records</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Missing Metrics Breakdown</h3>
                  <p className="card-subtitle">Field nullability audit across records</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>Missing Temperature</span>
                  <span style={{ fontSize: '0.85rem', color: qualityStats.missingMetrics?.temperature > 0 ? '#f87171' : '#34d399' }}>
                    {qualityStats.missingMetrics?.temperature || 0}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>Missing Humidity</span>
                  <span style={{ fontSize: '0.85rem', color: qualityStats.missingMetrics?.humidity > 0 ? '#f87171' : '#34d399' }}>
                    {qualityStats.missingMetrics?.humidity || 0}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>Missing Rainfall</span>
                  <span style={{ fontSize: '0.85rem', color: qualityStats.missingMetrics?.rainfall > 0 ? '#f87171' : '#34d399' }}>
                    {qualityStats.missingMetrics?.rainfall || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataImportPage;
