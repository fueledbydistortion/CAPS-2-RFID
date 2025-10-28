import React, { useState, useEffect } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Box,
	Typography,
	Alert,
	CircularProgress,
	IconButton,
	Chip,
	Divider,
	Card,
	CardContent,
	CardHeader,
	Tabs,
	Tab,
	List,
	ListItem,
	ListItemText,
	ListItemIcon,
	ListItemSecondaryAction,
} from "@mui/material";
import {
	Assignment,
	Close,
	CalendarToday,
	Grade,
	School,
	Person,
	AttachFile,
	CloudUpload,
	CheckCircle,
	Warning,
	AccessTime,
	FilePresent,
} from "@mui/icons-material";
import AssignmentSubmissionDialog from "./AssignmentSubmissionDialog";
import { formatLetterGrade } from "../utils/gradeUtils";

const AssignmentDetailDialog = ({
	open,
	onClose,
	assignment,
	onSubmissionSuccess,
}) => {
	const [activeTab, setActiveTab] = useState(0);
	const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);

	useEffect(() => {
		if (open) {
			setActiveTab(0);
		}
	}, [open]);

	const handleTabChange = (event, newValue) => {
		setActiveTab(newValue);
	};

	const handleSubmissionSuccess = (submissionData) => {
		setSubmissionDialogOpen(false);
		if (onSubmissionSuccess) {
			onSubmissionSuccess(submissionData);
		}
	};

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getAssignmentStatus = (dueDate) => {
		const now = new Date();
		const due = new Date(dueDate);
		const diffTime = due - now;
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays < 0) {
			return {
				status: "overdue",
				color: "error",
				text: "Overdue",
				icon: <Warning />,
			};
		} else if (diffDays <= 3) {
			return {
				status: "urgent",
				color: "warning",
				text: "Due Soon",
				icon: <AccessTime />,
			};
		} else if (diffDays <= 7) {
			return {
				status: "upcoming",
				color: "info",
				text: "Upcoming",
				icon: <CalendarToday />,
			};
		} else {
			return {
				status: "normal",
				color: "success",
				text: "On Track",
				icon: <CheckCircle />,
			};
		}
	};

	const getSubmissionTimestamp = (submission) => {
		if (!submission) {
			return 0;
		}

		const timestamp =
			submission?.gradedAt ||
			submission?.updatedAt ||
			submission?.submittedAt ||
			submission?.createdAt;

		return timestamp ? new Date(timestamp).getTime() : 0;
	};

	const normalizeAttachmentList = (
		attachments,
		fallbackPrefix = "attachment"
	) => {
		if (!attachments) {
			return [];
		}

		if (Array.isArray(attachments)) {
			return attachments.filter(Boolean).map((attachment, index) => ({
				...attachment,
				id:
					attachment?.id ||
					attachment?.attachmentId ||
					attachment?.filename ||
					`${fallbackPrefix}_${index}`,
				name:
					attachment?.name ||
					attachment?.originalName ||
					attachment?.fileName ||
					`Attachment ${index + 1}`,
			}));
		}

		if (typeof attachments === "object") {
			return Object.entries(attachments)
				.map(([key, attachment], index) => {
					if (!attachment) {
						return null;
					}

					return {
						...attachment,
						id:
							attachment?.id ||
							attachment?.attachmentId ||
							attachment?.filename ||
							key ||
							`${fallbackPrefix}_${index}`,
						name:
							attachment?.name ||
							attachment?.originalName ||
							attachment?.fileName ||
							`Attachment ${index + 1}`,
					};
				})
				.filter(Boolean);
		}

		return [];
	};

	const resolveLatestSubmission = (assignment) => {
		if (!assignment) {
			return null;
		}

		let submission = null;

		if (assignment.latestSubmission) {
			submission = assignment.latestSubmission;
		} else if (
			Array.isArray(assignment.submissions) &&
			assignment.submissions.length > 0
		) {
			const submissions = [...assignment.submissions];
			submissions.sort(
				(a, b) => getSubmissionTimestamp(b) - getSubmissionTimestamp(a)
			);
			submission = submissions[0];
		}

		// Normalize attachments in the submission
		if (submission) {
			return {
				...submission,
				attachments: normalizeAttachmentList(
					submission.attachments,
					`submission_${assignment.id || "assignment"}_${
						submission.id || "latest"
					}`
				),
			};
		}

		return null;
	};

	const getSubmissionStatusMeta = (submission) => {
		if (!submission) {
			return {
				label: "Not Submitted",
				color: "default",
				icon: <Assignment fontSize="small" />,
			};
		}

		const status = (submission.status || "").toLowerCase();

		if (status === "graded" || submission.gradedAt) {
			return {
				label: "Graded",
				color: "success",
				icon: <CheckCircle fontSize="small" />,
			};
		}

		if (status === "needs_revision") {
			return {
				label: "Needs Revision",
				color: "warning",
				icon: <Warning fontSize="small" />,
			};
		}

		if (status === "incomplete") {
			return {
				label: "Incomplete",
				color: "error",
				icon: <Warning fontSize="small" />,
			};
		}

		return {
			label: "Submitted",
			color: "info",
			icon: <AccessTime fontSize="small" />,
		};
	};

	const formatGradeValue = (gradeValue) => {
		if (gradeValue === undefined || gradeValue === null || gradeValue === "") {
			return null;
		}

		const formatted = formatLetterGrade(gradeValue, {
			separator: " - ",
		});

		return formatted || `${gradeValue}`;
	};

	const formatTimestamp = (timestamp) => {
		if (!timestamp) {
			return null;
		}

		const date = new Date(timestamp);
		if (Number.isNaN(date.getTime())) {
			return null;
		}

		return date.toLocaleString();
	};

	if (!assignment) return null;

	const status = getAssignmentStatus(assignment.dueDate);
	const latestSubmission = resolveLatestSubmission(assignment);
	const hasSubmission = Boolean(latestSubmission);
	const submittedAt =
		latestSubmission?.submittedAt || latestSubmission?.createdAt || null;
	const updatedAtRaw = latestSubmission?.updatedAt || null;
	const gradedAt = latestSubmission?.gradedAt || null;
	const submissionStatusMeta = getSubmissionStatusMeta(latestSubmission);
	const isGraded =
		hasSubmission &&
		((latestSubmission?.status || "").toLowerCase() === "graded" ||
			Boolean(gradedAt));
	const submissionGradeValue =
		latestSubmission?.grade ??
		latestSubmission?.score ??
		latestSubmission?.pointsEarned ??
		latestSubmission?.gradeValue ??
		null;
	const formattedGrade = formatGradeValue(submissionGradeValue);
	const updatedAt =
		updatedAtRaw && updatedAtRaw !== submittedAt ? updatedAtRaw : null;
	const formattedSubmittedAt = formatTimestamp(submittedAt);
	const formattedGradedAt = formatTimestamp(gradedAt);
	const formattedUpdatedAt = formatTimestamp(updatedAt);
	const submissionSubheader = formattedSubmittedAt
		? `Submitted ${formattedSubmittedAt}`
		: "Submission details";
	const submissionActionLabel = !hasSubmission
		? "Submit Assignment"
		: isGraded
		? "Submitted"
		: "Resubmit Assignment";
	const submissionActionIcon = isGraded ? <CheckCircle /> : <CloudUpload />;
	const isSubmissionDisabled = isGraded;

	const handleSubmitAssignment = () => {
		if (isSubmissionDisabled) {
			return;
		}

		setSubmissionDialogOpen(true);
	};

	return (
		<>
			<Dialog
				open={open}
				onClose={onClose}
				maxWidth="md"
				fullWidth
				PaperProps={{
					sx: {
						background: "rgba(255, 255, 255, 0.95)",
						backdropFilter: "blur(15px)",
						border: "2px solid rgba(31, 120, 80, 0.2)",
						borderRadius: "20px",
						boxShadow: "0 8px 32px rgba(31, 120, 80, 0.2)",
					},
				}}
			>
				<DialogTitle
					sx={{
						background:
							"linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
						backgroundClip: "text",
						WebkitBackgroundClip: "text",
						WebkitTextFillColor: "transparent",
						fontWeight: 700,
						fontSize: "1.5rem",
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center" }}>
						<Assignment sx={{ mr: 2, color: "hsl(152, 65%, 28%)" }} />
						Assignment Details
					</Box>
					<IconButton onClick={onClose} size="small">
						<Close />
					</IconButton>
				</DialogTitle>

				<DialogContent sx={{ p: 0 }}>
					{/* Assignment Header */}
					<Box sx={{ p: 4, pb: 2 }}>
						<Typography
							variant="h4"
							sx={{
								fontFamily: "Plus Jakarta Sans, sans-serif",
								fontWeight: 700,
								color: "hsl(152, 65%, 28%)",
								mb: 2,
							}}
						>
							{assignment.title}
						</Typography>

						{assignment.description && (
							<Typography
								variant="body1"
								sx={{
									mb: 3,
									fontFamily: "Plus Jakarta Sans, sans-serif",
									color: "text.secondary",
									lineHeight: 1.6,
								}}
							>
								{assignment.description}
							</Typography>
						)}

						{/* Assignment Info Cards */}
						<Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
							<Card
								sx={{
									flex: "1 1 200px",
									minWidth: "200px",
									background: "rgba(31, 120, 80, 0.05)",
									border: "1px solid rgba(31, 120, 80, 0.2)",
									borderRadius: "12px",
								}}
							>
								<CardContent sx={{ p: 2 }}>
									<Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
										<Grade
											sx={{ mr: 1, color: "hsl(152, 65%, 28%)", fontSize: 20 }}
										/>
										<Typography
											variant="subtitle2"
											sx={{ fontWeight: 600, color: "hsl(152, 65%, 28%)" }}
										>
											Points
										</Typography>
									</Box>
									<Typography
										variant="h6"
										sx={{
											fontFamily: "Plus Jakarta Sans, sans-serif",
											fontWeight: 700,
											color: "hsl(152, 65%, 28%)",
										}}
									>
										{assignment.points}
									</Typography>
								</CardContent>
							</Card>

							<Card
								sx={{
									flex: "1 1 200px",
									minWidth: "200px",
									background: "rgba(255, 152, 0, 0.05)",
									border: "1px solid rgba(255, 152, 0, 0.2)",
									borderRadius: "12px",
								}}
							>
								<CardContent sx={{ p: 2 }}>
									<Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
										<CalendarToday
											sx={{ mr: 1, color: "#ff9800", fontSize: 20 }}
										/>
										<Typography
											variant="subtitle2"
											sx={{ fontWeight: 600, color: "#ff9800" }}
										>
											Due Date
										</Typography>
									</Box>
									<Typography variant="body2" sx={{ fontWeight: 600 }}>
										{formatDate(assignment.dueDate)}
									</Typography>
								</CardContent>
							</Card>

							<Card
								sx={{
									flex: "1 1 200px",
									minWidth: "200px",
									background: "rgba(76, 175, 80, 0.05)",
									border: "1px solid rgba(76, 175, 80, 0.2)",
									borderRadius: "12px",
								}}
							>
								<CardContent sx={{ p: 2 }}>
									<Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
										<School sx={{ mr: 1, color: "#4caf50", fontSize: 20 }} />
										<Typography
											variant="subtitle2"
											sx={{ fontWeight: 600, color: "#4caf50" }}
										>
											Daycare Center
										</Typography>
									</Box>
									<Typography variant="body2" sx={{ fontWeight: 600 }}>
										{assignment.sectionName}
									</Typography>
									<Typography variant="caption" color="text.secondary">
										Grade {assignment.sectionGrade}
									</Typography>
								</CardContent>
							</Card>

							<Card
								sx={{
									flex: "1 1 200px",
									minWidth: "200px",
									background:
										status.color === "error"
											? "rgba(244, 67, 54, 0.05)"
											: status.color === "warning"
											? "rgba(255, 152, 0, 0.05)"
											: status.color === "info"
											? "rgba(31, 120, 80, 0.05)"
											: "rgba(76, 175, 80, 0.05)",
									border:
										status.color === "error"
											? "1px solid rgba(244, 67, 54, 0.2)"
											: status.color === "warning"
											? "1px solid rgba(255, 152, 0, 0.2)"
											: status.color === "info"
											? "1px solid rgba(31, 120, 80, 0.2)"
											: "1px solid rgba(76, 175, 80, 0.2)",
									borderRadius: "12px",
								}}
							>
								<CardContent sx={{ p: 2 }}>
									<Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
										{status.icon}
										<Typography
											variant="subtitle2"
											sx={{ fontWeight: 600, ml: 1 }}
										>
											Status
										</Typography>
									</Box>
									<Chip
										label={status.text}
										size="small"
										color={status.color}
										variant="filled"
										sx={{ fontWeight: 600 }}
									/>
								</CardContent>
							</Card>
						</Box>

						{/* Skill and Additional Info */}
						<Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
							<Chip
								label={assignment.skillName}
								color="primary"
								variant="outlined"
								sx={{ fontWeight: 600 }}
							/>
							{assignment.attachments && assignment.attachments.length > 0 && (
								<Chip
									label={`${assignment.attachments.length} Attachments`}
									color="secondary"
									variant="outlined"
									icon={<AttachFile />}
									sx={{ fontWeight: 600 }}
								/>
							)}
						</Box>

						{hasSubmission ? (
							<Card
								sx={{
									mb: 3,
									background: "rgba(31, 120, 80, 0.04)",
									border: "1px solid rgba(31, 120, 80, 0.2)",
									borderRadius: "12px",
								}}
							>
								<CardHeader
									avatar={<Person sx={{ color: "hsl(152, 65%, 28%)" }} />}
									title="Your Submission"
									subheader={submissionSubheader}
									titleTypographyProps={{ variant: "h6", fontWeight: 600 }}
									action={
										<Chip
											label={submissionStatusMeta.label}
											color={submissionStatusMeta.color}
											size="small"
											icon={submissionStatusMeta.icon}
											sx={{ fontWeight: 600 }}
										/>
									}
									sx={{ pb: 0 }}
								/>
								<CardContent sx={{ pt: 2 }}>
									{formattedGradedAt && (
										<Typography
											variant="caption"
											color="text.secondary"
											sx={{ display: "block", mb: 1 }}
										>
											Graded on {formattedGradedAt}
										</Typography>
									)}
									{formattedUpdatedAt && (
										<Typography
											variant="caption"
											color="text.secondary"
											sx={{ display: "block", mb: 1 }}
										>
											Last updated {formattedUpdatedAt}
										</Typography>
									)}
									{formattedGrade && (
										<Box
											sx={{
												display: "flex",
												alignItems: "center",
												gap: 2,
												mb: latestSubmission?.feedback ? 1 : 2,
											}}
										>
											<Grade sx={{ color: "hsl(152, 65%, 28%)" }} />
											<Typography
												variant="h6"
												sx={{
													fontFamily: "Plus Jakarta Sans, sans-serif",
													fontWeight: 700,
													color: "hsl(152, 65%, 28%)",
												}}
											>
												Grade: {formattedGrade}
											</Typography>
										</Box>
									)}
									{latestSubmission?.feedback && (
										<Typography
											variant="body2"
											color="text.secondary"
											sx={{ mb: 2 }}
										>
											Feedback: {latestSubmission.feedback}
										</Typography>
									)}

									{latestSubmission?.submissionText && (
										<Typography
											variant="body2"
											sx={{
												whiteSpace: "pre-wrap",
												lineHeight: 1.6,
												background: "rgba(31, 120, 80, 0.05)",
												borderRadius: "8px",
												border: "1px solid rgba(31, 120, 80, 0.15)",
												p: 2,
												mb:
													Array.isArray(latestSubmission.attachments) &&
													latestSubmission.attachments.length > 0
														? 2
														: 0,
											}}
										>
											{latestSubmission.submissionText}
										</Typography>
									)}

									{Array.isArray(latestSubmission?.attachments) &&
										latestSubmission.attachments.length > 0 && (
											<Box
												sx={{
													display: "flex",
													flexWrap: "wrap",
													gap: 1.5,
													mb: 2,
												}}
											>
												{latestSubmission.attachments.map((file, index) => (
													<Chip
														key={index}
														icon={<AttachFile />}
														label={
															file.name ||
															file.filename ||
															`Attachment ${index + 1}`
														}
														size="small"
														variant="outlined"
														onClick={() =>
															file.url && window.open(file.url, "_blank")
														}
														sx={{
															cursor: file.url ? "pointer" : "default",
															"&:hover": file.url
																? { backgroundColor: "rgba(31, 120, 80, 0.08)" }
																: undefined,
														}}
													/>
												))}
											</Box>
										)}
								</CardContent>
							</Card>
						) : (
							<Alert severity="info" sx={{ mb: 3 }}>
								No submission has been uploaded yet. Use the button below to
								submit your child's work.
							</Alert>
						)}
					</Box>

					<Divider />

					{/* Tabs */}
					<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
						<Tabs value={activeTab} onChange={handleTabChange} sx={{ px: 4 }}>
							<Tab
								label="Instructions"
								sx={{ textTransform: "none", fontWeight: 600 }}
							/>
							{assignment.attachments && assignment.attachments.length > 0 && (
								<Tab
									label={`Attachments (${assignment.attachments.length})`}
									sx={{ textTransform: "none", fontWeight: 600 }}
								/>
							)}
						</Tabs>
					</Box>

					{/* Tab Content */}
					<Box sx={{ p: 4 }}>
						{activeTab === 0 && (
							<Box>
								<Typography
									variant="h6"
									sx={{
										fontFamily: "Plus Jakarta Sans, sans-serif",
										fontWeight: 700,
										color: "hsl(152, 65%, 28%)",
										mb: 2,
									}}
								>
									Assignment Instructions
								</Typography>
								{assignment.instructions ? (
									<Typography
										variant="body1"
										sx={{
											whiteSpace: "pre-wrap",
											lineHeight: 1.6,
											p: 3,
											background: "rgba(31, 120, 80, 0.05)",
											borderRadius: "12px",
											border: "1px solid rgba(31, 120, 80, 0.2)",
										}}
									>
										{assignment.instructions}
									</Typography>
								) : (
									<Alert severity="info">
										No specific instructions provided for this assignment.
									</Alert>
								)}
							</Box>
						)}

						{activeTab === 1 &&
							assignment.attachments &&
							assignment.attachments.length > 0 && (
								<Box>
									<Typography
										variant="h6"
										sx={{
											fontFamily: "Plus Jakarta Sans, sans-serif",
											fontWeight: 700,
											color: "hsl(152, 65%, 28%)",
											mb: 2,
										}}
									>
										Assignment Attachments
									</Typography>
									<List>
										{assignment.attachments.map((attachment, index) => (
											<ListItem
												key={index}
												sx={{
													border: "1px solid #e0e0e0",
													borderRadius: "8px",
													mb: 1,
													background: "rgba(255, 255, 255, 0.8)",
												}}
											>
												<ListItemIcon>
													<FilePresent sx={{ color: "hsl(152, 65%, 28%)" }} />
												</ListItemIcon>
												<ListItemText
													primary={attachment.name || attachment.filename}
													secondary={attachment.description || "No description"}
												/>
											</ListItem>
										))}
									</List>
								</Box>
							)}
					</Box>
				</DialogContent>

				<DialogActions sx={{ p: 3, gap: 2 }}>
					<Button
						onClick={onClose}
						sx={{
							borderRadius: "12px",
							px: 3,
							py: 1,
						}}
					>
						Close
					</Button>
					<Button
						onClick={handleSubmitAssignment}
						variant="contained"
						startIcon={submissionActionIcon}
						disabled={isSubmissionDisabled}
						sx={{
							background:
								"linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
							borderRadius: "12px",
							px: 3,
							py: 1,
							"&:hover": {
								background:
									"linear-gradient(45deg, #0d47a1, hsl(220, 60%, 25%))",
							},
							"&.Mui-disabled": {
								backgroundColor: "rgba(0, 0, 0, 0.12)",
								backgroundImage: "none",
								color: "rgba(0, 0, 0, 0.26)",
							},
						}}
					>
						{submissionActionLabel}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Assignment Submission Dialog */}
			<AssignmentSubmissionDialog
				open={submissionDialogOpen}
				onClose={() => setSubmissionDialogOpen(false)}
				assignment={assignment}
				onSubmissionSuccess={handleSubmissionSuccess}
			/>
		</>
	);
};

export default AssignmentDetailDialog;
