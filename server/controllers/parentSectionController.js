const { db } = require("../config/firebase-admin-config");

// Normalize attachments coming from Firebase so the frontend always
// receives a predictable array structure.
const normalizeAttachments = (attachments, lessonId) => {
	if (!attachments) return [];

	let items = [];
	if (Array.isArray(attachments)) {
		items = attachments;
	} else if (typeof attachments === "object") {
		items = Object.values(attachments);
	} else {
		return [];
	}

	return items.filter(Boolean).map((attachment, index) => {
		const name =
			attachment.name || attachment.originalName || `Attachment ${index + 1}`;
		const id =
			attachment.id ||
			attachment.attachmentId ||
			attachment.filename ||
			`${lessonId || "lesson"}_attachment_${index}`;

		return {
			...attachment,
			id,
			name,
		};
	});
};

const getSubmissionTimestamp = (submission) => {
	if (!submission) return 0;
	const timestamp =
		submission.gradedAt ||
		submission.updatedAt ||
		submission.submittedAt ||
		submission.createdAt;
	return timestamp ? new Date(timestamp).getTime() : 0;
};

// Get modules and assignments for a parent's section
const getParentSectionContent = async (req, res) => {
	try {
		const { parentId } = req.params;

		if (!parentId) {
			return res.status(400).json({
				success: false,
				error: "Parent ID is required",
			});
		}

		// Get parent information
		const parentSnapshot = await db.ref(`users/${parentId}`).once("value");
		if (!parentSnapshot.exists()) {
			return res.status(404).json({
				success: false,
				error: "Parent not found",
			});
		}

		const parent = parentSnapshot.val();
		if (parent.role !== "parent") {
			return res.status(403).json({
				success: false,
				error: "User is not a parent",
			});
		}

		// Find sections where this parent's child is assigned
		// In this system, the parent's child is represented by the parent's uid in assignedStudents
		const sectionsSnapshot = await db.ref("sections").once("value");
		const sections = [];

		if (sectionsSnapshot.exists()) {
			sectionsSnapshot.forEach((childSnapshot) => {
				const section = childSnapshot.val();
				if (
					section.assignedStudents &&
					section.assignedStudents.includes(parentId)
				) {
					sections.push({ id: childSnapshot.key, ...section });
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
					skills: [],
				},
				message: "No sections found for this parent",
			});
		}

		// Preload skills so we only read them once
		const skillsSnapshot = await db.ref("skills").once("value");
		const skillMap = new Map();

		if (skillsSnapshot.exists()) {
			skillsSnapshot.forEach((skillChildSnapshot) => {
				skillMap.set(skillChildSnapshot.key, {
					id: skillChildSnapshot.key,
					...skillChildSnapshot.val(),
				});
			});
		}

		const aggregatedSkills = new Map();
		const moduleMap = new Map();
		const assignmentMap = new Map();

		for (const section of sections) {
			const sectionSkills = Array.from(skillMap.values()).filter(
				(skill) =>
					skill.assignedSections && skill.assignedSections.includes(section.id)
			);

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

		if (uniqueAssignments.length > 0) {
			try {
				const submissionsByAssignment = new Map();
				const submissionsSnapshot = await db
					.ref("assignmentSubmissions")
					.orderByChild("studentId")
					.equalTo(parentId)
					.once("value");

				if (submissionsSnapshot.exists()) {
					submissionsSnapshot.forEach((childSnapshot) => {
						const submission = {
							id: childSnapshot.key,
							...childSnapshot.val(),
						};

						if (!submission.assignmentId) {
							return;
						}

						const normalizedSubmission = {
							...submission,
							attachments: normalizeAttachments(
								submission.attachments,
								`${submission.assignmentId}_${submission.id || "submission"}`
							),
						};

						if (!submissionsByAssignment.has(submission.assignmentId)) {
							submissionsByAssignment.set(submission.assignmentId, []);
						}

						submissionsByAssignment
							.get(submission.assignmentId)
							.push(normalizedSubmission);
					});

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
};

// Get specific section content for a parent
const getParentSectionById = async (req, res) => {
	try {
		const { parentId, sectionId } = req.params;

		if (!parentId || !sectionId) {
			return res.status(400).json({
				success: false,
				error: "Parent ID and Section ID are required",
			});
		}

		// Verify parent exists and is a parent
		const parentSnapshot = await db.ref(`users/${parentId}`).once("value");
		if (!parentSnapshot.exists()) {
			return res.status(404).json({
				success: false,
				error: "Parent not found",
			});
		}

		const parent = parentSnapshot.val();
		if (parent.role !== "parent") {
			return res.status(403).json({
				success: false,
				error: "User is not a parent",
			});
		}

		// Get section details
		const sectionSnapshot = await db.ref(`sections/${sectionId}`).once("value");
		if (!sectionSnapshot.exists()) {
			return res.status(404).json({
				success: false,
				error: "Section not found",
			});
		}

		const sectionData = sectionSnapshot.val();
		const section = { id: sectionId, ...sectionData };

		// Verify parent's child is assigned to this section
		if (
			!section.assignedStudents ||
			!section.assignedStudents.includes(parentId)
		) {
			return res.status(403).json({
				success: false,
				error: "Parent is not assigned to this section",
			});
		}

		// Get skills assigned to this section
		const skillsSnapshot = await db.ref("skills").once("value");
		const sectionSkills = [];

		if (skillsSnapshot.exists()) {
			skillsSnapshot.forEach((skillChildSnapshot) => {
				const skill = skillChildSnapshot.val();
				if (
					skill.assignedSections &&
					skill.assignedSections.includes(sectionId)
				) {
					sectionSkills.push({
						id: skillChildSnapshot.key,
						...skill,
					});
				}
			});
		}

		// Get modules and assignments for these skills
		const modules = [];
		const assignments = [];

		for (const skill of sectionSkills) {
			// Get modules (lessons) for this skill
			const lessonsSnapshot = await db
				.ref("lessons")
				.orderByChild("skillId")
				.equalTo(skill.id)
				.once("value");
			if (lessonsSnapshot.exists()) {
				lessonsSnapshot.forEach((lessonChildSnapshot) => {
					const lesson = lessonChildSnapshot.val();
					const lessonId = lessonChildSnapshot.key;
					modules.push({
						...lesson,
						id: lessonId,
						sectionId: sectionId,
						skillId: skill.id,
						attachments: normalizeAttachments(lesson.attachments, lessonId),
						skillName: skill.name,
						sectionName: section.name,
						sectionGrade: section.grade,
					});
				});
			}

			// Get assignments for this skill
			const assignmentsSnapshot = await db
				.ref("assignments")
				.orderByChild("skillId")
				.equalTo(skill.id)
				.once("value");
			if (assignmentsSnapshot.exists()) {
				assignmentsSnapshot.forEach((assignmentChildSnapshot) => {
					const assignment = assignmentChildSnapshot.val();
					assignments.push({
						...assignment,
						id: assignmentChildSnapshot.key,
						sectionId: sectionId,
						skillId: skill.id,
						skillName: skill.name,
						sectionName: section.name,
						sectionGrade: section.grade,
						attachments: normalizeAttachments(
							assignment.attachments,
							assignmentChildSnapshot.key
						),
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
				skills: sectionSkills,
			},
			message: "Section content retrieved successfully",
		});
	} catch (error) {
		console.error("Error fetching section content:", error);
		res.status(500).json({
			success: false,
			error: "Failed to fetch section content: " + error.message,
		});
	}
};

module.exports = {
	getParentSectionContent,
	getParentSectionById,
};
