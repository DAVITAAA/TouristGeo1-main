import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in TouristGeo:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.hash = '';
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#020617] text-white flex flex-col items-center justify-center p-6 font-sans">
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-transparent to-purple-500/10 pointer-events-none" />

          <div className="relative z-10 max-w-md w-full bg-slate-900/90 backdrop-blur-2xl border border-slate-800 p-8 rounded-3xl text-center shadow-2xl">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/10">
              <AlertTriangle size={32} />
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              We ran into a slight issue loading this part of TouristGeo. Don’t worry, your data is safe!
            </p>

            {this.state.error && (
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 mb-6 text-left overflow-x-auto">
                <p className="text-[11px] font-mono text-emerald-400/90 truncate">
                  {this.state.error.message || 'Unknown Error'}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="w-full py-3.5 px-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                <RefreshCw size={18} />
                Refresh App
              </button>

              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/';
                }}
                className="w-full py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-2xl flex items-center justify-center gap-2 transition-all border border-slate-700/50"
              >
                <Home size={18} />
                Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
