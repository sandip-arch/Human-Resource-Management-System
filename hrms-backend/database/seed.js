const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const users = [
  {
    name: 'Admin Officer',
    email: 'admin@nexus.com',
    password: 'admin123',
    role: 'admin',
    status: 'approved',
    profile: {
      phone: '555-0199',
      department: 'HR Operations',
      designation: 'Finance Lead',
      joining_date: '2025-01-15',
      basic_pay: 95000.00,
      about: 'Passionate HR strategist with over 8 years of experience in organizational development, remote teams, and payroll systems.',
      skills: 'Strategic Planning, Talent Acquisition, Conflict Resolution, HR Tech, Analytics, Leadership',
      certifications: JSON.stringify(['SHRM-CP Certified', 'Agile Leadership']),
      performance_rating: 5.0
    },
    bank: {
      bank_name: 'Global NeoBank',
      account_number: '123456789012',
      ifsc_code: 'GNBK000122',
      pan_number: 'ABCDE1234F',
      uan_number: '10022334455',
      status: 'verified'
    }
  },
  {
    name: 'Elena Vostrova',
    email: 'elena.v@nexushr.io',
    password: 'employee123',
    role: 'employee',
    status: 'approved',
    profile: {
      phone: '555-0210',
      department: 'Product Dev',
      designation: 'Senior Frontend Engineer',
      joining_date: '2026-03-12',
      basic_pay: 85000.00,
      about: 'Passionate frontend engineer with 5+ years of experience building scalable, interactive corporate web apps.',
      skills: 'React.js, Javascript, CSS Modules, Responsive Web Design, REST API, Git',
      certifications: JSON.stringify(['Meta Front-End Developer Professional Certificate']),
      performance_rating: 4.9
    },
    bank: {
      bank_name: 'Federal Trust Bank',
      account_number: '987654321098',
      ifsc_code: 'FTBK000045',
      pan_number: 'XYZAB9876C',
      uan_number: '20011223344',
      status: 'verified'
    }
  },
  {
    name: 'Alex Rivera',
    email: 'alex.r@nexushr.io',
    password: 'employee123',
    role: 'employee',
    status: 'approved',
    profile: {
      phone: '555-8821',
      department: 'Product Dev',
      designation: 'Senior Backend Engineer',
      joining_date: '2025-05-10',
      basic_pay: 90000.00,
      about: 'Back-end generalist specializing in secure database setups, Node.js, and high performance APIs.',
      skills: 'Node.js, Express, MySQL, REST API, System Design, Docker',
      certifications: JSON.stringify(['AWS Solutions Architect Associate']),
      performance_rating: 4.8
    },
    bank: {
      bank_name: 'Global NeoBank',
      account_number: '554433221100',
      ifsc_code: 'GNBK000122',
      pan_number: 'PQRLM1234Z',
      uan_number: '30011224455',
      status: 'verified'
    }
  },
  {
    name: 'Sarah Jenkins',
    email: 'sarah.j@nexushr.io',
    password: 'employee123',
    role: 'employee',
    status: 'approved',
    profile: {
      phone: '555-4402',
      department: 'Product Dev',
      designation: 'Product Lead',
      joining_date: '2025-06-20',
      basic_pay: 110000.00,
      about: 'Product Manager leading engineering pipelines and cross-functional teams to build SaaS tools.',
      skills: 'Agile Workflows, Product Strategy, Scrum, User Research, Roadmap Planning',
      certifications: JSON.stringify(['Certified Scrum Product Owner (CSPO)']),
      performance_rating: 4.7
    },
    bank: {
      bank_name: 'Apex Bank',
      account_number: '776655443322',
      ifsc_code: 'APEX000099',
      pan_number: 'MNKOP8877L',
      uan_number: '40055667788',
      status: 'verified'
    }
  },
  {
    name: 'David Chen',
    email: 'david.c@nexushr.io',
    password: 'employee123',
    role: 'employee',
    status: 'approved',
    profile: {
      phone: '555-9123',
      department: 'Operations',
      designation: 'Operations Manager',
      joining_date: '2025-08-01',
      basic_pay: 75000.00,
      about: 'Operations professional dedicated to resource optimization, facility security, and staff availability planning.',
      skills: 'Resource Management, Operations Management, Logistics, Excel, Scheduling',
      certifications: JSON.stringify(['Six Sigma Green Belt']),
      performance_rating: 4.5
    },
    bank: {
      bank_name: 'Apex Bank',
      account_number: '112233445566',
      ifsc_code: 'APEX000099',
      pan_number: 'DGHJS5544K',
      uan_number: '50022338899',
      status: 'verified'
    }
  },
  {
    name: 'Elena Rodriguez',
    email: 'elena.r@nexushr.io',
    password: 'employee123',
    role: 'employee',
    status: 'approved',
    profile: {
      phone: '555-3012',
      department: 'HR Operations',
      designation: 'HR Director',
      joining_date: '2025-02-01',
      basic_pay: 105000.00,
      about: 'HR strategist focusing on talent acquisition, employee retention, and building premium corporate culture.',
      skills: 'HR Operations, Recruitment, Talent Management, Conflict Resolution',
      certifications: JSON.stringify(['SHRM-SCP']),
      performance_rating: 4.9
    },
    bank: {
      bank_name: 'Global NeoBank',
      account_number: '445566778899',
      ifsc_code: 'GNBK000122',
      pan_number: 'KJLMN8899R',
      uan_number: '60011228833',
      status: 'verified'
    }
  },
  {
    name: 'Mark Thompson',
    email: 'mark.t@nexushr.io',
    password: 'employee123',
    role: 'employee',
    status: 'approved',
    profile: {
      phone: '555-7721',
      department: 'Engineering',
      designation: 'QA Analyst',
      joining_date: '2026-02-15',
      basic_pay: 60000.00,
      about: 'Detail-oriented quality assurance analyst specializing in automated testing, selenium, and integration validation.',
      skills: 'Automated Testing, Selenium, Postman, Bug Tracking, QA Pipelines',
      certifications: JSON.stringify(['ISTQB Certified Tester']),
      performance_rating: 4.4
    },
    bank: {
      bank_name: 'Federal Trust Bank',
      account_number: '112244883399',
      ifsc_code: 'FTBK000045',
      pan_number: 'PLMOI9988H',
      uan_number: '70099883311',
      status: 'verified'
    }
  },
  {
    name: 'Jane Foster',
    email: 'jane.f@nexushr.io',
    password: 'employee123',
    role: 'employee',
    status: 'pending',
    profile: {
      phone: '555-1212',
      department: 'Engineering',
      designation: 'Junior Developer',
      joining_date: '2026-06-01',
      basic_pay: 40000.00,
      about: 'Fresh engineering graduate excited to learn software development, HTML, React, and server backend structures.',
      skills: 'HTML, CSS, React basics, Git, Javascript',
      certifications: JSON.stringify([]),
      performance_rating: 4.0
    },
    bank: {
      bank_name: 'Apex Bank',
      account_number: '998877665544',
      ifsc_code: 'APEX000099',
      pan_number: 'POIUY8877J',
      uan_number: '80055442211',
      status: 'unverified'
    }
  },
  {
    name: 'Bruce Banner',
    email: 'bruce.b@nexushr.io',
    password: 'employee123',
    role: 'employee',
    status: 'pending',
    profile: {
      phone: '555-8899',
      department: 'R&D',
      designation: 'Research Analyst',
      joining_date: '2026-06-15',
      basic_pay: 95000.00,
      about: 'Biophysics researcher focusing on stress levels, gamma radiation impacts, and operations stability.',
      skills: 'Research, Analytics, Biophysics, Laboratory management',
      certifications: JSON.stringify([]),
      performance_rating: 4.2
    },
    bank: {
      bank_name: 'Global NeoBank',
      account_number: '556677881122',
      ifsc_code: 'GNBK000122',
      pan_number: 'HULKK8877G',
      uan_number: '90022331144',
      status: 'unverified'
    }
  },
  {
    name: 'Clark Kent',
    email: 'clark.k@nexushr.io',
    password: 'employee123',
    role: 'employee',
    status: 'approved',
    profile: {
      phone: '555-0100',
      department: 'Marketing',
      designation: 'Content Writer',
      joining_date: '2025-10-01',
      basic_pay: 55000.00,
      about: 'Investigative reporter turned content writer. Fast typing, copy layouts, and remote collaboration expert.',
      skills: 'Copywriting, Research, SEO, Fast Typing, Press Releases',
      certifications: JSON.stringify([]),
      performance_rating: 4.8
    },
    bank: {
      bank_name: 'Apex Bank',
      account_number: '887799221100',
      ifsc_code: 'APEX000099',
      pan_number: 'SUPER8877M',
      uan_number: '11022339900',
      status: 'verified'
    }
  }
];

