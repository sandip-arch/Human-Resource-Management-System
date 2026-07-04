const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

let serverProcess;

// Helper to delay execution
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function startServer() {
  console.log('Starting the Express server...');
  serverProcess = spawn('node', ['server.js'], {
    cwd: __dirname,
    stdio: 'inherit', // Let logs show in terminal
    shell: true
  });

  // Wait a couple of seconds for the server to spin up and connect to MySQL
  await sleep(3000);
}

function stopServer() {
  if (serverProcess) {
    console.log('Stopping the Express server...');
    serverProcess.kill();
  }
}

async function runTests() {
  let adminToken = '';
  let employeeToken = '';
  let employeeId = null;
  let leaveId = null;
  let payslipId = null;

  const adminEmail = `admin_${Date.now()}@hrms.com`;
  const employeeEmail = `emp_${Date.now()}@hrms.com`;

  try {
    console.log('\n--- 1. Testing Registration ---');
    
    // Register the first admin
    console.log(`Registering first admin: ${adminEmail}`);
    const regAdminRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Super Admin',
      email: adminEmail,
      password: 'adminpassword',
      role: 'admin'
    });
    console.log('Admin Register Response:', regAdminRes.data.message);

    // Register a second admin (Should fail)
    try {
      console.log('Attempting to register a second admin...');
      await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Second Admin',
        email: `admin2_${Date.now()}@hrms.com`,
        password: 'adminpassword',
        role: 'admin'
      });
      console.error('FAIL: Second admin was allowed to register.');
      process.exit(1);
    } catch (err) {
      console.log('SUCCESS (Expected rejection):', err.response?.data?.message || err.message);
    }

    // Register an employee
    console.log(`Registering employee: ${employeeEmail}`);
    const regEmpRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'John Doe',
      email: employeeEmail,
      password: 'employeepassword',
      role: 'employee'
    });
    employeeId = regEmpRes.data.data.id;
    console.log('Employee Register Response:', regEmpRes.data.message);

    console.log('\n--- 2. Testing Login and Approval Flow ---');

    // Attempt employee login (Should fail because status is pending)
    try {
      console.log('Attempting to login employee before approval...');
      await axios.post(`${BASE_URL}/auth/login`, {
        email: employeeEmail,
        password: 'employeepassword',
        role: 'employee'
      });
      console.error('FAIL: Employee logged in without admin approval.');
      process.exit(1);
    } catch (err) {
      console.log('SUCCESS (Expected rejection):', err.response?.data?.message || err.message);
    }

    // Login as admin
    console.log('Logging in as Admin...');
    const loginAdminRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: adminEmail,
      password: 'adminpassword',
      role: 'admin'
    });
    adminToken = loginAdminRes.data.token;
    console.log('Admin Login SUCCESS. Token received.');

    // Approve the employee
    console.log(`Approving employee ID: ${employeeId}...`);
    const approveRes = await axios.put(
      `${BASE_URL}/employees/${employeeId}/approve`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log('Employee Approval Response:', approveRes.data.message);

    // Login as employee (Should work now)
    console.log('Logging in as employee after approval...');
    const loginEmpRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: employeeEmail,
      password: 'employeepassword',
      role: 'employee'
    });
    employeeToken = loginEmpRes.data.token;
    console.log('Employee Login SUCCESS. Token received.');

    console.log('\n--- 3. Testing Profile Updates ---');
    
    // Update own profile as employee (phone only)
    console.log('Updating employee phone number...');
    const updateProfileRes = await axios.put(
      `${BASE_URL}/employees/profile`,
      { phone: '123-456-7890' },
      { headers: { Authorization: `Bearer ${employeeToken}` } }
    );
    console.log('Employee Profile Update Response:', updateProfileRes.data.message);

    // Fetch own details
    const meRes = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    console.log('Employee My Profile details verified. Phone:', meRes.data.data.phone);

    // Admin updates employee basic salary details
    console.log(`Admin updating employee ${employeeId} basic salary...`);
    const adminUpdateRes = await axios.put(
      `${BASE_URL}/employees/${employeeId}`,
      { basic_pay: 50000.00, department: 'Engineering', designation: 'Software Engineer' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log('Admin Update Employee Profile Response:', adminUpdateRes.data.message);

    console.log('\n--- 4. Testing Attendance System ---');
    
    // Clock in
    console.log('Employee clocking in...');
    const clockInRes = await axios.post(
      `${BASE_URL}/attendance/clock-in`,
      {},
      { headers: { Authorization: `Bearer ${employeeToken}` } }
    );
    console.log('Clock In Response Status:', clockInRes.data.data.status);

    // Double clock in check
    try {
      console.log('Attempting double clock-in...');
      await axios.post(
        `${BASE_URL}/attendance/clock-in`,
        {},
        { headers: { Authorization: `Bearer ${employeeToken}` } }
      );
      console.error('FAIL: Double clock in allowed.');
      process.exit(1);
    } catch (err) {
      console.log('SUCCESS (Expected rejection):', err.response?.data?.message || err.message);
    }

    // Clock out
    console.log('Employee clocking out...');
    const clockOutRes = await axios.post(
      `${BASE_URL}/attendance/clock-out`,
      {},
      { headers: { Authorization: `Bearer ${employeeToken}` } }
    );
    console.log('Clock Out Response. Working Hours:', clockOutRes.data.data.working_hours, 'Status:', clockOutRes.data.data.status);

    // Fetch employee attendance
    const myAttRes = await axios.get(`${BASE_URL}/attendance/my-records`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    console.log('Fetched own attendance logs, count:', myAttRes.data.count);

    console.log('\n--- 5. Testing Leave Management ---');
    
    // Apply for leave
    console.log('Applying for leave...');
    const leaveApplyRes = await axios.post(
      `${BASE_URL}/leaves/apply`,
      {
        leave_type: 'sick',
        from_date: '2026-08-01',
        to_date: '2026-08-03',
        reason: 'Medical recovery'
      },
      { headers: { Authorization: `Bearer ${employeeToken}` } }
    );
    leaveId = leaveApplyRes.data.data.id;
    console.log('Leave Apply Response ID:', leaveId);

    // Admin view pending leaves
    const pendingLeavesRes = await axios.get(`${BASE_URL}/leaves/pending`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('Admin Pending Leaves list length:', pendingLeavesRes.data.count);

    // Admin approve leave
    console.log(`Approving leave request ${leaveId}...`);
    const leaveStatusRes = await axios.put(
      `${BASE_URL}/leaves/${leaveId}/status`,
      { status: 'approved' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log('Leave Approval Response:', leaveStatusRes.data.message);

    // Fetch leaves calendar
    const calendarRes = await axios.get(`${BASE_URL}/leaves/calendar`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    console.log('Leaves Calendar Approved entries count:', calendarRes.data.count);

    console.log('\n--- 6. Testing Salary & Payslip Generation ---');
    
    // Generate payslip
    console.log(`Generating payslip for employee ${employeeId} for July 2026...`);
    const payslipRes = await axios.post(
      `${BASE_URL}/salary/generate`,
      {
        user_id: employeeId,
        month: 7,
        year: 2026,
        basic_pay: 50000.00,
        allowance_hra: 15000.00,
        allowance_da: 5000.00,
        allowance_special: 5000.00,
        deduction_pf: 6000.00,
        deduction_tax: 2000.00,
        deduction_tds: 1500.00
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    payslipId = payslipRes.data.data.payslip_id;
    console.log('Payslip Generated! ID:', payslipId);
    console.log('Net Salary calculated:', payslipRes.data.data.net_salary);
    console.log('Email Ethereal Inbox Link:', payslipRes.data.data.email_preview_url);

    // Fetch my payslips as employee
    const myPayslipsRes = await axios.get(`${BASE_URL}/salary/my-payslips`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    console.log('Fetched Employee Payslips List, count:', myPayslipsRes.data.count);

    console.log('\n--- 7. Testing Holiday list ---');
    // Add holiday
    const holidayDate = '2026-12-25';
    console.log('Adding holiday: Christmas Day on', holidayDate);
    const addHolidayRes = await axios.post(
      `${BASE_URL}/leaves/holidays`,
      { name: 'Christmas Day', date: holidayDate },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log('Holiday Add Response:', addHolidayRes.data.message);

    // Fetch holidays
    const holidaysRes = await axios.get(`${BASE_URL}/leaves/holidays`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    console.log('Fetched Holidays List. Count:', holidaysRes.data.count);

    console.log('\n======================================');
    console.log('ALL TESTS PASSED SUCCESSFULLY! ✅');
    console.log('======================================');
  } catch (error) {
    console.error('\n❌ TEST RUN FAILED ❌');
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    } else {
      console.error('Error details:', error.message);
    }
    stopServer();
    process.exit(1);
  }
}

async function main() {
  await startServer();
  await runTests();
  stopServer();
  process.exit(0);
}

main();
