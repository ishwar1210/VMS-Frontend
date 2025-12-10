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

const vendor = {
  getAll: () => api.get("/api/vendor"),
  create: (payload: any) => api.post("/api/vendor", payload),
  update: (vendorId: number, payload: any) =>
    api.put(`/api/vendor/update/${vendorId}`, payload),
  delete: (vendorId: number) => api.delete(`/api/vendor/${vendorId}`),
};

// new location endpoints
const location = {
  getAll: () => api.get("/api/location"),
  create: (payload: any) => api.post("/api/location", payload),
  update: (locationId: number, payload: any) =>
    api.put(`/api/location/${locationId}`, payload),
  delete: (locationId: number) => api.delete(`/api/location/${locationId}`),
};

// visitor entry endpoints
const visitorEntry = {
  getAll: () => api.get("/api/visitorentry"),
  create: (payload: any) => api.post("/api/visitorentry", payload),
  update: (id: number, payload: any) =>
    api.put(`/api/visitorentry/${id}`, payload),
};
// visitor endpoints
const visitor = {
  getAll: () => api.get("/api/visitor"),
  getById: (id: number) => api.get(`/api/visitor/${id}`),
  create: (payload: any) => api.post("/api/visitor", payload),
  update: (id: number, payload: any) => api.put(`/api/visitor/${id}`, payload),
};

const endpoints = {
  auth,
  role,
  department,
  user,
  vendor,
  location,
  visitorEntry, // <- existing
  visitor, // <- added
};

export default auth;
export { endpoints };
