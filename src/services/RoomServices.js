import { apiDelete, apiGet, apiPatch, apiPost } from './api';

export const createRoom = async (testId) => {
  return apiPost('/rooms', { testId });
};

export const activateRoom = async (roomId) => {
  return apiPatch(`/rooms/${roomId}/activate`);
};

export const getRoomByCode = async (code) => {
  return apiGet(`/rooms/code/${code}`);
};

export const getRoomById = async (id) => {
  return apiGet(`/rooms/${id}`);
};

export const getAllRooms = async () => {
  return apiGet('/rooms');
};

export const deleteRoom = async (roomId) => {
  return apiDelete(`/rooms/${roomId}`);
};