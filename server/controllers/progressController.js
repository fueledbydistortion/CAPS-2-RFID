const { db, admin } = require('../config/firebase-admin-config');
const { checkAndAwardBadges: checkBadges } = require('./badgeController');

// Get user progress for a specific lesson
const getLessonProgress = async (req, res) => {
  try {
    const { userId, lessonId } = req.params;

    if (!userId || !lessonId) {
      return res.status(400).json({
        success: false,
        error: 'User ID and Lesson ID are required'
      });
    }

    // Get progress record
    const progressSnapshot = await db.ref(`progress/${userId}/${lessonId}`).once('value');
    
    if (!progressSnapshot.exists()) {
      // Create default progress if it doesn't exist
      const defaultProgress = {
        userId,
        lessonId,
        percentage: 0,
        status: 'not_started',
        lastAccessed: admin.database.ServerValue.TIMESTAMP,
        createdAt: admin.database.ServerValue.TIMESTAMP,
        updatedAt: admin.database.ServerValue.TIMESTAMP
      };

      await db.ref(`progress/${userId}/${lessonId}`).set(defaultProgress);

      return res.json({
        success: true,
        data: {
          ...defaultProgress,
          percentage: 0,
          status: 'not_started'
        }
      });
    }

    const progress = progressSnapshot.val();
    res.json({
      success: true,
      data: progress
    });

  } catch (error) {
    console.error('Error fetching lesson progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lesson progress: ' + error.message
    });
  }
};

// Update user progress for a specific lesson
const updateLessonProgress = async (req, res) => {
  try {
    const { userId, lessonId } = req.params;
    const { percentage, status } = req.body;

    if (!userId || !lessonId) {
      return res.status(400).json({
        success: false,
        error: 'User ID and Lesson ID are required'
      });
    }

    if (percentage === undefined || percentage < 0 || percentage > 100) {
      return res.status(400).json({
        success: false,
        error: 'Percentage must be between 0 and 100'
      });
    }

    // Determine status based on percentage
    let progressStatus = 'not_started';
    if (percentage > 0 && percentage < 100) {
      progressStatus = 'in_progress';
    } else if (percentage === 100) {
      progressStatus = 'completed';
    }

    // Update progress
    const updateData = {
      percentage: Math.round(percentage),
      status: status || progressStatus,
      lastAccessed: admin.database.ServerValue.TIMESTAMP,
      updatedAt: admin.database.ServerValue.TIMESTAMP
    };

    // Set createdAt if this is a new progress record
    const existingSnapshot = await db.ref(`progress/${userId}/${lessonId}`).once('value');
    if (!existingSnapshot.exists()) {
      updateData.createdAt = admin.database.ServerValue.TIMESTAMP;
    }

    await db.ref(`progress/${userId}/${lessonId}`).update(updateData);

    // Get updated progress
    const updatedSnapshot = await db.ref(`progress/${userId}/${lessonId}`).once('value');

    const updatedData = updatedSnapshot.val();

    // Check for newly earned badges (async, don't wait for completion)
    checkBadgesForUser(userId).catch(err => {
      console.error('Error checking badges after progress update:', err);
    });

    res.json({
      success: true,
      data: updatedData,
      message: 'Progress updated successfully'
    });

  } catch (error) {
    console.error('Error updating lesson progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update lesson progress: ' + error.message
    });
  }
};

// Helper function to check badges (internal use)
const checkBadgesForUser = async (userId) => {
  try {
    // Create a mock request/response for badge checking
    const mockReq = { params: { userId } };
    const mockRes = {
      json: () => {},
      status: () => mockRes
    };
    
    await checkBadges(mockReq, mockRes);
  } catch (error) {
    console.error('Error in checkBadgesForUser:', error);
  }
};

// Get all progress for a user
const getUserProgress = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Get all progress records for user
    const progressSnapshot = await db.ref(`progress/${userId}`).once('value');
    const progressRecords = [];

    if (progressSnapshot.exists()) {
      progressSnapshot.forEach((childSnapshot) => {
        progressRecords.push(childSnapshot.val());
      });
    }

    res.json({
      success: true,
      data: progressRecords,
      count: progressRecords.length
    });

  } catch (error) {
    console.error('Error fetching user progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user progress: ' + error.message
    });
  }
};

