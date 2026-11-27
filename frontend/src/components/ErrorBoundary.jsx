import { Component } from "react";
import { RotateCw } from "lucide-react";
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
        <div role="alert" className="flex min-h-screen items-center justify-center p-6">
          <div className="max-w-md space-y-6 text-center">
            <p className="eyebrow !text-madder">Unexpected error</p>
            <h2 className="font-display text-5xl font-light text-bone">Something broke.</h2>
            <p className="text-sm text-bone-2">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <Button variant="secondary" size="sm" icon={RotateCw} onClick={this.handleReset}>
              Try again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
