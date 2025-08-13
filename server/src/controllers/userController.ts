import User from '../models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail, sendVerificationSuccessEmail, generateVerificationToken } from '../utils/emailUtils';

interface IUserUpdate {
  name?: string;
  email?: string;
  phone?: string;
  dob?: string;
  location?: string;
  skills?: string[];
  openToAnything?: boolean;
  profilePicture?: string;
  about?: string;
  gender?: string;
  // Note: aadhaar is not included here as it should not be updatable
}

type RegisterInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  dob?: string;
  location?: string;
  role: 'user' | 'volunteer';
  skills?: string[];
  openToAnything?: boolean;
  profilePicture?: string;
  about?: string;
  gender?: string;
  aadhaar: string;
};

export const register = async (userData: RegisterInput) => {
  const { name, email, password, phone, dob, location, role, skills, openToAnything, profilePicture, about, gender, aadhaar } = userData;

  if (!aadhaar || !/^[0-9]{12}$/.test(aadhaar)) {
    throw new Error('Aadhaar is required and must be a 12-digit number');
  }
  
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('Email already exists');
  }

  // Check if Aadhaar already exists
  const existingAadhaar = await User.findOne({ aadhaar });
  if (existingAadhaar) {
    throw new Error('Aadhaar number already registered');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Generate verification token
  const verificationToken = generateVerificationToken();
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Create user
  const user = new User({
    name,
    email,
    password: hashedPassword,
    phone,
    dob,
    location,
    role,
    skills,
    openToAnything,
    profilePicture,
    about,
    gender,
    aadhaar,
    isEmailVerified: false,
    emailVerificationToken: verificationToken,
    emailVerificationExpires: verificationExpires
  });

  await user.save();

  // Send verification email
  const emailSent = await sendVerificationEmail(email, verificationToken, name);
  if (!emailSent) {
    console.warn('Failed to send verification email to:', email);
  }

  return { message: 'User registered successfully. Please check your email to verify your account.' };
};

export const login = async (email: string, password: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  // Check if email is verified
  if (!user.isEmailVerified) {
    throw new Error('Please verify your email address before logging in. Check your inbox for the verification link.');
  }

  const token = jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );

  return {
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified
    }
  };
};

export const verifyEmail = async (token: string) => {
  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: new Date() }
  });

  if (!user) {
    throw new Error('Invalid or expired verification token');
  }

  // Mark email as verified
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  // Send success email
  const emailSent = await sendVerificationSuccessEmail(user.email, user.name);
  if (!emailSent) {
    console.warn('Failed to send verification success email to:', user.email);
  }

  return { message: 'Email verified successfully!' };
};

export const resendVerificationEmail = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('User not found');
  }

  if (user.isEmailVerified) {
    throw new Error('Email is already verified');
  }

  // Generate new verification token
  const verificationToken = generateVerificationToken();
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Update user with new token
  user.emailVerificationToken = verificationToken;
  user.emailVerificationExpires = verificationExpires;
  await user.save();

  // Send new verification email
  const emailSent = await sendVerificationEmail(email, verificationToken, user.name);
  if (!emailSent) {
    throw new Error('Failed to send verification email');
  }

  return { message: 'Verification email sent successfully' };
};

export const getUserById = async (userId: string) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

export const updateUserProfile = async (userId: string, updateData: IUserUpdate) => {
  const { name, email, phone, location, skills, profilePicture, about, gender } = updateData;
  
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { name, email, phone, location, skills, profilePicture, about, gender },
    { new: true }
  ).select('-password');

  if (!updatedUser) {
    throw new Error('User not found');
  }
  
  return updatedUser;
}; 