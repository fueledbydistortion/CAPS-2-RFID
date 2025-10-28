const { db } = require("../config/firebase-admin-config");
const { createNotificationInternal } = require("./notificationController");

// Get all assignments for a specific skill
const getAssignmentsBySkill = async (req, res) => {
	try {
		const { skillId } = req.params;

		const snapshot = await db
			.ref("assignments")
			.orderByChild("skillId")
			.equalTo(skillId)
			.once("value");
		const assignments = [];

		if (snapshot.exists()) {
			snapshot.forEach((childSnapshot) => {
				assignments.push({
					id: childSnapshot.key,
					...childSnapshot.val(),
				});
			});
		}

		res.json({
			success: true,
			data: assignments,
		});
	} catch (error) {
		console.error("Error getting assignments by skill:", error);
		res.status(500).json({
			success: false,
			error: "Failed to get assignments",
		});
	}
};

// Get a specific assignment by ID
const getAssignmentById = async (req, res) => {
	try {
		const { assignmentId } = req.params;

		const snapshot = await db.ref(`assignments/${assignmentId}`).once("value");

		if (!snapshot.exists()) {
			return res.status(404).json({
				success: false,
				error: "Assignment not found",
			});
		}

		res.json({
			success: true,
			data: {
				id: assignmentId,
				...snapshot.val(),
			},
		});
	} catch (error) {
		console.error("Error getting assignment by ID:", error);
		res.status(500).json({
			success: false,
			error: "Failed to get assignment",
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

		const newAssignmentRef = db.ref("assignments").push();
		await newAssignmentRef.set(assignmentData);

		// Notify parents in ALL sections assigned to the skill about the new assignment
		try {
			if (assignmentData.skillId) {
				// Get all sections assigned to this skill
				const skillSnapshot = await db
					.ref(`skills/${assignmentData.skillId}`)
					.once("value");
				if (skillSnapshot.exists()) {
					const skill = skillSnapshot.val();
					const assignedSections = skill.assignedSections || [];

					if (assignedSections.length > 0) {
						const dueDate = assignmentData.dueDate
							? new Date(assignmentData.dueDate).toLocaleDateString()
							: "No due date";

						// Notify parents in all sections assigned to this skill
						for (const sectionId of assignedSections) {
							const sectionSnapshot = await db
								.ref(`sections/${sectionId}`)
								.once("value");
							if (sectionSnapshot.exists()) {
								const section = sectionSnapshot.val();
								const parents = section.assignedStudents || [];

								// Create notification for each parent in the section
								for (const parentId of parents) {
									await createNotificationInternal({
										recipientId: parentId,
										recipientRole: "parent",
										type: "assignment",
										title: "📝 New Assignment Posted",
										message: `${assignmentData.title} - Due: ${dueDate} (Section: ${section.name})`,
										priority: "normal",
										actionUrl: "/dashboard/parent-content",
										metadata: {
											assignmentId: newAssignmentRef.key,
											sectionId: sectionId,
											skillId: assignmentData.skillId,
											skillName: skill.name,
											sectionName: section.name,
										},
										createdBy: req.user?.uid || "system",
									});
								}
							}
						}
					}
				}
			} else if (assignmentData.sectionId) {
				// Fallback: if no skillId but sectionId is provided, use the old logic
				const sectionSnapshot = await db
					.ref(`sections/${assignmentData.sectionId}`)
					.once("value");
				if (sectionSnapshot.exists()) {
					const section = sectionSnapshot.val();
					const parents = section.assignedStudents || [];

					if (parents.length > 0) {
						const dueDate = assignmentData.dueDate
							? new Date(assignmentData.dueDate).toLocaleDateString()
							: "No due date";

						// Create notification for each parent
						for (const parentId of parents) {
							await createNotificationInternal({
								recipientId: parentId,
								recipientRole: "parent",
								type: "assignment",
								title: "📝 New Assignment Posted",
								message: `${assignmentData.title} - Due: ${dueDate}`,
								priority: "normal",
								actionUrl: "/dashboard/parent-content",
								metadata: {
									assignmentId: newAssignmentRef.key,
									sectionId: assignmentData.sectionId,
									skillId: assignmentData.skillId,
								},
								createdBy: req.user?.uid || "system",
							});
						}
					}
				}
			}
		} catch (notifError) {
			console.error("Error creating assignment notifications:", notifError);
			// Don't fail the request if notification fails
		}

		res.status(201).json({
			success: true,
			data: {
				id: newAssignmentRef.key,
				...assignmentData,
			},
		});
	} catch (error) {
		console.error("Error creating assignment:", error);
		res.status(500).json({
			success: false,
			error: "Failed to create assignment",
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
		const updatedSnapshot = await assignmentRef.once("value");

		res.json({
			success: true,
			data: {
				id: assignmentId,
				...updatedSnapshot.val(),
			},
		});
	} catch (error) {
		console.error("Error updating assignment:", error);
		res.status(500).json({
			success: false,
			error: "Failed to update assignment",
		});
	}
};

// Delete an assignment
const deleteAssignment = async (req, res) => {
	try {
		const { assignmentId } = req.params;

		const assignmentRef = db.ref(`assignments/${assignmentId}`);
		const snapshot = await assignmentRef.once("value");

		if (!snapshot.exists()) {
			return res.status(404).json({
				success: false,
				error: "Assignment not found",
			});
		}

		await assignmentRef.remove();

		res.json({
			success: true,
			message: "Assignment deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting assignment:", error);
		res.status(500).json({
			success: false,
			error: "Failed to delete assignment",
		});
	}
};

// Search assignments (client-side filtering for now)
const searchAssignments = async (req, res) => {
	try {
		const { skillId } = req.params;
		const { searchTerm } = req.query;

		const snapshot = await db
			.ref("assignments")
			.orderByChild("skillId")
			.equalTo(skillId)
			.once("value");

		let assignments = [];
		if (snapshot.exists()) {
			snapshot.forEach((childSnapshot) => {
				assignments.push({
					id: childSnapshot.key,
					...childSnapshot.val(),
				});
			});
		}

		// Client-side filtering
		if (searchTerm) {
			const searchLower = searchTerm.toLowerCase();
			assignments = assignments.filter(
				(assignment) =>
					assignment.title?.toLowerCase().includes(searchLower) ||
					assignment.description?.toLowerCase().includes(searchLower) ||
					assignment.instructions?.toLowerCase().includes(searchLower)
			);
		}

		res.json({
			success: true,
			data: assignments,
		});
	} catch (error) {
		console.error("Error searching assignments:", error);
		res.status(500).json({
			success: false,
			error: "Failed to search assignments",
		});
	}
};

// Get assignments by type
const getAssignmentsByType = async (req, res) => {
	try {
		const { skillId, type } = req.params;

		const snapshot = await db
			.ref("assignments")
			.orderByChild("skillId")
			.equalTo(skillId)
			.once("value");

		const assignments = [];
		if (snapshot.exists()) {
			snapshot.forEach((childSnapshot) => {
				const assignment = {
					id: childSnapshot.key,
					...childSnapshot.val(),
				};

				// Filter by type
				if (assignment.type === type) {
					assignments.push(assignment);
				}
			});
		}

		res.json({
			success: true,
			data: assignments,
		});
	} catch (error) {
		console.error("Error getting assignments by type:", error);
		res.status(500).json({
			success: false,
			error: "Failed to get assignments by type",
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

		const snapshot = await db
			.ref("assignments")
			.orderByChild("skillId")
			.equalTo(skillId)
			.once("value");

		const assignments = [];
		if (snapshot.exists()) {
			snapshot.forEach((childSnapshot) => {
				const assignment = {
					id: childSnapshot.key,
					...childSnapshot.val(),
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
			data: assignments,
		});
	} catch (error) {
		console.error("Error getting assignments due soon:", error);
		res.status(500).json({
			success: false,
			error: "Failed to get assignments due soon",
		});
	}
};

// Submit assignment (for parents/students)
const submitAssignment = async (req, res) => {
	try {
		const { assignmentId, submissionText, attachments, submittedAt } = req.body;
		const studentId = req.user?.uid; // Assuming user ID is available from auth middleware

		console.log("🔍 submitAssignment called with:", {
			assignmentId,
			studentId,
			hasSubmissionText: !!submissionText,
			submissionTextLength: submissionText?.length || 0,
			attachmentsReceived: attachments,
			attachmentsType: typeof attachments,
			attachmentsIsArray: Array.isArray(attachments),
			attachmentsCount: Array.isArray(attachments) ? attachments.length : 0,
		});

		if (!assignmentId) {
			return res.status(400).json({
				success: false,
				error: "Assignment ID is required",
			});
		}

		if (!studentId) {
			return res.status(401).json({
				success: false,
				error: "User authentication required",
			});
		}

		// Check if assignment exists
		const assignmentSnapshot = await db
			.ref(`assignments/${assignmentId}`)
			.once("value");
		if (!assignmentSnapshot.exists()) {
			return res.status(404).json({
				success: false,
				error: "Assignment not found",
			});
		}

		const assignment = assignmentSnapshot.val();

		// Ensure attachments is an array
		const cleanAttachments = Array.isArray(attachments) ? attachments : [];

		// Create submission data
		const submissionData = {
			assignmentId,
			studentId,
			submissionText: submissionText || "",
			attachments: cleanAttachments,
			submittedAt: submittedAt || new Date().toISOString(),
			status: "submitted",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		console.log("🔍 Creating submission with data:", {
			assignmentId,
			studentId,
			attachmentCount: cleanAttachments.length,
			hasText: !!(submissionText || "").trim(),
			submissionData: submissionData,
		});

		// Save submission
		const submissionRef = db.ref("assignmentSubmissions").push();
		await submissionRef.set(submissionData);

		console.log("✅ Submission saved with ID:", submissionRef.key);
		console.log(
			"✅ Full submission data saved:",
			JSON.stringify(submissionData, null, 2)
		);

		// Verify the submission was saved by reading it back
		const verifySnapshot = await submissionRef.once("value");
		console.log("✅ Verified submission exists:", verifySnapshot.exists());
		const verifiedData = verifySnapshot.val();
		console.log(
			"✅ Verified submission data:",
			JSON.stringify(verifiedData, null, 2)
		);
		console.log("✅ Verified attachments:", verifiedData?.attachments); // Update progress tracking
		await updateProgressForAssignmentSubmission(
			studentId,
			assignmentId,
			assignment
		);

		// Notify teacher about the submission
		try {
			const studentSnapshot = await db.ref(`users/${studentId}`).once("value");
			if (studentSnapshot.exists() && assignment.createdBy) {
				const student = studentSnapshot.val();
				const studentName =
					student.childName || `${student.firstName} ${student.lastName}`;

				await createNotificationInternal({
					recipientId: assignment.createdBy,
					recipientRole: "teacher",
					type: "assignment",
					title: "📬 New Assignment Submission",
					message: `${studentName} submitted: ${assignment.title}`,
					priority: "normal",
					actionUrl: "/dashboard/skills",
					metadata: {
						assignmentId,
						submissionId: submissionRef.key,
						studentId,
					},
					createdBy: req.user?.uid || "system",
				});
			}
		} catch (notifError) {
			console.error("Error creating submission notification:", notifError);
			// Don't fail the request if notification fails
		}

		res.status(201).json({
			success: true,
			data: {
				id: submissionRef.key,
				...submissionData,
			},
			message: "Assignment submitted successfully",
		});
	} catch (error) {
		console.error("Error submitting assignment:", error);
		res.status(500).json({
			success: false,
			error: "Failed to submit assignment: " + error.message,
		});
	}
};

// Get assignment submissions (for teachers)
const getAssignmentSubmissions = async (req, res) => {
	try {
		const { assignmentId } = req.params;

		const submissionsSnapshot = await db
			.ref("assignmentSubmissions")
			.orderByChild("assignmentId")
			.equalTo(assignmentId)
			.once("value");

		const submissions = [];
		if (submissionsSnapshot.exists()) {
			// Get all submissions first
			const submissionPromises = [];
			submissionsSnapshot.forEach((childSnapshot) => {
				const submission = {
					id: childSnapshot.key,
					...childSnapshot.val(),
				};
				submissions.push(submission);

				// Get child information for each submission
				// The studentId is actually the parent's UID, so we need to find the child's info
				submissionPromises.push(
					db
						.ref(`users/${submission.studentId}`)
						.once("value")
						.then(async (parentSnapshot) => {
							if (parentSnapshot.exists()) {
								const parent = parentSnapshot.val();
								console.log("Parent data for child name lookup:", {
									parentId: submission.studentId,
									hasChildName: !!parent.childName,
									hasChildren: !!parent.children,
									childrenCount: parent.children ? parent.children.length : 0,
								});

								// Look for child information in the parent's profile
								let childName = "Unknown Child";

								// Check if parent has childName field
								if (parent.childName) {
									childName = parent.childName;
								} else if (parent.children && parent.children.length > 0) {
									// If parent has children array, get the first child's name
									childName =
										parent.children[0].name ||
										parent.children[0].firstName +
											" " +
											parent.children[0].lastName;
								} else {
									// Fallback to parent's name if no child info is available
									childName = `${parent.firstName} ${parent.lastName}`;
								}

								console.log("Resolved child name:", childName);

								return {
									submissionId: submission.id,
									childName: childName,
									parentEmail: parent.email,
								};
							}
							return {
								submissionId: submission.id,
								childName: "Unknown Child",
								parentEmail: "Unknown",
							};
						})
				);
			});

			// Wait for all parent information to be fetched
			const parentInfo = await Promise.all(submissionPromises);

			// Merge parent information with submissions
			submissions.forEach((submission) => {
				const info = parentInfo.find((p) => p.submissionId === submission.id);
				if (info) {
					submission.childName = info.childName;
					submission.parentEmail = info.parentEmail;
				}
			});
		}

		res.json({
			success: true,
			data: submissions,
		});
	} catch (error) {
		console.error("Error getting assignment submissions:", error);
		res.status(500).json({
			success: false,
			error: "Failed to get assignment submissions",
		});
	}
};

// Grade assignment submission (for teachers)
const gradeAssignmentSubmission = async (req, res) => {
	try {
		const { submissionId } = req.params;
		const { grade, feedback, status } = req.body;

		if (
			grade === undefined ||
			grade === null ||
			(typeof grade === "string" && grade.trim() === "")
		) {
			return res.status(400).json({
				success: false,
				error: "Grade is required",
			});
		}

		const submissionRef = db.ref(`assignmentSubmissions/${submissionId}`);
		const submissionSnapshot = await submissionRef.once("value");

		if (!submissionSnapshot.exists()) {
			return res.status(404).json({
				success: false,
				error: "Submission not found",
			});
		}

		const submission = submissionSnapshot.val();

		// Handle both letter grades and numeric grades
		let gradeValue = grade;
		let numericGrade = null;

		// If it's a letter grade, convert to numeric for progress tracking
		if (typeof grade === "string") {
			const trimmedGrade = grade.trim();
			const parsed = parseFloat(trimmedGrade);
			if (!Number.isNaN(parsed)) {
				gradeValue = parsed;
				numericGrade = parsed;
			} else {
				// Letter grade - keep as string, but calculate numeric equivalent
				const gradeMap = {
					"A+": 98,
					A: 95,
					"A-": 92,
					"B+": 88,
					B: 85,
					"B-": 82,
					"C+": 78,
					C: 75,
					"C-": 72,
					"D+": 68,
					D: 65,
					"D-": 62,
					E: 55,
					F: 50,
				};
				const upperGrade = trimmedGrade.toUpperCase();
				numericGrade = gradeMap[upperGrade];

				// If grade not found in map, reject it
				if (numericGrade === undefined) {
					return res.status(400).json({
						success: false,
						error: `Invalid letter grade: ${upperGrade}. Valid grades are: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, E, F`,
					});
				}

				gradeValue = upperGrade;
			}
		} else {
			// Numeric grade from number type
			gradeValue = Number(grade);
			numericGrade = Number(grade);
		}

		if (
			typeof gradeValue === "number" &&
			(Number.isNaN(gradeValue) || !Number.isFinite(gradeValue))
		) {
			return res.status(400).json({
				success: false,
				error: "Grade must be a valid number or letter grade",
			});
		}

		// Update submission with grade
		const updateData = {
			grade: gradeValue, // Keep original grade (letter or number)
			feedback: feedback || "",
			status: "graded", // Always set to graded when grading
			gradedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await submissionRef.update(updateData);

		console.log(
			`Updated submission ${submissionId} with status: graded, grade: ${gradeValue}`
		);

		// Update progress tracking using numeric grade
		if (numericGrade !== null) {
			await updateProgressForAssignmentGrade(
				submission.studentId,
				submission.assignmentId,
				numericGrade
			);
		}

		// Notify student about the grade
		try {
			const assignmentSnapshot = await db
				.ref(`assignments/${submission.assignmentId}`)
				.once("value");
			if (assignmentSnapshot.exists()) {
				const assignment = assignmentSnapshot.val();
				const displayGrade =
					typeof gradeValue === "number" ? gradeValue.toFixed(0) : gradeValue;
				const gradeEmoji =
					(numericGrade || 0) >= 80
						? "🌟"
						: (numericGrade || 0) >= 70
						? "👍"
						: "📝";

				await createNotificationInternal({
					recipientId: submission.studentId,
					recipientRole: "parent",
					type: "assignment",
					title: `${gradeEmoji} Assignment Graded`,
					message: `${assignment.title} - Grade: ${displayGrade}${
						feedback ? ` - ${feedback.substring(0, 50)}...` : ""
					}`,
					priority: "normal",
					actionUrl: "/dashboard/parent-content",
					metadata: {
						assignmentId: submission.assignmentId,
						submissionId,
						grade: gradeValue,
					},
					createdBy: req.user?.uid || "system",
				});
			}
		} catch (notifError) {
			console.error("Error creating grading notification:", notifError);
			// Don't fail the request if notification fails
		}

		res.json({
			success: true,
			data: {
				id: submissionId,
				...submission,
				...updateData,
			},
			message: "Assignment graded successfully",
		});
	} catch (error) {
		console.error("Error grading assignment submission:", error);
		res.status(500).json({
			success: false,
			error: "Failed to grade assignment: " + error.message,
		});
	}
};

// Get student's assignment submissions
const getStudentSubmissions = async (req, res) => {
	try {
		const { studentId } = req.params;

		const submissionsSnapshot = await db
			.ref("assignmentSubmissions")
			.orderByChild("studentId")
			.equalTo(studentId)
			.once("value");

		const submissions = [];
		if (submissionsSnapshot.exists()) {
			submissionsSnapshot.forEach((childSnapshot) => {
				submissions.push({
					id: childSnapshot.key,
					...childSnapshot.val(),
				});
			});
		}

		res.json({
			success: true,
			data: submissions,
		});
	} catch (error) {
		console.error("Error getting student submissions:", error);
		res.status(500).json({
			success: false,
			error: "Failed to get student submissions",
		});
	}
};

// Helper function to update progress when assignment is submitted
const updateProgressForAssignmentSubmission = async (
	studentId,
	assignmentId,
	assignment
) => {
	try {
		// Get the skill ID from the assignment
		const skillId = assignment.skillId;
		if (!skillId) return;

		// Update progress for the skill
		const progressRef = db.ref(`progress/${studentId}/${assignmentId}`);
		const progressSnapshot = await progressRef.once("value");

		const currentProgress = progressSnapshot.exists()
			? progressSnapshot.val()
			: {
					userId: studentId,
					lessonId: assignmentId,
					percentage: 0,
					status: "not_started",
					createdAt: new Date().toISOString(),
			  };

		// Update progress to indicate assignment submitted
		await progressRef.update({
			percentage: 50, // Half progress for submission
			status: "in_progress",
			lastAccessed: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			assignmentSubmitted: true,
			submittedAt: new Date().toISOString(),
		});

		console.log(
			`Updated progress for student ${studentId}, assignment ${assignmentId}: submitted`
		);
	} catch (error) {
		console.error("Error updating progress for assignment submission:", error);
	}
};

// Helper function to update progress when assignment is graded
const updateProgressForAssignmentGrade = async (
	studentId,
	assignmentId,
	grade
) => {
	try {
		// Validate grade is a valid number
		if (!Number.isFinite(grade)) {
			console.error(`Invalid grade value for progress update: ${grade}`);
			return;
		}

		const progressRef = db.ref(`progress/${studentId}/${assignmentId}`);
		const progressSnapshot = await progressRef.once("value");

		if (!progressSnapshot.exists()) return;

		// Calculate percentage based on grade (assuming grade is out of 100)
		const percentage = Math.min(100, Math.max(0, grade));
		const status =
			percentage >= 100
				? "completed"
				: percentage >= 70
				? "in_progress"
				: "in_progress";

		await progressRef.update({
			percentage,
			status,
			lastAccessed: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			assignmentGraded: true,
			grade,
			gradedAt: new Date().toISOString(),
		});

		console.log(
			`Updated progress for student ${studentId}, assignment ${assignmentId}: graded with ${grade}`
		);
	} catch (error) {
		console.error("Error updating progress for assignment grade:", error);
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
};
