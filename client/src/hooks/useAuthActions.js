import { useNavigate } from 'react-router-dom';
import { loginUser, logoutUser } from '../utils/firebase-auth';
import Swal from 'sweetalert2';

export const useAuthActions = () => {
  const navigate = useNavigate();

  const login = async (email, password) => {
    try {
      const result = await loginUser(email, password);
      
      if (result.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Welcome Back!',
          text: 'You have successfully signed in to your SmartChildcare account.',
          timer: 2000,
          showConfirmButton: false
        });
        
        navigate('/dashboard');
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  };

  // Signup flow removed - user accounts should be provisioned by admin or via backend

  const logout = async () => {
    try {
      const result = await logoutUser();
      
      if (result.success) {
        await Swal.fire({
          title: 'Logged out!',
          text: 'You have been successfully logged out.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          background: 'rgba(255, 255, 255, 0.95)',
          backdrop: 'rgba(0, 0, 0, 0.4)'
        });
        
        navigate('/login');
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Failed to logout. Please try again.' };
    }
  };

  return { login, logout };
};
