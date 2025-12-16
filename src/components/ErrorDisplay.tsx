import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { AppError, ErrorSeverity, ErrorHandlingUtils } from '../utils/ErrorHandlingUtils';

interface ErrorDisplayProps {
  error: AppError | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  showSuggestions?: boolean;
  inline?: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  showSuggestions = true,
  inline = false
}) => {
  if (!error) return null;

  const { title, message, suggestions } = ErrorHandlingUtils.formatErrorForUser(error);

  const handleShowDetails = () => {
    const detailsMessage = [
      message,
      error.suggestions && error.suggestions.length > 0 
        ? '\n\nSuggestions:\n' + error.suggestions.map(s => `• ${s}`).join('\n')
        : '',
      `\nError Code: ${error.code}`,
      `Time: ${error.timestamp.toLocaleString()}`
    ].filter(Boolean).join('');

    Alert.alert(title, detailsMessage, [
      { text: 'OK', style: 'default' },
      ...(onRetry && error.retryable ? [{ text: 'Retry', onPress: onRetry }] : [])
    ]);
  };

  if (inline) {
    return (
      <View style={[styles.inlineContainer, getInlineStyleForSeverity(error.severity)]}>
        <Text style={[styles.inlineMessage, getInlineTextStyleForSeverity(error.severity)]}>
          {message}
        </Text>
        {showSuggestions && suggestions && suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {suggestions.slice(0, 2).map((suggestion, index) => (
              <Text key={index} style={styles.suggestionText}>
                • {suggestion}
              </Text>
            ))}
          </View>
        )}
        <View style={styles.inlineActions}>
          {onRetry && error.retryable && (
            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.detailsButton} onPress={handleShowDetails}>
            <Text style={styles.detailsButtonText}>Details</Text>
          </TouchableOpacity>
          {onDismiss && (
            <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
              <Text style={styles.dismissButtonText}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Full screen error display
  return (
    <View style={styles.fullScreenContainer}>
      <View style={styles.errorCard}>
        <View style={[styles.errorHeader, getHeaderStyleForSeverity(error.severity)]}>
          <Text style={styles.errorTitle}>{title}</Text>
        </View>
        
        <View style={styles.errorContent}>
          <Text style={styles.errorMessage}>{message}</Text>
          
          {showSuggestions && suggestions && suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>What you can do:</Text>
              {suggestions.map((suggestion, index) => (
                <Text key={index} style={styles.suggestionText}>
                  • {suggestion}
                </Text>
              ))}
            </View>
          )}
          
          <View style={styles.errorMeta}>
            <Text style={styles.errorCode}>Error Code: {error.code}</Text>
            <Text style={styles.errorTime}>
              {error.timestamp.toLocaleString()}
            </Text>
          </View>
        </View>
        
        <View style={styles.errorActions}>
          {onRetry && error.retryable && (
            <TouchableOpacity style={styles.primaryButton} onPress={onRetry}>
              <Text style={styles.primaryButtonText}>Try Again</Text>
            </TouchableOpacity>
          )}
          {onDismiss && (
            <TouchableOpacity style={styles.secondaryButton} onPress={onDismiss}>
              <Text style={styles.secondaryButtonText}>
                {onRetry && error.retryable ? 'Cancel' : 'OK'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const getHeaderStyleForSeverity = (severity: ErrorSeverity) => {
  switch (severity) {
    case ErrorSeverity.LOW:
      return styles.headerLow;
    case ErrorSeverity.MEDIUM:
      return styles.headerMedium;
    case ErrorSeverity.HIGH:
      return styles.headerHigh;
    case ErrorSeverity.CRITICAL:
      return styles.headerCritical;
    default:
      return styles.headerMedium;
  }
};

const getInlineStyleForSeverity = (severity: ErrorSeverity) => {
  switch (severity) {
    case ErrorSeverity.LOW:
      return styles.inlineLow;
    case ErrorSeverity.MEDIUM:
      return styles.inlineMedium;
    case ErrorSeverity.HIGH:
      return styles.inlineHigh;
    case ErrorSeverity.CRITICAL:
      return styles.inlineCritical;
    default:
      return styles.inlineMedium;
  }
};

const getInlineTextStyleForSeverity = (severity: ErrorSeverity) => {
  switch (severity) {
    case ErrorSeverity.LOW:
      return styles.inlineTextLow;
    case ErrorSeverity.MEDIUM:
      return styles.inlineTextMedium;
    case ErrorSeverity.HIGH:
      return styles.inlineTextHigh;
    case ErrorSeverity.CRITICAL:
      return styles.inlineTextCritical;
    default:
      return styles.inlineTextMedium;
  }
};

const styles = StyleSheet.create({
  // Full screen error styles
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  errorCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  errorHeader: {
    padding: 20,
    paddingBottom: 15,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  errorContent: {
    padding: 20,
    paddingTop: 0,
  },
  errorMessage: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 20,
  },
  suggestionsContainer: {
    marginBottom: 20,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  errorMeta: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  errorCode: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  errorTime: {
    fontSize: 12,
    color: '#999',
  },
  errorActions: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },

  // Inline error styles
  inlineContainer: {
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    borderLeftWidth: 4,
  },
  inlineMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  inlineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  detailsButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  detailsButtonText: {
    color: '#666',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  dismissButton: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  dismissButtonText: {
    color: '#999',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Severity-based styles
  headerLow: { backgroundColor: '#FF9800' },
  headerMedium: { backgroundColor: '#F44336' },
  headerHigh: { backgroundColor: '#D32F2F' },
  headerCritical: { backgroundColor: '#B71C1C' },

  inlineLow: {
    backgroundColor: '#FFF8E1',
    borderLeftColor: '#FF9800',
  },
  inlineMedium: {
    backgroundColor: '#FFEBEE',
    borderLeftColor: '#F44336',
  },
  inlineHigh: {
    backgroundColor: '#FFEBEE',
    borderLeftColor: '#D32F2F',
  },
  inlineCritical: {
    backgroundColor: '#FFEBEE',
    borderLeftColor: '#B71C1C',
  },

  inlineTextLow: { color: '#E65100' },
  inlineTextMedium: { color: '#C62828' },
  inlineTextHigh: { color: '#B71C1C' },
  inlineTextCritical: { color: '#B71C1C' },
});