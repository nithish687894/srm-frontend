"use client";

import React from "react";

type State = {
  hasError: boolean;
  errorMessage: string;
};

export default class AppErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error?.message || "Unexpected UI error." };
  }

  componentDidCatch(error: Error) {
    console.error("[SRMX] UI error boundary caught:", error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: "" });
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="page-root" style={{ display: "grid", placeItems: "center", padding: "24px", minHeight: "100vh" }}>
        <div className="min-card" style={{ maxWidth: "460px", width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-secondary)", marginBottom: "8px" }}>
            Something went wrong
          </div>
          <div style={{ fontSize: "14px", color: "var(--text-primary)", marginBottom: "20px" }}>
            {this.state.errorMessage || "The page crashed unexpectedly."}
          </div>
          <button className="action-btn" onClick={this.handleRetry} style={{ margin: "0 auto" }}>
            <div className="icon-l">↻</div>
            <div className="text-c">
              <span>Retry</span>
              <span>Reload this screen</span>
            </div>
            <div className="icon-r">›</div>
          </button>
        </div>
      </div>
    );
  }
}
