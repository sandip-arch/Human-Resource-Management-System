const pool = require('../config/db');
const path = require('path');
const fs = require('fs');
const { generatePayslipPDF } = require('../utils/pdf');
const { sendPayslipEmail } = require('../utils/email');

// Helper to convert month number to name
const getMonthName = (monthNumber) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthNumber - 1] || 'Unknown';
};

// @desc    Generate payslip for an employee (Admin Only)
// @route   POST /api/salary/generate
// @access  Private (Admin Only)
const generatePayslip = async (req, res, next) => {
  const {
    user_id,
    month,
    year,
    basic_pay,
    allowance_hra = 0,
    allowance_da = 0,
    allowance_special = 0,
    deduction_pf = 0,
    deduction_tax = 0,
    deduction_tds = 0
  } = req.body;

  try {
    // 1. Validation
    if (!user_id || !month || !year || basic_pay === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID (user_id), Month, Year, and Basic Pay are required.'
      });
    }

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    if (monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ success: false, message: 'Month must be between 1 and 12.' });
    }

    // 2. Check if employee exists
    const [employees] = await pool.query(
      `SELECT u.emp_id as id, u.name, u.email, u.role, ep.department, ep.designation
       FROM users u
       LEFT JOIN employee_profiles ep ON u.emp_id = ep.user_id
       WHERE u.emp_id = ? AND u.role = 'employee'`,
      [user_id]
    );

    if (employees.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee user not found or is not an employee.' });
    }

    const employee = employees[0];

    // 3. Check if payslip already generated for this month & year
    const [existing] = await pool.query(
      'SELECT id FROM payslips WHERE user_id = ? AND month = ? AND year = ?',
      [user_id, monthNum, yearNum]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `A payslip has already been generated for this employee for ${getMonthName(monthNum)} ${yearNum}.`
      });
    }

    // 4. Calculate Net Salary
    const grossEarnings = 
      parseFloat(basic_pay) + 
      parseFloat(allowance_hra) + 
      parseFloat(allowance_da) + 
      parseFloat(allowance_special);

    const grossDeductions = 
      parseFloat(deduction_pf) + 
      parseFloat(deduction_tax) + 
      parseFloat(deduction_tds);

    const netSalary = parseFloat((grossEarnings - grossDeductions).toFixed(2));

    // 5. Insert record into database
    const [result] = await pool.query(
      `INSERT INTO payslips 
       (user_id, month, year, basic_pay, allowance_hra, allowance_da, allowance_special, deduction_pf, deduction_tax, deduction_tds, net_salary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id, monthNum, yearNum, basic_pay,
        allowance_hra, allowance_da, allowance_special,
        deduction_pf, deduction_tax, deduction_tds, netSalary
      ]
    );

    const payslipId = result.insertId;

    // 6. Generate PDF Path and PDF file
    const pdfFilename = `payslip_${user_id}_${monthNum}_${yearNum}.pdf`;
    // Stored path on the server
    const relativePdfPath = `/uploads/payslips/${pdfFilename}`;
    const absolutePdfPath = path.join(__dirname, '..', 'uploads', 'payslips', pdfFilename);

    const monthName = getMonthName(monthNum);
    const payslipDataForPDF = {
      id: payslipId,
      monthName,
      year: yearNum,
      basic_pay,
      allowance_hra,
      allowance_da,
      allowance_special,
      deduction_pf,
      deduction_tax,
      deduction_tds,
      net_salary: netSalary
    };

    // Execute PDF creation
    await generatePayslipPDF(employee, payslipDataForPDF, absolutePdfPath);

    // 7. Update PDF path in database
    await pool.query(
      'UPDATE payslips SET pdf_path = ? WHERE id = ?',
      [relativePdfPath, payslipId]
    );

    // 8. Send email with PDF attachment
    let emailPreviewUrl = null;
    try {
      emailPreviewUrl = await sendPayslipEmail(
        employee.email,
        employee.name,
        monthName,
        yearNum,
        absolutePdfPath
      );
    } catch (emailErr) {
      console.error('Email failed to send, but payslip was successfully generated:', emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Payslip generated successfully',
      data: {
        payslip_id: payslipId,
        employee_id: user_id,
        employee_name: employee.name,
        month: monthName,
        year: yearNum,
        net_salary: netSalary,
        pdf_path: relativePdfPath,
        email_preview_url: emailPreviewUrl
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user's payslips
// @route   GET /api/salary/my-payslips
// @access  Private (Employee or Admin)
const getMyPayslips = async (req, res, next) => {
  const userId = req.user.id;

  try {
    const [payslips] = await pool.query(
      'SELECT id, month, year, basic_pay, net_salary, pdf_path, generated_at FROM payslips WHERE user_id = ? ORDER BY year DESC, month DESC',
      [userId]
    );

    // Add month name helper
    const formattedPayslips = payslips.map(ps => ({
      ...ps,
      month_name: getMonthName(ps.month)
    }));

    res.status(200).json({
      success: true,
      count: formattedPayslips.length,
      data: formattedPayslips
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all payslips (Admin only)
// @route   GET /api/salary/all
// @access  Private (Admin Only)
const getAllPayslips = async (req, res, next) => {
  try {
    const [payslips] = await pool.query(
      `SELECT p.id, p.month, p.year, p.basic_pay, p.net_salary, p.pdf_path, p.generated_at,
              u.name as employee_name, u.email as employee_email
       FROM payslips p
       JOIN users u ON p.user_id = u.emp_id
       ORDER BY p.year DESC, p.month DESC`
    );

    const formattedPayslips = payslips.map(ps => ({
      ...ps,
      month_name: getMonthName(ps.month)
    }));

    res.status(200).json({
      success: true,
      count: formattedPayslips.length,
      data: formattedPayslips
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download / serve a payslip PDF
// @route   GET /api/salary/payslip/:id/download
// @access  Private
const downloadPayslip = async (req, res, next) => {
  const payslipId = req.params.id;

  try {
    const [payslips] = await pool.query(
      'SELECT id, user_id, pdf_path, month, year FROM payslips WHERE id = ?',
      [payslipId]
    );

    if (payslips.length === 0) {
      return res.status(404).json({ success: false, message: 'Payslip not found.' });
    }

    const payslip = payslips[0];

    // Authorization check: Must be admin or owner of the payslip
    if (req.user.role !== 'admin' && req.user.id !== payslip.user_id) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this payslip.' });
    }

    if (!payslip.pdf_path) {
      return res.status(404).json({ success: false, message: 'Payslip PDF file is not generated.' });
    }

    const absolutePdfPath = path.join(__dirname, '..', payslip.pdf_path.replace(/^\//, ''));

    if (!fs.existsSync(absolutePdfPath)) {
      return res.status(404).json({ success: false, message: 'Payslip file does not exist on disk.' });
    }

    const filename = `Payslip_${getMonthName(payslip.month)}_${payslip.year}.pdf`;
    res.download(absolutePdfPath, filename);

  } catch (error) {
    next(error);
  }
};

module.exports = {
  generatePayslip,
  getMyPayslips,
  getAllPayslips,
  downloadPayslip
};
