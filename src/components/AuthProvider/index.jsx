import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { AUTH } from "../../config/firebase";
import { fetchAdmin } from "../../firebase/auth";
import { fetchCrewByEmail } from "../../firebase/video/crew";

const AuthContext = createContext({
  user: null,
  isAllowed: false,
  isOwner: false,
  crew: null,
  isCrew: false,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAllowed, setIsAllowed] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [crew, setCrew] = useState(null);
  const [isCrew, setIsCrew] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(AUTH, async (nextUser) => {
      setUser(nextUser);

      if (!nextUser) {
        setIsAllowed(false);
        setIsOwner(false);
        setCrew(null);
        setIsCrew(false);
        setLoading(false);
        return;
      }

      try {
        const [admin, crewRecord] = await Promise.all([
          fetchAdmin(nextUser.email),
          fetchCrewByEmail(nextUser.email),
        ]);
        setIsAllowed(admin !== null);
        setIsOwner(admin?.role === "owner");
        setCrew(crewRecord);
        setIsCrew(crewRecord !== null && crewRecord.active !== false);
      } catch (error) {
        console.error("auth lookup :", error);
        setIsAllowed(false);
        setIsOwner(false);
        setCrew(null);
        setIsCrew(false);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Re-reads the crew record (e.g. after a profile edit or availability
  // change) so the UI reflects the latest without a full sign-in cycle.
  const refreshCrew = async () => {
    if (!user?.email) return;
    const crewRecord = await fetchCrewByEmail(user.email);
    setCrew(crewRecord);
    setIsCrew(crewRecord !== null && crewRecord.active !== false);
  };

  return (
    <AuthContext.Provider value={{ user, isAllowed, isOwner, crew, isCrew, loading, refreshCrew }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
