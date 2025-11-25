import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

const createTestUsers = async () => {
  try {
    console.log('🔧 Creating test users...\n');

    const testUsers = [
      {
        email: 'admin@test.com',
        password: 'Admin123!@#',
        fullName: 'Test Admin',
        role: 'admin',
        phone: '+919876543210',
      },
      {
        email: 'mentor@test.com',
        password: 'Mentor123!@#',
        fullName: 'Test Mentor',
        role: 'mentor',
        phone: '+919876543211',
        mentorData: {
          bio: 'Experienced mentor with 10+ years in software development',
          domains: ['Technology', 'Software Development'],
          specialties: ['React', 'Node.js', 'System Design'],
          languages: ['English', 'Hindi'],
          achievements: ['Microsoft MVP', 'Published Author'],
        },
      },
      {
        email: 'mentee@test.com',
        password: 'Mentee123!@#',
        fullName: 'Test Mentee',
        role: 'mentee',
        phone: '+919876543212',
      },
    ];

    // First, update vapmail16@gmail.com to admin
    console.log('📧 Updating vapmail16@gmail.com to admin role...');
    const updateResult = await query(
      'UPDATE users SET role = $1 WHERE email = $2 RETURNING id, email, role',
      ['admin', 'vapmail16@gmail.com']
    );

    if (updateResult.rows.length > 0) {
      console.log(`✅ Updated: ${updateResult.rows[0].email} → ${updateResult.rows[0].role}\n`);
    } else {
      console.log('⚠️  User vapmail16@gmail.com not found. Will create with admin role.\n');
    }

    // Create test users
    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await query(
        'SELECT id, email, role FROM users WHERE email = $1',
        [userData.email]
      );

      if (existingUser.rows.length > 0) {
        console.log(`⚠️  User ${userData.email} already exists. Updating password and ensuring correct setup...`);
        
        const existingUserData = existingUser.rows[0];
        
        // Update password hash to ensure correct password
        const passwordHash = await hashPassword(userData.password);
        await query(
          'UPDATE users SET password_hash = $1, role = $2, email_confirmed = TRUE WHERE email = $3',
          [passwordHash, userData.role, userData.email]
        );
        console.log(`   ✅ Updated password and role: ${userData.role}`);
        
        // Create mentor profile if role is mentor and profile doesn't exist
        if (userData.role === 'mentor' && userData.mentorData) {
          const mentorCheck = await query(
            'SELECT user_id FROM mentors WHERE user_id = $1',
            [existingUserData.id]
          );
          
          if (mentorCheck.rows.length === 0) {
            await query(
              `INSERT INTO mentors (user_id, bio, domains, specialties, languages, achievements)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                existingUserData.id,
                userData.mentorData.bio,
                userData.mentorData.domains,
                userData.mentorData.specialties,
                userData.mentorData.languages,
                userData.mentorData.achievements,
              ]
            );
            console.log(`   ✅ Created mentor profile`);
          }
        }
        
        continue;
      }

      // Hash password
      const passwordHash = await hashPassword(userData.password);

      // Create user
      const userId = uuidv4();
      const result = await query(
        `INSERT INTO users (id, email, password_hash, full_name, role, phone, email_confirmed)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE)
         RETURNING id, email, full_name, role`,
        [
          userId,
          userData.email.toLowerCase(),
          passwordHash,
          userData.fullName,
          userData.role,
          userData.phone,
        ]
      );

      const user = result.rows[0];
      console.log(`✅ Created: ${user.email} (${user.role}) - Password: ${userData.password}`);

      // Create mentor profile if role is mentor
      if (userData.role === 'mentor' && userData.mentorData) {
        await query(
          `INSERT INTO mentors (user_id, bio, domains, specialties, languages, achievements)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            userId,
            userData.mentorData.bio,
            userData.mentorData.domains,
            userData.mentorData.specialties,
            userData.mentorData.languages,
            userData.mentorData.achievements,
          ]
        );
        console.log(`   ✅ Created mentor profile`);
      }
    }

    // Also ensure vapmail16@gmail.com exists as admin (if it wasn't found earlier)
    const checkVapmail = await query(
      'SELECT id, email, role FROM users WHERE email = $1',
      ['vapmail16@gmail.com']
    );

    if (checkVapmail.rows.length === 0) {
      console.log('\n📧 Creating vapmail16@gmail.com as admin...');
      const passwordHash = await hashPassword('Vapmail123!@#'); // Default password
      const userId = uuidv4();
      await query(
        `INSERT INTO users (id, email, password_hash, full_name, role, email_confirmed)
         VALUES ($1, $2, $3, $4, $5, TRUE)
         RETURNING id, email, role`,
        [
          userId,
          'vapmail16@gmail.com',
          passwordHash,
          'Vikkas Arun Pareek',
          'admin',
        ]
      );
      console.log(`✅ Created: vapmail16@gmail.com (admin) - Password: Vapmail123!@#`);
    } else if (checkVapmail.rows[0].role !== 'admin') {
      await query(
        'UPDATE users SET role = $1 WHERE email = $2',
        ['admin', 'vapmail16@gmail.com']
      );
      console.log(`✅ Updated vapmail16@gmail.com to admin role`);
    }

    console.log('\n✨ Test users setup complete!\n');
    console.log('📋 Test Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:');
    console.log('  Email: admin@test.com');
    console.log('  Password: Admin123!@#');
    console.log('');
    console.log('Mentor:');
    console.log('  Email: mentor@test.com');
    console.log('  Password: Mentor123!@#');
    console.log('');
    console.log('Mentee:');
    console.log('  Email: mentee@test.com');
    console.log('  Password: Mentee123!@#');
    console.log('');
    console.log('Your Account (Admin):');
    console.log('  Email: vapmail16@gmail.com');
    console.log('  Password: <your existing password>');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test users:', error);
    process.exit(1);
  }
};

createTestUsers();

