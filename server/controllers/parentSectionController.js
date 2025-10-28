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

<<<<<<< HEAD
  } catch (error) {
    console.error('Error fetching parent section content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch parent section content: ' + error.message
    });
  }
=======
			sectionSkills.forEach((skill) => {
				if (!aggregatedSkills.has(skill.id)) {
					aggregatedSkills.set(skill.id, skill);
				}
			});

			for (const skill of sectionSkills) {
				const lessonsSnapshot = await db
					.ref("lessons")
					.orderByChild("skillId")
					.equalTo(skill.id)
					.once("value");
				if (lessonsSnapshot.exists()) {
					lessonsSnapshot.forEach((lessonChildSnapshot) => {
						const lesson = lessonChildSnapshot.val();
						const lessonId = lessonChildSnapshot.key;
						const key = `${lessonId}_${section.id}`;
						moduleMap.set(key, {
							...lesson,
							id: lessonId,
							sectionId: section.id,
							skillId: skill.id,
							attachments: normalizeAttachments(lesson.attachments, lessonId),
							skillName: skill.name,
							sectionName: section.name,
							sectionGrade: section.grade,
						});
					});
				}

				const assignmentsSnapshot = await db
					.ref("assignments")
					.orderByChild("skillId")
					.equalTo(skill.id)
					.once("value");
				if (assignmentsSnapshot.exists()) {
					assignmentsSnapshot.forEach((assignmentChildSnapshot) => {
						const assignment = assignmentChildSnapshot.val();
						const assignmentId = assignmentChildSnapshot.key;
						const key = `${assignmentId}_${section.id}`;
						assignmentMap.set(key, {
							...assignment,
							id: assignmentId,
							sectionId: section.id,
							skillId: skill.id,
							skillName: skill.name,
							sectionName: section.name,
							sectionGrade: section.grade,
							attachments: normalizeAttachments(
								assignment.attachments,
								assignmentId
							),
						});
					});
				}
			}
		}

		const uniqueSkills = Array.from(aggregatedSkills.values());
		const uniqueModules = Array.from(moduleMap.values());
		let uniqueAssignments = Array.from(assignmentMap.values());
		const targetAssignmentIds = new Set(
			uniqueAssignments.map((assignment) => assignment.id).filter(Boolean)
		);

		console.log(`Target assignment IDs: ${Array.from(targetAssignmentIds).join(', ')}`);

		if (uniqueAssignments.length > 0) {
			try {
				const submissionsByAssignment = new Map();
				const submissionsSnapshot = await db
					.ref("assignmentSubmissions")
					.once("value");

				registerSubmission = (
					rawSubmission,
					fallbackAssignmentId,
					fallbackId
				) => {
					if (!rawSubmission || typeof rawSubmission !== "object") return;
					const assignmentId =
						rawSubmission.assignmentId || fallbackAssignmentId || null;

					console.log(`Processing submission ${fallbackId} with assignmentId ${assignmentId}`);

					if (!assignmentId || !targetAssignmentIds.has(assignmentId)) {
						console.log(`AssignmentId ${assignmentId} not in target`);
						return;
					}

					const ownerCandidates = [
						rawSubmission.studentId,
						rawSubmission.parentId,
						rawSubmission.childId,
						rawSubmission.childUID,
						rawSubmission.childUid,
						rawSubmission.userId,
						rawSubmission.userID,
						rawSubmission.studentUID,
						rawSubmission.studentUid,
						rawSubmission.parentUid,
						rawSubmission.parentUID,
					];

					console.log(`Owner candidates: ${ownerCandidates.filter(Boolean).join(', ')}`);
					console.log(`Associated student IDs: ${Array.from(associatedStudentIds).join(', ')}`);

					const matchedOwner = ownerCandidates.some((candidate) => {
						if (!candidate) return false;
						const normalized = String(candidate).trim();
						return normalized && associatedStudentIds.has(normalized);
					});

					console.log(`Matched owner for submission ${submissionId}: ${matchedOwner}`);

					if (!matchedOwner) {
						return;
					}

					console.log(`Registering submission ${submissionId} for ${assignmentId}`);

					const submissionId = rawSubmission.id || fallbackId;
					const normalizedSubmission = {
						...rawSubmission,
						id: submissionId,
						assignmentId,
						attachments: normalizeAttachments(
							rawSubmission.attachments,
							`${assignmentId}_${submissionId || "submission"}`
						),
					};

					if (!submissionsByAssignment.has(assignmentId)) {
						submissionsByAssignment.set(assignmentId, []);
					}

					submissionsByAssignment.get(assignmentId).push(normalizedSubmission);
				};

				if (submissionsSnapshot.exists()) {
					submissionsSnapshot.forEach((childSnapshot) => {
						const raw = childSnapshot.val();

						// Detect nested structure: assignmentId -> submissions -> data
						const isLikelyNested =
							raw &&
							typeof raw === "object" &&
							!Array.isArray(raw) &&
							!raw.assignmentId &&
							Object.values(raw).some(
								(value) => value && typeof value === "object"
							);

						if (isLikelyNested) {
							Object.entries(raw).forEach(([nestedKey, nestedValue]) => {
								registerSubmission(
									{ id: nestedKey, ...nestedValue },
									childSnapshot.key,
									nestedKey
								);
							});
						} else {
							registerSubmission(
								{ id: childSnapshot.key, ...raw },
								raw?.assignmentId || childSnapshot.key,
								childSnapshot.key
							);
						}
					});

					const matchedCount = Array.from(
						submissionsByAssignment.values()
					).reduce((count, list) => count + list.length, 0);
					console.log(
						`[ParentSection] Matched ${matchedCount} submissions for parent ${parentId}`
					);

					submissionsByAssignment.forEach((submissions) => {
						submissions.sort(
							(a, b) => getSubmissionTimestamp(b) - getSubmissionTimestamp(a)
						);
					});
				}

				uniqueAssignments = uniqueAssignments.map((assignment) => {
					const submissions = submissionsByAssignment.get(assignment.id) || [];
					return {
						...assignment,
						attachments: normalizeAttachments(
							assignment.attachments,
							assignment.id
						),
						submissions,
						latestSubmission: submissions[0] || null,
					};
				});
			} catch (submissionError) {
				console.error(
					"Error attaching assignment submissions:",
					submissionError
				);
				uniqueAssignments = uniqueAssignments.map((assignment) => ({
					...assignment,
					attachments: normalizeAttachments(
						assignment.attachments,
						assignment.id
					),
					submissions: [],
					latestSubmission: null,
				}));
			}
		}

		res.json({
			success: true,
			data: {
				sections: sections,
				modules: uniqueModules,
				assignments: uniqueAssignments,
				skills: uniqueSkills,
			},
			message: "Parent section content retrieved successfully",
		});
	} catch (error) {
		console.error("Error fetching parent section content:", error);
		res.status(500).json({
			success: false,
			error: "Failed to fetch parent section content: " + error.message,
		});
	}
>>>>>>> parent of 7acd75d (ll)
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
