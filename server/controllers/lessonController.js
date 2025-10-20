const { db, admin } = require('../config/firebase-admin-config');

// Get all lessons for a specific skill
const getLessonsBySkill = async (req, res) => {
  try {
    const { skillId } = req.params;
    
    const snapshot = await db.ref('lessons').orderByChild('skillId').equalTo(skillId).once('value');
    const lessons = [];
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        lessons.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
    }
    
    res.json({
      success: true,
      data: lessons
    });
  } catch (error) {
    console.error('Error getting lessons by skill:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get lessons'
    });
  }
};

// Get a specific lesson by ID
const getLessonById = async (req, res) => {
  try {
    const { lessonId } = req.params;
    
    const snapshot = await db.ref(`lessons/${lessonId}`).once('value');
    
    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Lesson not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: lessonId,
        ...snapshot.val()
      }
    });
  } catch (error) {
    console.error('Error getting lesson by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get lesson'
    });
  }
};

// Create a new lesson
const createLesson = async (req, res) => {
  try {
    const lessonData = req.body;
    
    // Add timestamp
    lessonData.createdAt = new Date();
    lessonData.updatedAt = new Date();
    
    const newLessonRef = db.ref('lessons').push();
    await newLessonRef.set(lessonData);
    
    res.status(201).json({
      success: true,
      data: {
        id: newLessonRef.key,
        ...lessonData
      }
    });
  } catch (error) {
    console.error('Error creating lesson:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create lesson'
    });
  }
};

// Update a lesson
const updateLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const updates = req.body;
    
    // Add update timestamp
    updates.updatedAt = new Date();
    
    const lessonRef = db.ref(`lessons/${lessonId}`);
    await lessonRef.update(updates);
    
    // Get updated data
    const updatedSnapshot = await lessonRef.once('value');
    
    res.json({
      success: true,
      data: {
        id: lessonId,
        ...updatedSnapshot.val()
      }
    });
  } catch (error) {
    console.error('Error updating lesson:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update lesson'
    });
  }
};

// Delete a lesson
const deleteLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    
    const lessonRef = db.ref(`lessons/${lessonId}`);
    const snapshot = await lessonRef.once('value');
    
    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Lesson not found'
      });
    }
    
    await lessonRef.remove();
    
    res.json({
      success: true,
      message: 'Lesson deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete lesson'
    });
  }
};

// Search lessons (client-side filtering for now)
const searchLessons = async (req, res) => {
  try {
    const { skillId } = req.params;
    const { searchTerm } = req.query;
    
    const snapshot = await db.ref('lessons').orderByChild('skillId').equalTo(skillId).once('value');
    
    let lessons = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        lessons.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
    }
    
    // Client-side filtering
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      lessons = lessons.filter(lesson => 
        lesson.title?.toLowerCase().includes(searchLower) ||
        lesson.description?.toLowerCase().includes(searchLower) ||
        lesson.content?.toLowerCase().includes(searchLower)
      );
    }
    
    res.json({
      success: true,
      data: lessons
    });
  } catch (error) {
    console.error('Error searching lessons:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search lessons'
    });
  }
};

// Submit quiz for a lesson
const submitQuiz = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { answers, score } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    // Check if lesson exists
    const lessonSnapshot = await db.ref(`lessons/${lessonId}`).once('value');
    if (!lessonSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Lesson not found'
      });
    }

    // Create quiz submission data
    const submissionData = {
      lessonId,
      userId,
      answers,
      score: {
        correctCount: score.correctCount,
        totalQuestions: score.totalQuestions,
        earnedPoints: score.earnedPoints,
        totalPoints: score.totalPoints,
        percentage: score.percentage
      },
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    // Save submission
    const submissionRef = db.ref(`quizSubmissions/${lessonId}/${userId}`);
    await submissionRef.set(submissionData);

    // Update progress based on quiz score
    if (score.percentage >= 70) {
      await updateProgressForQuizCompletion(userId, lessonId, score.percentage);
    }

    res.status(201).json({
      success: true,
      data: submissionData,
      message: 'Quiz submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit quiz: ' + error.message
    });
  }
};

// Get quiz results for a specific user and lesson
const getQuizResults = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const submissionSnapshot = await db.ref(`quizSubmissions/${lessonId}/${userId}`).once('value');

    if (!submissionSnapshot.exists()) {
      return res.json({
        success: true,
        data: null
      });
    }

    res.json({
      success: true,
      data: submissionSnapshot.val()
    });

  } catch (error) {
    console.error('Error getting quiz results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get quiz results'
    });
  }
};

// Get all quiz submissions for a lesson (for teachers)
const getLessonQuizSubmissions = async (req, res) => {
  try {
    const { lessonId } = req.params;

    const submissionsSnapshot = await db.ref(`quizSubmissions/${lessonId}`).once('value');

    const submissions = [];
    if (submissionsSnapshot.exists()) {
      const submissionPromises = [];
      
      submissionsSnapshot.forEach((childSnapshot) => {
        const submission = {
          userId: childSnapshot.key,
          ...childSnapshot.val()
        };
        submissions.push(submission);
        
        // Get user information for each submission
        submissionPromises.push(
          db.ref(`users/${submission.userId}`).once('value')
            .then((userSnapshot) => {
              if (userSnapshot.exists()) {
                const user = userSnapshot.val();
                let studentName = 'Unknown Student';
                
                if (user.childName) {
                  studentName = user.childName;
                } else if (user.children && user.children.length > 0) {
                  studentName = user.children[0].name || `${user.children[0].firstName} ${user.children[0].lastName}`;
                } else {
                  studentName = `${user.firstName} ${user.lastName}`;
                }
                
                return {
                  userId: submission.userId,
                  studentName: studentName,
                  parentEmail: user.email
                };
              }
              return {
                userId: submission.userId,
                studentName: 'Unknown Student',
                parentEmail: 'Unknown'
              };
            })
        );
      });

      // Wait for all user information to be fetched
      const userInfo = await Promise.all(submissionPromises);
      
      // Merge user information with submissions
      submissions.forEach(submission => {
        const info = userInfo.find(u => u.userId === submission.userId);
        if (info) {
          submission.studentName = info.studentName;
          submission.parentEmail = info.parentEmail;
        }
      });
    }

    res.json({
      success: true,
      data: submissions
    });

  } catch (error) {
    console.error('Error getting lesson quiz submissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get quiz submissions'
    });
  }
};

// Helper function to update progress when quiz is completed
const updateProgressForQuizCompletion = async (userId, lessonId, percentage) => {
  try {
    const progressRef = db.ref(`progress/${userId}/${lessonId}`);
    const progressSnapshot = await progressRef.once('value');
    
    const currentProgress = progressSnapshot.exists() ? progressSnapshot.val() : {
      userId: userId,
      lessonId: lessonId,
      percentage: 0,
      status: 'not_started',
      createdAt: new Date().toISOString()
    };

    // Update progress based on quiz score
    const status = percentage >= 100 ? 'completed' : 'in_progress';

    await progressRef.update({
      percentage: Math.max(currentProgress.percentage || 0, percentage),
      status,
      lastAccessed: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      quizCompleted: true,
      quizScore: percentage,
      quizCompletedAt: new Date().toISOString()
    });

    console.log(`Updated progress for user ${userId}, lesson ${lessonId}: quiz completed with ${percentage}%`);

  } catch (error) {
    console.error('Error updating progress for quiz completion:', error);
  }
};

module.exports = {
  getLessonsBySkill,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
  searchLessons,
  submitQuiz,
  getQuizResults,
  getLessonQuizSubmissions
};
