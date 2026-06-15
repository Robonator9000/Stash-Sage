import { Component, type ReactNode, type ErrorInfo } from 'react';
import { t } from '../utils/translations';

interface Props {
  children: ReactNode;
  isDark?: boolean;
  lang?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      const isDark = this.props.isDark ?? true;
      const lang = this.props.lang ?? 'en';
      return (
        <div className={`max-w-lg mx-auto mt-8 p-6 rounded-2xl text-center ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${isDark ? 'bg-midnight' : 'bg-gray-100'}`}>
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className={`text-sm font-medium mb-1 ${isDark ? 'text-frost' : 'text-gray-800'}`}>
            {t('unexpectedError', lang)}
          </p>
          <p className={`text-xs mb-4 ${isDark ? 'text-muted' : 'text-gray-400'}`}>
            {this.state.error?.message || ''}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-cyanx to-emera hover:from-cyanx-dark hover:to-emera-dark transition-all"
          >
            {t('tryAgain', lang)}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
