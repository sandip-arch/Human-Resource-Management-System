const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generates a premium Invoice-Style Salary slip PDF for an employee.
 * @param {Object} employee - Employee information (name, email, department, designation)
 * @param {Object} payslip - Payslip details (month, year, basic_pay, allowances, deductions, net_salary)
 * @param {string} outputPath - Path where the PDF should be saved
 * @returns {Promise<string>} - Resolves to the outputPath on success
 */
function generatePayslipPDF(employee, payslip, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      // Ensure the directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const writeStream = fs.createWriteStream(outputPath);

      doc.pipe(writeStream);

      // --- Color Palette (Matching Nexus Violet Theme) ---
      const primaryColor = '#7C3AED';  // Deep Violet
      const secondaryColor = '#100E19'; // Charcoal/Dark main
      const lightBg = '#F9FAFB';        // Ice white/light gray
      const borderColor = '#E5E7EB';    // Border gray
      const textMain = '#1F2937';       // Off-black text
      const textMuted = '#4B5563';      // Slate gray text

      // --- Invoice Header Section ---
      doc.fillColor(primaryColor)
         .fontSize(24)
         .font('Helvetica-Bold')
         .text('NEXUS HRMS', 50, 45);

      doc.fillColor(textMuted)
         .fontSize(9)
         .font('Helvetica')
         .text('NEXUS SYSTEMS PVT. LTD.', 50, 72)
         .text('CIN: U72200MH2026PTC391234', 50, 83)
         .text('101 Innovation Way, Tech District, Mumbai - 400001', 50, 94);

      // Invoice metadata on the right
      doc.fillColor(secondaryColor)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('SALARY INVOICE', 350, 45, { align: 'right', width: 195 });

      doc.fillColor(textMuted)
         .fontSize(9)
         .font('Helvetica')
         .text(`Invoice No: INV-2026-${payslip.id || 'TEMP'}`, 350, 65, { align: 'right', width: 195 })
         .text(`Billing Period: ${payslip.monthName} ${payslip.year}`, 350, 77, { align: 'right', width: 195 })
         .text(`Invoice Date: ${new Date().toLocaleDateString()}`, 350, 89, { align: 'right', width: 195 });

      // Draw top divider line
      doc.moveTo(50, 115)
         .lineTo(545, 115)
         .stroke(borderColor);

      // --- Bill To / Bill From Grid ---
      const billingStartY = 130;
      
      // Bill From (Employer) Column
      doc.fillColor(primaryColor)
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('BILLER / EMPLOYER', 50, billingStartY);

      doc.fillColor(textMain)
         .fontSize(9)
         .font('Helvetica-Bold')
         .text('Nexus Systems Corporate Office', 50, billingStartY + 15);

      doc.font('Helvetica')
         .fillColor(textMuted)
         .text('Accounts & Payroll Operations Dept', 50, billingStartY + 27)
         .text('Email: finance@nexushr.io', 50, billingStartY + 39)
         .text('Phone: +91 22 5550 0199', 50, billingStartY + 51);

      // Bill To (Employee) Column
      doc.fillColor(primaryColor)
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('RECIPIENT / EMPLOYEE', 320, billingStartY);

      doc.fillColor(textMain)
         .fontSize(9)
         .font('Helvetica-Bold')
         .text(employee.name, 320, billingStartY + 15);

      doc.font('Helvetica')
         .fillColor(textMuted)
         .text(`Designation: ${employee.designation || 'Specialist'}`, 320, billingStartY + 27)
         .text(`Department: ${employee.department || 'Operations'}`, 320, billingStartY + 39)
         .text(`Email: ${employee.email}`, 320, billingStartY + 51);

      // Draw middle separator
      doc.moveTo(50, 205)
         .lineTo(545, 205)
         .stroke(borderColor);

      // --- Invoice Line Items Table ---
      const tableHeaderY = 220;
      doc.rect(50, tableHeaderY, 495, 20).fill(primaryColor);

      doc.fillColor('#FFFFFF')
         .fontSize(9)
         .font('Helvetica-Bold')
         .text('Item Description', 60, tableHeaderY + 6)
         .text('Base Value', 240, tableHeaderY + 6, { width: 90, align: 'right' })
         .text('Deductions / PF', 345, tableHeaderY + 6, { width: 90, align: 'right' })
         .text('Employer Expense', 450, tableHeaderY + 6, { width: 85, align: 'right' });

      // Build out lists of financial components
      const basic = parseFloat(payslip.basic_pay || 0);
      const hra = parseFloat(payslip.allowance_hra || 0);
      const da = parseFloat(payslip.allowance_da || 0);
      const special = parseFloat(payslip.allowance_special || 0);

      const pf = parseFloat(payslip.deduction_pf || 0);
      const tax = parseFloat(payslip.deduction_tax || 0);
      const tds = parseFloat(payslip.deduction_tds || 0);

      // Paid by Employer calculation details:
      // Basic + HRA + DA + Special is paid by employer.
      // PF and Tax are deducted. 
      // Total Employer cost (excluding pf match or other, let's represent gross salary as Employer cost)
      const lineItems = [
        { desc: 'Base Salary (Monthly allocation)', value: basic, ded: 0, cost: basic },
        { desc: 'House Rent Allowance (HRA)', value: hra, ded: 0, cost: hra },
        { desc: 'Dearness Allowance (DA)', value: da, ded: 0, cost: da },
        { desc: 'Special & Travel Allowances', value: special, ded: 0, cost: special },
        { desc: 'Employee Provident Fund (EPF Contribution)', value: 0, ded: pf, cost: 0 },
        { desc: 'Professional Tax & Deductions', value: 0, ded: tax, cost: 0 },
        { desc: 'Tax Deducted at Source (TDS)', value: 0, ded: tds, cost: 0 }
      ];

      let itemY = tableHeaderY + 28;
      doc.fillColor(textMain).font('Helvetica').fontSize(9);

      lineItems.forEach((item) => {
        // Only draw row if values are greater than zero
        if (item.value > 0 || item.ded > 0 || item.cost > 0) {
          doc.text(item.desc, 60, itemY);
          
          doc.text(item.value > 0 ? `Rs. ${item.value.toFixed(2)}` : '--', 240, itemY, { width: 90, align: 'right' });
          doc.text(item.ded > 0 ? `- Rs. ${item.ded.toFixed(2)}` : '--', 345, itemY, { width: 90, align: 'right' });
          doc.text(item.cost > 0 ? `Rs. ${item.cost.toFixed(2)}` : '--', 450, itemY, { width: 85, align: 'right' });

          doc.moveTo(50, itemY + 14)
             .lineTo(545, itemY + 14)
             .stroke(borderColor);

          itemY += 22;
        }
      });

      // --- Financial Calculations Block ---
      const totalEarnings = basic + hra + da + special;
      const totalDeductions = pf + tax + tds;
      const netSalary = parseFloat(payslip.net_salary || (totalEarnings - totalDeductions));

      const calculationsStartY = itemY + 15;
      
      // Left Note/Bank Info Area
      doc.fillColor(textMuted)
         .fontSize(8)
         .font('Helvetica-Bold')
         .text('PAYMENT DISBURSEMENT NOTE', 50, calculationsStartY);

      doc.font('Helvetica')
         .text('Funds transferred electronically to registered bank details.', 50, calculationsStartY + 13)
         .text('Salary calculation matches attendance activity logs.', 50, calculationsStartY + 23)
         .text('For queries, contact finance-ledger@nexushr.io.', 50, calculationsStartY + 33);

      // Right totals calculations list
      const totalsX = 350;
      doc.fillColor(textMuted).font('Helvetica').fontSize(9);
      
      doc.text('Total Base Earnings:', totalsX, calculationsStartY)
         .text(`Rs. ${totalEarnings.toFixed(2)}`, 450, calculationsStartY, { align: 'right', width: 95 });

      doc.text('Total Deductions:', totalsX, calculationsStartY + 15)
         .text(`- Rs. ${totalDeductions.toFixed(2)}`, 450, calculationsStartY + 15, { align: 'right', width: 95 });

      // Draw thick line before net total
      doc.moveTo(totalsX, calculationsStartY + 32)
         .lineTo(545, calculationsStartY + 32)
         .stroke(primaryColor);

      // NET REMITTANCE Card Block
      doc.rect(totalsX, calculationsStartY + 38, 195, 30).fill(lightBg);
      
      doc.fillColor(primaryColor)
         .font('Helvetica-Bold')
         .fontSize(10)
         .text('Net Remitted:', totalsX + 10, calculationsStartY + 48);

      doc.text(`Rs. ${netSalary.toFixed(2)}`, totalsX + 70, calculationsStartY + 48, { align: 'right', width: 115 });

      // --- VALUES PAID BY EMPLOYER (Additional Section) ---
      const employerSectionY = calculationsStartY + 85;
      doc.rect(50, employerSectionY, 495, 35).fill('#F5F3FF'); // Light violet tint background

      doc.fillColor(primaryColor)
         .fontSize(9)
         .font('Helvetica-Bold')
         .text('TOTAL VALUE PAID BY EMPLOYER (Cost to Company)', 65, employerSectionY + 13);

      // Employer total cost is Gross salary + employer PF match (simulated as base + allowances + simulated employer PF matches)
      const employerPfContribution = pf; // Match employee PF
      const totalEmployerPayout = totalEarnings + employerPfContribution;

      doc.fillColor(primaryColor)
         .fontSize(10)
         .font('Helvetica-Bold')
         .text(`Rs. ${totalEmployerPayout.toFixed(2)} /-`, 350, employerSectionY + 12, { align: 'right', width: 180 });

      // Signature/Terms Footer
      doc.fontSize(8)
         .font('Helvetica')
         .fillColor(textMuted)
         .text('1. All figures stated are in Indian Rupees (INR).', 50, 680)
         .text('2. Tax deductions are made in accordance with government income tax structures.', 50, 692)
         .text('3. This is a secure digital invoice and does not require physical seals or hand signatures.', 50, 704);

      doc.fontSize(9)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text('Thank you for your dedicated services to Nexus Systems.', 50, 725, { align: 'center', width: 495 });

      doc.fontSize(8)
         .font('Helvetica')
         .fillColor(textMuted)
         .text('© 2026 Nexus Systems Pvt. Ltd. | Confidential document.', 50, 740, { align: 'center', width: 495 });

      // End document
      doc.end();

      writeStream.on('finish', () => {
        resolve(outputPath);
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generatePayslipPDF };
