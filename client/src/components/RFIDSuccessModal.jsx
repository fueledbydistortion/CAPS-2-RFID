import { AccessTime, CheckCircle, Schedule, School } from "@mui/icons-material";
import {
	Avatar,
	Box,
	Chip,
	Dialog,
	DialogContent,
	DialogTitle,
	Divider,
	Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";

const RFIDSuccessModal = ({
	open,
	onClose,
	attendanceData,
	attendanceType,
	status,
	statusLabel,
	message,
}) => {
	const [countdown, setCountdown] = useState(1);
	const [isClosing, setIsClosing] = useState(false);

	// Auto-close functionality - close after 1 second
	useEffect(() => {
		console.log("🔍 RFIDSuccessModal Debug - useEffect triggered:", {
			open,
			status,
		});

		if (open && (status === "present" || status === "late")) {
			console.log("🔍 RFIDSuccessModal Debug - Starting auto-close timer");
			setCountdown(1);
			setIsClosing(false);

			const timer = setTimeout(() => {
				console.log("🔍 RFIDSuccessModal Debug - Timer fired, closing modal");
				setIsClosing(true);
				setTimeout(() => {
					console.log("🔍 RFIDSuccessModal Debug - Calling onClose");
					onClose();
					// Reset countdown for next time
					setCountdown(1);
					setIsClosing(false);
				}, 300); // Small delay for smooth transition
			}, 3000); // Auto-close after 1 second

			return () => {
				console.log("🔍 RFIDSuccessModal Debug - Cleaning up timer");
				clearTimeout(timer);
			};
		} else {
			console.log("🔍 RFIDSuccessModal Debug - Not starting timer:", {
				open,
				status,
			});
		}
	}, [open, status, onClose]);

	if (!attendanceData) {
		console.log(
			"🔍 RFIDSuccessModal Debug - No attendance data, returning null"
		);
		return null;
	}

	console.log("🔍 RFIDSuccessModal Debug - Rendering modal with data:", {
		open,
		status,
		countdown,
		isClosing,
		attendanceData: !!attendanceData,
	});

	const { child, parent, schedule, attendance } = attendanceData;

	const childFullName =
		child?.fullName ||
		[child?.firstName, child?.middleName, child?.lastName]
			.filter((part) => typeof part === "string" && part.trim().length > 0)
			.map((part) => part.trim())
			.join(" ") ||
		"Student";

	const childInitials =
		child?.initials ||
		childFullName
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((segment) => segment.charAt(0).toUpperCase())
			.join("") ||
		"S";

	const childPhotoUrl =
		typeof child?.photoURL === "string" ? child.photoURL.trim() : "";

	const hasRenderablePhoto = /^(https?:|data:image|blob:|file:\/\/)/i.test(
		childPhotoUrl
	);

	// Debug: Log the attendance data structure
	console.log("🔍 RFIDSuccessModal - Attendance data structure:", {
		attendance,
		attendanceData,
		timeIn: attendance?.timeIn,
		timeOut: attendance?.timeOut,
		attendanceDataTimeIn: attendanceData?.timeIn,
		attendanceDataTimeOut: attendanceData?.timeOut,
		statusLabel,
	});

	const getStatusColor = (status) => {
		switch (status) {
			case "present":
				return "success";
			case "late":
				return "warning";
			case "absent":
				return "error";
			default:
				return "default";
		}
	};

	const getStatusIcon = (status) => {
		switch (status) {
			case "present":
				return "✅";
			case "late":
				return "⚠️";
			case "absent":
				return "❌";
			default:
				return "ℹ️";
		}
	};

	const getAttendanceTypeColor = (type) => {
		return type === "timeIn" ? "#4caf50" : "#ff9800";
	};

	const getAttendanceTypeText = (type) => {
		return type === "timeIn" ? "Time In" : "Time Out";
	};

	const resolvedStatusLabel =
		statusLabel ||
		(typeof status === "string"
			? status.replace(/_/g, " ").toUpperCase()
			: "RECORDED");

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="sm"
			fullWidth
			PaperProps={{
				sx: {
					background: "rgba(255, 255, 255, 0.98)",
					backdropFilter: "blur(20px)",
					border: "2px solid rgba(31, 120, 80, 0.3)",
					borderRadius: "20px",
					boxShadow: "0 12px 40px rgba(31, 120, 80, 0.3)",
				},
			}}
		>
			<DialogTitle
				sx={{
					textAlign: "center",
					background:
						"linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
					backgroundClip: "text",
					WebkitBackgroundClip: "text",
					WebkitTextFillColor: "transparent",
					fontWeight: 700,
					fontSize: "1.5rem",
					pb: 1,
				}}
			>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						gap: 1,
					}}
				>
					<CheckCircle sx={{ color: getAttendanceTypeColor(attendanceType) }} />
					Attendance Recorded Successfully
					{(status === "present" || status === "late") && (
						<Chip
							label="Auto-close in 0.5s"
							size="small"
							sx={{
								ml: 2,
								bgcolor: isClosing
									? "rgba(255, 152, 0, 0.1)"
									: "rgba(76, 175, 80, 0.1)",
								color: isClosing ? "#ff9800" : "#4caf50",
								fontWeight: 600,
								animation: isClosing ? "pulse 0.5s ease-in-out" : "none",
								"@keyframes pulse": {
									"0%": { transform: "scale(1)" },
									"50%": { transform: "scale(1.05)" },
									"100%": { transform: "scale(1)" },
								},
							}}
						/>
					)}
				</Box>
			</DialogTitle>

			<DialogContent sx={{ p: 3 }}>
				{/* Student Information */}
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						mb: 3,
						p: 3,
						bgcolor: "rgba(31, 120, 80, 0.05)",
						borderRadius: "16px",
						border: "1px solid rgba(31, 120, 80, 0.2)",
					}}
				>
					<Avatar
						src={hasRenderablePhoto ? childPhotoUrl : undefined}
						alt={childFullName}
						sx={{
							width: 80,
							height: 80,
							background: hasRenderablePhoto
								? "transparent"
								: "linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
							color: hasRenderablePhoto ? "inherit" : "#fff",
							fontSize: "2rem",
							mb: 1,
						}}
					>
						{!hasRenderablePhoto ? childInitials : null}
					</Avatar>
					{!hasRenderablePhoto && (
						<Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
							No image uploaded
						</Typography>
					)}

					<Typography
						variant="h5"
						sx={{ fontWeight: 700, mb: 1, textAlign: "center" }}
					>
						{childFullName}
					</Typography>

					<Typography
						variant="body1"
						color="text.secondary"
						sx={{ mb: 2, textAlign: "center" }}
					>
						Student
					</Typography>

					{/* Status Chip */}
					<Chip
						icon={<CheckCircle />}
						label={`${getStatusIcon(status)} ${resolvedStatusLabel}`}
						color={getStatusColor(status)}
						variant="filled"
						sx={{
							fontWeight: 600,
							fontSize: "0.9rem",
							px: 2,
							py: 1,
							height: "auto",
						}}
					/>
				</Box>

				{/* Attendance Details */}
				<Box sx={{ mb: 3 }}>
					<Typography
						variant="h6"
						sx={{ fontWeight: 600, mb: 2, color: "hsl(152, 65%, 28%)" }}
					>
						Attendance Details
					</Typography>

					<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
						{/* Attendance Type */}
						<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
							<AccessTime
								sx={{ color: getAttendanceTypeColor(attendanceType) }}
							/>
							<Box>
								<Typography variant="body2" color="text.secondary">
									Type
								</Typography>
								<Typography variant="body1" sx={{ fontWeight: 600 }}>
									{getAttendanceTypeText(attendanceType)}
								</Typography>
							</Box>
						</Box>

						{/* Time */}
						<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
							<Schedule sx={{ color: "hsl(152, 65%, 28%)" }} />
							<Box>
								<Typography variant="body2" color="text.secondary">
									Time
								</Typography>
								<Typography variant="body1" sx={{ fontWeight: 600 }}>
									{attendance?.timeIn ||
										attendance?.timeOut ||
										attendanceData?.timeIn ||
										attendanceData?.timeOut ||
										new Date().toLocaleTimeString("en-US", {
											hour: "2-digit",
											minute: "2-digit",
											hour12: true,
										})}
								</Typography>
							</Box>
						</Box>

						{/* Section */}
						<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
							<School sx={{ color: "hsl(152, 65%, 28%)" }} />
							<Box>
								<Typography variant="body2" color="text.secondary">
									Daycare Center
								</Typography>
								<Typography variant="body1" sx={{ fontWeight: 600 }}>
									{schedule?.sectionName || "Unknown Daycare Center"}
								</Typography>
							</Box>
						</Box>
					</Box>
				</Box>

				{/* Status Message */}
				{message && (
					<Box
						sx={{
							p: 2,
							bgcolor:
								getStatusColor(status) === "success"
									? "rgba(76, 175, 80, 0.1)"
									: getStatusColor(status) === "warning"
									? "rgba(255, 152, 0, 0.1)"
									: "rgba(244, 67, 54, 0.1)",
							borderRadius: "12px",
							border: `1px solid ${
								getStatusColor(status) === "success"
									? "rgba(76, 175, 80, 0.3)"
									: getStatusColor(status) === "warning"
									? "rgba(255, 152, 0, 0.3)"
									: "rgba(244, 67, 54, 0.3)"
							}`,
						}}
					>
						<Typography
							variant="body2"
							sx={{ fontWeight: 500, textAlign: "center" }}
						>
							{message}
						</Typography>
					</Box>
				)}

				{/* Parent Information */}
				{parent && (
					<>
						<Divider sx={{ my: 3 }} />
						<Box>
							<Typography
								variant="h6"
								sx={{ fontWeight: 600, mb: 2, color: "hsl(152, 65%, 28%)" }}
							>
								Parent Information
							</Typography>
							<Typography variant="body1" sx={{ fontWeight: 500 }}>
								{parent.firstName} {parent.lastName}
							</Typography>
							<Typography variant="body2" color="text.secondary">
								{parent.email}
							</Typography>
						</Box>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default RFIDSuccessModal;
