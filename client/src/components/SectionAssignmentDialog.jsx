import { Add, Delete, School, Search } from "@mui/icons-material";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { getAllSections } from "../utils/sectionService";
import {
  assignSectionToSkill,
  getSkillSections,
  removeSectionFromSkill,
} from "../utils/skillService";

const SectionAssignmentDialog = ({
  open,
  onClose,
  skillId,
  skillName,
  onAssignmentChange,
}) => {
  const [sections, setSections] = useState([]);
  const [assignedSections, setAssignedSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSection, setSelectedSection] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && skillId) {
      loadSections();
      loadAssignedSections();
    }
  }, [open, skillId]);

  const loadSections = async () => {
    setLoading(true);
    try {
      const result = await getAllSections();
      if (result.success) {
        setSections(result.data);
      } else {
        setError("Error loading sections: " + result.error);
      }
    } catch (error) {
      setError("Error loading sections: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignedSections = async () => {
    try {
      const result = await getSkillSections(skillId);
      if (result.success) {
        setAssignedSections(result.data);
      }
    } catch (error) {
      console.error("Error loading assigned sections:", error);
    }
  };

  const handleAssignSection = async () => {
    if (!selectedSection) return;

    setLoading(true);
    try {
      const result = await assignSectionToSkill(skillId, selectedSection.id);
      if (result.success) {
        setAssignedSections((prev) => [...prev, selectedSection]);
        setSelectedSection(null);
        if (onAssignmentChange) {
          onAssignmentChange();
        }
      } else {
        setError("Error assigning section: " + result.error);
      }
    } catch (error) {
      setError("Error assigning section: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSection = async (sectionId) => {
    setLoading(true);
    try {
      const result = await removeSectionFromSkill(skillId, sectionId);
      if (result.success) {
        setAssignedSections((prev) =>
          prev.filter((section) => section.id !== sectionId)
        );
        if (onAssignmentChange) {
          onAssignmentChange();
        }
      } else {
        setError("Error removing section: " + result.error);
      }
    } catch (error) {
      setError("Error removing section: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredSections = sections.filter((section) => {
    const isNotAssigned = !assignedSections.some(
      (assigned) => assigned.id === section.id
    );
    const matchesSearch =
      section.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.grade?.toLowerCase().includes(searchTerm.toLowerCase());
    return isNotAssigned && matchesSearch;
  });

  const handleClose = () => {
    setError("");
    setSearchTerm("");
    setSelectedSection(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(15px)",
          border: "2px solid rgba(31, 120, 80, 0.2)",
          borderRadius: "20px",
          boxShadow: "0 8px 32px rgba(31, 120, 80, 0.2)",
        },
      }}>
      <DialogTitle
        sx={{
          background:
            "linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontWeight: 700,
          fontSize: "1.5rem",
        }}>
        Assign Daycare Centers to Skill: {skillName}
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {/* Add Section Section */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              color: "hsl(152, 65%, 28%)",
              fontWeight: 600,
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontWeight: 700,
            }}>
            Add Section
          </Typography>

          <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
            <Autocomplete
              options={filteredSections}
              getOptionLabel={(option) =>
                `${option.name} (Grade ${option.grade})`
              }
              value={selectedSection}
              onChange={(event, newValue) => setSelectedSection(newValue)}
              sx={{ flex: 1, minWidth: "400px" }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Section"
                  placeholder="Search sections..."
                  variant="outlined"
                  size="small"
                  sx={{
                    width: "100%",
                    "& .MuiOutlinedInput-root": {
                      minWidth: "350px",
                    },
                  }}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ minWidth: "350px" }}>
                  <Box sx={{ width: "100%" }}>
                    <Typography variant="body2" fontWeight={600}>
                      {option.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Grade {option.grade} • Capacity: {option.capacity} •
                      Students: {option.assignedStudents?.length || 0}
                    </Typography>
                  </Box>
                </Box>
              )}
              disabled={loading}
            />

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAssignSection}
              disabled={!selectedSection || loading}
              sx={{
                background:
                  "linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
                minWidth: 120,
                maxWidth: 150,
                flexShrink: 0,
              }}>
              Assign
            </Button>
          </Box>

          {/* Search Filter */}
          <TextField
            fullWidth
            size="small"
            placeholder="Search sections by name or grade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <Search sx={{ mr: 1, color: "text.secondary" }} />
              ),
            }}
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                minWidth: "350px",
              },
            }}
          />
        </Box>

        {/* Assigned Daycare Centers */}
        <Box>
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              color: "hsl(152, 65%, 28%)",
              fontWeight: 600,
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontWeight: 700,
            }}>
            Assigned Daycare Centers ({assignedSections.length})
          </Typography>

          {assignedSections.length === 0 ? (
            <Box
              sx={{
                textAlign: "center",
                py: 4,
                backgroundColor: "rgba(31, 120, 80, 0.05)",
                borderRadius: "12px",
                border: "2px dashed rgba(31, 120, 80, 0.3)",
              }}>
              <School
                sx={{ fontSize: 48, color: "rgba(31, 120, 80, 0.5)", mb: 2 }}
              />
              <Typography variant="body1" color="text.secondary">
                No sections assigned to this skill yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Use the form above to assign sections
              </Typography>
            </Box>
          ) : (
            <TableContainer
              component={Paper}
              sx={{
                boxShadow: "none",
                border: "1px solid rgba(31, 120, 80, 0.2)",
                borderRadius: "12px",
              }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "rgba(31, 120, 80, 0.05)" }}>
                    <TableCell
                      sx={{ fontWeight: 600, color: "hsl(152, 65%, 28%)" }}>
                      Daycare Centers
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 600, color: "hsl(152, 65%, 28%)" }}>
                      Capacity
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 600, color: "hsl(152, 65%, 28%)" }}>
                      Students
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        color: "hsl(152, 65%, 28%)",
                        textAlign: "center",
                      }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assignedSections.map((section) => (
                    <TableRow key={section.id} hover>
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{ color: "hsl(152, 65%, 28%)" }}>
                          {section.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {section.capacity}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {section.assignedStudents?.length || 0} students
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        <Tooltip title="Remove Section">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveSection(section.id)}
                            disabled={loading}
                            sx={{
                              "&:hover": {
                                backgroundColor: "rgba(244, 67, 54, 0.1)",
                              },
                            }}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={{ borderRadius: "8px" }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SectionAssignmentDialog;
