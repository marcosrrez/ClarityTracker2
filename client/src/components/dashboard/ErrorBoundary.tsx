import { Component, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Dashboard component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-black mb-2">Something went wrong</h3>
            <p className="text-gray-600 mb-4">
              This component encountered an error. Please refresh to try again.
            </p>
            <Button 
              onClick={() => window.location.reload()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}