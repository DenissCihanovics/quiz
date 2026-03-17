import React, { useState, useEffect } from 'react';
import { getSubmissionsByRoom } from '../../services/submissionService';
import { getTestById } from '../../services/testService';
import Chart from './charts';
import { evaluateSubmission, getQuestionCheckConfig } from '../../utils/evaluation';

const Statistics = ({ roomId, roomCode }) => {
  const [submissions, setSubmissions] = useState([]);
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    averageScore: 0,
    questionStats: [],
    ranking: []
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!roomId) return;
      
      try {
        const submissionsData = await getSubmissionsByRoom(roomId);
        
        if (submissionsData.length > 0) {
          const testData = await getTestById(submissionsData[0].testId);
          setTest(testData);
          setSubmissions(submissionsData);
          
          // Aprēķinām statistiku
          if (testData) {
            calculateStats(testData, submissionsData);
          }
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Kļūda, iegūstot datus:', error);
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Atjauninām datus ik pēc 10 sekundēm
    const intervalId = setInterval(fetchData, 10000);
    return () => clearInterval(intervalId);
  }, [roomId]);

  const calculateStats = (testData, submissionsData) => {
    if (!testData || !submissionsData.length) return;
    
    const totalStudents = submissionsData.length;

    const rankedSubmissions = submissionsData
      .map((submission) => {
        const evaluation = evaluateSubmission(testData, submission.answers);
        return {
          ...submission,
          evaluation
        };
      })
      .sort((a, b) => {
        if (b.evaluation.percentage !== a.evaluation.percentage) {
          return b.evaluation.percentage - a.evaluation.percentage;
        }
        return new Date(a.timestamp) - new Date(b.timestamp);
      })
      .map((submission, index) => ({
        ...submission,
        rank: index + 1
      }));

    const questionStats = testData.questions.map(question => {
      const answersForQuestion = submissionsData.map(sub => sub.answers[question.id]);

      const answerCounts = {};
      answersForQuestion.forEach(answer => {
        if (!answer) return;
        answerCounts[answer] = (answerCounts[answer] || 0) + 1;
      });

      const checkConfig = getQuestionCheckConfig(question);
      let correctPercentage = 0;
      if (checkConfig.hasAutoCheck) {
        const correctCount = rankedSubmissions.filter((submission) => {
          return submission.evaluation.questionResults.find(
            (result) => result.questionId === question.id
          )?.isCorrect;
        }).length;
        correctPercentage = totalStudents > 0 ? (correctCount / totalStudents) * 100 : 0;
      }
      
      return {
        questionId: question.id,
        questionText: question.text,
        answerCounts,
        correctPercentage,
        mostCommonAnswer: Object.entries(answerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Nav atbilžu'
      };
    });

    const averageScore = rankedSubmissions.length
      ? rankedSubmissions.reduce((sum, item) => sum + item.evaluation.percentage, 0) / rankedSubmissions.length
      : 0;
    
    setStats({
      totalStudents,
      averageScore,
      questionStats,
      ranking: rankedSubmissions
    });
    
    setLoading(false);
  };

  // Palīgfunkcija, lai noteiktu krāsu pēc pareizo atbilžu procenta
  const getColorByPercentage = (percentage) => {
    if (percentage >= 80) return '#4CAF50'; // Zaļš
    if (percentage >= 60) return '#8BC34A'; // Gaiši zaļš
    if (percentage >= 40) return '#FFC107'; // Dzeltens
    if (percentage >= 20) return '#FF9800'; // Oranžs
    return '#F44336'; // Sarkans
  };

  // Sagatavo dati diagrammai par rezultātiem
  const prepareChartData = () => {
    if (!stats.questionStats.length) return null;
    
    return {
      labels: stats.questionStats.map((_, index) => `Jautājums ${index + 1}`),
      values: stats.questionStats.map(q => q.correctPercentage || 0),
      colors: stats.questionStats.map(q => getColorByPercentage(q.correctPercentage || 0))
    };
  };

  if (loading) {
    return <div className="loading-spinner"></div>;
  }

  if (!test || submissions.length === 0) {
    return <div className="empty-state">Nav pietiekami datu, lai attēlotu statistiku.</div>;
  }

  const chartData = prepareChartData();

  return (
    <div className="statistics">
      <h2>Statistika par testu</h2>
      <p><strong>Istabas kods:</strong> {roomCode}</p>
      <div className="stats-summary">
        <div className="stat-card">
          <h3>Kopējais skolēnu skaits</h3>
          <div className="stat-value">{stats.totalStudents}</div>
        </div>
        
        <div className="stat-card">
          <h3>Vidējais rezultāts</h3>
          <div className="stat-value">{stats.averageScore.toFixed(1)}%</div>
        </div>
      </div>
      
      {chartData && (
        <div className="chart-container">
          <h3 className="chart-title">Rezultāti par jautājumiem</h3>
          <Chart 
            type="bar" 
            data={chartData}
            options={{
              title: 'Pareizo atbilžu procents',
              width: 600,
              height: 300
            }}
          />
        </div>
      )}
      
      <h3>Statistika par jautājumiem</h3>
      <div className="question-stats">
        {stats.questionStats.map((qStat, index) => (
          <div key={qStat.questionId} className="question-stat-card">
            <h4>Jautājums {index + 1}: {qStat.questionText}</h4>
            
            {getQuestionCheckConfig(test.questions[index]).hasAutoCheck && (
              <div className="correct-percentage">
                <strong>Pareizo atbilžu procents:</strong> {qStat.correctPercentage.toFixed(1)}%
                <div className="progress-bar">
                  <div 
                    className="progress" 
                    style={{ width: `${qStat.correctPercentage}%`, backgroundColor: getColorByPercentage(qStat.correctPercentage) }}
                  ></div>
                </div>
              </div>
            )}
            
            <div className="answer-distribution">
              <strong>Atbilžu sadalījums:</strong>
              {Object.entries(qStat.answerCounts).length > 0 ? (
                <ul>
                  {Object.entries(qStat.answerCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([answer, count]) => (
                      <li key={answer}>
                        <span className="answer-text">
                          {answer} {test.questions[index].correctAnswer === answer && '✓'}
                        </span>
                        <span className="answer-count">
                          {count} ({((count / stats.totalStudents) * 100).toFixed(1)}%)
                        </span>
                        <div className="progress-bar small">
                          <div 
                            className="progress" 
                            style={{ 
                              width: `${(count / stats.totalStudents) * 100}%`,
                              backgroundColor: test.questions[index].correctAnswer === answer ? '#4CAF50' : '#2196F3'
                            }}
                          ></div>
                        </div>
                      </li>
                    ))}
                </ul>
              ) : (
                <p>Nav datu par atbildēm</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <h3>Reitings</h3>
      <table className="results-table">
        <thead>
          <tr>
            <th>Rangs</th>
            <th>Skolēns</th>
            <th>Rezultāts</th>
            <th>Iesniegts</th>
          </tr>
        </thead>
        <tbody>
          {stats.ranking.map((row) => (
            <tr key={row.id}>
              <td>#{row.rank}</td>
              <td>{row.studentName}</td>
              <td>
                {row.evaluation.score}/{row.evaluation.maxScore} ({row.evaluation.percentage.toFixed(1)}%)
              </td>
              <td>{new Date(row.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Statistics;
