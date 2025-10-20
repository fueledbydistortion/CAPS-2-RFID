const { db, admin } = require('../config/firebase-admin-config');
const { createNotificationInternal } = require('./notificationController');

// Create a new skill
const createSkill = async (req, res) => {
  try {
    const { name, code, description } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required'
      });
    }

    // Create skill data
    const skillData = {
      name: name.trim(),
      code: code ? code.trim() : null,
      description: description ? description.trim() : null,
      createdAt: admin.database.ServerValue.TIMESTAMP,
      updatedAt: admin.database.ServerValue.TIMESTAMP
    };

    // Add skill to database
    const skillRef = db.ref('skills').push();
    const skillId = skillRef.key;

    await skillRef.set({
      id: skillId,
      ...skillData
    });

    res.status(201).json({
      success: true,
      data: {
        id: skillId,
        ...skillData
      },
      message: 'Skill created successfully'
    });

  } catch (error) {
    console.error('Error creating skill:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create skill: ' + error.message
    });
  }
};

// Get all skills
const getAllSkills = async (req, res) => {
  try {
    const snapshot = await db.ref('skills').once('value');
    const skills = [];

    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        skills.push(childSnapshot.val());
      });
    }

    res.json({
      success: true,
      data: skills,
      count: skills.length
    });

  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch skills: ' + error.message
    });
  }
};

// Get skill by ID
const getSkillById = async (req, res) => {
  try {
    const { id } = req.params;

    const snapshot = await db.ref(`skills/${id}`).once('value');
    
    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Skill not found'
      });
    }

    res.json({
      success: true,
      data: snapshot.val()
    });

  } catch (error) {
    console.error('Error fetching skill:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch skill: ' + error.message
    });
  }
};

// Update skill
const updateSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description } = req.body;

    // Check if skill exists
    const snapshot = await db.ref(`skills/${id}`).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Skill not found'
      });
    }

    // Prepare update data
    const updateData = {
      updatedAt: admin.database.ServerValue.TIMESTAMP
    };

    if (name !== undefined) updateData.name = name.trim();
    if (code !== undefined) updateData.code = code ? code.trim() : null;
    if (description !== undefined) updateData.description = description ? description.trim() : null;

    // Update skill
    await db.ref(`skills/${id}`).update(updateData);

    // Get updated skill
    const updatedSnapshot = await db.ref(`skills/${id}`).once('value');

    res.json({
      success: true,
      data: updatedSnapshot.val(),
      message: 'Skill updated successfully'
    });

  } catch (error) {
    console.error('Error updating skill:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update skill: ' + error.message
    });
  }
};

// Delete skill
const deleteSkill = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if skill exists
    const snapshot = await db.ref(`skills/${id}`).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Skill not found'
      });
    }

    // Delete skill
    await db.ref(`skills/${id}`).remove();

    res.json({
      success: true,
      message: 'Skill deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting skill:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete skill: ' + error.message
    });
  }
};


// Helper function to get all parents assigned to sections of a skill
const getParentsInSkillSections = async (skillId) => {
  try {
    // Get skill data
    const skillSnapshot = await db.ref(`skills/${skillId}`).once('value');
    if (!skillSnapshot.exists()) {
      return [];
    }

    const skill = skillSnapshot.val();
    const assignedSections = skill.assignedSections || [];
    
    if (assignedSections.length === 0) {
      return [];
    }

    // Get all parents from assigned sections
    const allParents = [];
    for (const sectionId of assignedSections) {
      const sectionSnapshot = await db.ref(`sections/${sectionId}`).once('value');
      if (sectionSnapshot.exists()) {
        const section = sectionSnapshot.val();
        const assignedStudents = section.assignedStudents || [];
        
        // In this system, assignedStudents contains parent IDs (representing their children)
        for (const parentId of assignedStudents) {
          if (!allParents.some(p => p.parentId === parentId)) {
            allParents.push({
              parentId,
              sectionId,
              sectionName: section.name
            });
          }
        }
      }
    }

    return allParents;
  } catch (error) {
    console.error('Error getting parents in skill sections:', error);
    return [];
  }
};

