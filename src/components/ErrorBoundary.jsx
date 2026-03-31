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
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="sc sc-error" style={{ padding: "20px", color: "#ff7043" }}>
          <p style={{ fontSize: "18px" }}>⚠️ ERROR</p>
          <p style={{ fontSize: "10px", wordBreak: "break-all" }}>
            {this.state.error?.message || "Error desconocido"}
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: "10px", padding: "6px 12px", fontSize: "10px" }}
          >
            REINICIAR APP
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;