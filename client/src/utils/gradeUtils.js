export const LETTER_GRADE_DETAILS = {
	A: {
		description: "Outstanding",
		minScore: 90,
		chipColor: "#2e7d32",
	},
	B: {
		description: "Very Good",
		minScore: 80,
		chipColor: "#388e3c",
	},
	C: {
		description: "Satisfactory",
		minScore: 70,
		chipColor: "#f9a825",
	},
	D: {
		description: "Developing",
		minScore: 60,
		chipColor: "#fb8c00",
	},
	E: {
		description: "Emerging",
		minScore: 0,
		chipColor: "#e53935",
	},
};

export const LETTER_GRADE_VALUES = Object.keys(LETTER_GRADE_DETAILS);

export const normalizeLetterGrade = (value) => {
	if (typeof value !== "string") {
		return null;
	}

	const trimmed = value.trim().toUpperCase();
	return LETTER_GRADE_DETAILS[trimmed] ? trimmed : null;
};

export const numericToLetterGrade = (numeric) => {
	if (!Number.isFinite(numeric)) {
		return null;
	}

	if (numeric >= LETTER_GRADE_DETAILS.A.minScore) return "A";
	if (numeric >= LETTER_GRADE_DETAILS.B.minScore) return "B";
	if (numeric >= LETTER_GRADE_DETAILS.C.minScore) return "C";
	if (numeric >= LETTER_GRADE_DETAILS.D.minScore) return "D";
	return "E";
};

export const coerceToLetterGrade = (value) => {
	const normalized = normalizeLetterGrade(value);
	if (normalized) {
		return normalized;
	}

	const numeric = Number(value);
	if (!Number.isNaN(numeric)) {
		return numericToLetterGrade(numeric);
	}

	return null;
};

export const formatLetterGrade = (value, options = {}) => {
	const letter = coerceToLetterGrade(value);
	if (!letter) {
		return typeof value === "string" ? value : value ?? "";
	}

	const { includeDescription = true, separator = " - " } = options;
	const detail = LETTER_GRADE_DETAILS[letter];

	if (!includeDescription || !detail?.description) {
		return letter;
	}

	return `${letter}${separator}${detail.description}`;
};

export const getLetterGradeChipColor = (value) => {
	const letter = coerceToLetterGrade(value);
	return letter ? LETTER_GRADE_DETAILS[letter].chipColor : "#757575";
};

export const isLetterGradeValue = (value) =>
	Boolean(normalizeLetterGrade(value));
