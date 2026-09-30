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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const clearUser = () => setUser(null);
    window.addEventListener("auth:logout", clearUser);

    const token = localStorage.getItem("access");

    if (!token && !localStorage.getItem("refresh")) {
      setIsLoading(false);
      return () => window.removeEventListener("auth:logout", clearUser);
    }

    api.get("/accounts/dashboard/")
      .then(({ data }) => {
        setUser({
          username: data.username,
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
        });
      })
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));

    return () => window.removeEventListener("auth:logout", clearUser);
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
    setIsLoading(false);

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
        isLoading,
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