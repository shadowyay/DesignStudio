import User from '../models/User';

interface IUserUpdate {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  skills?: string;
  profilePicture?: string;
  about?: string;
}

export const getUserById = async (userId: string) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

export const updateUserProfile = async (userId: string, updateData: IUserUpdate) => {
  const { name, email, phone, location, skills, profilePicture, about } = updateData;
  
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { name, email, phone, location, skills, profilePicture, about },
    { new: true }
  ).select('-password');

  if (!updatedUser) {
    throw new Error('User not found');
  }
  
  return updatedUser;
}; 