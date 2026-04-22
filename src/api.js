// src/api.js
const BASE_URL = "https://be-xdudweb.onrender.com/api";

export const getUser = () => JSON.parse(localStorage.getItem("user") || "null");
export const clearUser = () => localStorage.removeItem("user");

export async function req(path, options = {}) {
  const url = BASE_URL + path;
  const headers = { "Content-Type": "application/json", ...options.headers };
  
  const res = await fetch(url, { ...options, headers, credentials: "include" });
  
  if (res.status === 401 && path !== "/auth/login") {
    clearUser();
    window.location.reload();
  }

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }

  if (!res.ok) {
    const msg = data?.message || data?.error || `Lỗi ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export function toList(data) {
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  const arr = Object.values(data || {}).find(Array.isArray);
  return arr ?? [];
}

// --- ĐỊNH NGHĨA CÁC API ---
export const authAPI = {
  login: (body) => req("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  register: (body) => req("/auth/register", { method: "POST", body: JSON.stringify(body) })
};

export const studentAPI = {
  getAll: () => req("/students"),
  getProfile: () => req("/students/profile"), 
};

export const lopAPI = {
  getAll: () => req("/lops"),
};

export const monHocAPI = {
  getAll: () => req("/monhocs"),
};

export const diemAPI = {
  getBySV: (mssv) => req(`/grades/student/${mssv}`),
};

export const transferAPI = {
  submit: (body) => req("/transfer/submit", { method: "POST", body: JSON.stringify(body) }),
  getPending: () => req("/transfer/pending"),
  approve: (id) => req(`/transfer/approve/${id}`, { method: "PUT" }),
};