// Get progress for all users in a section
const getSectionProgress = async (req, res) => {
  try {
    const { sectionId } = req.params;

    if (!sectionId) {
      return res.status(400).json({
        success: false,
        error: 'Section ID is required'
      });
    }

    // Get section details
    const sectionSnapshot = await db.ref(`sections/${sectionId}`).once('value');
    if (!sectionSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Section not found'
      });
    }

    const section = sectionSnapshot.val();
    const assignedStudents = section.assignedStudents || [];

    if (assignedStudents.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No students assigned to this section'
      });
    }

    // Get progress for all students in the section
    const sectionProgress = [];
    
    for (const studentId of assignedStudents) {
      const studentProgressSnapshot = await db.ref(`progress/${studentId}`).once('value');
      if (studentProgressSnapshot.exists()) {
        const studentProgress = [];
        studentProgressSnapshot.forEach((progressChildSnapshot) => {
          studentProgress.push(progressChildSnapshot.val());
        });
        
        sectionProgress.push({
          studentId,
          progress: studentProgress
        });
      }
    }

    res.json({
      success: true,
      data: sectionProgress,
      count: sectionProgress.length
    });

  } catch (error) {
    console.error('Error fetching section progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch section progress: ' + error.message
    });
  }
};

// Get progress for all users in a skill
const getSkillProgress = async (req, res) => {
  try {
    const { skillId } = req.params;

    if (!skillId) {
      return res.status(400).json({
        success: false,
        error: 'Skill ID is required'
      });
    }

    // Get all lessons for this skill
    const lessonsSnapshot = await db.ref('lessons').orderByChild('skillId').equalTo(skillId).once('value');
    const lessonIds = [];

    if (lessonsSnapshot.exists()) {
      lessonsSnapshot.forEach((lessonChildSnapshot) => {
        lessonIds.push(lessonChildSnapshot.key);
      });
    }

    if (lessonIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No lessons found for this skill'
      });
    }

    // Get progress for all users across all lessons in this skill
    const skillProgress = [];
    
    // Get all progress records
    const allProgressSnapshot = await db.ref('progress').once('value');
    
    if (allProgressSnapshot.exists()) {
      allProgressSnapshot.forEach((userChildSnapshot) => {
        const userId = userChildSnapshot.key;
        const userProgress = [];
        
        userChildSnapshot.forEach((lessonChildSnapshot) => {
          const progress = lessonChildSnapshot.val();
          if (lessonIds.includes(progress.lessonId)) {
            userProgress.push(progress);
          }
        });
        
        if (userProgress.length > 0) {
          skillProgress.push({
            userId,
            progress: userProgress
          });
        }
      });
    }

    res.json({
      success: true,
      data: skillProgress,
      count: skillProgress.length
    });

  } catch (error) {
    console.error('Error fetching skill progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch skill progress: ' + error.message
    });
  }
};

// Get overall progress statistics
const getProgressStats = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Get all progress for user
    const progressSnapshot = await db.ref(`progress/${userId}`).once('value');
    const progressRecords = [];

    if (progressSnapshot.exists()) {
      progressSnapshot.forEach((childSnapshot) => {
        progressRecords.push(childSnapshot.val());
      });
    }

    // Calculate statistics
    const totalLessons = progressRecords.length;
    const completedLessons = progressRecords.filter(p => p.percentage === 100).length;
    const inProgressLessons = progressRecords.filter(p => p.percentage > 0 && p.percentage < 100).length;
    const notStartedLessons = progressRecords.filter(p => p.percentage === 0).length;
    
    const averageProgress = totalLessons > 0 
      ? Math.round(progressRecords.reduce((sum, p) => sum + p.percentage, 0) / totalLessons)
      : 0;

    res.json({
      success: true,
      data: {
        totalLessons,
        completedLessons,
        inProgressLessons,
        notStartedLessons,
        averageProgress,
        progressRecords
      }
    });

  } catch (error) {
    console.error('Error fetching progress stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch progress stats: ' + error.message
    });
  }
};

