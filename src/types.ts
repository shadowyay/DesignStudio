export interface IFrontendUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  dob?: string;
  location?: string;
  role: 'user' | 'volunteer';
  skills?: string[];
  openToAnything?: boolean;
  profilePicture?: string;
  about?: string;
  gender?: string;
  aadhaar?: string;
  isEmailVerified?: boolean;
}

export interface ICreateTaskData {
  title: string;
  description: string;
  peopleNeeded: number;
  urgency: 'Normal' | 'Urgent' | 'Emergency';
  createdBy: IFrontendUser;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  approxStartTime?: string;
  endTime?: string;
  amount: number;
  taskCategory: 'General' | 'Donor' | 'Blood Emergency' | 'Other';
}

export interface IFrontendTask {
  _id: string;
  title: string;
  description: string;
  peopleNeeded: number;
  urgency: 'Normal' | 'Urgent' | 'Emergency';
  createdBy: IFrontendUser;
  location: { // Make location optional to align with newTask's initial state
    address: string;
    lat: number;
    lng: number;
  };
  approxStartTime?: string;
  endTime?: string;
  amount: number;
  acceptedBy?: IFrontendUser[]; // Make acceptedBy optional as it might not be present on creation
  acceptedCount?: number; // Make optional
  isFull?: boolean; // Make optional
  createdAt?: string; // Make optional
  updatedAt?: string; // Make optional
  taskCategory: 'General' | 'Donor' | 'Blood Emergency' | 'Other';
}

export interface RegisterData {
  name: string;
  dob: string;
  email: string;
  phone: string;
  password: string;
  location: string;
  profilePicture?: string;
  about?: string;
  role: 'user' | 'volunteer';
  gender?: 'male' | 'female' | 'rather not say';
  aadhaar?: string; // Made optional to handle existing users
}

export interface LocationData {
  lat: number;
  lng: number;
  address: string; // Make address required for task creation
} 

export interface LocationMapProps {
  center: [number, number];
  markerPosition: [number, number] | null;
  onLocationSelect: (lat: number, lng: number) => void;
  height?: string;
  zoom?: number;
}

export interface LocationPickerProps {
  address: string;
  onAddressChange: (address: string) => void;
  onLocationChange: (lat: number, lng: number) => void;
  onCurrentLocationClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  lat?: number; // Add lat to props
  lng?: number; // Add lng to props
}