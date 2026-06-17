import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean; message?: string };

export class RootErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[RootErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-svh flex flex-col items-center justify-center gap-4 px-6 text-center font-sans bg-background text-foreground">
          <h1 className="text-xl font-semibold">Něco se pokazilo</h1>
          <p className="text-sm text-muted-foreground max-w-md whitespace-pre-wrap">{this.state.message}</p>
          <button
            type="button"
            className="rounded-md border border-border bg-card px-4 py-2 text-sm hover:bg-muted"
            onClick={() => window.location.reload()}
          >
            Obnovit stránku
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
