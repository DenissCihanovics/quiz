import { apiGet, apiPost } from './api';

export const submitAnswers = async (roomId, testId, studentName, answers) => {
  const result = await apiPost('/submissions', {
    roomId,
    testId,
    studentName,
    answers
  });
  return result.id;
};

export const getSubmissionsByRoom = async (roomId) => {
  return apiGet(`/submissions/room/${roomId}`);
};

export const prepareDataForExport = async (roomId) => {
  return getSubmissionsByRoom(roomId);
};