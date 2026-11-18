import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../common/Button.jsx';

/**
 * Application-level React ErrorBoundary preventing blank screen crashes.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || 'An unexpected rendering error occurred.',
    };
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-6">
          <div className="surface-card rounded-xl p-8 max-w-md w-full text-center">
            <div className="w-11 h-11 rounded-xl bg-accent-error-container text-accent-error flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h1 className="text-headline-md text-on-surface mb-1">
              Something went wrong
            </h1>
            <p className="text-body-sm text-on-surface-variant mb-6">
              {this.state.message}
            </p>
            <div className="flex items-center justify-center gap-2.5">
              <Button
                variant="secondary"
                onClick={() => window.location.assign('/projects')}
              >
                Go to Projects
              </Button>
              <Button
                variant="primary"
                onClick={this.handleReset}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
