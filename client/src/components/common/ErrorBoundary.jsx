import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="card"
          style={{
            maxWidth: '600px',
            margin: 'var(--space-3xl) auto',
            textAlign: 'center',
            padding: 'var(--space-2xl)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            background: 'rgba(239, 68, 68, 0.05)',
          }}
        >
          <h3 style={{ color: '#ef4444', marginBottom: 'var(--space-sm)' }}>
            Component Render Error
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 'var(--space-md)' }}>
            An unexpected error occurred while displaying this section:
          </p>
          <div
            style={{
              padding: '12px',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              color: '#f87171',
              textAlign: 'left',
              marginBottom: 'var(--space-lg)',
              overflowX: 'auto',
            }}
          >
            {this.state.error?.message || 'Unknown render error'}
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={this.handleReset}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