// Get attachment progress for a lesson
const getAttachmentProgress = async (req, res) => {
  try {
    const { userId, lessonId } = req.params;

    if (!userId || !lessonId) {
      return res.status(400).json({
        success: false,
        error: 'User ID and Lesson ID are required'
      });
    }

    // Get attachment progress record
    const progressSnapshot = await db.ref(`attachmentProgress/${userId}/${lessonId}`).once('value');
    
    if (!progressSnapshot.exists()) {
      return res.json({
        success: true,
        data: {}
      });
    }

    const progress = progressSnapshot.val();
    
    // Convert sanitized keys back to original attachment IDs for frontend
    const normalizedProgress = {};
    Object.keys(progress).forEach(sanitizedKey => {
      const attachmentData = progress[sanitizedKey];
      const originalId = attachmentData.originalAttachmentId || sanitizedKey;
      normalizedProgress[originalId] = attachmentData;
    });
    
    res.json({
      success: true,
      data: normalizedProgress
    });

  } catch (error) {
    console.error('Error fetching attachment progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch attachment progress: ' + error.message
    });
  }
};

// Update attachment progress
const updateAttachmentProgress = async (req, res) => {
  try {
    const { userId, lessonId, attachmentId } = req.params;

    if (!userId || !lessonId || !attachmentId) {
      return res.status(400).json({
        success: false,
        error: 'User ID, Lesson ID, and Attachment ID are required'
      });
    }

    // Sanitize attachment ID for Firebase path (replace dots and other invalid characters)
    const sanitizedAttachmentId = attachmentId.replace(/[.#$[\]]/g, '_');

    // Update attachment progress
    const updateData = {
      viewed: true,
      viewedAt: admin.database.ServerValue.TIMESTAMP,
      updatedAt: admin.database.ServerValue.TIMESTAMP,
      originalAttachmentId: attachmentId // Store original ID for reference
    };

    await db.ref(`attachmentProgress/${userId}/${lessonId}/${sanitizedAttachmentId}`).update(updateData);

    // Get updated attachment progress
    const updatedSnapshot = await db.ref(`attachmentProgress/${userId}/${lessonId}/${sanitizedAttachmentId}`).once('value');

    // Calculate lesson progress based on attachment viewing
    await updateLessonProgressBasedOnAttachments(userId, lessonId);

    res.json({
      success: true,
      data: updatedSnapshot.val(),
      message: 'Attachment progress updated successfully'
    });

  } catch (error) {
    console.error('Error updating attachment progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update attachment progress: ' + error.message
    });
  }
};

// Helper function to update lesson progress based on attachment viewing
const updateLessonProgressBasedOnAttachments = async (userId, lessonId) => {
  try {
    // Get lesson details to count total attachments
    const lessonSnapshot = await db.ref(`lessons/${lessonId}`).once('value');
    if (!lessonSnapshot.exists()) {
      console.log('Lesson not found:', lessonId);
      return;
    }

    const lesson = lessonSnapshot.val();
    const totalAttachments = lesson.attachments ? lesson.attachments.length : 0;

    if (totalAttachments === 0) {
      console.log('No attachments found for lesson:', lessonId);
      return;
    }

    // Get all attachment progress for this lesson
    const attachmentProgressSnapshot = await db.ref(`attachmentProgress/${userId}/${lessonId}`).once('value');
    const attachmentProgress = attachmentProgressSnapshot.val() || {};
    
    // Count viewed attachments (handle both sanitized and original IDs)
    const viewedAttachments = Object.values(attachmentProgress).filter(att => att.viewed).length;
    
    // Calculate progress percentage
    const progressPercentage = Math.round((viewedAttachments / totalAttachments) * 100);
    
    // Determine status based on percentage
    let progressStatus = 'not_started';
    if (progressPercentage > 0 && progressPercentage < 100) {
      progressStatus = 'in_progress';
    } else if (progressPercentage === 100) {
      progressStatus = 'completed';
    }

    // Update lesson progress
    const progressUpdateData = {
      percentage: progressPercentage,
      status: progressStatus,
      lastAccessed: admin.database.ServerValue.TIMESTAMP,
      updatedAt: admin.database.ServerValue.TIMESTAMP
    };

    // Set createdAt if this is a new progress record
    const existingProgressSnapshot = await db.ref(`progress/${userId}/${lessonId}`).once('value');
    if (!existingProgressSnapshot.exists()) {
      progressUpdateData.createdAt = admin.database.ServerValue.TIMESTAMP;
    }

    await db.ref(`progress/${userId}/${lessonId}`).update(progressUpdateData);

    console.log(`Updated lesson progress for user ${userId}, lesson ${lessonId}: ${progressPercentage}% (${viewedAttachments}/${totalAttachments} attachments viewed)`);

  } catch (error) {
    console.error('Error updating lesson progress based on attachments:', error);
  }
};

// Get real-time progress updates for a lesson (including attachment progress)
const getLessonProgressWithAttachments = async (req, res) => {
  try {
    const { userId, lessonId } = req.params;

    if (!userId || !lessonId) {
      return res.status(400).json({
        success: false,
        error: 'User ID and Lesson ID are required'
      });
    }

    // Get lesson progress
    const progressSnapshot = await db.ref(`progress/${userId}/${lessonId}`).once('value');
    const lessonProgress = progressSnapshot.exists() ? progressSnapshot.val() : null;

    // Get attachment progress
    const attachmentProgressSnapshot = await db.ref(`attachmentProgress/${userId}/${lessonId}`).once('value');
    let attachmentProgress = attachmentProgressSnapshot.exists() ? attachmentProgressSnapshot.val() : {};
    
    // Convert sanitized keys back to original attachment IDs for frontend
    const normalizedProgress = {};
    Object.keys(attachmentProgress).forEach(sanitizedKey => {
      const attachmentData = attachmentProgress[sanitizedKey];
      const originalId = attachmentData.originalAttachmentId || sanitizedKey;
      normalizedProgress[originalId] = attachmentData;
    });

    res.json({
      success: true,
      data: {
        lessonProgress,
        attachmentProgress: normalizedProgress
      }
    });

  } catch (error) {
    console.error('Error fetching lesson progress with attachments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lesson progress with attachments: ' + error.message
    });
  }
};

