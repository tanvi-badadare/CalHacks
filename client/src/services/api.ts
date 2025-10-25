import axios from 'axios';
import { Problem, Session, HintResponse, SessionUpdate } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const problemService = {
  getAll: async (): Promise<Problem[]> => {
    const response = await api.get('/problems');
    return response.data;
  },

  getById: async (id: string): Promise<Problem> => {
    const response = await api.get(`/problems/${id}`);
    return response.data;
  },

  getByFilters: async (difficulty?: string, language?: string, category?: string): Promise<Problem[]> => {
    const params = new URLSearchParams();
    if (difficulty) params.append('difficulty', difficulty);
    if (language) params.append('language', language);
    if (category) params.append('category', category);
    
    const response = await api.get(`/problems?${params.toString()}`);
    return response.data;
  },
};

export const hintService = {
  getHint: async (problemId: string, level: number): Promise<HintResponse> => {
    const response = await api.get(`/hints/${problemId}/${level}`);
    return response.data;
  },
};

export const sessionService = {
  create: async (problemId: string): Promise<Session> => {
    const response = await api.post('/sessions', { problemId });
    return response.data;
  },

  getById: async (sessionId: string): Promise<Session> => {
    const response = await api.get(`/sessions/${sessionId}`);
    return response.data;
  },

  update: async (sessionId: string, data: SessionUpdate): Promise<Session> => {
    const response = await api.put(`/sessions/${sessionId}`, data);
    return response.data;
  },
};
