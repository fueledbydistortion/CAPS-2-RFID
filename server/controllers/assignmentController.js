const { db } = require('../config/firebase-admin-config');
const { createNotificationInternal } = require('./notificationController');

// Simplified letter grade conversion system
const LETTER_GRADES = {
  'A': { min: 90, max: 100, gpa: 4.0 },
  'B': { min: 80, max: 89, gpa: 3.0 },
  'C': { min: 70, max: 79, gpa: 2.0 },
  'D': { min: 60, max: 69, gpa: 1.0 },
  'F': { min: 0, max: 59, gpa: 0.0 }
};

// Convert numeric grade to letter grade
const convertToLetterGrade = (numericGrade) => {
  const grade = Math.round(numericGrade);
  for (const [letter, range] of Object.entries(LETTER_GRADES)) {
    if (grade >= range.min && grade <= range.max) {
      return letter;
    }
  }
  return 'F'; // Default to F if no match
};

// Convert letter grade to numeric grade (for calculations)
const convertToNumericGrade = (letterGrade) => {
  const grade = LETTER_GRADES[letterGrade];
  if (grade) {
    return Math.round((grade.min + grade.max) / 2); // Return midpoint
  }
  return 0; // Default to 0 for invalid grades
};

// Validate letter grade
const isValidLetterGrade = (grade) => {
  return LETTER_GRADES.hasOwnProperty(grade);
};

// Get all assignments for a specific skill
const getAssignmentsBySkill = async (req, res) => {
  try {
    const { skillId } = req.params;
    
    const snapshot = await db.ref('assignments').orderByChild('skillId').equalTo(skillId).once('value');
    const assignments = [];
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        assignments.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
    }
    
    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('Error getting assignments by skill:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get assignments'
    });
  }
};

// Get a specific assignment by ID
const getAssignmentById = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    const snapshot = await db.ref(`assignments/${assignmentId}`).once('value');
    
    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: assignmentId,
        ...snapshot.val()
      }
    });
  } catch (error) {
    console.error('Error getting assignment by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get assignment'
    });
  }
};

// Create a new assignment
const createAssignment = async (req, res) => {
  try {
    const assignmentData = req.body;
    
    // Add timestamp
    assignmentData.createdAt = new Date();
    assignmentData.updatedAt = new Date();
    
    const newAssignmentRef = db.ref('assignments').push();
    await newAssignmentRef.set(assignmentData);
    
    // Notify parents in ALL sections assigned to the skill about the new assignment
    try {
      if (assignmentData.skillId) {
        // Get all sections assigned to this skill
        const skillSnapshot = await db.ref(`skills/${assignmentData.skillId}`).once('value');
        if (skillSnapshot.exists()) {
          const skill = skillSnapshot.val();
          const assignedSections = skill.assignedSections || [];
          
          if (assignedSections.length > 0) {
            const dueDate = assignmentData.dueDate ? new Date(assignmentData.dueDate).toLocaleDateString() : 'No due date';
            
            // Notify parents in all sections assigned to this skill
            for (const sectionId of assignedSections) {
              const sectionSnapshot = await db.ref(`sections/${sectionId}`).once('value');
              if (sectionSnapshot.exists()) {
                const section = sectionSnapshot.val();
                const parents = section.assignedStudents || [];
                
                // Create notification for each parent in the section
                for (const parentId of parents) {
                  await createNotificationInternal({
                    recipientId: parentId,
                    recipientRole: 'parent',
                    type: 'assignment',
                    title: '📝 New Assignment Posted',
                    message: `${assignmentData.title} - Due: ${dueDate} (Section: ${section.name})`,
                    priority: 'normal',
                    actionUrl: '/dashboard/parent-content',
                    metadata: {
                      assignmentId: newAssignmentRef.key,
                      sectionId: sectionId,
                      skillId: assignmentData.skillId,
                      skillName: skill.name,
                      sectionName: section.name
                    },
                    createdBy: req.user?.uid || 'system'
                  });
                }
              }
            }
          }
        }
      } else if (assignmentData.sectionId) {
        // Fallback: if no skillId but sectionId is provided, use the old logic
        const sectionSnapshot = await db.ref(`sections/${assignmentData.sectionId}`).once('value');
        if (sectionSnapshot.exists()) {
          const section = sectionSnapshot.val();
          const parents = section.assignedStudents || [];
          
          if (parents.length > 0) {
            const dueDate = assignmentData.dueDate ? new Date(assignmentData.dueDate).toLocaleDateString() : 'No due date';
            
            // Create notification for each parent
            for (const parentId of parents) {
              await createNotificationInternal({
                recipientId: parentId,
                recipientRole: 'parent',
                type: 'assignment',
                title: '📝 New Assignment Posted',
                message: `${assignmentData.title} - Due: ${dueDate}`,
                priority: 'normal',
                actionUrl: '/dashboard/parent-content',
                metadata: {
                  assignmentId: newAssignmentRef.key,
                  sectionId: assignmentData.sectionId,
                  skillId: assignmentData.skillId
                },
                createdBy: req.user?.uid || 'system'
              });
            }
          }
        }
      }
    } catch (notifError) {
      console.error('Error creating assignment notifications:', notifError);
      // Don't fail the request if notification fails
    }
    
    res.status(201).json({
      success: true,
      data: {
        id: newAssignmentRef.key,
        ...assignmentData
      }
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create assignment'
    });
  }
};