// Get all parent progress for teacher dashboard or admin dashboard
const getAllParentProgress = async (req, res) => {
  try {
    console.log('getAllParentProgress called with:', { 
      method: req.method, 
      params: req.params, 
      body: req.body,
      url: req.url 
    });
    const { teacherId } = req.params;
    const { userRole } = req.body; // Get user role from request body for admin access

    // For admin users, allow access without teacherId
    if (userRole === 'admin') {
      console.log('Admin access to all parent progress');
      
      // Get all sections
      const sectionsSnapshot = await db.ref('sections').once('value');
      const allSections = [];
      
      if (sectionsSnapshot.exists()) {
        sectionsSnapshot.forEach((sectionChildSnapshot) => {
          allSections.push({
            ...sectionChildSnapshot.val(),
            id: sectionChildSnapshot.key
          });
        });
      }

      console.log(`Found ${allSections.length} total sections`);
      
      if (allSections.length === 0) {
        return res.json({
          success: true,
          data: {
            sections: [],
            parentProgress: [],
            summary: {
              totalParents: 0,
              totalLessons: 0,
              averageProgress: 0,
              completedLessons: 0
            }
          },
          message: 'No sections found'
        });
      }

      // Get all students from all sections
      const allStudents = [];
      for (const section of allSections) {
        if (section.assignedStudents) {
          allStudents.push(...section.assignedStudents);
        }
      }

      // Remove duplicates
      const uniqueStudents = [...new Set(allStudents)];
      console.log(`Found ${uniqueStudents.length} unique students across all sections`);

      // Get progress for all students
      const parentProgress = [];
      let totalLessons = 0;
      let completedLessons = 0;
      let totalProgressSum = 0;

      for (const studentId of uniqueStudents) {
        // Get student info
        const studentSnapshot = await db.ref(`users/${studentId}`).once('value');
        if (!studentSnapshot.exists()) continue;

        const student = studentSnapshot.val();
        
        // Get student's progress
        const studentProgressSnapshot = await db.ref(`progress/${studentId}`).once('value');
        const studentProgress = [];
        
        if (studentProgressSnapshot.exists()) {
          studentProgressSnapshot.forEach((progressChildSnapshot) => {
            const progress = progressChildSnapshot.val();
            studentProgress.push(progress);
            
            totalLessons++;
            if (progress.percentage === 100) {
              completedLessons++;
            }
            totalProgressSum += progress.percentage || 0;
          });
        }

        // Get student's sections
        const studentSections = allSections.filter(section => 
          section.assignedStudents && section.assignedStudents.includes(studentId)
        );

        parentProgress.push({
          studentId,
          studentName: student.childName || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown',
          studentEmail: student.email || '',
          sections: studentSections.map(section => ({
            id: section.id,
            name: section.name,
            grade: section.grade
          })),
          progress: studentProgress,
          totalLessons: studentProgress.length,
          completedLessons: studentProgress.filter(p => p.percentage === 100).length,
          averageProgress: studentProgress.length > 0 
            ? Math.round(studentProgress.reduce((sum, p) => sum + (p.percentage || 0), 0) / studentProgress.length)
            : 0
        });
      }

      const averageProgress = totalLessons > 0 ? Math.round(totalProgressSum / totalLessons) : 0;

      return res.json({
        success: true,
        data: {
          sections: allSections,
          parentProgress,
          summary: {
            totalParents: parentProgress.length,
            totalLessons,
            averageProgress,
            completedLessons
          }
        }
      });
    }

    // For parent users, allow access to their own child's progress
    if (userRole === 'parent') {
      console.log('Parent access to their child progress:', teacherId);
      
      // Verify parent exists and has parent role
      const parentSnapshot = await db.ref(`users/${teacherId}`).once('value');
      if (!parentSnapshot.exists()) {
        return res.status(404).json({
          success: false,
          error: 'Parent not found'
        });
      }

      const parent = parentSnapshot.val();
      if (parent.role !== 'parent') {
        return res.status(403).json({
          success: false,
          error: 'User is not a parent'
        });
      }

      // Get parent's child ID (assuming parent ID is the same as child ID for now)
      // In a real system, you might have a separate child ID field
      const childId = teacherId; // This might need to be adjusted based on your data structure
      
      // Get sections where this child is enrolled
      const sectionsSnapshot = await db.ref('sections').once('value');
      const childSections = [];
      
      if (sectionsSnapshot.exists()) {
        sectionsSnapshot.forEach((sectionChildSnapshot) => {
          const section = sectionChildSnapshot.val();
          if (section.assignedStudents && section.assignedStudents.includes(childId)) {
            childSections.push({
              ...section,
              id: sectionChildSnapshot.key
            });
          }
        });
      }

      console.log(`Found ${childSections.length} sections for child ${childId}`);
      
      if (childSections.length === 0) {
        return res.json({
          success: true,
          data: {
            sections: [],
            parentProgress: [],
            summary: {
              totalParents: 0,
              totalLessons: 0,
              averageProgress: 0,
              completedLessons: 0
            }
          },
          message: 'Child not enrolled in any sections'
        });
      }

      // Get child's progress
      const childProgressSnapshot = await db.ref(`progress/${childId}`).once('value');
      const childProgress = [];
      
      if (childProgressSnapshot.exists()) {
        childProgressSnapshot.forEach((progressChildSnapshot) => {
          const progress = progressChildSnapshot.val();
          childProgress.push(progress);
        });
      }

      // Calculate statistics for this child
      const totalLessons = childProgress.length;
      const completedLessons = childProgress.filter(p => p.percentage === 100).length;
      const totalProgressSum = childProgress.reduce((sum, p) => sum + (p.percentage || 0), 0);
      const averageProgress = totalLessons > 0 ? Math.round(totalProgressSum / totalLessons) : 0;

      const parentProgress = [{
        studentId: childId,
        studentName: parent.childName || `${parent.firstName || ''} ${parent.lastName || ''}`.trim() || 'Unknown',
        studentEmail: parent.email || '',
        sections: childSections.map(section => ({
          id: section.id,
          name: section.name,
          grade: section.grade
        })),
        progress: childProgress,
        totalLessons: childProgress.length,
        completedLessons: childProgress.filter(p => p.percentage === 100).length,
        averageProgress: averageProgress
      }];

      return res.json({
        success: true,
        data: {
          sections: childSections,
          parentProgress,
          summary: {
            totalParents: 1,
            totalLessons,
            averageProgress,
            completedLessons
          }
        }
      });
    }

    // Original teacher logic
    if (!teacherId) {
      return res.status(400).json({
        success: false,
        error: 'Teacher ID is required'
      });
    }

    // Verify teacher exists and has teacher role
    const teacherSnapshot = await db.ref(`users/${teacherId}`).once('value');
    if (!teacherSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Teacher not found'
      });
    }

    const teacher = teacherSnapshot.val();
    if (teacher.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        error: 'User is not a teacher'
      });
    }

    // Get all sections assigned to this teacher
    const sectionsSnapshot = await db.ref('sections').once('value');
    const teacherSections = [];
    
    if (sectionsSnapshot.exists()) {
      sectionsSnapshot.forEach((sectionChildSnapshot) => {
        const section = sectionChildSnapshot.val();
        // Check both teacherId (singular) and assignedTeachers (plural) for backward compatibility
        if ((section.teacherId === teacherId) || 
            (section.assignedTeachers && section.assignedTeachers.includes(teacherId))) {
          teacherSections.push({
            ...section,
            id: sectionChildSnapshot.key
          });
        }
      });
    }

    console.log(`Found ${teacherSections.length} sections for teacher ${teacherId}`);
    
    if (teacherSections.length === 0) {
      return res.json({
        success: true,
        data: {
          sections: [],
          parentProgress: [],
          summary: {
            totalParents: 0,
            totalLessons: 0,
            averageProgress: 0,
            completedLessons: 0
          }
        },
        message: 'No sections assigned to this teacher'
      });
    }

    // Get all students (parents) from these sections
    const allStudents = [];
    for (const section of teacherSections) {
      if (section.assignedStudents) {
        allStudents.push(...section.assignedStudents);
      }
    }

    // Remove duplicates
    const uniqueStudents = [...new Set(allStudents)];
    console.log(`Found ${uniqueStudents.length} unique students for teacher ${teacherId}`);

    // Get progress for all students
    const parentProgress = [];
    let totalLessons = 0;
    let completedLessons = 0;
    let totalProgressSum = 0;

    for (const studentId of uniqueStudents) {
      // Get student info
      const studentSnapshot = await db.ref(`users/${studentId}`).once('value');
      if (!studentSnapshot.exists()) continue;

      const student = studentSnapshot.val();
      
      // Get student's progress
      const studentProgressSnapshot = await db.ref(`progress/${studentId}`).once('value');
      const studentProgress = [];
      
      if (studentProgressSnapshot.exists()) {
        studentProgressSnapshot.forEach((progressChildSnapshot) => {
          const progress = progressChildSnapshot.val();
          studentProgress.push(progress);
          
          totalLessons++;
          if (progress.percentage === 100) {
            completedLessons++;
          }
          totalProgressSum += progress.percentage || 0;
        });
      }

      // Get student's sections
      const studentSections = teacherSections.filter(section => 
        section.assignedStudents && section.assignedStudents.includes(studentId)
      );

      parentProgress.push({
        studentId,
        studentName: student.childName || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown',
        studentEmail: student.email || '',
        sections: studentSections.map(section => ({
          id: section.id,
          name: section.name,
          grade: section.grade
        })),
        progress: studentProgress,
        totalLessons: studentProgress.length,
        completedLessons: studentProgress.filter(p => p.percentage === 100).length,
        averageProgress: studentProgress.length > 0 
          ? Math.round(studentProgress.reduce((sum, p) => sum + (p.percentage || 0), 0) / studentProgress.length)
          : 0
      });
    }

    const averageProgress = totalLessons > 0 ? Math.round(totalProgressSum / totalLessons) : 0;

    res.json({
      success: true,
      data: {
        sections: teacherSections,
        parentProgress,
        summary: {
          totalParents: parentProgress.length,
          totalLessons,
          averageProgress,
          completedLessons
        }
      }
    });

  } catch (error) {
    console.error('Error fetching all parent progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch parent progress: ' + error.message
    });
  }
};

