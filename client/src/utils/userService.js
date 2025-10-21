import { createUserWithEmailAndPassword } from "firebase/auth";
import { get, onValue, ref, set, update } from "firebase/database";
import { API_BASE_URL } from "../config/api";
import { auth, database } from "./firebase-config";

// User types constants
export const USER_TYPES = {
  TEACHER: "teacher",
  STUDENT: "student",
  PARENT: "parent",
  ADMIN: "admin",
};

// Create a new user (both auth and database)
export const createUser = async (userData) => {
  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );

    const user = userCredential.user;

    // ⚠️ SECURITY WARNING: Storing plain text password - NOT RECOMMENDED for production
    // Prepare user profile data with all fields
    const userProfile = {
      uid: user.uid,
      firstName: userData.firstName,
      middleName: userData.middleName || "",
      lastName: userData.lastName,
      suffix: userData.suffix || "",
      email: userData.email,
      phone: userData.phone || "",
      password: userData.password, // ⚠️ STORING PLAIN TEXT PASSWORD
      role: userData.role || "user",
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      // Include all child and parent information for parent users
      ...(userData.role === "parent" && {
        childFirstName: userData.childFirstName || "",
        childMiddleName: userData.childMiddleName || "",
        childLastName: userData.childLastName || "",
        childRFID: userData.childRFID || "",
        childSex: userData.childSex || "",
        childBirthMonth: userData.childBirthMonth || "",
        childBirthDay: userData.childBirthDay || "",
        childBirthYear: userData.childBirthYear || "",
        address: userData.address || "",
        barangay: userData.barangay || "",
        municipality: userData.municipality || "",
        province: userData.province || "",
        region: userData.region || "",
        childHandedness: userData.childHandedness || "",
        isStudying: userData.isStudying || "",
        schoolName: userData.schoolName || "",
        numberOfSiblings: userData.numberOfSiblings || "",
        birthOrder: userData.birthOrder || "",
        fatherFirstName: userData.fatherFirstName || "",
        fatherMiddleName: userData.fatherMiddleName || "",
        fatherLastName: userData.fatherLastName || "",
        fatherAge: userData.fatherAge || "",
        fatherOccupation: userData.fatherOccupation || "",
        fatherEducation: userData.fatherEducation || "",
        motherFirstName: userData.motherFirstName || "",
        motherMiddleName: userData.motherMiddleName || "",
        motherLastName: userData.motherLastName || "",
        motherAge: userData.motherAge || "",
        motherOccupation: userData.motherOccupation || "",
        motherEducation: userData.motherEducation || "",
      }),
    };

    // Save user profile to users collection only
    await set(ref(database, `users/${user.uid}`), userProfile);

    return { success: true, user, userProfile };
  } catch (error) {
    console.error("Create user error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Get all users from users collection
export const getAllUsers = async () => {
  try {
    const snapshot = await get(ref(database, "users"));
    if (snapshot.exists()) {
      const users = Object.entries(snapshot.val()).map(([uid, userData]) => ({
        uid,
        ...userData,
      }));
      return { success: true, data: users };
    } else {
      return { success: true, data: [] };
    }
  } catch (error) {
    console.error("Get all users error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Get users by role
export const getUsersByRole = async (role) => {
  try {
    const snapshot = await get(ref(database, "users"));
    if (snapshot.exists()) {
      const allUsers = Object.entries(snapshot.val()).map(
        ([uid, userData]) => ({
          uid,
          ...userData,
        })
      );
      const filteredUsers = allUsers.filter((user) => user.role === role);
      return { success: true, data: filteredUsers };
    } else {
      return { success: true, data: [] };
    }
  } catch (error) {
    console.error("Get users by role error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Get a specific user by UID
export const getUserById = async (uid) => {
  try {
    const snapshot = await get(ref(database, `users/${uid}`));
    if (snapshot.exists()) {
      return { success: true, data: snapshot.val() };
    } else {
      return { success: false, error: "User not found" };
    }
  } catch (error) {
    console.error("Get user by ID error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Update user data (via server API to handle password and Firebase Auth updates)
export const updateUser = async (uid, updates) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const token = await user.getIdToken();

    // Always use server endpoint to ensure proper handling of passwords and Firebase Auth sync
    const response = await fetch(`${API_BASE_URL}/users/${uid}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to update user");
    }

    return { success: true };
  } catch (error) {
    console.error("Update user error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Delete user (both auth and database via server)
export const deleteUserById = async (uid) => {
  try {
    // Get current user's auth token
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const token = await user.getIdToken();

    // Call server endpoint to delete user from both Firebase Auth and database
    const response = await fetch(`${API_BASE_URL}/users/${uid}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to delete user");
    }

    return { success: true, message: result.message };
  } catch (error) {
    console.error("Delete user error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Listen to real-time updates for all users
export const subscribeToAllUsers = (callback) => {
  const usersRef = ref(database, "users");

  const unsubscribe = onValue(
    usersRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const users = Object.entries(snapshot.val()).map(([uid, userData]) => ({
          uid,
          ...userData,
        }));
        callback({ success: true, data: users });
      } else {
        callback({ success: true, data: [] });
      }
    },
    (error) => {
      console.error("Subscribe to users error:", error);
      callback({ success: false, error: error.message });
    }
  );

  return unsubscribe;
};

// Listen to real-time updates for users by role
export const subscribeToUsersByRole = (role, callback) => {
  const usersRef = ref(database, "users");

  const unsubscribe = onValue(
    usersRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const allUsers = Object.entries(snapshot.val()).map(
          ([uid, userData]) => ({
            uid,
            ...userData,
          })
        );
        const filteredUsers = allUsers.filter((user) => user.role === role);
        callback({ success: true, data: filteredUsers });
      } else {
        callback({ success: true, data: [] });
      }
    },
    (error) => {
      console.error("Subscribe to users by role error:", error);
      callback({ success: false, error: error.message });
    }
  );

  return unsubscribe;
};

// Update user status (active/inactive)
export const updateUserStatus = async (uid, status) => {
  try {
    await update(ref(database, `users/${uid}`), { status });

    return { success: true };
  } catch (error) {
    console.error("Update user status error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Search users by name or email
export const searchUsers = async (searchTerm) => {
  try {
    const snapshot = await get(ref(database, "users"));
    if (snapshot.exists()) {
      const users = Object.entries(snapshot.val()).map(([uid, userData]) => ({
        uid,
        ...userData,
      }));

      const filteredUsers = users.filter(
        (user) =>
          user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      return { success: true, data: filteredUsers };
    } else {
      return { success: true, data: [] };
    }
  } catch (error) {
    console.error("Search users error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Bulk import parents from Excel
export const bulkImportParents = async (parents) => {
  try {
    // Get the current user's auth token
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Not authenticated");
    }

    const token = await user.getIdToken();

    // Debug: client-side payload checks before API call
    try {
      console.log(
        "[Import][Client] Parents payload size:",
        parents?.length || 0
      );
      const rfidCounts = {
        withRFID: (parents || []).filter(
          (p) => (p?.childRFID || "").toString().trim() !== ""
        ).length,
        withoutRFID: (parents || []).filter(
          (p) => !p?.childRFID || p.childRFID.toString().trim() === ""
        ).length,
      };
      console.log("[Import][Client] RFID stats:", rfidCounts);
      console.log(
        "[Import][Client] First two parents:",
        (parents || []).slice(0, 2)
      );
    } catch (e) {
      console.warn("[Import][Client] Failed to log payload summary:", e);
    }

    const response = await fetch(`${API_BASE_URL}/users/bulk-import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ parents }),
    });

    const result = await response.json();

    // Debug: log server response for troubleshooting
    console.log("[Import][Client] Server response status:", response.status);
    try {
      console.log("[Import][Client] Full server response:", result);
      console.log("[Import][Client] Server response data (sample):", {
        successCount: result?.data?.successCount,
        failedCount: result?.data?.failedCount,
        firstSuccess: result?.data?.successfulImports?.[0],
      });
      // Debug: Check if RFID is in the success response
      const firstSuccess = result?.data?.successfulImports?.[0];
      if (firstSuccess) {
        console.log(
          "[Import][Client] First success RFID:",
          firstSuccess.childRFID
        );
        console.log(
          "[Import][Client] First success keys:",
          Object.keys(firstSuccess)
        );
        console.log(
          "[Import][Client] First success full object:",
          firstSuccess
        );
      }
    } catch (e) {
      console.error("[Import][Client] Debug logging error:", e);
    }

    if (!response.ok) {
      throw new Error(result.error || "Failed to import parents");
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error("Bulk import parents error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Upload profile picture for a user
export const uploadProfilePicture = async (uid, file) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Not authenticated");
    }

    const token = await user.getIdToken();

    const formData = new FormData();
    formData.append("profilePicture", file);

    const response = await fetch(
      `${API_BASE_URL}/files/profile-picture/${uid}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to upload profile picture");
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error("Upload profile picture error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Delete profile picture for a user
export const deleteProfilePicture = async (uid) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Not authenticated");
    }

    const token = await user.getIdToken();

    const response = await fetch(
      `${API_BASE_URL}/files/profile-picture/${uid}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to delete profile picture");
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error("Delete profile picture error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