// Assign section to skill
const assignSectionToSkill = async (req, res) => {
  try {
    const { skillId } = req.params;
    const { sectionId } = req.body;

    if (!sectionId) {
      return res.status(400).json({
        success: false,
        error: 'Section ID is required'
      });
    }

    // Check if skill exists
    const skillSnapshot = await db.ref(`skills/${skillId}`).once('value');
    if (!skillSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Skill not found'
      });
    }

    // Check if section exists
    const sectionSnapshot = await db.ref(`sections/${sectionId}`).once('value');
    if (!sectionSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Section not found'
      });
    }

    const skill = skillSnapshot.val();
    const section = sectionSnapshot.val();
    const assignedSections = skill.assignedSections || [];

    // Check if section is already assigned
    if (assignedSections.includes(sectionId)) {
      return res.status(400).json({
        success: false,
        error: 'Section is already assigned to this skill'
      });
    }

    // Add section to skill
    const updatedSections = [...assignedSections, sectionId];
    
    await db.ref(`skills/${skillId}`).update({
      assignedSections: updatedSections,
      updatedAt: admin.database.ServerValue.TIMESTAMP
    });

    // Notify parents in the newly assigned section about the skill assignment
    try {
      const assignedStudents = section.assignedStudents || [];
      
      if (assignedStudents.length > 0) {
        // Create notification for each parent in the section
        for (const parentId of assignedStudents) {
          await createNotificationInternal({
            recipientId: parentId,
            recipientRole: 'parent',
            type: 'assignment',
            title: '📚 New Skill Available',
            message: `Your child's section "${section.name}" has been assigned to skill: ${skill.name}`,
            priority: 'normal',
            actionUrl: '/dashboard/parent-content',
            metadata: {
              skillId: skillId,
              sectionId: sectionId,
              skillName: skill.name,
              sectionName: section.name
            },
            createdBy: req.user?.uid || 'system'
          });
        }

        // Check if there are existing assignments for this skill and notify parents
        const assignmentsSnapshot = await db.ref('assignments').orderByChild('skillId').equalTo(skillId).once('value');
        if (assignmentsSnapshot.exists()) {
          const assignments = [];
          assignmentsSnapshot.forEach((childSnapshot) => {
            assignments.push({
              id: childSnapshot.key,
              ...childSnapshot.val()
            });
          });

          // Notify parents about existing assignments
          for (const assignment of assignments) {
            const dueDate = assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date';
            
            for (const parentId of assignedStudents) {
              await createNotificationInternal({
                recipientId: parentId,
                recipientRole: 'parent',
                type: 'assignment',
                title: '📝 Assignment Available',
                message: `Assignment "${assignment.title}" is now available for your child - Due: ${dueDate}`,
                priority: 'normal',
                actionUrl: '/dashboard/parent-content',
                metadata: {
                  assignmentId: assignment.id,
                  skillId: skillId,
                  sectionId: sectionId,
                  skillName: skill.name,
                  sectionName: section.name
                },
                createdBy: req.user?.uid || 'system'
              });
            }
          }
        }
      }
    } catch (notifError) {
      console.error('Error creating skill assignment notifications:', notifError);
      // Don't fail the request if notification fails
    }

    res.json({
      success: true,
      data: {
        ...skill,
        assignedSections: updatedSections
      },
      message: 'Section assigned to skill successfully'
    });

  } catch (error) {
    console.error('Error assigning section to skill:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign section to skill: ' + error.message
    });
  }
};

// Remove section from skill
const removeSectionFromSkill = async (req, res) => {
  try {
    const { skillId, sectionId } = req.params;

    // Check if skill exists
    const skillSnapshot = await db.ref(`skills/${skillId}`).once('value');
    if (!skillSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Skill not found'
      });
    }

    const skill = skillSnapshot.val();
    const assignedSections = skill.assignedSections || [];

    // Check if section is assigned
    if (!assignedSections.includes(sectionId)) {
      return res.status(400).json({
        success: false,
        error: 'Section is not assigned to this skill'
      });
    }

    // Remove section from skill
    const updatedSections = assignedSections.filter(id => id !== sectionId);
    
    await db.ref(`skills/${skillId}`).update({
      assignedSections: updatedSections,
      updatedAt: admin.database.ServerValue.TIMESTAMP
    });

    res.json({
      success: true,
      data: {
        ...skill,
        assignedSections: updatedSections
      },
      message: 'Section removed from skill successfully'
    });

  } catch (error) {
    console.error('Error removing section from skill:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove section from skill: ' + error.message
    });
  }
};

// Get sections assigned to a skill
const getSkillSections = async (req, res) => {
  try {
    const { skillId } = req.params;

    // Check if skill exists
    const skillSnapshot = await db.ref(`skills/${skillId}`).once('value');
    if (!skillSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Skill not found'
      });
    }

    const skill = skillSnapshot.val();
    const assignedSections = skill.assignedSections || [];

    if (assignedSections.length === 0) {
      return res.json({
        success: true,
        data: [],
        count: 0
      });
    }

    // Get section details for assigned sections
    const sections = [];
    for (const sectionId of assignedSections) {
      const sectionSnapshot = await db.ref(`sections/${sectionId}`).once('value');
      if (sectionSnapshot.exists()) {
        sections.push(sectionSnapshot.val());
      }
    }

    res.json({
      success: true,
      data: sections,
      count: sections.length
    });

  } catch (error) {
    console.error('Error fetching skill sections:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch skill sections: ' + error.message
    });
  }
};

module.exports = {
  createSkill,
  getAllSkills,
  getSkillById,
  updateSkill,
  deleteSkill,
  assignSectionToSkill,
  removeSectionFromSkill,
  getSkillSections
};