// Get progress with assignment submissions
const getProgressWithAssignments = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Get user progress
    const progressSnapshot = await db.ref(`progress/${userId}`).once('value');
    const progressRecords = [];

    if (progressSnapshot.exists()) {
      progressSnapshot.forEach((childSnapshot) => {
        progressRecords.push(childSnapshot.val());
      });
    }

    // Get assignment submissions for this user
    const submissionsSnapshot = await db.ref('assignmentSubmissions')
      .orderByChild('studentId')
      .equalTo(userId)
      .once('value');

    const submissions = [];
    if (submissionsSnapshot.exists()) {
      submissionsSnapshot.forEach((childSnapshot) => {
        submissions.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
    }

    // Combine progress with assignment data
    const progressWithAssignments = progressRecords.map(progress => {
      const assignmentSubmission = submissions.find(sub => sub.assignmentId === progress.lessonId);
      return {
        ...progress,
        assignmentSubmission
      };
    });

    res.json({
      success: true,
      data: {
        progress: progressWithAssignments,
        submissions,
        summary: {
          totalProgress: progressRecords.length,
          completedAssignments: submissions.filter(s => s.status === 'graded').length,
          pendingAssignments: submissions.filter(s => s.status === 'submitted').length,
          averageGrade: submissions.length > 0 
            ? submissions.filter(s => s.grade !== undefined && s.grade !== null && s.grade !== '').length
            : 0
        }
      }
    });

  } catch (error) {
    console.error('Error getting progress with assignments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get progress with assignments: ' + error.message
    });
  }
};

