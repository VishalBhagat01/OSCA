import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Button from "./ui/Button";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary caught an error]:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#09090b] text-white p-4">
          <div className="w-full max-w-lg rounded-2xl border border-red-500/20 bg-zinc-900/90 p-8 text-center space-y-5 shadow-2xl backdrop-blur-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400">
              <AlertTriangle className="h-7 w-7" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                An Unexpected Error Occurred
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                The application encountered an issue while rendering this view.
              </p>
            </div>

            {this.state.error && (
              <div className="rounded-xl border border-zinc-800 bg-black/60 p-3.5 text-left font-mono text-xs text-red-400/90 overflow-auto max-h-40 leading-relaxed">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="primary"
                icon={RefreshCw}
                onClick={this.handleReload}
              >
                Reload Page
              </Button>
              <a href="/">
                <Button variant="secondary" icon={Home}>
                  Return Home
                </Button>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
