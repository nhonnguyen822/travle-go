import {createContext, useContext, useEffect, useState} from "react";
import api from "./api";


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Khi app load, gọi /me để check user đã login chưa
  const fetchUser = async () => {
    try {
      const resp = await api.get(`/auth/me`,);
      if (resp.data.success) {
        const userData = resp.data.user || resp.data;
        setUser(userData);
        setIsAuthenticated(true);
        return userData; // ✅ Trả về user mới
      } else {
        setUser(null);
        setIsAuthenticated(false);
        return null;
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout'); // Gọi API logout server
    } catch (error) {
      // Ignore errors
    } finally {
      // ✅ Clear mọi state và storage
      setUser(null);
      setIsAuthenticated(false);

      // ✅ Xóa cookie trên client
      document.cookie = 'jwt=; Max-Age=0; path=/;';
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
      <AuthContext.Provider value={{ user, setUser, loading, fetchUser, logout, isAuthenticated }}>
        {children}
      </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
