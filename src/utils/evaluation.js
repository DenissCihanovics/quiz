const normalizeText = (value = '') => value.toString().trim().toLowerCase();

export const getQuestionCheckConfig = (question) => {
  if (!question) {
    return {
      hasAutoCheck: false,
      correctAnswer: '',
      mode: 'exact',
      keywords: []
    };
  }

  const correctAnswer = question.correctAnswer || '';
  const mode = question.autoCheckMode || 'exact';
  const keywords = Array.isArray(question.autoCheckKeywords)
    ? question.autoCheckKeywords
    : [];

  return {
    hasAutoCheck: Boolean(correctAnswer || keywords.length),
    correctAnswer,
    mode,
    keywords
  };
};

export const isAnswerCorrect = (question, answer) => {
  const { hasAutoCheck, correctAnswer, mode, keywords } = getQuestionCheckConfig(question);
  if (!hasAutoCheck) return null;

  if (!answer || !answer.toString().trim()) return false;

  const normalizedAnswer = normalizeText(answer);
  const normalizedCorrect = normalizeText(correctAnswer);

  if (question.type === 'multiple-choice') {
    return normalizedAnswer === normalizedCorrect;
  }

  if (mode === 'contains' && normalizedCorrect) {
    return normalizedAnswer.includes(normalizedCorrect);
  }

  if (mode === 'keywords' && keywords.length > 0) {
    return keywords.every((keyword) =>
      normalizedAnswer.includes(normalizeText(keyword))
    );
  }

  return normalizedAnswer === normalizedCorrect;
};

export const evaluateSubmission = (test, answers = {}) => {
  if (!test?.questions?.length) {
    return {
      score: 0,
      maxScore: 0,
      percentage: 0,
      questionResults: []
    };
  }

  const questionResults = test.questions.map((question) => {
    const answer = answers[question.id] || '';
    const result = isAnswerCorrect(question, answer);

    return {
      questionId: question.id,
      answer,
      isCorrect: result
    };
  });

  const autoChecked = questionResults.filter((item) => item.isCorrect !== null);
  const score = autoChecked.filter((item) => item.isCorrect).length;
  const maxScore = autoChecked.length;
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

  return {
    score,
    maxScore,
    percentage,
    questionResults
  };
};
