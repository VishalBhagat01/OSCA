import { Component } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import Button from "./ui/Button";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary] Caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-red-500/20 bg-[#111111] p-8 text-center space-y-5 shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/15">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-[#E8E8E3]" style={{ fontFamily: "var(--font-serif)" }}>
                Something went wrong
              </h2>
              <p className="text-[13px] text-[#737370]">
                {this.state.error?.message || "An unexpected error occurred."}
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={RotateCw}
              onClick={this.handleReset}
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
