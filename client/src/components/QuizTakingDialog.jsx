import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  LinearProgress,
  IconButton,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Chip,
  Divider
} from '@mui/material';
import {
  Close,
  QuizOutlined,
  CheckCircle,
  Cancel,
  NavigateNext,
  NavigateBefore
} from '@mui/icons-material';

const QuizTakingDialog = ({ 
  open, 
  onClose, 
  lesson,
  onSubmit,
  loading = false
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      // Reset state when dialog opens
      setCurrentQuestionIndex(0);
      setAnswers({});
      setShowResults(false);
      setScore(0);
    }
  }, [open]);

  const questions = lesson?.quizQuestions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const handleAnswerChange = (questionId, answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const calculateScore = () => {
    let correctCount = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    questions.forEach((question) => {
      totalPoints += question.points || 0;
      const userAnswer = answers[question.id];
      if (userAnswer !== undefined && userAnswer === question.correctAnswer) {
        correctCount++;
        earnedPoints += question.points || 0;
      }
    });

    return {
      correctCount,
      totalQuestions: questions.length,
      earnedPoints,
      totalPoints,
      percentage: totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
    };
  };

  const handleSubmitQuiz = async () => {
    const scoreData = calculateScore();
    setScore(scoreData);
    setShowResults(true);

    // Submit quiz results to backend
    if (onSubmit) {
      setSubmitting(true);
      try {
        await onSubmit({
          lessonId: lesson.id,
          answers,
          score: scoreData
        });
      } catch (error) {
        console.error('Error submitting quiz:', error);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleClose = () => {
    if (!showResults || confirm('Are you sure you want to close? Your progress will be lost.')) {
      onClose();
    }
  };

  if (!lesson || questions.length === 0) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <QuizOutlined sx={{ fontSize: 64, color: 'rgba(31, 120, 80, 0.3)', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No quiz available for this lesson
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(15px)',
          border: '2px solid rgba(31, 120, 80, 0.2)',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(31, 120, 80, 0.2)'
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))', 
        backgroundClip: 'text', 
        WebkitBackgroundClip: 'text', 
        WebkitTextFillColor: 'transparent',
        fontWeight: 700,
        fontSize: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <QuizOutlined sx={{ color: 'hsl(152, 65%, 28%)' }} />
          Quiz: {lesson.title}
        </Box>
        <IconButton onClick={handleClose} sx={{ color: 'hsl(152, 65%, 28%)' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {!showResults ? (
          <>
            {/* Progress Bar */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </Typography>
                <Typography variant="body2" color="primary" fontWeight={600}>
                  {Object.keys(answers).length} / {totalQuestions} answered
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: 'rgba(31, 120, 80, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))'
                  }
                }} 
              />
            </Box>

            {/* Current Question */}
            {currentQuestion && (
              <Card sx={{ mb: 3, border: '2px solid rgba(31, 120, 80, 0.2)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: 'hsl(152, 65%, 28%)', fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', flex: 1 , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
                      {currentQuestion.question}
                    </Typography>
                    <Chip 
                      label={`${currentQuestion.points} pts`} 
                      color="primary" 
                      size="small"
                      sx={{ ml: 2 }}
                    />
                  </Box>

                  <FormControl component="fieldset" fullWidth>
                    <RadioGroup
                      value={answers[currentQuestion.id] ?? ''}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, parseInt(e.target.value))}
                    >
                      {currentQuestion.options.map((option, index) => (
                        <FormControlLabel
                          key={index}
                          value={index}
                          control={<Radio />}
                          label={
                            <Typography variant="body1">
                              <strong>{String.fromCharCode(65 + index)}.</strong> {option}
                            </Typography>
                          }
                          sx={{
                            border: '1px solid rgba(31, 120, 80, 0.2)',
                            borderRadius: '8px',
                            p: 1.5,
                            mb: 1,
                            '&:hover': {
                              backgroundColor: 'rgba(31, 120, 80, 0.05)'
                            }
                          }}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
              <Button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                startIcon={<NavigateBefore />}
                sx={{ borderRadius: '12px' }}
              >
                Previous
              </Button>

              {currentQuestionIndex === totalQuestions - 1 ? (
                <Button
                  onClick={handleSubmitQuiz}
                  variant="contained"
                  disabled={Object.keys(answers).length < totalQuestions || submitting}
                  sx={{ 
                    borderRadius: '12px',
                    background: 'linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #0d47a1, hsl(220, 60%, 25%))',
                    }
                  }}
                >
                  {submitting ? <CircularProgress size={20} /> : 'Submit Quiz'}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={currentQuestionIndex === totalQuestions - 1}
                  endIcon={<NavigateNext />}
                  variant="outlined"
                  sx={{ borderRadius: '12px' }}
                >
                  Next
                </Button>
              )}
            </Box>

            {Object.keys(answers).length < totalQuestions && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Please answer all questions before submitting the quiz.
              </Alert>
            )}
          </>
        ) : (
          /* Results Section */
          <Box>
            <Card sx={{ 
              mb: 3, 
              background: score.percentage >= 70 
                ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(76, 175, 80, 0.05))' 
                : 'linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(255, 152, 0, 0.05))',
              border: `2px solid ${score.percentage >= 70 ? '#4caf50' : '#ff9800'}`
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                {score.percentage >= 70 ? (
                  <CheckCircle sx={{ fontSize: 64, color: '#4caf50', mb: 2 }} />
                ) : (
                  <Cancel sx={{ fontSize: 64, color: '#ff9800', mb: 2 }} />
                )}
                
                <Typography variant="h4" fontWeight={700} sx={{ color: score.percentage >= 70 ? '#4caf50' : '#ff9800', mb: 1 , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
                  {score.percentage}%
                </Typography>
                
                <Typography variant="h6" color="text.secondary" sx={{ mb: 3 , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
                  {score.percentage >= 70 ? 'Great job!' : 'Keep practicing!'}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="h5" fontWeight={600}>
                      {score.correctCount} / {score.totalQuestions}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Correct Answers
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight={600}>
                      {score.earnedPoints} / {score.totalPoints}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Points Earned
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Detailed Results */}
            <Typography variant="h6" sx={{ color: 'hsl(152, 65%, 28%)', fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', mb: 2 , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
              Review Your Answers
            </Typography>

            {questions.map((question, index) => {
              const userAnswer = answers[question.id];
              const isCorrect = userAnswer === question.correctAnswer;

              return (
                <Card 
                  key={question.id} 
                  sx={{ 
                    mb: 2, 
                    border: `2px solid ${isCorrect ? '#4caf50' : '#f44336'}`,
                    backgroundColor: isCorrect ? 'rgba(76, 175, 80, 0.05)' : 'rgba(244, 67, 54, 0.05)'
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="body1" fontWeight={600}>
                        {index + 1}. {question.question}
                      </Typography>
                      {isCorrect ? (
                        <CheckCircle sx={{ color: '#4caf50', ml: 2 }} />
                      ) : (
                        <Cancel sx={{ color: '#f44336', ml: 2 }} />
                      )}
                    </Box>

                    <Box sx={{ ml: 2 }}>
                      <Typography variant="body2" sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#4caf50', mb: 0.5 }}>
                        <strong>Correct Answer:</strong> {String.fromCharCode(65 + question.correctAnswer)}. {question.options[question.correctAnswer]}
                      </Typography>
                      
                      {!isCorrect && userAnswer !== undefined && (
                        <Typography variant="body2" sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#f44336' }}>
                          <strong>Your Answer:</strong> {String.fromCharCode(65 + userAnswer)}. {question.options[userAnswer]}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button 
          onClick={onClose}
          variant={showResults ? "contained" : "outlined"}
          sx={{ 
            borderRadius: '12px',
            ...(showResults && {
              background: 'linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))',
              '&:hover': {
                background: 'linear-gradient(45deg, #0d47a1, hsl(220, 60%, 25%))',
              }
            })
          }}
        >
          {showResults ? 'Close' : 'Cancel'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuizTakingDialog;