// Update an assignment
const updateAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const updates = req.body;
    
    // Add update timestamp
    updates.updatedAt = new Date();
    
    const assignmentRef = db.ref(`assignments/${assignmentId}`);
    await assignmentRef.update(updates);
    
    // Get updated data
    const updatedSnapshot = await assignmentRef.once('value');
    
    res.json({
      success: true,
      data: {
        id: assignmentId,
        ...updatedSnapshot.val()
      }
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update assignment'
    });
  }
};

// Delete an assignment
const deleteAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    const assignmentRef = db.ref(`assignments/${assignmentId}`);
    const snapshot = await assignmentRef.once('value');
    
    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }
    
    await assignmentRef.remove();
    
    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete assignment'
    });
  }
};

// Search assignments (client-side filtering for now)
const searchAssignments = async (req, res) => {
  try {
    const { skillId } = req.params;
    const { searchTerm } = req.query;
    
    const snapshot = await db.ref('assignments').orderByChild('skillId').equalTo(skillId).once('value');
    
    let assignments = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        assignments.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
    }
    
    // Client-side filtering
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      assignments = assignments.filter(assignment => 
        assignment.title?.toLowerCase().includes(searchLower) ||
        assignment.description?.toLowerCase().includes(searchLower) ||
        assignment.instructions?.toLowerCase().includes(searchLower)
      );
    }
    
    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('Error searching assignments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search assignments'
    });
  }
};

// Get assignments by type
const getAssignmentsByType = async (req, res) => {
  try {
    const { skillId, type } = req.params;
    
    const snapshot = await db.ref('assignments').orderByChild('skillId').equalTo(skillId).once('value');
    
    const assignments = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const assignment = {
          id: childSnapshot.key,
          ...childSnapshot.val()
        };
        
        // Filter by type
        if (assignment.type === type) {
          assignments.push(assignment);
        }
      });
    }
    
    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('Error getting assignments by type:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get assignments by type'
    });
  }
};

// Get assignments due soon
const getAssignmentsDueSoon = async (req, res) => {
  try {
    const { skillId } = req.params;
    const { days = 7 } = req.query;
    
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + parseInt(days));
    
    const snapshot = await db.ref('assignments').orderByChild('skillId').equalTo(skillId).once('value');
    
    const assignments = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const assignment = {
          id: childSnapshot.key,
          ...childSnapshot.val()
        };
        
        // Check if assignment is due within the specified days
        if (assignment.dueDate) {
          const assignmentDueDate = new Date(assignment.dueDate);
          if (assignmentDueDate <= dueDate) {
            assignments.push(assignment);
          }
        }
      });
    }
    
    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('Error getting assignments due soon:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get assignments due soon'
    });
  }
};

