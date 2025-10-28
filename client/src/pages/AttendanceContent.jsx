import {
	CalendarMonth,
	Download,
	History,
	PictureAsPdf,
	QrCode,
	Schedule,
	Search,
	TableChart,
	Today,
} from "@mui/icons-material";
import {
	Alert,
	Avatar,
	Box,
	Button,
	Card,
	Checkbox,
	Chip,
	CardContent,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	FormControl,
	FormControlLabel,
	InputAdornment,
	InputLabel,
	MenuItem,
	Paper,
	Radio,
	RadioGroup,
	Select,
	Snackbar,
	Tab,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tabs,
	TextField,
	Typography,
} from "@mui/material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import QRScannerDialog from "../components/QRScannerDialog";
import RFIDSuccessModal from "../components/RFIDSuccessModal";
import { useAuth } from "../contexts/AuthContext";
import { getAllAttendance } from "../utils/attendanceService";
import {
	determineAttendanceType,
	getCurrentDay,
} from "../utils/attendanceTimeUtils";
import {
	calculateAttendanceStatus,
	formatAttendanceMessage,
} from "../utils/attendanceUtils";
import { markAttendanceViaQR } from "../utils/parentScheduleService";
import { getAllSchedules } from "../utils/scheduleService";
import { getAllSections } from "../utils/sectionService";
import { database } from "../utils/firebase-config";
import { ref as dbRef, push as dbPush, set as dbSet } from "firebase/database";
import { formatTo12Hour } from "../utils/timeUtils";
import { getAllUsers } from "../utils/userService";

const UNKNOWN_DAYCARE_REGEX = /unknown daycare center/i;
const NOT_IN_DAYCARE_LABEL = "Not in any daycare center";
const isMeaningfulSectionName = (value) =>
	typeof value === "string" &&
	value.trim().length > 0 &&
	!UNKNOWN_DAYCARE_REGEX.test(value.trim());

const normalizeIdValue = (value) => {
	if (value === null || value === undefined) return null;
	if (typeof value === "number" || typeof value === "bigint") {
		return value.toString();
	}
	if (typeof value === "string") {
		const trimmed = value.trim();
		return trimmed.length ? trimmed : null;
	}
	return null;
};

const findSectionById = (sections, sectionId) => {
	const normalizedId = normalizeIdValue(sectionId);
	if (!normalizedId) return null;
	return (
		sections.find((section) => {
			const candidates = [section.id, section.sectionId, section.sectionID];
			return candidates
				.map((candidate) => normalizeIdValue(candidate))
				.filter(Boolean)
				.includes(normalizedId);
		}) || null
	);
};

const getSectionCanonicalId = (section) => {
	if (!section) return null;
	const candidates = [
		section.id,
		section.sectionId,
		section.sectionID,
		section.section?.id,
		section.uid,
		section.key,
	];

	for (const candidate of candidates) {
		const normalized = normalizeIdValue(candidate);
		if (normalized) {
			return normalized;
		}
	}

	return null;
};

const matchesStudentId = (entry, normalizedTarget) => {
	if (!entry || !normalizedTarget) return false;
	if (typeof entry === "string" || typeof entry === "number") {
		return normalizeIdValue(entry) === normalizedTarget;
	}
	if (typeof entry === "object") {
		const candidates = [
			entry.uid,
			entry.id,
			entry.studentId,
			entry.childId,
			entry.userId,
		];
		return candidates.some(
			(value) => normalizeIdValue(value) === normalizedTarget
		);
	}
	return false;
};

const resolveStudentSectionAssignment = (studentId, { students, sections }) => {
	const normalizedId = normalizeIdValue(studentId);
	if (!normalizedId) return { section: null, fallbackName: null };
	let fallbackName = null;

	for (const section of sections) {
		const assignmentBuckets = [
			section.assignedStudents,
			section.assignedStudentIds,
			section.studentIds,
			section.students,
			section.enrolledStudents,
		];

		const hasMatch = assignmentBuckets.some((bucket) => {
			if (!bucket) return false;
			if (Array.isArray(bucket)) {
				return bucket.some((entry) => matchesStudentId(entry, normalizedId));
			}
			if (typeof bucket === "object") {
				return Object.values(bucket).some((entry) =>
					matchesStudentId(entry, normalizedId)
				);
			}
			return false;
		});

		if (hasMatch) {
			return { section, fallbackName: null };
		}
	}

	const student = students.find((s) => {
		const candidateIds = [s.uid, s.id, s.userId]
			.map((candidate) => normalizeIdValue(candidate))
			.filter(Boolean);
		return candidateIds.includes(normalizedId);
	});

	if (student) {
		const candidateIds = [
			student.sectionId,
			student.sectionID,
			student.assignedSectionId,
			student.assignedSectionID,
			student.childSectionId,
			student.childSectionID,
			student.section?.id,
			student.childSection?.id,
		]
			.map((candidate) => normalizeIdValue(candidate))
			.filter(Boolean);

		for (const candidateId of candidateIds) {
			const section = findSectionById(sections, candidateId);
			if (section) {
				return { section, fallbackName: null };
			}
		}

		const candidateNames = [
			student.sectionName,
			student.section?.name,
			student.childSectionName,
			student.childSection?.name,
			student.childDaycareCenter,
			student.daycareCenter,
			typeof student.childSection === "string" ? student.childSection : null,
		].filter((name) => isMeaningfulSectionName(name));

		for (const name of candidateNames) {
			const normalizedName = name.trim();
			const section = sections.find(
				(s) => s.name && s.name.toLowerCase() === normalizedName.toLowerCase()
			);
			if (section) {
				return { section, fallbackName: null };
			}
			if (!fallbackName) fallbackName = normalizedName;
		}
	}

	return { section: null, fallbackName };
};

const resolveSectionDetails = (record, context) => {
	const { sections, schedules } = context;
	let resolvedSectionId = record.sectionId || null;
	let resolvedSectionName = isMeaningfulSectionName(record.sectionName)
		? record.sectionName.trim()
		: null;
	let fallbackName = null;

	if (resolvedSectionId) {
		const section = findSectionById(sections, resolvedSectionId);
		if (section) {
			resolvedSectionId = section.id;
			if (!resolvedSectionName && isMeaningfulSectionName(section.name)) {
				resolvedSectionName = section.name.trim();
			}
		} else {
			resolvedSectionId = null;
		}
	}

	const normalizedScheduleId = normalizeIdValue(record.scheduleId);
	if (normalizedScheduleId) {
		const schedule = schedules.find(
			(scheduleItem) =>
				normalizeIdValue(scheduleItem.id) === normalizedScheduleId
		);
		if (schedule) {
			const scheduleSection = findSectionById(sections, schedule.sectionId);
			if (!resolvedSectionId && scheduleSection) {
				resolvedSectionId = scheduleSection.id;
			}
			if (
				scheduleSection &&
				!resolvedSectionName &&
				isMeaningfulSectionName(scheduleSection.name)
			) {
				resolvedSectionName = scheduleSection.name.trim();
			}
		}
	}

	const studentSection = resolveStudentSectionAssignment(
		record.studentId || record.childId,
		context
	);
	if (studentSection.section) {
		if (!resolvedSectionId) {
			resolvedSectionId = studentSection.section.id;
		}
		if (
			!resolvedSectionName &&
			isMeaningfulSectionName(studentSection.section.name)
		) {
			resolvedSectionName = studentSection.section.name.trim();
		}
	} else if (!resolvedSectionName && studentSection.fallbackName) {
		fallbackName = studentSection.fallbackName.trim();
	}

	if (!resolvedSectionName) {
		const extraFields = [
			record.sectionLabel,
			record.sectionTitle,
			record.section,
			record.daycareCenter,
			record.daycareCenterName,
			record.daycare,
		];

		const extraName = extraFields.find((val) => isMeaningfulSectionName(val));
		if (extraName) {
			resolvedSectionName = extraName.trim();
		}
	}

	return {
		sectionId: resolvedSectionId,
		sectionName: resolvedSectionName,
		fallbackName,
	};
};

const normalizeAttendanceRecord = (record, context) => {
	const normalizedRecord = { ...record };
	if (!normalizedRecord.studentId && normalizedRecord.childId) {
		normalizedRecord.studentId = normalizedRecord.childId;
	}
	if (!normalizedRecord.studentId && normalizedRecord.parentId) {
		normalizedRecord.studentId = normalizedRecord.parentId;
	}

	if (!normalizedRecord.date) {
		if (normalizedRecord.createdAt) {
			const createdDate = new Date(normalizedRecord.createdAt);
			if (!Number.isNaN(createdDate.getTime())) {
				normalizedRecord.date = createdDate.toISOString().split("T")[0];
			}
		} else if (normalizedRecord.time && normalizedRecord.timestamp) {
			const timestampDate = new Date(normalizedRecord.timestamp);
			if (!Number.isNaN(timestampDate.getTime())) {
				normalizedRecord.date = timestampDate.toISOString().split("T")[0];
			}
		}
	}

	if (!normalizedRecord.scheduleId && normalizedRecord.schedule) {
		normalizedRecord.scheduleId =
			normalizedRecord.schedule.id || normalizedRecord.scheduleId;
	}

	const sectionMeta = resolveSectionDetails(normalizedRecord, context);
	if (sectionMeta.sectionId && !normalizedRecord.sectionId) {
		normalizedRecord.sectionId = sectionMeta.sectionId;
	}

	const existingSectionName = isMeaningfulSectionName(
		normalizedRecord.sectionName
	)
		? normalizedRecord.sectionName.trim()
		: null;

	let finalSectionName = existingSectionName || sectionMeta.sectionName;

	if (!isMeaningfulSectionName(finalSectionName) && sectionMeta.fallbackName) {
		finalSectionName = sectionMeta.fallbackName;
	}

	if (!isMeaningfulSectionName(finalSectionName)) {
		finalSectionName = NOT_IN_DAYCARE_LABEL;
	}

	normalizedRecord.sectionName = finalSectionName;
	normalizedRecord.resolvedSectionName = finalSectionName;
	normalizedRecord.resolvedSectionId =
		sectionMeta.sectionId || normalizedRecord.sectionId || null;

	return normalizedRecord;
};

