import axios from 'axios';

export const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach authorization token dynamically
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper methods for auth API
export const authAPI = {
  register: (userData) => API.post('/auth/register', userData),
  login: (credentials) => API.post('/auth/login', credentials), // takes { email, password }
  getMe: () => API.get('/auth/me')
};

// Helper methods for employees API
export const employeeAPI = {
  getEmployees: (status, department, designation) => API.get('/employees', { params: { status, department, designation } }),
  getEmployeeById: (id) => API.get(`/employees/${id}`),
  approveEmployee: (id) => API.put(`/employees/${id}/approve`),
  updateProfile: (profileData) => API.put('/employees/profile', profileData),
  adminUpdateEmployee: (id, updateData) => API.put(`/employees/${id}`, updateData),
  addEmployee: (employeeData) => API.post('/employees', employeeData),
  updateBankDetails: (id, bankData) => API.put(`/employees/${id}/bank-details`, bankData),
  rateEmployee: (id, rating) => API.put(`/employees/${id}/rate`, { rating }),
  fireEmployee: (email, adminPassword) => API.post('/employees/fire', { email, admin_password: adminPassword }),
  getFilterMetadata: () => API.get('/employees/meta/filters')
};

// Helper methods for attendance API
export const attendanceAPI = {
  clockIn: () => API.post('/attendance/clock-in'),
  clockOut: () => API.post('/attendance/clock-out'),
  getMyAttendance: (status) => API.get('/attendance/my-records', { params: { status } }),
  getAllAttendance: (date, userId, department, designation) => 
    API.get('/attendance/all', { params: { date, user_id: userId, department, designation } })
};

// Helper methods for leaves API
export const leaveAPI = {
  applyLeave: (leaveData) => API.post('/leaves/apply', leaveData),
  getMyLeaves: () => API.get('/leaves/my-leaves'),
  getPendingLeaves: () => API.get('/leaves/pending'),
  updateLeaveStatus: (id, status) => API.put(`/leaves/${id}/status`, { status }),
  getCalendarLeaves: () => API.get('/leaves/calendar'),
  getHolidays: () => API.get('/leaves/holidays'),
  addHoliday: (holidayData) => API.post('/leaves/holidays', holidayData)
};

// Helper methods for salary/payroll API
export const salaryAPI = {
  generatePayslip: (payslipData) => API.post('/salary/generate', payslipData),
  getMyPayslips: () => API.get('/salary/my-payslips'),
  getAllPayslips: () => API.get('/salary/all'),
  downloadPayslip: (id) => API.get(`/salary/payslip/${id}/download`, { responseType: 'blob' })
};

// Helper methods for notifications API
export const notificationAPI = {
  getPendingCount: () => API.get('/notifications/pending-count')
};