// Submit assignment (for parents/students)
const submitAssignment = async (req, res) => {
  try {
    const { assignmentId, submissionText, attachments, submittedAt } = req.body;
    const studentId = req.user?.uid; // Assuming user ID is available from auth middleware

    if (!assignmentId) {
      return res.status(400).json({
        success: false,
        error: 'Assignment ID is required'
      });
    }

    if (!studentId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    // Check if assignment exists
    const assignmentSnapshot = await db.ref(`assignments/${assignmentId}`).once('value');
    if (!assignmentSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    const assignment = assignmentSnapshot.val();

    // Create submission data
    const submissionData = {
      assignmentId,
      studentId,
      submissionText: submissionText || '',
      attachments: attachments || [],
      submittedAt: submittedAt || new Date().toISOString(),
      status: 'submitted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save submission
    const submissionRef = db.ref('assignmentSubmissions').push();
    await submissionRef.set(submissionData);

    // Update progress tracking
    await updateProgressForAssignmentSubmission(studentId, assignmentId, assignment);

    // Notify teacher about the submission
    try {
      const studentSnapshot = await db.ref(`users/${studentId}`).once('value');
      if (studentSnapshot.exists() && assignment.createdBy) {
        const student = studentSnapshot.val();
        const studentName = student.childName || `${student.firstName} ${student.lastName}`;
        
        await createNotificationInternal({
          recipientId: assignment.createdBy,
          recipientRole: 'teacher',
          type: 'assignment',
          title: '📬 New Assignment Submission',
          message: `${studentName} submitted: ${assignment.title}`,
          priority: 'normal',
          actionUrl: '/dashboard/skills',
          metadata: {
            assignmentId,
            submissionId: submissionRef.key,
            studentId
          },
          createdBy: req.user?.uid || 'system'
        });
      }
    } catch (notifError) {
      console.error('Error creating submission notification:', notifError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      success: true,
      data: {
        id: submissionRef.key,
        ...submissionData
      },
      message: 'Assignment submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit assignment: ' + error.message
    });
  }
};

// Get assignment submissions (for teachers)
const getAssignmentSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const submissionsSnapshot = await db.ref('assignmentSubmissions')
      .orderByChild('assignmentId')
      .equalTo(assignmentId)
      .once('value');

    const submissions = [];
    if (submissionsSnapshot.exists()) {
      // Get all submissions first
      const submissionPromises = [];
      submissionsSnapshot.forEach((childSnapshot) => {
        const submission = {
          id: childSnapshot.key,
          ...childSnapshot.val()
        };
        submissions.push(submission);
        
        // Get child information for each submission
        // The studentId is actually the parent's UID, so we need to find the child's info
        submissionPromises.push(
          db.ref(`users/${submission.studentId}`).once('value')
            .then(async (parentSnapshot) => {
              if (parentSnapshot.exists()) {
                const parent = parentSnapshot.val();
                console.log('Parent data for child name lookup:', { 
                  parentId: submission.studentId, 
                  hasChildName: !!parent.childName,
                  hasChildren: !!parent.children,
                  childrenCount: parent.children ? parent.children.length : 0
                });
                
                // Look for child information in the parent's profile
                let childName = 'Unknown Child';
                
                // Check if parent has childName field
                if (parent.childName) {
                  childName = parent.childName;
                } else if (parent.children && parent.children.length > 0) {
                  // If parent has children array, get the first child's name
                  childName = parent.children[0].name || parent.children[0].firstName + ' ' + parent.children[0].lastName;
                } else {
                  // Fallback to parent's name if no child info is available
                  childName = `${parent.firstName} ${parent.lastName}`;
                }
                
                console.log('Resolved child name:', childName);
                
                return {
                  submissionId: submission.id,
                  childName: childName,
                  parentEmail: parent.email
                };
              }
              return {
                submissionId: submission.id,
                childName: 'Unknown Child',
                parentEmail: 'Unknown'
              };
            })
        );
      });

      // Wait for all parent information to be fetched
      const parentInfo = await Promise.all(submissionPromises);
      
      // Merge parent information with submissions
      submissions.forEach(submission => {
        const info = parentInfo.find(p => p.submissionId === submission.id);
        if (info) {
          submission.childName = info.childName;
          submission.parentEmail = info.parentEmail;
        }
      });
    }

    res.json({
      success: true,
      data: submissions
    });

  } catch (error) {
    console.error('Error getting assignment submissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get assignment submissions'
    });
  }
};