// Update progress when assignment is submitted
const updateProgressOnAssignmentSubmission = async (req, res) => {
  try {
    const { userId, assignmentId, submissionData } = req.body;

    if (!userId || !assignmentId) {
      return res.status(400).json({
        success: false,
        error: 'User ID and Assignment ID are required'
      });
    }

    // Update progress record
    const progressRef = db.ref(`progress/${userId}/${assignmentId}`);
    const progressSnapshot = await progressRef.once('value');
    
    const currentProgress = progressSnapshot.exists() ? progressSnapshot.val() : {
      userId,
      lessonId: assignmentId,
      percentage: 0,
      status: 'not_started',
      createdAt: new Date().toISOString()
    };

    // Update progress based on submission
    const updateData = {
      percentage: 50, // Half progress for submission
      status: 'in_progress',
      lastAccessed: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignmentSubmitted: true,
      submittedAt: new Date().toISOString()
    };

    await progressRef.update(updateData);

    res.json({
      success: true,
      data: {
        ...currentProgress,
        ...updateData
      },
      message: 'Progress updated for assignment submission'
    });

  } catch (error) {
    console.error('Error updating progress on assignment submission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update progress: ' + error.message
    });
  }
};

// Get assignment progress for a specific user
const getAssignmentProgress = async (req, res) => {
  try {
    const { userId, assignmentId } = req.params;

    if (!userId || !assignmentId) {
      return res.status(400).json({
        success: false,
        error: 'User ID and Assignment ID are required'
      });
    }

    // Get progress record
    const progressSnapshot = await db.ref(`progress/${userId}/${assignmentId}`).once('value');
    
    if (!progressSnapshot.exists()) {
      return res.json({
        success: true,
        data: {
          userId,
          assignmentId,
          percentage: 0,
          status: 'not_started',
          assignmentSubmitted: false
        }
      });
    }

    const progress = progressSnapshot.val();

    // Get assignment submission if exists
    const submissionSnapshot = await db.ref('assignmentSubmissions')
      .orderByChild('studentId')
      .equalTo(userId)
      .once('value');

    let submission = null;
    if (submissionSnapshot.exists()) {
      submissionSnapshot.forEach((childSnapshot) => {
        const sub = childSnapshot.val();
        if (sub.assignmentId === assignmentId) {
          submission = {
            id: childSnapshot.key,
            ...sub
          };
        }
      });
    }

    res.json({
      success: true,
      data: {
        progress,
        submission
      }
    });

  } catch (error) {
    console.error('Error getting assignment progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get assignment progress: ' + error.message
    });
  }
};

module.exports = {
  getLessonProgress,
  updateLessonProgress,
  getUserProgress,
  getSectionProgress,
  getSkillProgress,
  getProgressStats,
  getAttachmentProgress,
  updateAttachmentProgress,
  getLessonProgressWithAttachments,
  getAllParentProgress,
  getProgressWithAssignments,
  updateProgressOnAssignmentSubmission,
  getAssignmentProgress
};
