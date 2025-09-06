import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          fontFamily: 'Arial, sans-serif',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '5px',
          margin: '20px'
        }}>
          <h2 style={{ color: '#856404' }}>⚠️ Something went wrong</h2>
          <p>There was an error loading the application.</p>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            <summary>Error Details (Click to expand)</summary>
            <p><strong>Error:</strong> {this.state.error && this.state.error.toString()}</p>
            <p><strong>Stack:</strong> {this.state.errorInfo.componentStack}</p>
          </details>
          <div style={{ marginTop: '15px' }}>
            <h3>Common Solutions:</h3>
            <ul>
              <li>Check if Firebase is properly configured</li>
              <li>Verify all environment variables are set</li>
              <li>Check browser console for more details</li>
              <li>Try refreshing the page</li>
            </ul>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;