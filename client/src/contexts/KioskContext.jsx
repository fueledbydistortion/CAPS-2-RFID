import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createKioskSession,
  endKioskSession,
  getKioskSession,
} from "../utils/kioskService";
import { useAuth } from "./AuthContext";

const KioskContext = createContext();

export { KioskContext };

export const useKiosk = () => {
  const context = useContext(KioskContext);
  if (!context) {
    throw new Error("useKiosk must be used within a KioskProvider");
  }
  return context;
};

export const KioskProvider = ({ children }) => {
  try {
    const { userProfile } = useAuth();

    const [kioskMode, setKioskMode] = useState(false);
    const [kioskSession, setKioskSession] = useState(null);
    const [loading, setLoading] = useState(false);

    // Check for existing kiosk session on mount
    useEffect(() => {
      if (
        userProfile &&
        (userProfile.role === "teacher" || userProfile.role === "admin")
      ) {
        checkKioskSession();
      }
    }, [userProfile]);

    const checkKioskSession = async () => {
      try {
        setLoading(true);
        const result = await getKioskSession();
        if (result.success && result.data) {
          setKioskSession(result.data);
          setKioskMode(true);
        } else if (result.notDeployed) {
          // Kiosk endpoints are not deployed on the server
          console.warn("Kiosk mode is not available on this server");
          setKioskSession(null);
          setKioskMode(false);
        } else {
          setKioskSession(null);
          setKioskMode(false);
        }
      } catch (error) {
        console.error("Error checking kiosk session:", error);
        setKioskSession(null);
        setKioskMode(false);
      } finally {
        setLoading(false);
      }
    };

    const enableKioskMode = async (scheduleId) => {
      try {
        setLoading(true);
        const result = await createKioskSession(scheduleId);
        if (result.success) {
          setKioskSession(result.data);
          setKioskMode(true);
          return { success: true, data: result.data };
        } else if (result.notDeployed) {
          return {
            success: false,
            error:
              "Kiosk mode is not available on this server. Please contact your administrator.",
          };
        } else {
          return { success: false, error: result.error };
        }
      } catch (error) {
        console.error("Error enabling kiosk mode:", error);
        return { success: false, error: error.message };
      } finally {
        setLoading(false);
      }
    };

    const disableKioskMode = async () => {
      try {
        setLoading(true);
        const result = await endKioskSession();
        if (result.success) {
          setKioskSession(null);
          setKioskMode(false);
          return { success: true };
        } else {
          return { success: false, error: result.error };
        }
      } catch (error) {
        console.error("Error disabling kiosk mode:", error);
        return { success: false, error: error.message };
      } finally {
        setLoading(false);
      }
    };

    const canAccessKiosk = () => {
      return kioskMode && kioskSession && kioskSession.isActive;
    };

    const getKioskUrl = () => {
      if (kioskSession && kioskSession.sessionId) {
        return `${window.location.origin}/kiosk/${kioskSession.sessionId}`;
      }
      return null;
    };

    const value = {
      kioskMode,
      kioskSession,
      loading,
      enableKioskMode,
      disableKioskMode,
      canAccessKiosk,
      getKioskUrl,
      checkKioskSession,
    };

    return (
      <KioskContext.Provider value={value}>{children}</KioskContext.Provider>
    );
  } catch (error) {
    console.error("KioskProvider: Error initializing:", error);
    // Return a fallback provider with minimal functionality
    const fallbackValue = {
      kioskMode: false,
      kioskSession: null,
      loading: false,
      enableKioskMode: async () => ({
        success: false,
        error: "Kiosk mode unavailable",
      }),
      disableKioskMode: async () => ({
        success: false,
        error: "Kiosk mode unavailable",
      }),
      canAccessKiosk: () => false,
      getKioskUrl: () => null,
      checkKioskSession: async () => {},
    };

    return (
      <KioskContext.Provider value={fallbackValue}>
        {children}
      </KioskContext.Provider>
    );
  }
};
