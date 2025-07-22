export async function getUserTasks(userId: string) {
  const res = await fetch(`${API_URL}/tasks?createdBy=${userId}`);
  return res.json();
}

export async function acceptTask(taskId: string, volunteerId: string) {
  const res = await fetch(`${API_URL}/tasks/${taskId}/accept/${volunteerId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return res.json();
}
// API utility for frontend to connect to backend
export const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api';

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return res.json();
}

export async function register(data: any) {
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

export async function createTask(data: any, token: string) {
  const res = await fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function getUserProfile(userId: string) {
  const res = await fetch(`${API_URL}/user/${userId}`);
  return res.json();
}

export async function updateUserProfile(userId: string, data: any) {
  const res = await fetch(`${API_URL}/user/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}
