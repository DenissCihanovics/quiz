import React, { useState, useEffect, useRef } from 'react';
import { getTestById } from '../../services/testService';
import { submitAnswers } from '../../services/submissionService';
import { getQuestionCheckConfig, isAnswerCorrect } from '../../utils/evaluation';

const TakeTest = ({ roomId, testId, studentName, onTestComplete }) => {
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const isSubmittingRef = useRef(false);
  const answersRef = useRef({});
  const testRef = useRef(null);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const testData = await getTestById(testId);
        
        if (!testData) {
          setError('Tests netika atrasts');
          return;
        }
        
        setTest(testData);
        
        // Inicializēt atbildes
        const initialAnswers = {};
        testData.questions.forEach(q => {
          initialAnswers[q.id] = '';
        });
        setAnswers(initialAnswers);

        const hasTimer = Boolean(testData.hasTimer || testData.mode === 'sync');
        const minutes = Number(testData.durationMinutes) || 30;
        setRemainingSeconds(hasTimer ? minutes * 60 : null);
      } catch (error) {
        console.error('Kļūda ielādējot testu:', error);
        setError('Kļūda ielādējot testu. Lūdzu, mēģiniet vēlreiz.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTest();
  }, [testId]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    testRef.current = test;
  }, [test]);

  useEffect(() => {
    if (remainingSeconds === null) return undefined;
    if (remainingSeconds <= 0) return undefined;

    const intervalId = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          clearInterval(intervalId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [remainingSeconds]);

  useEffect(() => {
    if (remainingSeconds !== 0) return;
    performSubmit(answersRef.current, { skipConfirm: true, timedOut: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const goToNextQuestion = () => {
    if (currentQuestion < test.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const performSubmit = async (submissionAnswers, options = {}) => {
    if (isSubmittingRef.current) return;

    const activeTest = testRef.current || test;
    if (!activeTest) return;

    try {
      const unansweredQuestions = activeTest.questions.filter((q) => !submissionAnswers[q.id]);

      if (!options.skipConfirm && unansweredQuestions.length > 0) {
        const confirm = window.confirm(`Jums ir ${unansweredQuestions.length} neizpildīts jautājums(-i). Vai tomēr iesniegt?`);
        if (!confirm) return;
      }

      isSubmittingRef.current = true;
      await submitAnswers(roomId, testId, studentName, submissionAnswers);
      if (options.timedOut) {
        alert('Laiks ir beidzies. Tests automātiski iesniegts.');
      } else {
        alert('Tests veiksmīgi iesniegts!');
      }
      onTestComplete();
    } catch (error) {
      isSubmittingRef.current = false;
      console.error('Kļūda iesniedzot testu:', error);
      setError('Kļūda iesniedzot testu. Lūdzu, mēģiniet vēlreiz.');
    }
  };

  const handleSubmit = async () => {
    await performSubmit(answers, { skipConfirm: false, timedOut: false });
  };

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderMedia = (question) => {
    if (!question.mediaUrl || question.mediaType === 'none') return null;

    if (question.mediaType === 'image') {
      return (
        <div className="question-media">
          <img src={question.mediaUrl} alt="Question media" />
        </div>
      );
    }

    if (question.mediaType === 'video') {
      return (
        <div className="question-media">
          <video controls src={question.mediaUrl}>
            Jūsu pārlūks neatbalsta video atskaņošanu.
          </video>
        </div>
      );
    }

    return (
      <div className="question-media">
        <audio controls src={question.mediaUrl}>
          Jūsu pārlūks neatbalsta audio atskaņošanu.
        </audio>
      </div>
    );
  };

  if (loading) {
    return <div className="loading">Testa ielāde...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!test) {
    return <div className="not-found">Tests netika atrasts</div>;
  }

  const currentQ = test.questions[currentQuestion];
  const hasAnswer = !!answers[currentQ.id];
  const checkConfig = getQuestionCheckConfig(currentQ);
  const currentResult = isAnswerCorrect(currentQ, answers[currentQ.id]);
  const hasTimer = remainingSeconds !== null;

  return (
    <div className="take-test">
      <h2>{test.title}</h2>
      <div className="student-info">
        <p><strong>Student:</strong> {studentName}</p>
        <p><strong>Jautājums:</strong> {currentQuestion + 1} no {test.questions.length}</p>
        <p><strong>Režīms:</strong> {hasTimer ? 'Sinhrons (ar taimeri)' : 'Asinhrons (bez taimera)'}</p>
        {hasTimer && <p><strong>Atlikušais laiks:</strong> {formatTime(remainingSeconds)}</p>}
      </div>
      
      <div className="question-container">
        <h3>Jautājums {currentQuestion + 1}</h3>
        <p className="question-text">{currentQ.text}</p>
        {renderMedia(currentQ)}
        
        {currentQ.type === 'multiple-choice' ? (
          <div className="options">
            {currentQ.options.map((option, idx) => (
              <label key={idx} className="option">
                <input
                  type="radio"
                  name={`question-${currentQ.id}`}
                  value={option}
                  checked={answers[currentQ.id] === option}
                  onChange={() => handleAnswerChange(currentQ.id, option)}
                />
                <span className="option-checkmark"></span>
                <span className="option-text">{option}</span>
              </label>
            ))}
          </div>
        ) : (
          <div className="text-input">
            <textarea
              value={answers[currentQ.id] || ''}
              onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
              placeholder="Ievadiet savu atbildi šeit..."
              rows="4"
            />
          </div>
        )}

        {hasAnswer && checkConfig.hasAutoCheck && currentResult !== null && (
          <div className="text-feedback">
            {currentResult ? (
              <div className="correct">Auto-check: pareizi ✓</div>
            ) : (
              <div className="incorrect">
                <p>Auto-check: pagaidām nepareizi ✗</p>
                {checkConfig.correctAnswer && (
                  <p>Paredzētā atbilde: <strong>{checkConfig.correctAnswer}</strong></p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="navigation">
        <button 
          onClick={goToPreviousQuestion} 
          disabled={currentQuestion === 0}
          className="nav-btn prev-btn"
        >
          Iepriekšējais
        </button>
        
        {currentQuestion < test.questions.length - 1 ? (
          <button 
            onClick={goToNextQuestion} 
            className="nav-btn next-btn"
          >
            Nākamais
          </button>
        ) : (
          <button 
            onClick={handleSubmit} 
            className="submit-btn"
          >
            Pabeigt testu
          </button>
        )}
      </div>
      
      <div className="progress-indicator">
        {test.questions.map((_, idx) => (
          <span 
            key={idx} 
            className={`progress-dot ${idx === currentQuestion ? 'active' : ''} ${answers[test.questions[idx].id] ? 'answered' : ''}`}
            onClick={() => setCurrentQuestion(idx)}
          />
        ))}
      </div>
    </div>
  );
  };

export default TakeTest;