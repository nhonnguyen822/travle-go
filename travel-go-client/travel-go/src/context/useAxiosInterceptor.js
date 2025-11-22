import {useCallback, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import api from "./api";
import toast from "react-hot-toast";
import {useAuth} from "./AuthContext";

export const useAxiosInterceptor = () => {
  const navigate = useNavigate();
  const { setUser, logout } = useAuth();
  // const hasShown = useRef(false);

  // ✅ Dùng useCallback để giữ 1 reference duy nhất
  const errorHandler = useCallback(
    (error) => {
      const status = error.response?.status;
      const errorData = error.response?.data;
      const errorMessage = error.message || "";

      console.log("Error handler in useAxiosInterceptor:", {
        status,
        errorData,
        errorMessage,
        fullError: error,
      });

      // Check for content policy violation specifically
      if (status === 400) {
        const responseString = JSON.stringify(errorData || {});

        if (
          errorMessage.includes("content_policy_violation") ||
          errorMessage.includes("safety system") ||
          responseString.includes("content_policy_violation") ||
          responseString.includes("safety system") ||
          errorData?.message?.includes("content_policy_violation") ||
          errorData?.message?.includes("safety system") ||
          errorData?.error?.code === "content_policy_violation"
        ) {
          // Don't redirect to login for content policy violations
          // Let the component handle this error
          console.log(
            "Content policy violation detected in interceptor, not redirecting to login"
          );
          return Promise.reject(error);
        }
      }

      if (status === 401 && errorData?.error === "Unauthorized") {
        setUser(null);

        toast.error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.", {
          id: "session-expired",
        });
        navigate("/login", { replace: true });
        // }

        // ⛔️ không reject để component không xử lý tiếp
        // return new Promise(() => { }); // "treo" promise này
        return Promise.resolve();
      }
      return Promise.reject(error);
    },
    [navigate, setUser]
  );

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      errorHandler
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [errorHandler]);
};

// ✅ wrapper
export const AxiosInterceptor = () => {
  useAxiosInterceptor();
  return null;
};
