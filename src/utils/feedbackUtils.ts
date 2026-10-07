/**
 * Feedback Utilities
 * Helper functions for managing feedback data
 */

export interface StoredFeedback {
  name: string;
  email: string;
  feedback: string;
  rating?: number;
  category?: string;
  user_id: string;
  timestamp: string;
  page_url: string;
}

/**
 * Get all feedback stored in localStorage (fallback method)
 */
export const getLocalFeedback = (): StoredFeedback[] => {
  try {
    const feedback = localStorage.getItem('app_feedback');
    return feedback ? JSON.parse(feedback) : [];
  } catch (error) {
    console.error('Error reading feedback from localStorage:', error);
    return [];
  }
};

/**
 * Clear all feedback from localStorage
 */
export const clearLocalFeedback = (): void => {
  try {
    localStorage.removeItem('app_feedback');
    console.log('Local feedback cleared');
  } catch (error) {
    console.error('Error clearing feedback from localStorage:', error);
  }
};

/**
 * Export feedback data as JSON file for download
 */
export const exportFeedback = (feedback: StoredFeedback[]): void => {
  const dataStr = JSON.stringify(feedback, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `feedback-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

/**
 * Get feedback statistics
 */
export const getFeedbackStats = (feedback: StoredFeedback[]) => {
  const total = feedback.length;
  const withRatings = feedback.filter(f => f.rating).length;
  const averageRating = withRatings > 0 
    ? feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / withRatings 
    : 0;
  
  const categories = feedback.reduce((acc, f) => {
    const category = f.category || 'general';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    total,
    withRatings,
    averageRating: Math.round(averageRating * 100) / 100,
    categories,
    latest: feedback[feedback.length - 1],
    oldest: feedback[0]
  };
};

/**
 * Console commands for developers
 * Use these in browser console to manage feedback
 */
export const feedbackConsoleCommands = {
  // Get all feedback: window.getFeedback()
  getFeedback: () => {
    const feedback = getLocalFeedback();
    console.table(feedback);
    return feedback;
  },
  
  // Get feedback stats: window.getFeedbackStats()
  getStats: () => {
    const feedback = getLocalFeedback();
    const stats = getFeedbackStats(feedback);
    console.log('Feedback Statistics:', stats);
    return stats;
  },
  
  // Export feedback: window.exportFeedback()
  export: () => {
    const feedback = getLocalFeedback();
    exportFeedback(feedback);
    console.log(`Exported ${feedback.length} feedback entries`);
  },
  
  // Clear feedback: window.clearFeedback()
  clear: () => {
    const count = getLocalFeedback().length;
    clearLocalFeedback();
    console.log(`Cleared ${count} feedback entries`);
  }
};

// Make commands available globally for development
if (typeof window !== 'undefined') {
  (window as any).getFeedback = feedbackConsoleCommands.getFeedback;
  (window as any).getFeedbackStats = feedbackConsoleCommands.getStats;
  (window as any).exportFeedback = feedbackConsoleCommands.export;
  (window as any).clearFeedback = feedbackConsoleCommands.clear;
}