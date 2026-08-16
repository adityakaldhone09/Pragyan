import { Component, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to monitoring service (Sentry, LogRocket, etc.)
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
    
    // In production, send to error tracking service
    if (process.env.NODE_ENV === "production") {
      // Example: Sentry.captureException(error);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Use provided fallback or default error UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="w-full max-w-md text-center">
            {/* Error Icon */}
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-red-100 rounded-full">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Something went wrong
            </h1>

            {/* Error Message */}
            <p className="text-muted-foreground mb-6">
              {this.state.error?.message || "An unexpected error occurred. Please try again."}
            </p>

            {/* Error Details (development only) */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="text-left bg-muted rounded-lg p-3 mb-6 text-xs text-muted-foreground max-h-32 overflow-auto">
                <summary className="cursor-pointer font-semibold mb-2">Error Details</summary>
                <pre className="whitespace-pre-wrap break-words">
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = "/"}
                className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Go Home
              </button>
            </div>

            {/* Pragyan Branding */}
            <p className="text-xs text-muted-foreground mt-6">
              Pragyan AI • Your Career Guide
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