const TIME_CLASSIFICATION_LABELS = {
	arrival: {
		late: "Late Arrival",
		early: "Early Arrival",
		on_time: "On-Time Arrival",
		within_grace: "Arrival Within Grace",
		missing: "No Time-In",
		invalid: "Invalid Time-In",
		unknown_schedule: "No Scheduled Start",
		default: "Check Time-In",
	},
	departure: {
		late: "Late Clock-Out",
		early: "Early Clock-Out",
		on_time: "On-Time Clock-Out",
		within_grace: "Clock-Out Within Grace",
		missing: "No Time-Out",
		invalid: "Invalid Time-Out",
		unknown_schedule: "No Scheduled End",
		default: "Check Time-Out",
	},
};

const CLASSIFICATION_COLOR_MAP = {
	late: "warning",
	early: "info",
	on_time: "success",
	within_grace: "success",
	missing: "error",
	invalid: "error",
	unknown_schedule: "default",
};

const OBJECT_STRING_CANDIDATE_KEYS = [
	"downloadURL",
	"url",
	"href",
	"src",
	"path",
	"fullPath",
	"value",
	"imageUrl",
	"photoURL",
	"photoUrl",
	"link",
	"previewUrl",
];

const pickFirstMeaningfulString = (values) => {
	for (const value of values) {
		if (value === null || value === undefined) continue;

		if (typeof value === "string") {
			const trimmed = value.trim();
			if (trimmed.length > 0) {
				const lowered = trimmed.toLowerCase();
				if (
					lowered === "null" ||
					lowered === "undefined" ||
					lowered === "false" ||
					lowered === "n/a" ||
					lowered === "na" ||
					lowered === "none"
				)
					continue;
				return trimmed;
			}
		}

		if (typeof value === "number" && Number.isFinite(value)) {
			return String(value);
		}

		if (Array.isArray(value)) {
			const nested = pickFirstMeaningfulString(value);
			if (nested) return nested;
		}

		if (typeof value === "object") {
			const nestedCandidates = OBJECT_STRING_CANDIDATE_KEYS.map(
				(key) => value[key]
			);
			const nested = pickFirstMeaningfulString(nestedCandidates);
			if (nested) return nested;
		}
	}

	return null;
};

const extractImageUrl = (...values) => pickFirstMeaningfulString(values);

const buildFullName = (...parts) =>
	parts
		.filter((part) => typeof part === "string" && part.trim().length > 0)
		.map((part) => part.trim())
		.join(" ")
		.trim();

const buildInitialsFromName = (name) => {
	if (!name || typeof name !== "string") return "";
	const segments = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
	if (segments.length === 0) return "";
	return segments.map((segment) => segment.charAt(0).toUpperCase()).join("");
};

const isLikelyRenderableImageUrl = (value) => {
	if (!value || typeof value !== "string") return false;
	const trimmed = value.trim().toLowerCase();
	return (
		trimmed.startsWith("http://") ||
		trimmed.startsWith("https://") ||
		trimmed.startsWith("data:image") ||
		trimmed.startsWith("blob:") ||
		trimmed.startsWith("file://")
	);
};

const getClassificationDisplay = (type, classification) => {
	if (!classification) return null;
	const labels = TIME_CLASSIFICATION_LABELS[type];
	if (!labels) return null;
	const label = labels[classification] || labels.default;
	if (!label) return null;
	return {
		label,
		color: CLASSIFICATION_COLOR_MAP[classification] || "default",
	};
};

const buildTimeSummary = (record, type) => {
	if (!record) return "";
	const classification =
		type === "arrival"
			? record.arrivalClassification
			: record.departureClassification;
	const note = type === "arrival" ? record.arrivalNote : record.departureNote;
	const time =
		type === "arrival"
			? formatTo12Hour(record.timeIn)
			: formatTo12Hour(record.timeOut);
	const display = getClassificationDisplay(type, classification);
	const parts = [];
	if (time) parts.push(time);
	if (display?.label) parts.push(display.label);
	if (note) parts.push(note);
	return parts.join(" • ");
};

