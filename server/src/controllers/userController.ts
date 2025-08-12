import User from '../models/User';

interface IUserUpdate {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  skills?: string;
  profilePicture?: string;
  about?: string;
  gender?: 'male' | 'female' | 'rather not say';
  // Note: aadhaar is not included here as it should not be updatable
}

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