import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { AUTH } from "../../config/firebase";
import { fetchAdmin } from "../../firebase/auth";

const AuthContext = createContext({
  user: null,
  isAllowed: false,
  isOwner: false,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAllowed, setIsAllowed] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(AUTH, async (nextUser) => {
      setUser(nextUser);

      if (!nextUser) {
        setIsAllowed(false);
        setIsOwner(false);
        setLoading(false);
        return;
      }

      try {
        const admin = await fetchAdmin(nextUser.email);
        setIsAllowed(admin !== null);
        setIsOwner(admin?.role === "owner");
      } catch (error) {
        console.error("fetchAdmin :", error);
        setIsAllowed(false);
        setIsOwner(false);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAllowed, isOwner, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
