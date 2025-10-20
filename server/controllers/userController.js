const admin = require('firebase-admin');
const xlsx = require('xlsx');
const { setDefaultPreferencesInternal } = require('./notificationPreferencesController');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const snapshot = await admin.database().ref('users').once('value');
    const users = [];
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        users.push({
          uid: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
    }
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { uid } = req.params;
    const snapshot = await admin.database().ref(`users/${uid}`).once('value');
    
    if (snapshot.exists()) {
      res.json({
        success: true,
        data: {
          uid,
          ...snapshot.val()
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get users by role
const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const snapshot = await admin.database().ref('users').once('value');
    const users = [];
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const userData = childSnapshot.val();
        if (userData.role === role) {
          users.push({
            uid: childSnapshot.key,
            ...userData
          });
        }
      });
    }
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error getting users by role:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create user
const createUser = async (req, res) => {
  try {
    const userData = req.body;
    const { uid, email, password, ...profileData } = userData;
    
    // Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      uid: uid,
      email: email,
      password: password,
      displayName: `${profileData.firstName} ${profileData.lastName}`
    });
    
    // ⚠️ SECURITY WARNING: Storing plain text password - NOT RECOMMENDED for production
    // Prepare user profile data with all fields
    const userProfile = {
      uid: userRecord.uid,
      firstName: profileData.firstName,
      middleName: profileData.middleName || '',
      lastName: profileData.lastName,
      suffix: profileData.suffix || '',
      email: profileData.email,
      phone: profileData.phone || '',
      role: profileData.role || 'user',
      password: password, // ⚠️ STORING PLAIN TEXT PASSWORD
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      // Include all child and parent information for parent users
      ...(profileData.role === 'parent' && {
        // Child Information - store separate fields
        childFirstName: profileData.childFirstName || '',
        childMiddleName: profileData.childMiddleName || '',
        childLastName: profileData.childLastName || '',
        childSex: profileData.childSex || '',
        childBirthMonth: profileData.childBirthMonth || '',
        childBirthDay: profileData.childBirthDay || '',
        childBirthYear: profileData.childBirthYear || '',
        address: profileData.address || '',
        barangay: profileData.barangay || '',
        municipality: profileData.municipality || '',
        province: profileData.province || '',
        region: profileData.region || '',
        childHandedness: profileData.childHandedness || '',
        isStudying: profileData.isStudying || '',
        schoolName: profileData.schoolName || '',
        numberOfSiblings: profileData.numberOfSiblings || '',
        birthOrder: profileData.birthOrder || '',
        // Father Information - store separate fields
        fatherFirstName: profileData.fatherFirstName || '',
        fatherMiddleName: profileData.fatherMiddleName || '',
        fatherLastName: profileData.fatherLastName || '',
        fatherAge: profileData.fatherAge || '',
        fatherOccupation: profileData.fatherOccupation || '',
        fatherEducation: profileData.fatherEducation || '',
        // Mother Information - store separate fields
        motherFirstName: profileData.motherFirstName || '',
        motherMiddleName: profileData.motherMiddleName || '',
        motherLastName: profileData.motherLastName || '',
        motherAge: profileData.motherAge || '',
        motherOccupation: profileData.motherOccupation || '',
        motherEducation: profileData.motherEducation || ''
      })
    };
    
    // Save user profile to database
    await admin.database().ref(`users/${userRecord.uid}`).set(userProfile);
    
    // Set default notification preferences for new user
    await setDefaultPreferencesInternal(userRecord.uid, profileData.role || 'user');
    
    res.json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { uid } = req.params;
    const updates = req.body;
    
    // Clean up updates - remove empty password field
    const cleanUpdates = { ...updates };
    if (cleanUpdates.password === '' || cleanUpdates.password === null || cleanUpdates.password === undefined) {
      delete cleanUpdates.password;
    }
    if (cleanUpdates.confirmPassword !== undefined) {
      delete cleanUpdates.confirmPassword; // Don't store confirmPassword
    }
    
    // ⚠️ SECURITY WARNING: Updating plain text password - NOT RECOMMENDED for production
    // Update user profile in database (including password if provided)
    await admin.database().ref(`users/${uid}`).update(cleanUpdates);
    
    // Prepare Firebase Auth updates
    const authUpdates = {};
    
    // If updating email, add to Firebase Auth updates
    if (cleanUpdates.email) {
      authUpdates.email = cleanUpdates.email;
    }
    
    // If updating password, add to Firebase Auth updates
    if (cleanUpdates.password && cleanUpdates.password.trim() !== '') {
      authUpdates.password = cleanUpdates.password;
    }
    
    // If updating name, add displayName to Firebase Auth updates
    if (cleanUpdates.firstName || cleanUpdates.lastName) {
      authUpdates.displayName = `${cleanUpdates.firstName || ''} ${cleanUpdates.lastName || ''}`.trim();
    }
    
    // Update Firebase Auth if there are any auth-related changes
    if (Object.keys(authUpdates).length > 0) {
      await admin.auth().updateUser(uid, authUpdates);
    }
    
    res.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { uid } = req.params;
    
    console.log(`Attempting to delete user with UID: ${uid}`);
    
    // Delete from Firebase Auth first
    try {
      await admin.auth().deleteUser(uid);
      console.log(`Successfully deleted user from Firebase Auth: ${uid}`);
    } catch (authError) {
      console.error(`Error deleting from Firebase Auth:`, authError);
      // If user doesn't exist in Auth, continue to delete from database
      if (authError.code !== 'auth/user-not-found') {
        throw authError;
      }
    }
    
    // Delete from database
    await admin.database().ref(`users/${uid}`).remove();
    console.log(`Successfully deleted user from database: ${uid}`);
    
    res.json({
      success: true,
      message: 'User deleted successfully from both Firebase Auth and Database'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Search users
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const snapshot = await admin.database().ref('users').once('value');
    const users = [];
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const userData = childSnapshot.val();
        const searchTerm = q.toLowerCase();
        
        if (
          userData.firstName?.toLowerCase().includes(searchTerm) ||
          userData.lastName?.toLowerCase().includes(searchTerm) ||
          userData.email?.toLowerCase().includes(searchTerm) ||
          userData.childName?.toLowerCase().includes(searchTerm)
        ) {
          users.push({
            uid: childSnapshot.key,
            ...userData
          });
        }
      });
    }
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Bulk import parents from Excel
const bulkImportParents = async (req, res) => {
  try {
    const { parents } = req.body;
    
    if (!parents || !Array.isArray(parents) || parents.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No parent data provided'
      });
    }

    const results = {
      success: [],
      failed: []
    };

    // Process each parent
    for (const parentData of parents) {
      try {
        // Debug logging for birth month
        console.log('Processing parent data:', {
          firstName: parentData.firstName,
          lastName: parentData.lastName,
          childBirthMonth: parentData.childBirthMonth,
          allParentKeys: Object.keys(parentData)
        });

        // Validate required fields
        if (!parentData.email || !parentData.firstName || !parentData.lastName) {
          results.failed.push({
            data: parentData,
            error: 'Missing required fields (email, firstName, lastName)'
          });
          continue;
        }

        // Validate password is provided
        if (!parentData.password || parentData.password.trim() === '') {
          results.failed.push({
            data: parentData,
            error: 'Password is required'
          });
          continue;
        }

        // Use the password provided in the Excel file
        const password = parentData.password;
        
        // Check if user already exists
        let userExists = false;
        try {
          await admin.auth().getUserByEmail(parentData.email);
          userExists = true;
        } catch (error) {
          // User doesn't exist, which is good for import
        }

        if (userExists) {
          results.failed.push({
            data: parentData,
            error: 'User with this email already exists'
          });
          continue;
        }

        // Create Firebase Auth user
        const userRecord = await admin.auth().createUser({
          email: parentData.email,
          password: password,
          displayName: `${parentData.firstName} ${parentData.lastName}`
        });
        
        // ⚠️ SECURITY WARNING: Storing plain text password - NOT RECOMMENDED for production
        // Prepare user profile data
        const userProfile = {
          uid: userRecord.uid,
          firstName: parentData.firstName || '',
          middleName: parentData.middleName || '',
          lastName: parentData.lastName || '',
          suffix: parentData.suffix || '',
          email: parentData.email,
          phone: parentData.phone || '',
          role: 'parent',
          password: password, // ⚠️ STORING PLAIN TEXT PASSWORD
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          // Child Information - store separate fields
          childFirstName: parentData.childFirstName || '',
          childMiddleName: parentData.childMiddleName || '',
          childLastName: parentData.childLastName || '',
          childSex: parentData.childSex || '',
          childBirthMonth: parentData.childBirthMonth || '',
          childBirthDay: parentData.childBirthDay || '',
          childBirthYear: parentData.childBirthYear || '',
          address: parentData.address || '',
          barangay: parentData.barangay || '',
          municipality: parentData.municipality || '',
          province: parentData.province || '',
          region: parentData.region || '',
          childHandedness: parentData.childHandedness || '',
          isStudying: parentData.isStudying || '',
          schoolName: parentData.schoolName || '',
          numberOfSiblings: parentData.numberOfSiblings || '',
          birthOrder: parentData.birthOrder || '',
          // Father Information - store separate fields
          fatherFirstName: parentData.fatherFirstName || '',
          fatherMiddleName: parentData.fatherMiddleName || '',
          fatherLastName: parentData.fatherLastName || '',
          fatherAge: parentData.fatherAge || '',
          fatherOccupation: parentData.fatherOccupation || '',
          fatherEducation: parentData.fatherEducation || '',
          // Mother Information - store separate fields
          motherFirstName: parentData.motherFirstName || '',
          motherMiddleName: parentData.motherMiddleName || '',
          motherLastName: parentData.motherLastName || '',
          motherAge: parentData.motherAge || '',
          motherOccupation: parentData.motherOccupation || '',
          motherEducation: parentData.motherEducation || ''
        };
        
        // Debug logging for what's being saved
        console.log('Saving user profile to database:', {
          uid: userRecord.uid,
          childBirthMonth: userProfile.childBirthMonth,
          childBirthDay: userProfile.childBirthDay,
          childBirthYear: userProfile.childBirthYear
        });

        // Save user profile to database
        await admin.database().ref(`users/${userRecord.uid}`).set(userProfile);
        
        // Set default notification preferences for new parent
        await setDefaultPreferencesInternal(userRecord.uid, 'parent');
        
        results.success.push({
          ...userProfile
        });
      } catch (error) {
        results.failed.push({
          data: parentData,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        successCount: results.success.length,
        failedCount: results.failed.length,
        successfulImports: results.success,
        failedImports: results.failed
      }
    });
  } catch (error) {
    console.error('Error bulk importing parents:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  getUsersByRole,
  createUser,
  updateUser,
  deleteUser,
  searchUsers,
  bulkImportParents
};
