// src/components/teacher/Results.js
import React, { useState, useEffect } from 'react';
import { getSubmissionsByRoom } from '../../services/submissionService';
import { getTestById } from '../../services/testService';
import * as XLSX from 'xlsx';
import { evaluateSubmission } from '../../utils/evaluation';

const Results = ({ roomId, roomCode }) => {
  const [submissions, setSubmissions] = useState([]);
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!roomId) return;

      try {
        const submissionsData = await getSubmissionsByRoom(roomId);

        if (submissionsData.length > 0) {
          const testData = await getTestById(submissionsData[0].testId);
          setTest(testData);
        }

        setSubmissions(submissionsData);
      } catch (error) {
        console.error('Kļūda ielādējot rezultātus:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 5000);
    return () => clearInterval(intervalId);
  }, [roomId]);

  const getRankedSubmissions = () => {
    if (!test) return [];

    return submissions
      .map((submission) => ({
        ...submission,
        evaluation: evaluateSubmission(test, submission.answers)
      }))
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
  };

  const exportToExcel = () => {
    if (!test || submissions.length === 0) {
      alert('Nav datu eksportam.');
      return;
    }

    try {
      const rankedSubmissions = getRankedSubmissions();
      const rows = rankedSubmissions.map((submission) => {
        const row = {
          Rank: submission.rank,
          Student: submission.studentName,
          Score: `${submission.evaluation.score}/${submission.evaluation.maxScore}`,
          Percentage: `${submission.evaluation.percentage.toFixed(1)}%`,
          SubmittedAt: new Date(submission.timestamp).toLocaleString()
        };

        test.questions.forEach((question, index) => {
          row[`Q${index + 1}`] = submission.answers[question.id] || '-';
        });

        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');
      XLSX.writeFile(workbook, `testa_rezultati_${roomCode}.xlsx`);
    } catch (error) {
      console.error('Kļūda eksportējot Excel:', error);
      alert('Kļūda eksportējot rezultātus. Lūdzu, mēģiniet vēlreiz.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const rankedSubmissions = getRankedSubmissions();

  if (loading) {
    return <div>Rezultāti tiek ielādēti...</div>;
  }

  return (
    <div className="results">
      <h2>Testa rezultāti</h2>
      <div className="room-info">
        <p><strong>Istabas kods:</strong> {roomCode}</p>
        <p><strong>Atbilžu skaits:</strong> {submissions.length}</p>
      </div>

      {submissions.length === 0 ? (
        <p>Pašlaik nav iesniegumu. Gaidām, kamēr skolēni pabeigs testu...</p>
      ) : (
        <>
          <table className="results-table">
            <thead>
              <tr>
                <th>Rangs</th>
                <th>Skolēns</th>
                <th>Punkti</th>
                {test?.questions.map((q, idx) => (
                  <th key={q.id}>J{idx + 1}</th>
                ))}
                <th>Atbildes laiks</th>
              </tr>
            </thead>
            <tbody>
              {rankedSubmissions.map((sub) => (
                <tr key={sub.id}>
                  <td>#{sub.rank}</td>
                  <td>{sub.studentName}</td>
                  <td>
                    {sub.evaluation.score}/{sub.evaluation.maxScore}
                    {sub.evaluation.maxScore > 0 && (
                      <span> ({sub.evaluation.percentage.toFixed(1)}%)</span>
                    )}
                  </td>
                  {test?.questions.map((q) => (
                    <td key={q.id}>
                      {sub.answers[q.id]}
                      {sub.evaluation.questionResults.find((item) => item.questionId === q.id)?.isCorrect !== null && (
                        <span className={
                          sub.evaluation.questionResults.find((item) => item.questionId === q.id)?.isCorrect
                            ? 'correct'
                            : 'incorrect'
                        }>
                          {sub.evaluation.questionResults.find((item) => item.questionId === q.id)?.isCorrect ? ' ✓' : ' ✗'}
                        </span>
                      )}
                    </td>
                  ))}
                  <td>{formatDate(sub.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={exportToExcel} className="export-btn">
            Eksportēt rezultātus Excel (.xlsx)
          </button>
        </>
      )}
    </div>
  );
};

export default Results;