const AttendanceContent = () => {
	const { userProfile } = useAuth();
	const [students, setStudents] = useState([]);
	const [sections, setSections] = useState([]);
	const [schedules, setSchedules] = useState([]);
	const [loading, setLoading] = useState(true);
	const [attendanceRecords, setAttendanceRecords] = useState([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [filteredRecords, setFilteredRecords] = useState([]);
	const [onlineOnly, setOnlineOnly] = useState(false);
	const [exportDialogOpen, setExportDialogOpen] = useState(false);
	const [exportFormat, setExportFormat] = useState("excel");
	const [tabValue, setTabValue] = useState(0);
	const [qrScannerOpen, setQrScannerOpen] = useState(false);
	const [dateFilter, setDateFilter] = useState("today");
	const [sectionFilter, setSectionFilter] = useState("all");
	const [customStartDate, setCustomStartDate] = useState("");
	const [stats, setStats] = useState({
		total: 0,
		present: 0,
		absent: 0,
		late: 0,
	});
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: "",
		severity: "success",
	});
	const [rfidModalOpen, setRfidModalOpen] = useState(false);
	const [rfidModalData, setRfidModalData] = useState(null);

	const resolveStudentDisplayInfo = React.useCallback(
		(record) => {
			if (!record) {
				return {
					displayName: "Unknown Student",
					photoUrl: null,
					initials: "S",
					missingImage: true,
					matchedStudent: null,
				};
			}

			const candidateIds = [
				record.studentId,
				record.childId,
				record.parentId,
				record.uid,
				record.userId,
				record.child?.uid,
				record.child?.id,
				record.child?.userId,
				record.child?.parentId,
				record.student?.uid,
				record.student?.id,
				record.student?.userId,
				record.student?.parentId,
				record.attendanceUserId,
			]
				.map((value) => normalizeIdValue(value))
				.filter(Boolean);

			const candidateIdSet = new Set(candidateIds);

			let matchedStudent = null;
			if (candidateIdSet.size > 0) {
				matchedStudent = students.find((student) => {
					const studentCandidates = [
						student.uid,
						student.id,
						student.userId,
						student.childId,
						student.childUID,
						student.childUid,
						student.childUserId,
						student.studentId,
						student.parentId,
					]
						.map((value) => normalizeIdValue(value))
						.filter(Boolean);

					return studentCandidates.some((value) => candidateIdSet.has(value));
				});
			}

			const matchedName = matchedStudent
				? pickFirstMeaningfulString([
						buildFullName(
							matchedStudent.childFirstName || matchedStudent.firstName,
							matchedStudent.childMiddleName || matchedStudent.middleName,
							matchedStudent.childLastName || matchedStudent.lastName
						),
						buildFullName(
							matchedStudent.firstName,
							matchedStudent.middleName,
							matchedStudent.lastName
						),
				  ])
				: null;

			const recordNameCandidates = [
				buildFullName(
					record.childFirstName,
					record.childMiddleName,
					record.childLastName
				),
				buildFullName(
					record.studentFirstName,
					record.studentMiddleName,
					record.studentLastName
				),
				buildFullName(record.firstName, record.middleName, record.lastName),
				buildFullName(
					record.child?.firstName,
					record.child?.middleName,
					record.child?.lastName
				),
				buildFullName(
					record.student?.firstName,
					record.student?.middleName,
					record.student?.lastName
				),
				record.childName,
				record.studentName,
				record.child?.name,
				record.student?.name,
				record.childFullName,
				record.studentFullName,
			];

			const displayName =
				pickFirstMeaningfulString([matchedName, ...recordNameCandidates]) ||
				"Unknown Student";

			let photoUrl =
				extractImageUrl(
					record.photoURL,
					record.photoUrl,
					record.photo,
					record.profilePicture,
					record.profilePictureUrl,
					record.childProfilePicture,
					record.studentProfilePicture,
					record.childPhoto,
					record.child?.photoURL,
					record.child?.photoUrl,
					record.child?.photo,
					record.child?.imageUrl,
					record.child?.avatarUrl,
					record.studentPhoto,
					record.student?.photoURL,
					record.student?.photo,
					record.student?.imageUrl,
					record.student?.avatarUrl,
					record.imageUrl,
					record.avatarUrl,
					record.photoObj,
					record.photoObject,
					record.picture,
					record.pictureUrl,
					matchedStudent?.childPhoto,
					matchedStudent?.photoURL,
					matchedStudent?.photoUrl,
					matchedStudent?.photo,
					matchedStudent?.imageUrl,
					matchedStudent?.avatarUrl,
					matchedStudent?.profilePicture,
					matchedStudent?.profilePictureUrl,
					matchedStudent?.profilePhoto,
					matchedStudent?.childProfilePicture
				) || null;

			if (photoUrl && !isLikelyRenderableImageUrl(photoUrl)) {
				photoUrl = null;
			}

			const initials = buildInitialsFromName(displayName) || "S";
			const missingImage = !photoUrl;

			return {
				displayName,
				photoUrl,
				initials,
				missingImage,
				matchedStudent: matchedStudent || null,
			};
		},
		[students]
	);

	const sectionOptions = useMemo(() => {
		const seen = new Set();
		return sections.reduce((acc, section) => {
			const id = getSectionCanonicalId(section);
			if (!id || seen.has(id)) {
				return acc;
			}

			seen.add(id);
			const name = isMeaningfulSectionName(section.name)
				? section.name.trim()
				: section.grade
				? `${section.grade} (${id})`
				: `Daycare ${id}`;

			acc.push({ id, name });
			return acc;
		}, []);
	}, [sections]);

	useEffect(() => {
		loadInitialData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (students.length > 0 && sections.length > 0 && schedules.length > 0) {
			loadAttendanceData();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		dateFilter,
		sectionFilter,
		customStartDate,
		tabValue,
		students.length,
		sections.length,
		schedules.length,
	]);

	useEffect(() => {
		filterRecords();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		searchTerm,
		attendanceRecords,
		students,
		sections,
		schedules,
		onlineOnly,
	]);

	const loadInitialData = async () => {
		try {
			setLoading(true);
			const [usersResult, sectionsResult, schedulesResult] = await Promise.all([
				getAllUsers(),
				getAllSections(),
				getAllSchedules(),
			]);

			if (usersResult.success) {
				setStudents(usersResult.data);
			} else {
				showSnackbar("Error loading students: " + usersResult.error, "error");
			}

			if (sectionsResult.success) {
				setSections(sectionsResult.data);
			} else {
				showSnackbar(
					"Error loading sections: " + sectionsResult.error,
					"error"
				);
			}

			if (schedulesResult.success) {
				setSchedules(schedulesResult.data);
			} else {
				showSnackbar(
					"Error loading schedules: " + schedulesResult.error,
					"error"
				);
			}

			if (
				usersResult.success &&
				sectionsResult.success &&
				schedulesResult.success
			) {
				await loadAttendanceData();
			}
		} catch (error) {
			console.error("Error loading initial data:", error);
			showSnackbar("Error loading data: " + error.message, "error");
		} finally {
			setLoading(false);
		}
	};

	const loadAttendanceData = async () => {
		try {
			setLoading(true);
			const filters = {};

			// Apply date filters
			const today = new Date().toISOString().split("T")[0];

			if (dateFilter === "today" && tabValue === 0) {
				filters.date = today;
			} else if (dateFilter === "week") {
				const weekAgo = new Date();
				weekAgo.setDate(weekAgo.getDate() - 7);
				filters.startDate = weekAgo.toISOString().split("T")[0];
				filters.endDate = today;
			} else if (dateFilter === "month") {
				const monthAgo = new Date();
				monthAgo.setMonth(monthAgo.getMonth() - 1);
				filters.startDate = monthAgo.toISOString().split("T")[0];
				filters.endDate = today;
			} else if (dateFilter === "year") {
				const currentYear = new Date().getFullYear();
				const lastYear = currentYear - 1;
				filters.startDate = `${lastYear}-01-01`;
				filters.endDate = `${lastYear}-12-31`;
			} else if (dateFilter === "custom" && customStartDate) {
				filters.date = customStartDate;
			}

			const normalizedSectionFilter =
				sectionFilter && sectionFilter !== "all"
					? normalizeIdValue(sectionFilter)
					: null;

			const attendanceResult = await getAllAttendance(filters);

			if (attendanceResult.success) {
				const normalizationContext = { sections, schedules, students };
				let records = attendanceResult.data.map((attendanceRecord) =>
					normalizeAttendanceRecord(attendanceRecord, normalizationContext)
				);

				// Apply client-side date/section filters in case backend ignored query params
				const todayStr = new Date().toISOString().split("T")[0];
				let startDate = null;
				let endDate = null;
				if (dateFilter === "today") {
					startDate = todayStr;
					endDate = todayStr;
				} else if (dateFilter === "week") {
					const w = new Date();
					w.setDate(w.getDate() - 7);
					startDate = w.toISOString().split("T")[0];
					endDate = todayStr;
				} else if (dateFilter === "month") {
					const m = new Date();
					m.setMonth(m.getMonth() - 1);
					startDate = m.toISOString().split("T")[0];
					endDate = todayStr;
				} else if (dateFilter === "year") {
					const y = new Date();
					y.setFullYear(y.getFullYear() - 1);
					startDate = y.toISOString().split("T")[0];
					endDate = todayStr;
				} else if (dateFilter === "custom" && customStartDate) {
					startDate = customStartDate;
					endDate = customStartDate;
				}

				if (startDate && endDate) {
					records = records.filter((r) => {
						if (!r.date) return false;
						return r.date >= startDate && r.date <= endDate;
					});
				}

				if (normalizedSectionFilter) {
					records = records.filter((r) => {
						const recordSectionId =
							normalizeIdValue(r.sectionId) ||
							normalizeIdValue(r.resolvedSectionId);
						if (
							recordSectionId &&
							recordSectionId === normalizedSectionFilter
						) {
							return true;
						}

						if (r.scheduleId) {
							const normalizedScheduleId = normalizeIdValue(r.scheduleId);
							const schedule = schedules.find(
								(s) => normalizeIdValue(s.id) === normalizedScheduleId
							);

							if (schedule) {
								const scheduleSectionId = normalizeIdValue(schedule.sectionId);
								if (scheduleSectionId === normalizedSectionFilter) {
									return true;
								}
							}
						}

						return false;
					});
				}

				setAttendanceRecords(records);
				calculateStats(records);
			} else {
				showSnackbar(
					"Error loading attendance records: " + attendanceResult.error,
					"error"
				);
			}
		} catch (error) {
			console.error("Error loading attendance data:", error);
			showSnackbar("Error loading data: " + error.message, "error");
		} finally {
			setLoading(false);
		}
	};

	const calculateStats = (records) => {
		const stats = {
			total: records.length,
			present: records.filter((r) => r.status === "present").length,
			absent: records.filter((r) => r.status === "absent").length,
			late: records.filter((r) => r.status === "late").length,
		};
		setStats(stats);
	};

	const filterRecords = () => {
		// Defensive filter + stable sort that handles missing/varied fields.
		let filtered = [];

		if (searchTerm.trim()) {
			filtered = attendanceRecords.filter((record) => {
				const studentInfo = resolveStudentDisplayInfo(record);
				const studentName = studentInfo.displayName.toLowerCase();
				const sectionName = (
					record.resolvedSectionName || NOT_IN_DAYCARE_LABEL
				).toLowerCase();
				const date = record.date
					? new Date(record.date).toLocaleDateString().toLowerCase()
					: "";

				return (
					studentName.includes(searchTerm.toLowerCase()) ||
					sectionName.includes(searchTerm.toLowerCase()) ||
					date.includes(searchTerm.toLowerCase())
				);
			});
		} else {
			filtered = attendanceRecords.slice();
		}

		// Helper: compute a millisecond timestamp combining date + time fields
		const parseTimeToHMS = (timeStr) => {
			if (!timeStr) return { h: 0, m: 0, s: 0 };
			const ampm = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)/i);
			if (ampm) {
				let h = parseInt(ampm[1], 10);
				const m = parseInt(ampm[2], 10);
				const s = ampm[3] ? parseInt(ampm[3], 10) : 0;
				const p = ampm[4].toUpperCase();
				if (p === "PM" && h !== 12) h += 12;
				if (p === "AM" && h === 12) h = 0;
				return { h, m, s };
			}
			const parts = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
			if (parts)
				return {
					h: parseInt(parts[1], 10),
					m: parseInt(parts[2], 10),
					s: parts[3] ? parseInt(parts[3], 10) : 0,
				};
			return { h: 0, m: 0, s: 0 };
		};

		const computeSortMs = (r) => {
			// Prefer explicit ISO-like createdAt if present
			if (r.createdAt) {
				const p = Date.parse(r.createdAt);
				if (!isNaN(p)) return p;
			}

			// If we have a date and a time field, combine them into a local Date
			if (r.date) {
				const dateParts = r.date.split("-").map((n) => parseInt(n, 10));
				if (dateParts.length === 3 && dateParts.every((n) => !isNaN(n))) {
					const [y, mo, d] = dateParts;
					const timeStr = r.timeIn || r.timeOut || r.time || "00:00";
					const { h, m, s } = parseTimeToHMS(timeStr);
					return new Date(y, mo - 1, d, h, m, s).getTime();
				}
				// fallback to parsing date string
				const pd = Date.parse(r.date);
				if (!isNaN(pd)) return pd;
			}

			// Last resorts
			const alt = Date.parse(r.timestamp || r.timeStamp || r.dateCreated || "");
			if (!isNaN(alt)) return alt;
			return 0;
		};

		// Sort copy to avoid mutating state
		const sortedFiltered = filtered.slice().sort((a, b) => {
			const ta = computeSortMs(a);
			const tb = computeSortMs(b);
			if (ta !== tb) return tb - ta; // newest first

			// Tiebreaker: prefer explicit time fields parsed to minutes
			const timeA = a.timeIn || a.timeOut || a.time || "";
			const timeB = b.timeIn || b.timeOut || b.time || "";
			const ma = parseTimeToHMS(timeA);
			const mb = parseTimeToHMS(timeB);
			const minutesA = ma.h * 60 + ma.m;
			const minutesB = mb.h * 60 + mb.m;
			if (!isNaN(minutesA) && !isNaN(minutesB) && minutesA !== minutesB)
				return minutesB - minutesA;

			// final deterministic fallback
			if (a.id && b.id) return b.id.localeCompare(a.id);
			return 0;
		});

		// If onlineOnly is requested, remove records that are fallback-detected
		let finalFiltered = sortedFiltered;
		if (onlineOnly) {
			finalFiltered = sortedFiltered.filter((r) => {
				if (r.isFallback) return false;
				if (
					r.notes &&
					typeof r.notes === "string" &&
					r.notes.toLowerCase().includes("fallback")
				)
					return false;
				return true;
			});
		}

		console.log(
			"🔍 [filterRecords] sorted count:",
			finalFiltered.length,
			"(onlineOnly:",
			onlineOnly,
			") sample:",
			finalFiltered.slice(0, 3).map((r) => {
				const studentInfo = resolveStudentDisplayInfo(r);
				return {
					id: r.id,
					date: r.date || r.createdAt,
					time: r.timeIn || r.timeOut || r.time,
					student: studentInfo.displayName,
					isFallback: !!r.isFallback,
				};
			})
		);
		setFilteredRecords(finalFiltered);
	};

	const getScheduleById = (scheduleId) => {
		const normalizedId = normalizeIdValue(scheduleId);
		return schedules.find((s) => normalizeIdValue(s.id) === normalizedId);
	};

	const getSectionByScheduleId = (scheduleId) => {
		const schedule = getScheduleById(scheduleId);
		if (schedule) {
			const normalizedScheduleId = normalizeIdValue(schedule.sectionId);
			if (!normalizedScheduleId) {
				return null;
			}
			return (
				sections.find(
					(s) => getSectionCanonicalId(s) === normalizedScheduleId
				) || null
			);
		}
		return null;
	};

	const getSectionNameByScheduleId = (scheduleId) => {
		const section = getSectionByScheduleId(scheduleId);
		if (section && isMeaningfulSectionName(section.name)) {
			return section.name;
		}
		return NOT_IN_DAYCARE_LABEL;
	};

	const getSectionNameBySectionId = (sectionId) => {
		if (!sectionId) return NOT_IN_DAYCARE_LABEL;
		const normalizedId = normalizeIdValue(sectionId);
		if (!normalizedId) return NOT_IN_DAYCARE_LABEL;
		const section = sections.find(
			(s) => getSectionCanonicalId(s) === normalizedId
		);
		if (section && isMeaningfulSectionName(section.name)) {
			return section.name;
		}
		return NOT_IN_DAYCARE_LABEL;
	};

	// getStatusColor removed; colors are determined inline where needed

	// Helper function to check if student is already assigned to another daycare center
	const checkStudentDaycareAssignment = (studentId) => {
		const { section } = resolveStudentSectionAssignment(studentId, {
			students,
			sections,
		});
		return section;
	};

	// Helper function to check for schedule conflicts
	const checkScheduleConflict = (studentId, currentSchedule) => {
		const assignedSection = checkStudentDaycareAssignment(studentId);

		if (!assignedSection) {
			return {
				hasConflict: true,
				message:
					"Student is not assigned to any daycare center. Cannot record attendance.",
			};
		}

		// Check if the student's assigned daycare center has any schedule for today
		const currentDay = getCurrentDay();
		const assignedSectionSchedules = schedules.filter(
			(schedule) =>
				schedule.day === currentDay && schedule.sectionId === assignedSection.id
		);

		// If the student's assigned daycare has no schedule for today, prevent attendance
		if (assignedSectionSchedules.length === 0) {
			return {
				hasConflict: true,
				message: `Student is assigned to ${assignedSection.name}, but this daycare center has no schedule set for ${currentDay}. Cannot record attendance.`,
				conflictingSection: assignedSection.name,
			};
		}

		// If the student is assigned to the same section as the current schedule, no conflict
		if (assignedSection.id === currentSchedule.sectionId) {
			return {
				hasConflict: false,
				message: "Student is correctly assigned to this daycare center",
			};
		}

		// Check if there are overlapping schedules for the same day
		const conflictingSchedules = schedules.filter(
			(schedule) =>
				schedule.day === currentDay &&
				schedule.sectionId === assignedSection.id &&
				schedule.id !== currentSchedule.id
		);

		if (conflictingSchedules.length === 0) {
			return {
				hasConflict: true,
				message: `Student is assigned to ${assignedSection.name}, but this daycare center has no overlapping schedule with the current attendance time. Cannot record attendance.`,
				conflictingSection: assignedSection.name,
			};
		}

		// Check for time overlap
		const currentScheduleTimes = getScheduleTimeRange(currentSchedule);
		const hasTimeOverlap = conflictingSchedules.some((schedule) => {
			const scheduleTimes = getScheduleTimeRange(schedule);
			return isTimeOverlapping(currentScheduleTimes, scheduleTimes);
		});

		if (hasTimeOverlap) {
			return {
				hasConflict: true,
				message: `Student is already assigned to ${assignedSection.name} and has a conflicting schedule at this time`,
				conflictingSection: assignedSection.name,
			};
		}

		return {
			hasConflict: true,
			message: `Student is assigned to ${assignedSection.name}, but this daycare center has no overlapping schedule with the current attendance time. Cannot record attendance.`,
			conflictingSection: assignedSection.name,
		};
	};

	// Helper function to get schedule time range
	const getScheduleTimeRange = (schedule) => {
		const timeInStart = schedule.timeInStart
			? parseTimeToMinutes(schedule.timeInStart)
			: 0;
		const timeOutEnd = schedule.timeOutEnd
			? parseTimeToMinutes(schedule.timeOutEnd)
			: 1440; // 24:00

		return {
			start: timeInStart,
			end: timeOutEnd,
		};
	};

	// Helper function to parse time string to minutes
	const parseTimeToMinutes = (timeStr) => {
		if (!timeStr) return 0;

		// Handle 12-hour format (e.g., "2:30 PM")
		if (timeStr.includes("AM") || timeStr.includes("PM")) {
			const [time, period] = timeStr.split(" ");
			const [hours, minutes] = time.split(":").map(Number);
			let hour24 = hours;

			if (period === "AM" && hours === 12) hour24 = 0;
			if (period === "PM" && hours !== 12) hour24 = hours + 12;

			return hour24 * 60 + minutes;
		}

		// Handle 24-hour format (e.g., "14:30")
		const [hours, minutes] = timeStr.split(":").map(Number);
		return hours * 60 + minutes;
	};

	// Helper function to check if two time ranges overlap
	const isTimeOverlapping = (range1, range2) => {
		return range1.start < range2.end && range2.start < range1.end;
	};

	const showSnackbar = (message, severity = "success") => {
		setSnackbar({
			open: true,
			message,
			severity,
		});
	};

	const handleCloseSnackbar = () => {
		setSnackbar((prev) => ({ ...prev, open: false }));
	};

	const handleCloseRfidModal = () => {
		console.log("🔍 AttendanceContent Debug - handleCloseRfidModal called");
		setRfidModalOpen(false);
		setRfidModalData(null);

		// After the success modal closes, automatically open the RFID scanner again
		setTimeout(() => {
			console.log("🔍 AttendanceContent Debug - Auto-restarting RFID scanner");
			handleOpenScanner(); // This will open the "Scan RFID" dialog
		}, 500); // Small delay for smooth transition
	};

	const handleRefresh = () => {
		loadAttendanceData();
	};

	const handleTabChange = (event, newValue) => {
		setTabValue(newValue);
		if (newValue === 0) {
			// Reset to today's filter when switching to Today's Attendance tab
			setDateFilter("today");
		} else {
			// Default to week view for history
			if (dateFilter === "today") {
				setDateFilter("week");
			}
		}
	};

	const handleExportClick = () => {
		setExportDialogOpen(true);
	};

	const handleExportClose = () => {
		setExportDialogOpen(false);
	};

	const filterRecordsForExport = (records, selectedSectionFilter) => {
		const normalizedSelectedSection =
			selectedSectionFilter && selectedSectionFilter !== "all"
				? normalizeIdValue(selectedSectionFilter)
				: null;

		if (!normalizedSelectedSection) {
			return records;
		}

		return records.filter((record) => {
			const recordSectionId =
				normalizeIdValue(record.sectionId) ||
				normalizeIdValue(record.resolvedSectionId);
			if (recordSectionId && recordSectionId === normalizedSelectedSection) {
				return true;
			}

			const schedule = getScheduleById(record.scheduleId);
			if (schedule) {
				const scheduleSectionId = normalizeIdValue(schedule.sectionId);
				if (scheduleSectionId === normalizedSelectedSection) {
					return true;
				}
			}

			return false;
		});
	};

	const getExportData = (records, selectedSectionFilter) => {
		const exportRecords = filterRecordsForExport(
			records,
			selectedSectionFilter
		);

		return exportRecords.map((record) => {
			const arrivalDisplay = getClassificationDisplay(
				"arrival",
				record.arrivalClassification
			);
			const departureDisplay = getClassificationDisplay(
				"departure",
				record.departureClassification
			);
			const displayDate = record.date
				? new Date(record.date).toLocaleDateString()
				: "-";
			const manualNote =
				typeof record.manualNote === "string" ? record.manualNote.trim() : "";
			const studentInfo = resolveStudentDisplayInfo(record);

			return {
				Date: displayDate,
				Student: studentInfo.displayName,
				Section:
					record.resolvedSectionName ||
					getSectionNameByScheduleId(record.scheduleId),
				Status: record.status || "Not marked",
				"Time In": formatTo12Hour(record.timeIn) || "-",
				"Arrival Status": arrivalDisplay?.label || "-",
				"Arrival Note": record.arrivalNote || "-",
				"Time Out": formatTo12Hour(record.timeOut) || "-",
				"Departure Status": departureDisplay?.label || "-",
				"Departure Note": record.departureNote || "-",
				"Teacher Note": manualNote || "-",
				"Summary Notes": record.notes || "-",
			};
		});
	};

	const exportToExcel = (selectedSectionFilter = "all") => {
		try {
			const exportData = getExportData(filteredRecords, selectedSectionFilter);

			if (exportData.length === 0) {
				showSnackbar("No data to export", "warning");
				return;
			}

			// Create workbook and worksheet
			const worksheet = XLSX.utils.json_to_sheet(exportData);
			const workbook = XLSX.utils.book_new();

			const sectionName =
				selectedSectionFilter === "all"
					? "All Daycare Centers"
					: getSectionNameBySectionId(selectedSectionFilter);

			XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

			// Auto-size columns
			const maxWidth = exportData.reduce(
				(w, r) => Math.max(w, r.Student?.length || 0),
				10
			);
			worksheet["!cols"] = [
				{ wch: 12 }, // Date
				{ wch: maxWidth }, // Student
				{ wch: 20 }, // Section
				{ wch: 12 }, // Status
				{ wch: 12 }, // Time In
				{ wch: 18 }, // Arrival Status
				{ wch: 28 }, // Arrival Note
				{ wch: 12 }, // Time Out
				{ wch: 18 }, // Departure Status
				{ wch: 28 }, // Departure Note
				{ wch: 24 }, // Teacher Note
				{ wch: 32 }, // Summary Notes
			];

			// Generate file name with date and section
			const dateRange =
				dateFilter === "today"
					? new Date().toISOString().split("T")[0]
					: customStartDate || "all";

			const fileName = `Attendance_${sectionName.replace(
				/\s+/g,
				"_"
			)}_${dateRange}.xlsx`;
			XLSX.writeFile(workbook, fileName);

			showSnackbar(
				`Attendance exported successfully: ${sectionName}`,
				"success"
			);
		} catch (error) {
			showSnackbar("Error exporting to Excel: " + error.message, "error");
		}
	};

	const exportToPDF = (selectedSectionFilter = "all") => {
		try {
			const exportRecords = filterRecordsForExport(
				filteredRecords,
				selectedSectionFilter
			);

			if (exportRecords.length === 0) {
				showSnackbar("No data to export", "warning");
				return;
			}

			const doc = new jsPDF();

			const sectionName =
				selectedSectionFilter === "all"
					? "All Daycare Centers"
					: getSectionNameBySectionId(selectedSectionFilter);

			// Title
			doc.setFontSize(18);
			doc.setTextColor(21, 101, 192);
			doc.text(`Attendance Records - ${sectionName}`, 14, 22);

			// Date
			doc.setFontSize(10);
			doc.setTextColor(100);
			doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
			doc.text(`Total Records: ${exportRecords.length}`, 14, 36);
			doc.text(`Date Filter: ${dateFilter}`, 14, 42);

			// Prepare table data
			const tableData = exportRecords.map((record) => {
				const studentInfo = resolveStudentDisplayInfo(record);
				const arrivalSummary = buildTimeSummary(record, "arrival") || "-";
				const departureSummary = buildTimeSummary(record, "departure") || "-";
				const manualNote =
					typeof record.manualNote === "string" ? record.manualNote.trim() : "";
				const fallbackNotes = (record.notes || "")
					.split("|")
					.map((note) => note.trim())
					.filter((note) => note.length && !/^Teacher note:/i.test(note));
				const noteSummary = manualNote || fallbackNotes.join(" | ") || "-";
				const displayDate = record.date
					? new Date(record.date).toLocaleDateString()
					: "-";
				return [
					displayDate,
					studentInfo.displayName,
					record.resolvedSectionName ||
						getSectionNameByScheduleId(record.scheduleId),
					record.status || "Not marked",
					arrivalSummary,
					departureSummary,
					noteSummary,
				];
			});

			// Generate table
			autoTable(doc, {
				startY: 48,
				head: [
					[
						"Date",
						"Student",
						"Daycare Center",
						"Status",
						"Arrival Detail",
						"Departure Detail",
						"Notes",
					],
				],
				body: tableData,
				theme: "grid",
				headStyles: { fillColor: [21, 101, 192], textColor: 255 },
				alternateRowStyles: { fillColor: [245, 245, 245] },
				margin: { top: 48, left: 14, right: 14 },
				styles: { fontSize: 8, cellPadding: 2 },
			});

			// Save PDF
			const dateRange =
				dateFilter === "today"
					? new Date().toISOString().split("T")[0]
					: customStartDate || "all";

			const fileName = `Attendance_${sectionName.replace(
				/\s+/g,
				"_"
			)}_${dateRange}.pdf`;
			doc.save(fileName);

			showSnackbar(
				`Attendance exported successfully: ${sectionName}`,
				"success"
			);
		} catch (error) {
			showSnackbar("Error exporting to PDF: " + error.message, "error");
		}
	};

	const handleExport = () => {
		if (sectionFilter === "all") {
			// Export all sections as separate files
			if (exportFormat === "excel" || exportFormat === "both") {
				exportToExcel("all");
				sections.forEach((section) => {
					setTimeout(() => exportToExcel(section.id), 500);
				});
			}
			if (exportFormat === "pdf" || exportFormat === "both") {
				setTimeout(
					() => {
						exportToPDF("all");
						sections.forEach((section) => {
							setTimeout(() => exportToPDF(section.id), 500);
						});
					},
					exportFormat === "both" ? 1000 : 0
				);
			}
		} else {
			// Export specific section
			if (exportFormat === "excel") {
				exportToExcel(sectionFilter);
			} else if (exportFormat === "pdf") {
				exportToPDF(sectionFilter);
			} else if (exportFormat === "both") {
				exportToExcel(sectionFilter);
				setTimeout(() => exportToPDF(sectionFilter), 500);
			}
		}
		handleExportClose();
	};

	// RFID Scan handlers
	const handleOpenScanner = async (e) => {
		if (e && e.stopPropagation) {
			e.stopPropagation();
		}
		const { value: rfid } = await Swal.fire({
			title: "Scan RFID",
			input: "text",
			inputLabel: "Place the card on the reader",
			inputPlaceholder: "RFID value...",
			inputAttributes: { autocapitalize: "off", autocomplete: "off" },
			showCancelButton: true,
			confirmButtonText: "Scan",
			confirmButtonColor: "#4caf50",
			cancelButtonColor: "#d33",
			allowOutsideClick: false,
			didOpen: () => {
				const input = Swal.getInput();
				if (input) input.focus();
			},
			preConfirm: (value) => {
				if (!value || !value.trim()) {
					Swal.showValidationMessage("Please scan an RFID value");
				}
				return value?.trim();
			},
		});

		if (!rfid) return;

		// Automatically determine attendance type based on current time and schedule
		await handleScanRFID(rfid);
	};

	const handleScanRFID = async (rfidValue) => {
		try {
			// Match RFID against registered users (parents with child info)
			const parent = students.find(
				(s) => (s.childRFID || "").trim() === rfidValue.trim()
			);
			if (!parent) {
				await Swal.fire({
					icon: "error",
					title: "RFID Not Found",
					text: "No registered user found for this RFID.",
					confirmButtonColor: "#d33",
				});
				return;
			}

			// Find the relevant schedule for today
			const currentDay = getCurrentDay();
			const relevantSchedule = schedules.find(
				(schedule) => schedule.day === currentDay
			);

			// If no relevant schedule is found for today, allow attendance to proceed
			// (do not block with a popup). This supports early/late check-ins.
			if (!relevantSchedule) {
				console.warn(
					`No schedule found for ${currentDay} - allowing attendance to proceed.`
				);
			}

			// Check for schedule conflicts before proceeding
			const conflictCheck = checkScheduleConflict(parent.uid, relevantSchedule);

			if (conflictCheck.hasConflict) {
				await Swal.fire({
					icon: "error",
					title: "Schedule Conflict",
					text: `${conflictCheck.message}. Please ensure the student is attending the correct daycare center.`,
					confirmButtonColor: "#d33",
				});
				return;
			}

			// Determine attendance type based on current time and schedule
			const attendanceInfo = determineAttendanceType(
				relevantSchedule,
				currentDay
			);

			// Allow attendance even if outside normal hours
			const attendanceType =
				attendanceInfo.type === "outside" ? "timeIn" : attendanceInfo.type;

			const parentId = parent.uid;
			const qrDataString = JSON.stringify({
				type: "parent",
				parentId,
				attendanceType,
			});

			// Process attendance via API; if API fails (including outside-hours responses),
			// fall back to writing the attendance record directly to Realtime DB so
			// the scan is not blocked by server-side validations.
			let result = null;
			try {
				result = await markAttendanceViaQR(
					qrDataString,
					parentId,
					attendanceType
				);
			} catch (e) {
				console.warn("markAttendanceViaQR threw:", e);
				result = { success: false, error: e.message };
			}

			if (result && result.success) {
				// Calculate attendance status based on actual time vs scheduled time
				const currentTime = new Date().toLocaleTimeString("en-US", {
					hour12: true,
					hour: "2-digit",
					minute: "2-digit",
				});

				// Get the scheduled time based on attendance type
				const scheduledTime =
					attendanceType === "timeIn"
						? relevantSchedule.timeInStart
						: relevantSchedule.timeOutStart;

				const statusResult = calculateAttendanceStatus(
					scheduledTime,
					currentTime
				);

				const attendanceRecord = result.data || {};
				const serverStatus = attendanceRecord.status;
				const resolvedStatus = serverStatus || statusResult.status;
				const timeOutStatus = attendanceRecord.timeOutStatus;
				const resolvedMessage =
					attendanceType === "timeOut"
						? attendanceRecord.departureNote ||
						  attendanceRecord.notes ||
						  formatAttendanceMessage(statusResult, attendanceType)
						: attendanceRecord.notes ||
						  formatAttendanceMessage(statusResult, attendanceType);

				const statusLabel = (() => {
					if (attendanceType === "timeOut") {
						switch (timeOutStatus) {
							case "late_time_out":
								return "Late Time-Out";
							case "grace_time_out":
								return "Time-Out (Grace)";
							case "on_time_time_out":
								return "On-Time Time-Out";
							default:
								return resolvedStatus === "late"
									? "Late Time-Out"
									: "Time-Out Recorded";
						}
					}
					switch (resolvedStatus) {
						case "late":
							return statusResult.minutesLate > 0
								? `Late by ${statusResult.minutesLate} min`
								: "Late Arrival";
						case "present":
							return statusResult.isOnTime
								? "Present"
								: statusResult.minutesLate > 0
								? `Present (Grace: ${statusResult.minutesLate} min late)`
								: "Present";
						case "absent":
							return "Absent";
						default:
							return (resolvedStatus || "Recorded")
								.toString()
								.replace(/_/g, " ")
								.replace(/\b\w/g, (ch) => ch.toUpperCase());
					}
				})();

				const resolvedChildFirstName =
					attendanceRecord.child?.firstName ||
					parent.childFirstName ||
					"Unknown";
				const resolvedChildMiddleName =
					attendanceRecord.child?.middleName || parent.childMiddleName || "";
				const resolvedChildLastName =
					attendanceRecord.child?.lastName || parent.childLastName || "Student";
				const resolvedChildFullName =
					buildFullName(
						resolvedChildFirstName,
						resolvedChildMiddleName,
						resolvedChildLastName
					) || `${resolvedChildFirstName} ${resolvedChildLastName}`.trim();
				let resolvedChildPhoto = extractImageUrl(
					attendanceRecord.child?.photoURL,
					attendanceRecord.child?.photoUrl,
					attendanceRecord.child?.photo,
					attendanceRecord.child?.imageUrl,
					parent.childPhoto,
					parent.childProfilePicture,
					parent.photoURL
				);
				if (
					resolvedChildPhoto &&
					!isLikelyRenderableImageUrl(resolvedChildPhoto)
				) {
					resolvedChildPhoto = null;
				}
				const resolvedChildInitials =
					buildInitialsFromName(resolvedChildFullName) || "S";

				// Prepare data for the success modal
				const modalData = {
					child: {
						...(attendanceRecord.child &&
						typeof attendanceRecord.child === "object"
							? attendanceRecord.child
							: {}),
						firstName: resolvedChildFirstName,
						middleName: resolvedChildMiddleName,
						lastName: resolvedChildLastName,
						fullName: resolvedChildFullName,
						photoURL: resolvedChildPhoto,
						initials: resolvedChildInitials,
						missingImage: !resolvedChildPhoto,
					},
					parent: {
						firstName: parent.firstName,
						lastName: parent.lastName,
						email: parent.email,
					},
					schedule: {
						sectionName: getSectionNameBySectionId(relevantSchedule.sectionId),
						timeInStart: relevantSchedule.timeInStart,
						timeInEnd: relevantSchedule.timeInEnd,
						timeOutStart: relevantSchedule.timeOutStart,
						timeOutEnd: relevantSchedule.timeOutEnd,
					},
					attendance: attendanceRecord,
					timeOutStatus,
				};

				// Show success modal
				const modalDataToShow = {
					...modalData,
					attendanceType,
					status: resolvedStatus,
					statusLabel,
					message: resolvedMessage,
				};

				console.log(
					"🔍 AttendanceContent Debug - Setting modal data:",
					modalDataToShow
				);
				console.log("🔍 AttendanceContent Debug - Status:", resolvedStatus);
				console.log(
					"🔍 AttendanceContent Debug - AttendanceType:",
					attendanceType
				);

				setRfidModalData(modalDataToShow);
				setRfidModalOpen(true);

				// Refresh attendance data to show updated records
				await loadAttendanceData();
			} else {
				// Do not show a blocking popup for server errors (e.g., "outside attendance hours").
				// Instead, attempt a local Realtime DB fallback so the attendance is recorded.
				console.warn(
					"API attendance failed or returned error, attempting Realtime DB fallback:",
					result?.error
				);
				try {
					const attendanceRef = dbRef(database, "attendance");
					const newRef = dbPush(attendanceRef);

					const nowIso = new Date().toISOString();
					const normalizationContext = { sections, schedules, students };

					// Try to determine the child's assigned section so the attendance record
					// contains a sectionId (and scheduleId when possible) instead of leaving
					// the daycare center as unknown.
					const assignmentDetails = resolveStudentSectionAssignment(
						parent.uid,
						{
							students,
							sections,
						}
					);
					const assignedSection = assignmentDetails.section;
					let fallbackScheduleId = null;
					if (!relevantSchedule && assignedSection) {
						const fallbackSchedule = schedules.find(
							(scheduleItem) =>
								scheduleItem.sectionId === assignedSection.id &&
								scheduleItem.day === getCurrentDay()
						);
						if (fallbackSchedule) fallbackScheduleId = fallbackSchedule.id;
					}

					const rawAttendanceRecord = {
						id: newRef.key,
						// Keep legacy child fields but also set studentId so UI lookup works
						childId: parent.uid,
						studentId: parent.uid,
						childName:
							parent.childFirstName || parent.childFirstName || "Student",
						childPhoto: parent.childPhoto || parent.photoURL || null,
						parentId,
						scheduleId: relevantSchedule
							? relevantSchedule.id
							: fallbackScheduleId,
						sectionId: relevantSchedule
							? relevantSchedule.sectionId
							: assignedSection
							? assignedSection.id
							: null,
						sectionName: assignedSection?.name,
						type: attendanceType,
						time: new Date().toLocaleTimeString("en-US", {
							hour12: true,
							hour: "2-digit",
							minute: "2-digit",
						}),
						createdAt: nowIso,
						notes: result?.error || "Recorded via client fallback",
						isFallback: true,
					};

					const normalizedFallbackRecord = normalizeAttendanceRecord(
						rawAttendanceRecord,
						normalizationContext
					);

					await dbSet(newRef, normalizedFallbackRecord);

					// Show non-blocking snackbar instead of modal
					showSnackbar(
						"Attendance recorded locally (offline fallback).",
						"success"
					);

					const fallbackChildFirstName = parent.childFirstName || "Unknown";
					const fallbackChildMiddleName = parent.childMiddleName || "";
					const fallbackChildLastName = parent.childLastName || "Student";
					const fallbackChildFullName =
						buildFullName(
							fallbackChildFirstName,
							fallbackChildMiddleName,
							fallbackChildLastName
						) || `${fallbackChildFirstName} ${fallbackChildLastName}`.trim();
					let fallbackChildPhoto = extractImageUrl(
						parent.childPhoto,
						parent.childProfilePicture,
						parent.photoURL
					);
					if (
						fallbackChildPhoto &&
						!isLikelyRenderableImageUrl(fallbackChildPhoto)
					) {
						fallbackChildPhoto = null;
					}
					const fallbackChildInitials =
						buildInitialsFromName(fallbackChildFullName) || "S";

					// Prepare modal data for display
					const modalDataToShow = {
						child: {
							firstName: fallbackChildFirstName,
							middleName: fallbackChildMiddleName,
							lastName: fallbackChildLastName,
							fullName: fallbackChildFullName,
							photoURL: fallbackChildPhoto,
							initials: fallbackChildInitials,
							missingImage: !fallbackChildPhoto,
						},
						parent: {
							firstName: parent.firstName,
							lastName: parent.lastName,
							email: parent.email,
						},
						schedule: {
							sectionName:
								normalizedFallbackRecord.resolvedSectionName ||
								NOT_IN_DAYCARE_LABEL,
							timeInStart: relevantSchedule?.timeInStart || null,
							timeInEnd: relevantSchedule?.timeInEnd || null,
							timeOutStart: relevantSchedule?.timeOutStart || null,
							timeOutEnd: relevantSchedule?.timeOutEnd || null,
						},
						attendance: normalizedFallbackRecord,
					};

					setRfidModalData({
						...modalDataToShow,
						attendanceType,
						status: "present",
						statusLabel: "Present",
						message: "Attendance recorded via local fallback",
					});
					setRfidModalOpen(true);

					// Refresh attendance list
					await loadAttendanceData();
				} catch (fallbackErr) {
					console.error("Realtime DB fallback failed:", fallbackErr);
					// As a last resort, show a small snackbar message indicating failure
					showSnackbar(
						"Failed to record attendance. Please try again.",
						"error"
					);
				}
			}
		} catch (error) {
			console.error("Error processing RFID:", error);
			await Swal.fire({
				icon: "error",
				title: "RFID Scan Failed",
				text: "The RFID could not be processed. Please try again.",
				confirmButtonColor: "#d33",
			});
		}
	};

	if (loading && students.length === 0) {
		return (
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					height: "50vh",
				}}
			>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box sx={{ display: "flex", flexDirection: "column" }}>
			<Paper
				sx={{
					display: "flex",
					flexDirection: "column",
					p: 4,
					mb: 4,
					background: "rgba(255, 255, 255, 0.95)",
					backdropFilter: "blur(15px)",
					border: "2px solid rgba(31, 120, 80, 0.2)",
					borderRadius: "20px",
					boxShadow: "0 8px 32px rgba(31, 120, 80, 0.2)",
				}}
			>
				{/* Header */}
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						mb: 3,
					}}
				>
					<Typography
						variant="h4"
						sx={{
							fontFamily: "Plus Jakarta Sans, sans-serif",
							fontWeight: 700,
							background:
								"linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
							backgroundClip: "text",
							WebkitBackgroundClip: "text",
							WebkitTextFillColor: "transparent",
						}}
					>
						Attendance Management
					</Typography>
					<Box sx={{ display: "flex", gap: 2 }}>
						{userProfile &&
							(userProfile.role === "teacher" ||
								userProfile.role === "admin") && (
								<Button
									variant="outlined"
									startIcon={<QrCode />}
									onClick={handleOpenScanner}
									sx={{
										borderRadius: "12px",
										px: 2,
										py: 1,
									}}
								>
									Scan RFID
								</Button>
							)}
						<Button
							startIcon={<Download />}
							onClick={handleExportClick}
							variant="contained"
							disabled={filteredRecords.length === 0}
							sx={{
								borderRadius: "12px",
								px: 3,
								py: 1,
								background:
									"linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
							}}
						>
							Export
						</Button>
						<Button
							startIcon={<Schedule />}
							onClick={handleRefresh}
							variant="outlined"
							sx={{
								borderRadius: "12px",
								px: 2,
								py: 1,
							}}
						>
							Refresh
						</Button>
					</Box>
				</Box>

				{/* Statistics Cards */}
				<Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
					<Box sx={{ flex: "1 1 calc(25% - 12px)", minWidth: "200px" }}>
						<Card
							sx={{
								display: "flex",
								flexDirection: "column",
								height: "100%",
								borderRadius: "12px",
								border: "2px solid rgba(21, 101, 192, 0.2)",
							}}
						>
							<CardContent
								sx={{ display: "flex", flexDirection: "column", flex: 1 }}
							>
								<Typography variant="body2" color="text.secondary" gutterBottom>
									Total Records
								</Typography>
								<Typography
									variant="h4"
									sx={{ fontWeight: 700, color: "primary.main" }}
								>
									{stats.total}
								</Typography>
							</CardContent>
						</Card>
					</Box>
					<Box sx={{ flex: "1 1 calc(25% - 12px)", minWidth: "200px" }}>
						<Card
							sx={{
								display: "flex",
								flexDirection: "column",
								height: "100%",
								borderRadius: "12px",
								border: "2px solid rgba(76, 175, 80, 0.2)",
							}}
						>
							<CardContent
								sx={{ display: "flex", flexDirection: "column", flex: 1 }}
							>
								<Typography variant="body2" color="text.secondary" gutterBottom>
									Present
								</Typography>
								<Typography
									variant="h4"
									sx={{ fontWeight: 700, color: "success.main" }}
								>
									{stats.present}
								</Typography>
							</CardContent>
						</Card>
					</Box>
					<Box sx={{ flex: "1 1 calc(25% - 12px)", minWidth: "200px" }}>
						<Card
							sx={{
								display: "flex",
								flexDirection: "column",
								height: "100%",
								borderRadius: "12px",
								border: "2px solid rgba(255, 152, 0, 0.2)",
							}}
						>
							<CardContent
								sx={{ display: "flex", flexDirection: "column", flex: 1 }}
							>
								<Typography variant="body2" color="text.secondary" gutterBottom>
									Late
								</Typography>
								<Typography
									variant="h4"
									sx={{ fontWeight: 700, color: "warning.main" }}
								>
									{stats.late}
								</Typography>
							</CardContent>
						</Card>
					</Box>
					<Box sx={{ flex: "1 1 calc(25% - 12px)", minWidth: "200px" }}>
						<Card
							sx={{
								display: "flex",
								flexDirection: "column",
								height: "100%",
								borderRadius: "12px",
								border: "2px solid rgba(244, 67, 54, 0.2)",
							}}
						>
							<CardContent
								sx={{ display: "flex", flexDirection: "column", flex: 1 }}
							>
								<Typography variant="body2" color="text.secondary" gutterBottom>
									Absent
								</Typography>
								<Typography
									variant="h4"
									sx={{ fontWeight: 700, color: "error.main" }}
								>
									{stats.absent}
								</Typography>
							</CardContent>
						</Card>
					</Box>
				</Box>

				{/* Tabs */}
				<Box
					sx={{
						display: "flex",
						mb: 3,
						borderBottom: 1,
						borderColor: "divider",
					}}
				>
					<Tabs
						value={tabValue}
						onChange={handleTabChange}
						sx={{ width: "100%" }}
					>
						<Tab
							icon={<Today />}
							iconPosition="start"
							label="Today's Attendance"
							sx={{ fontWeight: 600 }}
						/>
						<Tab
							icon={<History />}
							iconPosition="start"
							label="Attendance History"
							sx={{ fontWeight: 600 }}
						/>
					</Tabs>
				</Box>

				{/* Filters - Only show for Attendance History tab */}
				{tabValue === 1 && (
					<Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
						{/* Date Picker Filter */}
						<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									flex: "1 1 300px",
									minWidth: "250px",
									p: 2,
									bgcolor: "rgba(0, 0, 0, 0.03)",
									borderRadius: "12px",
									border: "1px solid rgba(0, 0, 0, 0.1)",
									cursor: "pointer",
									"&:hover": {
										bgcolor: "rgba(0, 0, 0, 0.05)",
										border: "1px solid rgba(31, 120, 80, 0.3)",
									},
								}}
								onClick={() =>
									document.getElementById("date-picker-input").showPicker()
								}
							>
								<Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
									<Typography
										variant="body2"
										color="text.secondary"
										sx={{ fontSize: "0.75rem", lineHeight: 1 }}
									>
										Taking attendance for
									</Typography>
									<Typography
										variant="body1"
										sx={{ fontWeight: 600, color: "text.primary" }}
									>
										{dateFilter === "today"
											? new Date().toLocaleDateString("en-US", {
													year: "numeric",
													month: "long",
													day: "numeric",
											  })
											: dateFilter === "custom" && customStartDate
											? new Date(customStartDate).toLocaleDateString("en-US", {
													year: "numeric",
													month: "long",
													day: "numeric",
											  })
											: "Select Date"}
									</Typography>
								</Box>
								<TextField
									id="date-picker-input"
									type="date"
									value={
										dateFilter === "today"
											? new Date().toISOString().split("T")[0]
											: dateFilter === "custom"
											? customStartDate
											: ""
									}
									onChange={(e) => {
										const selectedDate = e.target.value;
										setDateFilter("custom");
										setCustomStartDate(selectedDate);
									}}
									sx={{
										opacity: 0,
										position: "absolute",
										pointerEvents: "none",
										width: 0,
										height: 0,
									}}
								/>
								<CalendarMonth sx={{ color: "primary.main", ml: 1 }} />
							</Box>

							<Box sx={{ flex: "1 1 300px", minWidth: "200px" }}>
								<FormControl fullWidth>
									<InputLabel>Daycare Center Filter</InputLabel>
									<Select
										value={sectionFilter}
										label="Daycare Center Filter"
										onChange={(e) => setSectionFilter(e.target.value)}
										sx={{ borderRadius: "12px" }}
									>
										<MenuItem value="all">All Daycare Centers</MenuItem>
										{sectionOptions.map((section) => (
											<MenuItem key={section.id} value={section.id}>
												{section.name}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							</Box>
						</Box>

						{/* Quick Date Filters */}
						<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
							<Button
								variant={dateFilter === "today" ? "contained" : "outlined"}
								size="small"
								onClick={() => setDateFilter("today")}
								sx={{
									borderRadius: "20px",
									textTransform: "none",
									fontSize: "0.875rem",
								}}
							>
								Today
							</Button>
							<Button
								variant={dateFilter === "week" ? "contained" : "outlined"}
								size="small"
								onClick={() => setDateFilter("week")}
								sx={{
									borderRadius: "20px",
									textTransform: "none",
									fontSize: "0.875rem",
								}}
							>
								Last Week
							</Button>
							<Button
								variant={dateFilter === "month" ? "contained" : "outlined"}
								size="small"
								onClick={() => setDateFilter("month")}
								sx={{
									borderRadius: "20px",
									textTransform: "none",
									fontSize: "0.875rem",
								}}
							>
								Last Month
							</Button>
							<Button
								variant={dateFilter === "year" ? "contained" : "outlined"}
								size="small"
								onClick={() => setDateFilter("year")}
								sx={{
									borderRadius: "20px",
									textTransform: "none",
									fontSize: "0.875rem",
								}}
							>
								Last Year
							</Button>
						</Box>

						{/* Online-only toggle (filters out client fallback records) */}
						<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
							<FormControlLabel
								control={
									<Checkbox
										checked={onlineOnly}
										onChange={(e) => setOnlineOnly(e.target.checked)}
									/>
								}
								label="Online only (server)"
							/>
						</Box>

						{/* Full Width Search Bar */}
						<Box sx={{ display: "flex", width: "100%" }}>
							<TextField
								fullWidth
								placeholder="Search by student, section, or date..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<Search />
										</InputAdornment>
									),
								}}
								sx={{
									"& .MuiOutlinedInput-root": {
										borderRadius: "12px",
										backgroundColor: "rgba(255, 255, 255, 0.8)",
										"&:hover": {
											backgroundColor: "rgba(255, 255, 255, 0.9)",
										},
										"&.Mui-focused": {
											backgroundColor: "rgba(255, 255, 255, 1)",
										},
									},
								}}
							/>
						</Box>
					</Box>
				)}

				{/* Content based on tab */}
				{loading ? (
					<Box
						sx={{
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							py: 4,
						}}
					>
						<CircularProgress />
					</Box>
				) : filteredRecords.length === 0 ? (
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							py: 4,
						}}
					>
						<Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
							{tabValue === 0
								? "No attendance records for today"
								: "No attendance records found"}
						</Typography>
						<Typography variant="body2" color="text.secondary">
							{tabValue === 0
								? "Attendance records will appear here once students check in through their schedules."
								: "Try adjusting your filters or date range."}
						</Typography>
					</Box>
				) : (
					<Box sx={{ display: "flex", flexDirection: "column" }}>
						{/* Attendance Records Table */}
						<TableContainer
							sx={{
								border: "1px solid #e0e0e0",
								borderRadius: 3,
								backgroundColor: "rgba(255, 255, 255, 0.8)",
							}}
						>
							<Table>
								<TableHead>
									<TableRow sx={{ backgroundColor: "rgba(31, 120, 80, 0.05)" }}>
										<TableCell
											sx={{
												fontFamily: "Plus Jakarta Sans, sans-serif",
												fontWeight: 600,
											}}
										>
											Date
										</TableCell>
										<TableCell
											sx={{
												fontFamily: "Plus Jakarta Sans, sans-serif",
												fontWeight: 600,
											}}
										>
											Student
										</TableCell>
										<TableCell
											sx={{
												fontFamily: "Plus Jakarta Sans, sans-serif",
												fontWeight: 600,
											}}
										>
											Daycare Center
										</TableCell>
										<TableCell
											sx={{
												fontFamily: "Plus Jakarta Sans, sans-serif",
												fontWeight: 600,
											}}
										>
											Status
										</TableCell>
										<TableCell
											sx={{
												fontFamily: "Plus Jakarta Sans, sans-serif",
												fontWeight: 600,
											}}
										>
											Time In
										</TableCell>
										<TableCell
											sx={{
												fontFamily: "Plus Jakarta Sans, sans-serif",
												fontWeight: 600,
											}}
										>
											Time Out
										</TableCell>
										<TableCell
											sx={{
												fontFamily: "Plus Jakarta Sans, sans-serif",
												fontWeight: 600,
											}}
										>
											Notes
										</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{filteredRecords.map((record) => {
										const arrivalChipConfig = getClassificationDisplay(
											"arrival",
											record.arrivalClassification
										);
										const departureChipConfig = getClassificationDisplay(
											"departure",
											record.departureClassification
										);
										const formattedTimeIn =
											formatTo12Hour(record.timeIn) || "-";
										const formattedTimeOut =
											formatTo12Hour(record.timeOut) || "-";
										const teacherNote =
											typeof record.manualNote === "string"
												? record.manualNote.trim()
												: "";
										const fallbackNotes = (record.notes || "")
											.split("|")
											.map((note) => note.trim())
											.filter(
												(note) => note.length && !/^Teacher note:/i.test(note)
											);
										const studentInfo = resolveStudentDisplayInfo(record);

										return (
											<TableRow
												key={record.id || `${record.studentId}-${record.date}`}
												hover
											>
												<TableCell>
													<Typography variant="body2" fontWeight={500}>
														{record.date
															? new Date(record.date).toLocaleDateString(
																	"en-US",
																	{
																		year: "numeric",
																		month: "short",
																		day: "numeric",
																	}
															  )
															: "-"}
													</Typography>
												</TableCell>
												<TableCell>
													<Box
														sx={{
															display: "flex",
															alignItems: "center",
															gap: 1.5,
														}}
													>
														<Avatar
															src={studentInfo.photoUrl || undefined}
															sx={{
																width: 36,
																height: 36,
																fontSize: "0.9rem",
																background: studentInfo.photoUrl
																	? "transparent"
																	: "linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
																color: studentInfo.photoUrl
																	? "inherit"
																	: "#fff",
															}}
														>
															{!studentInfo.photoUrl && studentInfo.initials}
														</Avatar>
														<Box
															sx={{ display: "flex", flexDirection: "column" }}
														>
															<Typography variant="body2" fontWeight={500}>
																{studentInfo.displayName}
															</Typography>
															{studentInfo.missingImage && (
																<Typography
																	variant="caption"
																	color="text.secondary"
																>
																	No image uploaded
																</Typography>
															)}
														</Box>
													</Box>
												</TableCell>
												<TableCell>
													<Typography variant="body2" fontWeight={500}>
														{record.resolvedSectionName || NOT_IN_DAYCARE_LABEL}
													</Typography>
												</TableCell>
												<TableCell>
													<Typography
														variant="body2"
														fontWeight={500}
														sx={{
															color:
																record.status === "present"
																	? "success.main"
																	: record.status === "late"
																	? "warning.main"
																	: record.status === "absent"
																	? "error.main"
																	: "text.secondary",
														}}
													>
														{record.status || "Not marked"}
													</Typography>
												</TableCell>
												<TableCell>
													<Box
														sx={{ display: "flex", flexDirection: "column" }}
													>
														<Typography variant="body2">
															{formattedTimeIn}
														</Typography>
														{arrivalChipConfig && (
															<Chip
																size="small"
																label={arrivalChipConfig.label}
																color={arrivalChipConfig.color}
																variant="outlined"
																sx={{ mt: 0.5, alignSelf: "flex-start" }}
															/>
														)}
														{record.arrivalNote && (
															<Typography
																variant="caption"
																color="text.secondary"
																sx={{ mt: 0.5 }}
															>
																{record.arrivalNote}
															</Typography>
														)}
													</Box>
												</TableCell>
												<TableCell>
													<Box
														sx={{ display: "flex", flexDirection: "column" }}
													>
														<Typography variant="body2">
															{formattedTimeOut}
														</Typography>
														{departureChipConfig && (
															<Chip
																size="small"
																label={departureChipConfig.label}
																color={departureChipConfig.color}
																variant="outlined"
																sx={{ mt: 0.5, alignSelf: "flex-start" }}
															/>
														)}
														{record.departureNote && (
															<Typography
																variant="caption"
																color="text.secondary"
																sx={{ mt: 0.5 }}
															>
																{record.departureNote}
															</Typography>
														)}
													</Box>
												</TableCell>
												<TableCell>
													<Box
														sx={{ display: "flex", flexDirection: "column" }}
													>
														{teacherNote ? (
															<Typography variant="body2">
																{teacherNote}
															</Typography>
														) : fallbackNotes.length ? (
															fallbackNotes.map((note, index) => (
																<Typography
																	key={`${
																		record.id || record.studentId
																	}-${index}`}
																	variant="caption"
																	color="text.secondary"
																	sx={index === 0 ? {} : { mt: 0.5 }}
																>
																	{note}
																</Typography>
															))
														) : (
															<Typography
																variant="body2"
																color="text.secondary"
															>
																-
															</Typography>
														)}
													</Box>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</TableContainer>
					</Box>
				)}
			</Paper>

			{/* Export Dialog */}
			<Dialog
				open={exportDialogOpen}
				onClose={handleExportClose}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>
					<Typography variant="h6" sx={{ fontWeight: 600 }}>
						Export Attendance Records
					</Typography>
				</DialogTitle>
				<DialogContent>
					<Box sx={{ display: "flex", flexDirection: "column", py: 2 }}>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
							Current Filters:
						</Typography>
						<Box
							sx={{
								display: "flex",
								flexDirection: "column",
								gap: 0.5,
								mb: 3,
								p: 2,
								bgcolor: "rgba(0,0,0,0.03)",
								borderRadius: 2,
							}}
						>
							<Typography variant="body2">
								<strong>Date:</strong>{" "}
								{dateFilter === "today"
									? "Today"
									: dateFilter === "custom"
									? customStartDate
										? new Date(customStartDate).toLocaleDateString("en-US", {
												year: "numeric",
												month: "long",
												day: "numeric",
										  })
										: "Select Date"
									: dateFilter}
							</Typography>
							<Typography variant="body2">
								<strong>Daycare Center:</strong>{" "}
								{sectionFilter === "all"
									? "All Daycare Centers"
									: getSectionNameBySectionId(sectionFilter)}
							</Typography>
							<Typography variant="body2">
								<strong>Records:</strong> {filteredRecords.length}
							</Typography>
						</Box>

						<Divider sx={{ my: 2 }} />

						<FormControl component="fieldset">
							<Typography variant="body1" sx={{ mb: 1, fontWeight: 600 }}>
								Select Export Format:
							</Typography>
							<RadioGroup
								value={exportFormat}
								onChange={(e) => setExportFormat(e.target.value)}
							>
								<FormControlLabel
									value="excel"
									control={<Radio />}
									label={
										<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
											<TableChart fontSize="small" />
											<span>Excel (.xlsx)</span>
										</Box>
									}
								/>
								<FormControlLabel
									value="pdf"
									control={<Radio />}
									label={
										<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
											<PictureAsPdf fontSize="small" />
											<span>PDF (.pdf)</span>
										</Box>
									}
								/>
								<FormControlLabel
									value="both"
									control={<Radio />}
									label={
										<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
											<Download fontSize="small" />
											<span>Both Formats</span>
										</Box>
									}
								/>
							</RadioGroup>
						</FormControl>

						{sectionFilter === "all" && (
							<Alert severity="info" sx={{ mt: 2 }}>
								Exporting "All Daycare Centers" will create separate files for
								each section plus one combined file.
							</Alert>
						)}
					</Box>
				</DialogContent>
				<DialogActions
					sx={{
						display: "flex",
						justifyContent: "flex-end",
						gap: 1,
						px: 3,
						pb: 2,
					}}
				>
					<Button onClick={handleExportClose}>Cancel</Button>
					<Button
						onClick={handleExport}
						variant="contained"
						disabled={filteredRecords.length === 0}
						sx={{
							background:
								"linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
						}}
					>
						Export
					</Button>
				</DialogActions>
			</Dialog>

			{/* Snackbar for notifications */}
			<Snackbar
				open={snackbar.open}
				autoHideDuration={6000}
				onClose={handleCloseSnackbar}
				anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
			>
				<Alert
					onClose={handleCloseSnackbar}
					severity={snackbar.severity}
					sx={{ width: "100%" }}
				>
					{snackbar.message}
				</Alert>
			</Snackbar>

			{/* Legacy QR dialog kept for compatibility, route scans to RFID handler */}
			<QRScannerDialog
				open={qrScannerOpen}
				onClose={() => setQrScannerOpen(false)}
				onScan={(value) => handleScanRFID(value, "timeIn")}
			/>

			{/* RFID Success Modal */}
			<RFIDSuccessModal
				open={rfidModalOpen}
				onClose={handleCloseRfidModal}
				attendanceData={rfidModalData}
				attendanceType={rfidModalData?.attendanceType}
				status={rfidModalData?.status}
				statusLabel={rfidModalData?.statusLabel}
				message={rfidModalData?.message}
			/>
		</Box>
	);
};

export default AttendanceContent;
