const { db, admin } = require('../config/firebase-admin-config');

// Get modules and assignments for a parent's section
const getParentSectionContent = async (req, res) => {
  try {
    const { parentId } = req.params;

    if (!parentId) {
      return res.status(400).json({
        success: false,
        error: 'Parent ID is required'
      });
    }

    // Get parent information
    const parentSnapshot = await db.ref(`users/${parentId}`).once('value');
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

    // Find sections where this parent's child is assigned
    // In this system, the parent's child is represented by the parent's uid in assignedStudents
    const sectionsSnapshot = await db.ref('sections').once('value');
    const sections = [];
    
    if (sectionsSnapshot.exists()) {
      sectionsSnapshot.forEach((childSnapshot) => {
        const section = childSnapshot.val();
        if (section.assignedStudents && section.assignedStudents.includes(parentId)) {
          sections.push(section);
        }
      });
    }

    if (sections.length === 0) {
      return res.json({
        success: true,
        data: {
          sections: [],
          modules: [],
          assignments: [],
          skills: []
        },
        message: 'No sections found for this parent'
      });
    }

    // Get all skills assigned to these sections
    const allSkills = [];
    const allModules = [];
    const allAssignments = [];

    for (const section of sections) {
      // Get skills assigned to this section
      const skillsSnapshot = await db.ref('skills').once('value');
      if (skillsSnapshot.exists()) {
        skillsSnapshot.forEach((skillChildSnapshot) => {
          const skill = skillChildSnapshot.val();
          if (skill.assignedSections && skill.assignedSections.includes(section.id)) {
            allSkills.push(skill);
          }
        });
      }

      // Get modules (lessons) for these skills
      for (const skill of allSkills) {
        const lessonsSnapshot = await db.ref('lessons').orderByChild('skillId').equalTo(skill.id).once('value');
        if (lessonsSnapshot.exists()) {
          lessonsSnapshot.forEach((lessonChildSnapshot) => {
            const lesson = lessonChildSnapshot.val();
            allModules.push({
              ...lesson,
              id: lessonChildSnapshot.key, // Add the Firebase key as the id
              skillName: skill.name,
              sectionName: section.name,
              sectionGrade: section.grade
            });
          });
        }

        // Get assignments for these skills
        const assignmentsSnapshot = await db.ref('assignments').orderByChild('skillId').equalTo(skill.id).once('value');
        if (assignmentsSnapshot.exists()) {
          assignmentsSnapshot.forEach((assignmentChildSnapshot) => {
            const assignment = assignmentChildSnapshot.val();
            allAssignments.push({
              ...assignment,
              id: assignmentChildSnapshot.key, // Add the Firebase key as the id
              skillName: skill.name,
              sectionName: section.name,
              sectionGrade: section.grade
            });
          });
        }
      }
    }

    // Remove duplicates
    const uniqueSkills = allSkills.filter((skill, index, self) => 
      index === self.findIndex(s => s.id === skill.id)
    );

    const uniqueModules = allModules.filter((module, index, self) => 
      index === self.findIndex(m => m.id === module.id)
    );

    const uniqueAssignments = allAssignments.filter((assignment, index, self) => 
      index === self.findIndex(a => a.id === assignment.id)
    );

    res.json({
      success: true,
      data: {
        sections: sections,
        modules: uniqueModules,
        assignments: uniqueAssignments,
        skills: uniqueSkills
      },
      message: 'Parent section content retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching parent section content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch parent section content: ' + error.message
    });
  }
};

// Get specific section content for a parent
const getParentSectionById = async (req, res) => {
  try {
    const { parentId, sectionId } = req.params;

    if (!parentId || !sectionId) {
      return res.status(400).json({
        success: false,
        error: 'Parent ID and Section ID are required'
      });
    }

    // Verify parent exists and is a parent
    const parentSnapshot = await db.ref(`users/${parentId}`).once('value');
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

    // Get section details
    const sectionSnapshot = await db.ref(`sections/${sectionId}`).once('value');
    if (!sectionSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Section not found'
      });
    }

    const section = sectionSnapshot.val();

    // Verify parent's child is assigned to this section
    if (!section.assignedStudents || !section.assignedStudents.includes(parentId)) {
      return res.status(403).json({
        success: false,
        error: 'Parent is not assigned to this section'
      });
    }

    // Get skills assigned to this section
    const skillsSnapshot = await db.ref('skills').once('value');
    const sectionSkills = [];
    
    if (skillsSnapshot.exists()) {
      skillsSnapshot.forEach((skillChildSnapshot) => {
        const skill = skillChildSnapshot.val();
        if (skill.assignedSections && skill.assignedSections.includes(sectionId)) {
          sectionSkills.push(skill);
        }
      });
    }

    // Get modules and assignments for these skills
    const modules = [];
    const assignments = [];

    for (const skill of sectionSkills) {
      // Get modules (lessons) for this skill
      const lessonsSnapshot = await db.ref('lessons').orderByChild('skillId').equalTo(skill.id).once('value');
      if (lessonsSnapshot.exists()) {
        lessonsSnapshot.forEach((lessonChildSnapshot) => {
          const lesson = lessonChildSnapshot.val();
          modules.push({
            ...lesson,
            skillName: skill.name,
            sectionName: section.name,
            sectionGrade: section.grade
          });
        });
      }

      // Get assignments for this skill
      const assignmentsSnapshot = await db.ref('assignments').orderByChild('skillId').equalTo(skill.id).once('value');
      if (assignmentsSnapshot.exists()) {
        assignmentsSnapshot.forEach((assignmentChildSnapshot) => {
          const assignment = assignmentChildSnapshot.val();
          assignments.push({
            ...assignment,
            skillName: skill.name,
            sectionName: section.name,
            sectionGrade: section.grade
          });
        });
      }
    }

    res.json({
      success: true,
      data: {
        section: section,
        modules: modules,
        assignments: assignments,
        skills: sectionSkills
      },
      message: 'Section content retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching section content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch section content: ' + error.message
    });
  }
};

module.exports = {
  getParentSectionContent,
  getParentSectionById
};
