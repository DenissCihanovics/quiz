import { apiGet, apiPost } from './api';

export const createTest = async (testData) => {
  const result = await apiPost('/tests', testData);
  return result.id;
};

export const getTestById = async (testId) => {
  return apiGet(`/tests/${testId}`);
};

export const getAllTests = async () => {
  return apiGet('/tests');
};