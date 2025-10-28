import React, { useState, useEffect } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Button,
	Box,
	Typography,
	Alert,
	CircularProgress,
	IconButton,
	List,
	ListItem,
	ListItemText,
	ListItemSecondaryAction,
	LinearProgress,
	Chip,
	Divider,
} from "@mui/material";
import {
	AttachFile,
	Delete,
	CloudUpload,
	FilePresent,
	Assignment,
	CheckCircle,
} from "@mui/icons-material";
import {
	uploadFile,
	MAX_FILE_SIZE_MB,
	ALLOWED_FILE_EXTENSIONS,
} from "../utils/fileService";
import { submitAssignment } from "../utils/assignmentService";

const AssignmentSubmissionDialog = ({
	open,
	onClose,
	assignment,
	onSubmissionSuccess,
}) => {
	const [formData, setFormData] = useState({
		submissionText: "",
		attachments: [],
	});
	const [uploadingFiles, setUploadingFiles] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [errors, setErrors] = useState({});

	const latestSubmission =
		assignment?.latestSubmission ||
		(Array.isArray(assignment?.submissions) && assignment.submissions.length > 0
			? assignment.submissions[0]
			: null);
	const hasSubmission = Boolean(latestSubmission);
	const isGraded =
		hasSubmission &&
		((latestSubmission?.status || "").toLowerCase() === "graded" ||
			Boolean(latestSubmission?.gradedAt));
	const resubmissionAvailable = hasSubmission && !isGraded;
	const dialogTitle = isGraded
		? "Submission Closed"
		: resubmissionAvailable
		? "Resubmit Assignment"
		: "Submit Assignment";
	const submitButtonLabel = submitting
		? "Submitting..."
		: isGraded
		? "Submitted"
		: resubmissionAvailable
		? "Resubmit Assignment"
		: "Submit Assignment";

	useEffect(() => {
		if (open) {
			setFormData({
				submissionText: "",
				attachments: [],
			});
			setErrors({});
		}
	}, [open]);

	const handleChange = (field) => (event) => {
		const value = event.target.value;
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));

		// Clear error when user starts typing
		if (errors[field]) {
			setErrors((prev) => ({
				...prev,
				[field]: "",
			}));
		}
	};

	const handleFileUpload = async (event) => {
		const files = Array.from(event.target.files);
		if (files.length === 0) return;

		setUploadingFiles(true);
		try {
			const uploadPromises = files.map(async (file) => {
				const result = await uploadFile(file, "submissions");
				if (result.success) {
					return {
						id: result.data.id,
						name: file.name,
						size: file.size,
						type: file.type,
						url: result.data.url,
						path: result.data.path,
					};
				}
				throw new Error(result.error);
			});

			const uploadedFiles = await Promise.all(uploadPromises);
			setFormData((prev) => ({
				...prev,
				attachments: [...prev.attachments, ...uploadedFiles],
			}));
		} catch (error) {
			console.error("Error uploading files:", error);
			setErrors((prev) => ({
				...prev,
				attachments: "Failed to upload files: " + error.message,
			}));
		} finally {
			setUploadingFiles(false);
		}
	};

	const handleRemoveFile = (fileId) => {
		setFormData((prev) => ({
			...prev,
			attachments: prev.attachments.filter((file) => file.id !== fileId),
		}));
	};

	const formatFileSize = (bytes) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	};

	const validateForm = () => {
		const newErrors = {};

		if (!formData.submissionText.trim() && formData.attachments.length === 0) {
			newErrors.submissionText =
				"Please provide either text submission or upload files";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (isGraded) {
			setErrors({
				submit:
					"This assignment has already been graded and cannot be resubmitted.",
			});
			return;
		}

		if (!validateForm()) return;

		setSubmitting(true);
		try {
			const submissionData = {
				assignmentId: assignment.id,
				submissionText: formData.submissionText,
				attachments: formData.attachments,
				submittedAt: new Date().toISOString(),
			};

			console.log("📤 Submitting assignment with data:", {
				assignmentId: submissionData.assignmentId,
				hasText: !!submissionData.submissionText.trim(),
				attachmentCount: submissionData.attachments.length,
				attachments: submissionData.attachments,
			});

			const result = await submitAssignment(submissionData);

			console.log("📥 Submission result:", result);

			if (result.success) {
				console.log("✅ Submission successful, calling onSubmissionSuccess");
				onSubmissionSuccess(result.data);
				onClose();
			} else {
				console.error("❌ Submission failed:", result.error);
				setErrors({ submit: result.error });
			}
		} catch (error) {
			console.error("❌ Submission exception:", error);
			setErrors({ submit: error.message });
		} finally {
			setSubmitting(false);
		}
	};

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	return (
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
				}}
			>
				{dialogTitle}
			</DialogTitle>

			<DialogContent sx={{ p: 4 }}>
				{assignment && (
					<>
						{/* Assignment Details */}
						<Box
							sx={{
								mb: 4,
								p: 3,
								background: "rgba(31, 120, 80, 0.05)",
								borderRadius: "12px",
							}}
						>
							<Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
								<Assignment sx={{ mr: 2, color: "hsl(152, 65%, 28%)" }} />
								<Typography
									variant="h6"
									sx={{
										fontFamily: "Plus Jakarta Sans, sans-serif",
										fontWeight: 700,
										color: "hsl(152, 65%, 28%)",
									}}
								>
									{assignment.title}
								</Typography>
							</Box>

							{assignment.description && (
								<Typography
									variant="body2"
									sx={{
										mb: 2,
										fontFamily: "Plus Jakarta Sans, sans-serif",
										color: "text.secondary",
									}}
								>
									{assignment.description}
								</Typography>
							)}

							<Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
								<Chip
									label={`${assignment.points} points`}
									color="primary"
									size="small"
								/>
								<Chip
									label={`Due: ${formatDate(assignment.dueDate)}`}
									color={
										new Date(assignment.dueDate) < new Date()
											? "error"
											: "default"
									}
									size="small"
								/>
							</Box>

							{assignment.instructions && (
								<Box>
									<Typography
										variant="subtitle2"
										sx={{ fontWeight: 600, mb: 1 }}
									>
										Instructions:
									</Typography>
									<Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
										{assignment.instructions}
									</Typography>
								</Box>
							)}
						</Box>

						<Divider sx={{ mb: 3 }} />

						{isGraded && (
							<Alert severity="info" sx={{ mb: 3 }}>
								This assignment has already been graded. Submissions are now
								locked.
							</Alert>
						)}

						{/* Submission Form */}
						<Box
							component="form"
							onSubmit={handleSubmit}
							sx={{ display: "flex", flexDirection: "column", gap: 3 }}
						>
							{/* Text Submission */}
							<TextField
								fullWidth
								label="Your Submission"
								value={formData.submissionText}
								onChange={handleChange("submissionText")}
								multiline
								rows={6}
								placeholder="Write your response, thoughts, or any additional information here..."
								error={!!errors.submissionText}
								helperText={errors.submissionText}
								disabled={isGraded}
								sx={{
									"& .MuiOutlinedInput-root": {
										borderRadius: "12px",
										"&:hover fieldset": {
											borderColor: "hsl(152, 65%, 28%)",
										},
										"&.Mui-focused fieldset": {
											borderColor: "hsl(152, 65%, 28%)",
										},
									},
								}}
							/>

							{/* File Upload Section */}
							<Box>
								<Typography
									variant="h6"
									sx={{
										mb: 2,
										color: "hsl(152, 65%, 28%)",
										fontFamily: "Plus Jakarta Sans, sans-serif",
										fontWeight: 700,
									}}
								>
									Attach Files (Optional)
								</Typography>

								{/* File restrictions info */}
								<Typography
									variant="caption"
									sx={{ color: "#666", display: "block", mb: 1 }}
								>
									<strong>Allowed:</strong> Images (JPG, PNG, GIF), Documents
									(PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT), Archives (ZIP)
									{" • "}
									<strong>Max size:</strong> {MAX_FILE_SIZE_MB}MB per file
								</Typography>

								{/* Upload Button */}
								<Box sx={{ mb: 2 }}>
									<input
										accept="*/*"
										style={{ display: "none" }}
										id="submission-file-upload"
										multiple
										type="file"
										onChange={handleFileUpload}
										disabled={uploadingFiles || isGraded}
									/>
									<label htmlFor="submission-file-upload">
										<Button
											variant="outlined"
											component="span"
											startIcon={<CloudUpload />}
											disabled={uploadingFiles || isGraded}
											sx={{
												borderRadius: "12px",
												borderColor: "hsl(152, 65%, 28%)",
												color: "hsl(152, 65%, 28%)",
												"&:hover": {
													borderColor: "#0d47a1",
													backgroundColor: "rgba(21, 101, 192, 0.04)",
												},
											}}
										>
											{uploadingFiles ? "Uploading..." : "Upload Files"}
										</Button>
									</label>
								</Box>

								{/* Upload Progress */}
								{uploadingFiles && (
									<Box sx={{ mb: 2 }}>
										<LinearProgress />
										<Typography variant="caption" color="text.secondary">
											Uploading files...
										</Typography>
									</Box>
								)}

								{/* File List */}
								{formData.attachments.length > 0 && (
									<List
										sx={{
											border: "1px solid #e0e0e0",
											borderRadius: "8px",
											p: 1,
										}}
									>
										{formData.attachments.map((file) => (
											<ListItem key={file.id} sx={{ py: 1 }}>
												<FilePresent
													sx={{ mr: 2, color: "hsl(152, 65%, 28%)" }}
												/>
												<ListItemText
													primary={file.name}
													secondary={`${formatFileSize(file.size)}`}
												/>
												<ListItemSecondaryAction>
													<IconButton
														edge="end"
														onClick={() => handleRemoveFile(file.id)}
														size="small"
														sx={{ color: "#f44336" }}
														disabled={isGraded}
													>
														<Delete />
													</IconButton>
												</ListItemSecondaryAction>
											</ListItem>
										))}
									</List>
								)}

								{/* Error Display */}
								{errors.attachments && (
									<Alert severity="error" sx={{ mt: 1 }}>
										{errors.attachments}
									</Alert>
								)}
							</Box>

							{/* Submit Error */}
							{errors.submit && <Alert severity="error">{errors.submit}</Alert>}
						</Box>
					</>
				)}
			</DialogContent>

			<DialogActions sx={{ p: 3, gap: 2 }}>
				<Button
					onClick={onClose}
					disabled={submitting}
					sx={{
						borderRadius: "12px",
						px: 3,
						py: 1,
					}}
				>
					Cancel
				</Button>
				<Button
					onClick={handleSubmit}
					variant="contained"
					disabled={submitting || isGraded}
					startIcon={
						submitting ? (
							<CircularProgress size={20} color="inherit" />
						) : (
							<CheckCircle />
						)
					}
					sx={{
						background:
							"linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
						borderRadius: "12px",
						px: 3,
						py: 1,
						"&:hover": {
							background: "linear-gradient(45deg, #0d47a1, hsl(220, 60%, 25%))",
						},
						"&.Mui-disabled": {
							backgroundColor: "rgba(0, 0, 0, 0.12)",
							backgroundImage: "none",
							color: "rgba(0, 0, 0, 0.26)",
						},
					}}
				>
					{submitButtonLabel}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default AssignmentSubmissionDialog;
