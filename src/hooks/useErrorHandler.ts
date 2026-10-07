import { useState, useCallback } from 'react';

export interface ErrorState {
  message: string;
  type: 'location' | 'places' | 'map' | 'network' | 'permission' | 'generic';
  timestamp: number;
  retryable: boolean;
}

export interface UseErrorHandlerReturn {
  error: ErrorState | null;
  setError: (error: string | Error, type?: ErrorState['type']) => void;
  clearError: () => void;
  retryLastAction: () => void;
  isRetryable: boolean;
}

export const useErrorHandler = (
  onRetry?: () => void
): UseErrorHandlerReturn => {
  const [error, setErrorState] = useState<ErrorState | null>(null);
  const [lastRetryAction, setLastRetryAction] = useState<(() => void) | null>(null);

  const setError = useCallback((
    errorInput: string | Error, 
    type: ErrorState['type'] = 'generic'
  ) => {
    const message = errorInput instanceof Error ? errorInput.message : errorInput;
    
    // Determine error type from message if not provided
    let errorType = type;
    if (type === 'generic') {
      const lowerMessage = message.toLowerCase();
      if (lowerMessage.includes('permission') || lowerMessage.includes('denied')) {
        errorType = 'permission';
      } else if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
        errorType = 'network';
      } else if (lowerMessage.includes('location')) {
        errorType = 'location';
      } else if (lowerMessage.includes('places') || lowerMessage.includes('search')) {
        errorType = 'places';
      } else if (lowerMessage.includes('map')) {
        errorType = 'map';
      }
    }

    // Determine if error is retryable
    const retryable = !['permission'].includes(errorType) && 
                     !message.toLowerCase().includes('api key') &&
                     !message.toLowerCase().includes('authentication');

    setErrorState({
      message,
      type: errorType,
      timestamp: Date.now(),
      retryable
    });
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  const retryLastAction = useCallback(() => {
    if (lastRetryAction) {
      clearError();
      lastRetryAction();
    } else if (onRetry) {
      clearError();
      onRetry();
    }
  }, [lastRetryAction, onRetry, clearError]);

  const setRetryAction = useCallback((action: () => void) => {
    setLastRetryAction(() => action);
  }, []);

  return {
    error,
    setError,
    clearError,
    retryLastAction,
    isRetryable: error?.retryable ?? false,
  };
};