// Grade assignment submission (for teachers)
const gradeAssignmentSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback, status } = req.body;

    if (grade === undefined || grade === null || grade === '') {
      return res.status(400).json({
        success: false,
        error: 'Grade is required'
      });
    }

    const submissionRef = db.ref(`assignmentSubmissions/${submissionId}`);
    const submissionSnapshot = await submissionRef.once('value');

    if (!submissionSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    const submission = submissionSnapshot.val();

    // Validate letter grade
    if (!isValidLetterGrade(grade)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid letter grade. Valid grades: A, B, C, D, F'
      });
    }

    const letterGrade = grade;
    const numericGrade = convertToNumericGrade(letterGrade);

    // Update submission with grade
    const updateData = {
      grade: letterGrade,
      numericGrade: numericGrade, // Keep numeric for calculations
      feedback: feedback || '',
      status: 'graded', // Always set to graded when grading
      gradedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await submissionRef.update(updateData);

    console.log(`Updated submission ${submissionId} with status: graded, grade: ${letterGrade} (${numericGrade})`);

    // Update progress tracking
    await updateProgressForAssignmentGrade(submission.studentId, submission.assignmentId, letterGrade, numericGrade);

    // Notify student about the grade
    try {
      const assignmentSnapshot = await db.ref(`assignments/${submission.assignmentId}`).once('value');
      if (assignmentSnapshot.exists()) {
        const assignment = assignmentSnapshot.val();
        const gradeEmoji = letterGrade.startsWith('A') ? '🌟' : 
                          letterGrade.startsWith('B') ? '👍' : 
                          letterGrade.startsWith('C') ? '📝' : '📚';
        
        await createNotificationInternal({
          recipientId: submission.studentId,
          recipientRole: 'parent',
          type: 'assignment',
          title: `${gradeEmoji} Assignment Graded`,
          message: `${assignment.title} - Grade: ${letterGrade}${feedback ? ` - ${feedback.substring(0, 50)}...` : ''}`,
          priority: 'normal',
          actionUrl: '/dashboard/parent-content',
          metadata: {
            assignmentId: submission.assignmentId,
            submissionId,
            grade: letterGrade,
            numericGrade: numericGrade
          },
          createdBy: req.user?.uid || 'system'
        });
      }
    } catch (notifError) {
      console.error('Error creating grading notification:', notifError);
      // Don't fail the request if notification fails
    }

    res.json({
      success: true,
      data: {
        id: submissionId,
        ...submission,
        ...updateData
      },
      message: 'Assignment graded successfully'
    });

  } catch (error) {
    console.error('Error grading assignment submission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to grade assignment: ' + error.message
    });
  }
};

// Get student's assignment submissions
const getStudentSubmissions = async (req, res) => {
  try {
    const { studentId } = req.params;

    const submissionsSnapshot = await db.ref('assignmentSubmissions')
      .orderByChild('studentId')
      .equalTo(studentId)
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

    res.json({
      success: true,
      data: submissions
    });

  } catch (error) {
    console.error('Error getting student submissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get student submissions'
    });
  }
};

