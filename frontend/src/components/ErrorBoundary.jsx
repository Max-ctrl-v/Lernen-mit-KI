import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface-base px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 flex items-center justify-center mb-5">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round">
                <path d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <h1 className="font-display text-2xl text-gray-900 tracking-heading mb-2">
              Etwas ist schiefgelaufen
            </h1>
            <p className="text-gray-500 font-body mb-6">
              Ein unerwarteter Fehler ist aufgetreten. Bitte lade die Seite neu.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-brand"
            >
              Seite neu laden
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
