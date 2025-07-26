import User from '../models/User';

export const getUserById = async (userId: string) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

export const updateUserProfile = async (userId: string, updateData: any) => {
  const { name, email, phone, location, skills } = updateData;
  
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { name, email, phone, location, skills },
    { new: true }
  ).select('-password');

  if (!updatedUser) {
    throw new Error('User not found');
  }
  
  return updatedUser;
}; 