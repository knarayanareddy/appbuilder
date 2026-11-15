import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./ui";

interface Props {
  children: ReactNode;
  /** Changing this clears the failure — used to reset when the tab changes. */
  resetKey?: unknown;
  onReset?: () => void;
}

interface State {
  error: Error | null;
}

/**
 * A render error anywhere in a screen used to leave a blank white page with no
 * explanation — the worst possible outcome for an app that holds your only copy
 * of an inventory. This keeps the shell (and the data) visible and says what
 * happened.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("A screen failed to render:", error, info.componentStack);
  }

  componentDidUpdate(previous: Props): void {
    if (this.state.error && previous.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  private reset = (): void => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (!this.state.error) return this.props.children;

    return (
      <div className="p-3">
        <div className="space-y-2 rounded-2xl border border-red-200 bg-white p-4 text-center">
          <AlertTriangle size={22} className="mx-auto text-red-500" />
          <p className="text-sm font-bold text-slate-900">This screen could not be shown</p>
          <p className="text-[11px] leading-relaxed text-slate-600">
            Nothing has been deleted — your records are still on this phone. Try another tab, or go back to the lot.
          </p>
          <p className="break-words text-[10px] text-slate-400">{this.state.error.message}</p>
          <Button variant="secondary" className="w-full" onClick={this.reset}>
            Back to the lot
          </Button>
        </div>
      </div>
    );
  }
}
