import React, { useState } from 'react';
import { createTest } from '../../services/testService';

const createQuestion = (id, type = 'multiple-choice') => ({
  id,
  text: '',
  type,
  options: type === 'multiple-choice' ? ['', ''] : [],
  mediaType: 'none',
  mediaUrl: '',
  correctAnswer: '',
  autoCheckMode: 'exact',
  autoCheckKeywords: []
});

const TestCreator = ({ onTestCreated }) => {
  const [testTitle, setTestTitle] = useState('');
  const [questions, setQuestions] = useState([
    createQuestion('1', 'multiple-choice'),
    createQuestion('2', 'text-input')
  ]);
  const [mode, setMode] = useState('async');
  const [durationMinutes, setDurationMinutes] = useState(30);

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...questions].map((question, questionIndex) => {
      if (questionIndex !== index) return question;

      const updatedQuestion = { ...question, [field]: value };

      if (field === 'type') {
        if (value === 'multiple-choice') {
          updatedQuestion.options = question.options?.length ? question.options : ['', ''];
          updatedQuestion.autoCheckMode = 'exact';
          updatedQuestion.autoCheckKeywords = [];
        } else {
          updatedQuestion.options = [];
        }
      }

      return updatedQuestion;
    });

    setQuestions(updatedQuestions);
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(updatedQuestions);
  };

  const addOption = (questionIndex) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options.push('');
    setQuestions(updatedQuestions);
  };

  const handleKeywordsChange = (questionIndex, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].autoCheckKeywords = value
      .split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean);
    setQuestions(updatedQuestions);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      createQuestion((questions.length + 1).toString(), 'multiple-choice')
    ]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!testTitle.trim()) {
      alert('Lūdzu, ievadiet testa nosaukumu');
      return;
    }

    if (mode === 'sync' && (!Number.isFinite(Number(durationMinutes)) || Number(durationMinutes) <= 0)) {
      alert('Lūdzu, norādiet taimera ilgumu minūtēs (vairāk par 0).');
      return;
    }

    for (const question of questions) {
      if (!question.text.trim()) {
        alert('Lūdzu, aizpildiet visus jautājumu tekstus');
        return;
      }

      if (question.type === 'multiple-choice') {
        for (const option of question.options) {
          if (!option.trim()) {
            alert('Lūdzu, aizpildiet visus atbilžu variantus');
            return;
          }
        }
      }
    }

    try {
      const testId = await createTest({
        title: testTitle,
        mode,
        hasTimer: mode === 'sync',
        durationMinutes: mode === 'sync' ? Number(durationMinutes) : null,
        questions: questions.map((question) => ({
          ...question,
          autoCheckKeywords: question.type === 'text-input' ? question.autoCheckKeywords : []
        })),
        createdAt: new Date()
      });

      console.log('Tests izveidots ar ID:', testId);

      alert('Tests veiksmīgi izveidots!');
      onTestCreated(testId);
    } catch (error) {
      console.error('Kļūda veidojot testu:', error);
      alert('Radās kļūda veidojot testu. Lūdzu, mēģiniet vēlreiz.');
    }
  };

  return (
    <div className="test-creator">
      <h2>Izveidot jaunu testu</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Testa nosaukums:</label>
          <input
            type="text"
            value={testTitle}
            onChange={(e) => setTestTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Režīms:</label>
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="async">Asinhrons (bez taimera)</option>
            <option value="sync">Sinhrons (ar taimeri)</option>
          </select>
        </div>

        {mode === 'sync' && (
          <div className="form-group">
            <label>Taimera ilgums (minūtēs):</label>
            <input
              type="number"
              min="1"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              required
            />
          </div>
        )}

        <h3>Jautājumi</h3>
        {questions.map((question, questionIndex) => (
          <div key={question.id} className="question-container">
            <h4>Jautājums {questionIndex + 1}</h4>
            <div className="form-group">
              <label>Jautājuma teksts:</label>
              <textarea
                value={question.text}
                onChange={(e) => handleQuestionChange(questionIndex, 'text', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Jautājuma tips:</label>
              <select
                value={question.type}
                onChange={(e) => handleQuestionChange(questionIndex, 'type', e.target.value)}
              >
                <option value="multiple-choice">Izvēle no variantiem</option>
                <option value="text-input">Teksta ievade</option>
              </select>
            </div>

            {question.type === 'multiple-choice' && (
              <div className="options-container">
                <label>Atbilžu varianti:</label>
                {question.options.map((option, optionIndex) => (
                  <input
                    key={optionIndex}
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(questionIndex, optionIndex, e.target.value)}
                    placeholder={`Variants ${optionIndex + 1}`}
                    required
                  />
                ))}
                <button
                  type="button"
                  onClick={() => addOption(questionIndex)}
                  className="add-option-btn"
                >
                  Pievienot variantu
                </button>
              </div>
            )}

            <div className="form-group">
              <label>Pievienot mediju (nav obligāti):</label>
              <select
                value={question.mediaType}
                onChange={(e) => handleQuestionChange(questionIndex, 'mediaType', e.target.value)}
              >
                <option value="none">Bez medija</option>
                <option value="image">Attēls (image URL)</option>
                <option value="video">Video (video URL)</option>
                <option value="audio">Audio (audio URL)</option>
              </select>
            </div>

            {question.mediaType !== 'none' && (
              <div className="form-group">
                <label>Medija URL:</label>
                <input
                  type="url"
                  value={question.mediaUrl}
                  onChange={(e) => handleQuestionChange(questionIndex, 'mediaUrl', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            )}

            <div className="form-group">
              <label>Auto-pārbaude (nav obligāti):</label>
              {question.type === 'multiple-choice' ? (
                <select
                  value={question.correctAnswer}
                  onChange={(e) => handleQuestionChange(questionIndex, 'correctAnswer', e.target.value)}
                >
                  <option value="">Nav pareizās atbildes</option>
                  {question.options.map((option, idx) => (
                    <option key={idx} value={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={question.correctAnswer}
                  onChange={(e) => handleQuestionChange(questionIndex, 'correctAnswer', e.target.value)}
                  placeholder="Paredzamā atbilde (nav obligāti)"
                />
              )}
            </div>

            {question.type === 'text-input' && (
              <>
                <div className="form-group">
                  <label>Auto-pārbaudes režīms:</label>
                  <select
                    value={question.autoCheckMode}
                    onChange={(e) => handleQuestionChange(questionIndex, 'autoCheckMode', e.target.value)}
                  >
                    <option value="exact">Exact match</option>
                    <option value="contains">Answer contains expected text</option>
                    <option value="keywords">Keywords (all must be present)</option>
                  </select>
                </div>

                {question.autoCheckMode === 'keywords' && (
                  <div className="form-group">
                    <label>Atslēgvārdi (atdali ar komatiem):</label>
                    <input
                      type="text"
                      value={question.autoCheckKeywords.join(', ')}
                      onChange={(e) => handleKeywordsChange(questionIndex, e.target.value)}
                      placeholder="piem.: DNS, kodols, šūna"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        ))}

        <button type="button" onClick={addQuestion} className="add-question-btn">
          Pievienot vēl vienu jautājumu
        </button>

        <button type="submit" className="submit-btn">
          Izveidot testu
        </button>
      </form>
    </div>
  );
};

export default TestCreator;
