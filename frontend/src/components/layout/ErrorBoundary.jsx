import React from "react";
import ErrorState from "@/components/shared/ErrorState";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch() {
    // Intentionally noop: production app would report to Sentry/etc.
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] p-6">
          <ErrorState
            title={this.props.title || "This page crashed"}
            description={this.props.description || "Please refresh or try again."}
            onRetry={() => window.location.reload()}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

