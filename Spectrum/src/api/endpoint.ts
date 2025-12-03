import api from "./axiosInstance";

const auth = {
  login: (payload: { username: string; password: string }) =>
    api.post("/api/auth/login", payload),
};

const role = {
  getAll: () => api.get("/api/role"),
  create: (payload: { roleName: string }) => api.post("/api/role", payload),
  update: (roleId: number, payload: { roleName: string }) =>
    api.put(`/api/role/${roleId}`, payload),
  delete: (roleId: number) => api.delete(`/api/role/${roleId}`),
};

const department = {
  getAll: () => api.get("/api/department/all"),
  create: (payload: { departmentName: string }) =>
    api.post("/api/department", payload),
  update: (departmentId: number, payload: { departmentName: string }) =>
    api.put(`/api/department/${departmentId}`, payload),
  delete: (departmentId: number) =>
    api.delete(`/api/department/${departmentId}`),
};

const user = {
  getAll: () => api.get("/api/auth/all"),
  create: (payload: any) => api.post("/api/auth/register", payload),
  update: (userId: number, payload: any) =>
    api.put(`/api/auth/update/${userId}`, payload),
  delete: (userId: number) => api.delete(`/api/auth/${userId}`),
};

const endpoints = {
  auth,
  role,
  department,
  user,
};

export default auth;
export { endpoints };
