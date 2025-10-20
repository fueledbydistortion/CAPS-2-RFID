import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  ref, 
  set, 
  get, 
  push, 
  update 
} from 'firebase/database';
import { auth, database } from './firebase-config';

// User registration
export const registerUser = async (userData) => {
  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );
    
    const user = userCredential.user;
    
    // ⚠️ SECURITY WARNING: Storing plain text password - NOT RECOMMENDED for production
    // Store additional user data in realtime database
    const userProfile = {
      uid: user.uid,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phone: userData.phone,
      organization: userData.organization,
      password: userData.password, // ⚠️ STORING PLAIN TEXT PASSWORD
      role: userData.role,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    
    // Save user profile to database
    await set(ref(database, `users/${user.uid}`), userProfile);
    
    return { success: true, user, userProfile };
  } catch (error) {
    console.error('Registration error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

// User login
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update last login time
    await update(ref(database, `users/${user.uid}`), {
      lastLogin: new Date().toISOString()
    });
    
    return { success: true, user };
  } catch (error) {
    console.error('Login error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

// User logout
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

// Get current user profile
export const getUserProfile = async (uid) => {
  try {
    const snapshot = await get(ref(database, `users/${uid}`));
    if (snapshot.exists()) {
      return { success: true, data: snapshot.val() };
    } else {
      return { success: false, error: 'User profile not found' };
    }
  } catch (error) {
    console.error('Get user profile error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

// Update user profile
export const updateUserProfile = async (uid, updates) => {
  try {
    await update(ref(database, `users/${uid}`), updates);
    return { success: true };
  } catch (error) {
    console.error('Update user profile error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

// Auth state observer
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};