// Get the authenticated parent's submission for a specific assignment
const getMySubmissionForAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user?.uid;

    if (!studentId) {
      return res.status(401).json({ success: false, error: 'User authentication required' });
    }

    // Query submissions by assignmentId, then filter by studentId
    const submissionsSnapshot = await db
      .ref('assignmentSubmissions')
      .orderByChild('assignmentId')
      .equalTo(assignmentId)
      .once('value');

    if (!submissionsSnapshot.exists()) {
      return res.json({ success: true, data: null });
    }

    let mySubmission = null;
    submissionsSnapshot.forEach((childSnapshot) => {
      const submission = childSnapshot.val();
      if (submission.studentId === studentId && !mySubmission) {
        mySubmission = { id: childSnapshot.key, ...submission };
      }
    });

    return res.json({ success: true, data: mySubmission });
  } catch (error) {
    console.error('Error getting my submission for assignment:', error);
    return res.status(500).json({ success: false, error: 'Failed to get submission' });
  }
};

// Helper function to update progress when assignment is submitted
const updateProgressForAssignmentSubmission = async (studentId, assignmentId, assignment) => {
  try {
    // Get the skill ID from the assignment
    const skillId = assignment.skillId;
    if (!skillId) return;

    // Update progress for the skill
    const progressRef = db.ref(`progress/${studentId}/${assignmentId}`);
    const progressSnapshot = await progressRef.once('value');
    
    const currentProgress = progressSnapshot.exists() ? progressSnapshot.val() : {
      userId: studentId,
      lessonId: assignmentId,
      percentage: 0,
      status: 'not_started',
      createdAt: new Date().toISOString()
    };

    // Update progress to indicate assignment submitted
    await progressRef.update({
      percentage: 50, // Half progress for submission
      status: 'in_progress',
      lastAccessed: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignmentSubmitted: true,
      submittedAt: new Date().toISOString()
    });

    console.log(`Updated progress for student ${studentId}, assignment ${assignmentId}: submitted`);

  } catch (error) {
    console.error('Error updating progress for assignment submission:', error);
  }
};

// Helper function to update progress when assignment is graded
const updateProgressForAssignmentGrade = async (studentId, assignmentId, letterGrade, numericGrade) => {
  try {
    const progressRef = db.ref(`progress/${studentId}/${assignmentId}`);
    const progressSnapshot = await progressRef.once('value');
    
    if (!progressSnapshot.exists()) return;

    // Calculate percentage based on numeric grade
    const percentage = Math.min(100, Math.max(0, numericGrade));
    
    // Determine status based on letter grade
    let status = 'in_progress';
    if (letterGrade.startsWith('A') || letterGrade.startsWith('B')) {
      status = 'completed';
    } else if (letterGrade.startsWith('C')) {
      status = 'completed'; // C is still passing
    } else if (letterGrade.startsWith('D')) {
      status = 'needs_improvement';
    } else if (letterGrade === 'F') {
      status = 'failed';
    }

    await progressRef.update({
      percentage,
      status,
      lastAccessed: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignmentGraded: true,
      grade: letterGrade,
      numericGrade: numericGrade,
      gradedAt: new Date().toISOString()
    });

    console.log(`Updated progress for student ${studentId}, assignment ${assignmentId}: graded with ${letterGrade} (${numericGrade}) - status: ${status}`);

  } catch (error) {
    console.error('Error updating progress for assignment grade:', error);
  }
};

module.exports = {
  getAssignmentsBySkill,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  searchAssignments,
  getAssignmentsByType,
  getAssignmentsDueSoon,
  submitAssignment,
  getAssignmentSubmissions,
  gradeAssignmentSubmission,
  getStudentSubmissions,
  getMySubmissionForAssignment
};