// Helper to locally generate emp_id for seed records
function localGenerateEmpId(name, joiningDate, yearCounters) {
  const cleanName = name.trim();
  const nameParts = cleanName.split(/\s+/);
  
  const firstName = nameParts[0] || 'XX';
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

  const first2 = firstName.slice(0, 2).toUpperCase().padEnd(2, 'X');
  
  let last2 = 'XX';
  if (lastName) {
    last2 = lastName.slice(0, 2).toUpperCase().padEnd(2, 'X');
  } else if (firstName.length >= 4) {
    last2 = firstName.slice(2, 4).toUpperCase();
  }

  const code = first2 + last2;
  const year = new Date(joiningDate).getFullYear();

  yearCounters[year] = (yearCounters[year] || 0) + 1;
  const serial = String(yearCounters[year]).padStart(4, '0');

  return `OI${code}${year}${serial}`;
}

async function seed() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'hrms_db';

  let connection;
  const yearCounters = {};

  try {
    connection = await mysql.createConnection({
      host,
      user,
      password,
      multipleStatements: true
    });

    console.log('Re-creating database to apply new schema changes...');
    await connection.query(`DROP DATABASE IF EXISTS \`${database}\``);
    await connection.query(`CREATE DATABASE \`${database}\``);
    await connection.query(`USE \`${database}\``);

    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await connection.query(schemaSql);
      console.log('Schema successfully loaded.');
    } else {
      throw new Error(`schema.sql not found at ${schemaPath}`);
    }

    console.log('Inserting 10 users and profiles...');
    const salt = await bcrypt.genSalt(10);

    for (const u of users) {
      const hashedPassword = await bcrypt.hash(u.password, salt);
      const empId = localGenerateEmpId(u.name, u.profile.joining_date, yearCounters);

      await connection.query(
        'INSERT INTO users (emp_id, name, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
        [empId, u.name, u.email, hashedPassword, u.role, u.status]
      );

      // Insert profiles
      await connection.query(
        `INSERT INTO employee_profiles 
         (user_id, phone, department, designation, joining_date, basic_pay, about, skills, certifications, performance_rating) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          empId,
          u.profile.phone,
          u.profile.department,
          u.profile.designation,
          u.profile.joining_date,
          u.profile.basic_pay,
          u.profile.about,
          u.profile.skills,
          u.profile.certifications,
          u.profile.performance_rating
        ]
      );

      // Insert bank details
      await connection.query(
        `INSERT INTO bank_details 
         (user_id, bank_name, account_number, ifsc_code, pan_number, uan_number, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          empId,
          u.bank.bank_name,
          u.bank.account_number,
          u.bank.ifsc_code,
          u.bank.pan_number,
          u.bank.uan_number,
          u.bank.status
        ]
      );
    }

    console.log('Inserting mock holidays...');
    await connection.query("INSERT INTO holidays (name, date) VALUES ('New Year\\'s Day', '2026-01-01')");
    await connection.query("INSERT INTO holidays (name, date) VALUES ('Independence Day', '2026-08-15')");
    await connection.query("INSERT INTO holidays (name, date) VALUES ('Christmas Day', '2026-12-25')");

    console.log('Inserting mock attendance records...');
    // Add mock attendance logs for elena (User ID: OIELVO20260001) for the last 3 days
    const mockDates = ['2026-07-01', '2026-07-02', '2026-07-03'];
    for (let i = 0; i < mockDates.length; i++) {
      await connection.query(
        `INSERT INTO attendance (user_id, date, clock_in, clock_out, status, working_hours) 
         VALUES ('OIELVO20260001', ?, '09:00:00', '17:00:00', 'present', 8.00)`,
        [mockDates[i]]
      );
    }

    console.log('Database successfully seeded! ✅');
  } catch (error) {
    console.error('Error seeding database:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seed();
