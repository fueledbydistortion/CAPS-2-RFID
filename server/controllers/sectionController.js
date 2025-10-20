const { db, admin } = require('../config/firebase-admin-config');

// Create a new section
const createSection = async (req, res) => {
  try {
    const { name, capacity, teacherId, assignedStudents } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required'
      });
    }

    // Create section data
    const sectionData = {
      name: name.trim(),
      capacity: capacity ? parseInt(capacity) : 0,
      teacherId: teacherId || null,
      assignedStudents: assignedStudents || [],
      createdAt: admin.database.ServerValue.TIMESTAMP,
      updatedAt: admin.database.ServerValue.TIMESTAMP
    };

    // Add section to database
    const sectionRef = db.ref('sections').push();
    const sectionId = sectionRef.key;

    await sectionRef.set({
      id: sectionId,
      ...sectionData
    });

    res.status(201).json({
      success: true,
      data: {
        id: sectionId,
        ...sectionData
      },
      message: 'Section created successfully'
    });

  } catch (error) {
    console.error('Error creating section:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create section: ' + error.message
    });
  }
};

// Get all sections
const getAllSections = async (req, res) => {
  try {
    const snapshot = await db.ref('sections').once('value');
    const sections = [];

    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        sections.push(childSnapshot.val());
      });
    }

    res.json({
      success: true,
      data: sections,
      count: sections.length
    });

  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sections: ' + error.message
    });
  }
};

// Get section by ID
const getSectionById = async (req, res) => {
  try {
    const { id } = req.params;

    const snapshot = await db.ref(`sections/${id}`).once('value');
    
    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Section not found'
      });
    }

    res.json({
      success: true,
      data: snapshot.val()
    });

  } catch (error) {
    console.error('Error fetching section:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch section: ' + error.message
    });
  }
};

// Update section
const updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, capacity, teacherId, assignedStudents } = req.body;

    // Check if section exists
    const snapshot = await db.ref(`sections/${id}`).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Section not found'
      });
    }

    // Prepare update data
    const updateData = {
      updatedAt: admin.database.ServerValue.TIMESTAMP
    };

    if (name !== undefined) updateData.name = name.trim();
    if (capacity !== undefined) updateData.capacity = parseInt(capacity);
    if (teacherId !== undefined) updateData.teacherId = teacherId;
    if (assignedStudents !== undefined) updateData.assignedStudents = assignedStudents;

    // Update section
    await db.ref(`sections/${id}`).update(updateData);

    // Get updated section
    const updatedSnapshot = await db.ref(`sections/${id}`).once('value');

    res.json({
      success: true,
      data: updatedSnapshot.val(),
      message: 'Section updated successfully'
    });

  } catch (error) {
    console.error('Error updating section:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update section: ' + error.message
    });
  }
};

// Delete section
const deleteSection = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if section exists
    const snapshot = await db.ref(`sections/${id}`).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Section not found'
      });
    }

    // Delete section
    await db.ref(`sections/${id}`).remove();

    res.json({
      success: true,
      message: 'Section deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting section:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete section: ' + error.message
    });
  }
};

// Add student to section
const addStudentToSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        error: 'Student ID is required'
      });
    }

    // Check if section exists
    const snapshot = await db.ref(`sections/${id}`).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Section not found'
      });
    }

    const section = snapshot.val();
    const assignedStudents = section.assignedStudents || [];

    // Check if student is already assigned
    if (assignedStudents.includes(studentId)) {
      return res.status(400).json({
        success: false,
        error: 'Student is already assigned to this section'
      });
    }

    // Add student to section
    const updatedStudents = [...assignedStudents, studentId];
    
    await db.ref(`sections/${id}`).update({
      assignedStudents: updatedStudents,
      updatedAt: admin.database.ServerValue.TIMESTAMP
    });

    res.json({
      success: true,
      data: {
        ...section,
        assignedStudents: updatedStudents
      },
      message: 'Student added to section successfully'
    });

  } catch (error) {
    console.error('Error adding student to section:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add student to section: ' + error.message
    });
  }
};

// Remove student from section
const removeStudentFromSection = async (req, res) => {
  try {
    const { id, studentId } = req.params;

    // Check if section exists
    const snapshot = await db.ref(`sections/${id}`).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Section not found'
      });
    }

    const section = snapshot.val();
    const assignedStudents = section.assignedStudents || [];

    // Check if student is assigned
    if (!assignedStudents.includes(studentId)) {
      return res.status(400).json({
        success: false,
        error: 'Student is not assigned to this section'
      });
    }

    // Remove student from section
    const updatedStudents = assignedStudents.filter(id => id !== studentId);
    
    await db.ref(`sections/${id}`).update({
      assignedStudents: updatedStudents,
      updatedAt: admin.database.ServerValue.TIMESTAMP
    });

    res.json({
      success: true,
      data: {
        ...section,
        assignedStudents: updatedStudents
      },
      message: 'Student removed from section successfully'
    });

  } catch (error) {
    console.error('Error removing student from section:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove student from section: ' + error.message
    });
  }
};

// Get sections by grade
const getSectionsByGrade = async (req, res) => {
  try {
    const { grade } = req.params;

    const snapshot = await db.ref('sections').orderByChild('grade').equalTo(grade).once('value');
    const sections = [];

    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        sections.push(childSnapshot.val());
      });
    }

    res.json({
      success: true,
      data: sections,
      count: sections.length
    });

  } catch (error) {
    console.error('Error fetching sections by grade:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sections by grade: ' + error.message
    });
  }
};

module.exports = {
  createSection,
  getAllSections,
  getSectionById,
  updateSection,
  deleteSection,
  addStudentToSection,
  removeStudentFromSection,
  getSectionsByGrade
};
