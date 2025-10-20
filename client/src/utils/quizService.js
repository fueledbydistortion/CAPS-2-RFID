import { API_BASE_URL } from '../config/api';
import { auth } from './firebase-config';

/**
 * Submit quiz results for a lesson
 * @param {string} lessonId - The lesson ID
 * @param {Object} quizData - Quiz submission data (answers, score, etc.)
 * @returns {Promise<Object>} Response with success status and data
 */
export const submitQuiz = async (lessonId, quizData) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      return { success: false, error: 'User not authenticated' };
    }

    const response = await fetch(`${API_BASE_URL}/api/lessons/${lessonId}/quiz/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(quizData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to submit quiz' };
    }

    return { success: true, data: data.data };
  } catch (error) {
    console.error('Error submitting quiz:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get quiz results for a specific lesson
 * @param {string} userId - The user ID
 * @param {string} lessonId - The lesson ID
 * @returns {Promise<Object>} Response with success status and quiz results
 */
export const getQuizResults = async (userId, lessonId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      return { success: false, error: 'User not authenticated' };
    }

    const response = await fetch(
      `${API_BASE_URL}/api/lessons/${lessonId}/quiz/results?userId=${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to get quiz results' };
    }

    return { success: true, data: data.data };
  } catch (error) {
    console.error('Error getting quiz results:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all quiz submissions for a lesson (for teachers)
 * @param {string} lessonId - The lesson ID
 * @returns {Promise<Object>} Response with success status and submissions
 */
export const getLessonQuizSubmissions = async (lessonId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      return { success: false, error: 'User not authenticated' };
    }

    const response = await fetch(
      `${API_BASE_URL}/api/lessons/${lessonId}/quiz/submissions`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to get quiz submissions' };
    }

    return { success: true, data: data.data };
  } catch (error) {
    console.error('Error getting quiz submissions:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Calculate quiz score
 * @param {Array} questions - Array of quiz questions
 * @param {Object} answers - User's answers (questionId: answerIndex)
 * @returns {Object} Score details (correctCount, totalQuestions, earnedPoints, totalPoints, percentage)
 */
export const calculateQuizScore = (questions, answers) => {
  let correctCount = 0;
  let totalPoints = 0;
  let earnedPoints = 0;

  questions.forEach((question) => {
    totalPoints += question.points || 0;
    const userAnswer = answers[question.id];
    if (userAnswer !== undefined && userAnswer === question.correctAnswer) {
      correctCount++;
      earnedPoints += question.points || 0;
    }
  });

  return {
    correctCount,
    totalQuestions: questions.length,
    earnedPoints,
    totalPoints,
    percentage: totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
  };
};

/**
 * Validate quiz answers
 * @param {Array} questions - Array of quiz questions
 * @param {Object} answers - User's answers
 * @returns {Object} Validation result
 */
export const validateQuizAnswers = (questions, answers) => {
  const errors = [];

  questions.forEach((question, index) => {
    if (answers[question.id] === undefined) {
      errors.push(`Question ${index + 1} is not answered`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Save quiz progress to localStorage
 * @param {string} userId - The user ID
 * @param {string} lessonId - The lesson ID
 * @param {Object} data - Quiz data to save
 */
export const saveQuizProgress = (userId, lessonId, data) => {
  try {
    const key = `quiz_progress_${userId}_${lessonId}`;
    localStorage.setItem(key, JSON.stringify({
      ...data,
      savedAt: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error saving quiz progress:', error);
  }
};

/**
 * Load quiz progress from localStorage
 * @param {string} userId - The user ID
 * @param {string} lessonId - The lesson ID
 * @returns {Object|null} Saved quiz progress or null
 */
export const loadQuizProgress = (userId, lessonId) => {
  try {
    const key = `quiz_progress_${userId}_${lessonId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading quiz progress:', error);
    return null;
  }
};

/**
 * Clear quiz progress from localStorage
 * @param {string} userId - The user ID
 * @param {string} lessonId - The lesson ID
 */
export const clearQuizProgress = (userId, lessonId) => {
  try {
    const key = `quiz_progress_${userId}_${lessonId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing quiz progress:', error);
  }
};

export default {
  submitQuiz,
  getQuizResults,
  getLessonQuizSubmissions,
  calculateQuizScore,
  validateQuizAnswers,
  saveQuizProgress,
  loadQuizProgress,
  clearQuizProgress
};

