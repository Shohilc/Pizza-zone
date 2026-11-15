import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';

dotenv.config();

const emailArg = process.argv[2]?.trim().toLowerCase();

if (!emailArg) {
  console.log('\nUsage: node src/seed/setAdmin.js <email>');
  console.log('Example: node src/seed/setAdmin.js myemail@gmail.com\n');
  process.exit(1);
}

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/snackstore';

async function setAdmin() {
  try {
    await mongoose.connect(mongoUri);
    console.log(`Connected to database.`);

    const user = await User.findOne({ email: emailArg });

    if (!user) {
      console.log(`❌ User with email "${emailArg}" was not found in database.`);
      console.log(`Please sign in with this email on the website first, then run this command.\n`);
      process.exit(1);
    }

    user.role = 'admin';
    await user.save();

    console.log(`\n🎉 Success! User "${user.name}" (${user.email}) is now an ADMIN!`);
    console.log(`They can now access the Admin Dashboard at: http://localhost:5173/admin\n`);
    process.exit(0);
  } catch (err) {
    console.error('Error updating user role:', err.message);
    process.exit(1);
  }
}

setAdmin();

