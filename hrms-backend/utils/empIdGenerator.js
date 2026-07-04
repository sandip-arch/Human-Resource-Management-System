const pool = require('../config/db');

/**
 * Automatically generates a Login/Employee ID following the rule:
 * OI + (first two letters of first & last name) + (joining year) + (4-digit serial number)
 * Example: OIJODO20220001
 * 
 * @param {string} name - Full Name of the employee
 * @param {string|Date} joiningDate - Date of joining
 * @returns {Promise<string>} - Auto-generated Employee ID
 */
async function generateEmpId(name, joiningDate) {
  // 1. Parse name parts
  const cleanName = (name || 'Guest').trim();
  const nameParts = cleanName.split(/\s+/);
  
  const firstName = nameParts[0] || 'XX';
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

  // Extract first 2 letters of first name
  const first2 = firstName.slice(0, 2).toUpperCase().padEnd(2, 'X');
  
  // Extract first 2 letters of last name (or next 2 letters of first name if single-word name)
  let last2 = 'XX';
  if (lastName) {
    last2 = lastName.slice(0, 2).toUpperCase().padEnd(2, 'X');
  } else if (firstName.length >= 4) {
    last2 = firstName.slice(2, 4).toUpperCase();
  }

  const code = first2 + last2;

  // 2. Extract Year
  let year = new Date().getFullYear();
  if (joiningDate) {
    const parsedDate = new Date(joiningDate);
    if (!isNaN(parsedDate.getTime())) {
      year = parsedDate.getFullYear();
    }
  }

  // 3. Calculate Serial Number for that year
  const yearStr = String(year);
  const searchPattern = `OI%${yearStr}%`;
  
  const [rows] = await pool.query(
    'SELECT COUNT(*) as count FROM users WHERE emp_id LIKE ?',
    [searchPattern]
  );
  
  const count = rows[0].count;
  const serial = String(count + 1).padStart(4, '0');

  // Combined: e.g. OIJODO20220001
  return `OI${code}${yearStr}${serial}`;
}

module.exports = { generateEmpId };
