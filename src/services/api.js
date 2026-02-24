import axios from 'axios';

const API = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5007/clinic',
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth
export const login = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');
export const changePassword = (data) => API.post('/auth/change-password', data);

// Clinics
export const createClinic = (data) => API.post('/clinics', data);
export const listClinics = () => API.get('/clinics');
export const toggleClinicActive = (id) => API.patch(`/clinics/${id}/toggle`);

// Employees (owners + employees; used for Users table and clinic owner lookup)
export const listEmployees = (clinicId) =>
    clinicId ? API.get('/employees', { params: { clinicId } }) : API.get('/employees');
/** List users (employees + owner) for a clinic - same as listEmployees(clinicId) */
export const listClinicUsers = (clinicId) => API.get('/employees', { params: { clinicId } });
export const createEmployee = (data) => API.post('/employees', data);
export const toggleEmployeeActive = (id) => API.patch(`/employees/${id}/toggle`);

// User approval (if backend supports these)
export const approveUser = (id) => API.post(`/users/${id}/approve`);
export const rejectUser = (id) => API.post(`/users/${id}/reject`);

// Patients & Visits
export const getPatients = (clinicId) => API.get(`/patients/${clinicId}`);
export const getPatientDetail = (id) => API.get(`/patients/detail/${id}`);
export const getPatientDetails = getPatientDetail;
export const createPatient = (data) => API.post('/patients', data);
export const updatePatient = (id, data) => API.put(`/patients/${id}`, data);
export const deletePatient = (id) => API.delete(`/patients/${id}`);
export const addVisit = (data) => API.post('/visits', data);
export const getVisitsByBranch = (branchId) => API.get(`/visits/${branchId}`);

// Previous Deliveries
export const getPreviousDeliveriesByPatient = (patientId) => API.get(`/previous-deliveries/patient/${patientId}`);
export const createPreviousDelivery = (data) => API.post('/previous-deliveries', data);
export const getPreviousDelivery = (id) => API.get(`/previous-deliveries/${id}`);
export const updatePreviousDelivery = (id, data) => API.put(`/previous-deliveries/${id}`, data);
export const deletePreviousDelivery = (id) => API.delete(`/previous-deliveries/${id}`);

// Branches
export const listBranches = (clinicId) => API.get(`/branches/${clinicId}`);
export const createBranch = (data) => API.post('/branches', data);

export default API;
