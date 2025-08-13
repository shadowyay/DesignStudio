import type { IFrontendUser, RegisterData, ICreateTaskData } from './types';

// API utility for frontend to connect to backend
export const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api`;

export async function acceptTask(taskId: string, volunteerId: string, token: string) {
  const res = await fetch(`${API_URL}/tasks/${taskId}/accept/${volunteerId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function register(data: RegisterData) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function getTasks() {
  const res = await fetch(`${API_URL}/tasks`);
  return res.json();
}

export async function getTasksByUser(userId: string) {
  const res = await fetch(`${API_URL}/tasks?createdBy=${userId}`);
  return res.json();
}

export async function createTask(data: ICreateTaskData, token: string) {
  const res = await fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({...data})
  });
  return res.json();
}

export async function updateTask(taskId: string, data: ICreateTaskData, token: string) {
  const userId = localStorage.getItem('userId');
  const res = await fetch(`${API_URL}/tasks/${taskId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'userid': userId || ''
    },
    body: JSON.stringify({...data})
  });
  return res.json();
}

export async function getUserProfile(userId: string, token: string): Promise<IFrontendUser> {
  const res = await fetch(`${API_URL}/user/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data: IFrontendUser = await res.json();
  return data;
}

export async function updateUserProfile(userId: string, data: IFrontendUser, token: string) {
  const res = await fetch(`${API_URL}/user/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function uploadProfilePicture(file: File, token: string) {
  const formData = new FormData();
  formData.append('profilePicture', file);

  const res = await fetch(`${API_URL}/upload/profile-picture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  return res.json();
}

export async function deleteTask(taskId: string, token: string) {
  const userId = localStorage.getItem('userId');
  const res = await fetch(`${API_URL}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'userid': userId || ''
    }
  });
  return res.json();
}
