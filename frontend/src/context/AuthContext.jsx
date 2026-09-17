import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("access");

    if (token) {
      const loadUser = async () => {
        try {
          const response = await api.get(
            "/accounts/dashboard/"
          );

          setUser({
            username: response.data.username,
          });
        } catch (error) {
                console.error(error);
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
          setUser(null);
        }
      };

      loadUser();
    }
  }, []);

  const login = async (username, password) => {
    const response = await api.post("/token/", {
      username,
      password,
    });

    localStorage.setItem(
      "access",
      response.data.access
    );

    localStorage.setItem(
      "refresh",
      response.data.refresh
    );

    setUser({
      username,
    });

    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

 export const useAuth = () =>
  {
  return useContext(AuthContext);
};