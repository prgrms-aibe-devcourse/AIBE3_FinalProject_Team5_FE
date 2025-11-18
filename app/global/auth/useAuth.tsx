"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface MemberDto {
  id: number;
  email: string;
  nickname: string;
}

interface AuthContextType {
  loginMember: MemberDto | null; //로그인 멤버의 정보 { id:long, email:string, nickname:string }
  isLogin: boolean; //로그인 상태 보여주는 boolean
  reloadMember: () => void; //로그인 멤버의 상태 최신화
  logoutMember: () => void; //로그아웃 요청 후 쿠키삭제
  accessToken: string | null;
  apiKey: string | null;
  setAccessToken: (value: string) => void;
  setApiKey: (value: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  loginMember: null,
  isLogin: false,
  reloadMember: () => {},
  logoutMember: () => {},
  accessToken: null,
  apiKey: null,
  setAccessToken: () => {},
  setApiKey: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loginMember, setLoginMember] = useState<MemberDto | null>(null);
  const [isLogin, setIsLogin] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>("");
  const [apiKey, setApiKey] = useState<string | null>("");

  const fetchMember = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && apiKey
            ? { Authorization: `Bearer ${apiKey} ${accessToken}` }
            : {}),
        },
        credentials: "include",
      });
      if (!res.ok) {
        setLoginMember(null);
        setIsLogin(false);
        return;
      }
      const data = await res.json();
      setLoginMember(data.data);
      setIsLogin(true);
    } catch (err) {
      console.error("로그인 정보 요청 실패:", err);
      setLoginMember(null);
      setIsLogin(false);
    }
  };

  const logoutMember = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/v1/auth/logout`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) {
        return;
      }
      setLoginMember(null);
      setIsLogin(false);
    } catch (err) {
      console.error("로그아웃 요청 실패:", err);
    }
  };

  useEffect(() => {
    fetchMember();
  }, [apiKey, accessToken]);

  return (
    <AuthContext.Provider
      value={{
        loginMember,
        isLogin,
        reloadMember: fetchMember,
        logoutMember: logoutMember,
        accessToken,
        apiKey,
        setAccessToken: setAccessToken,
        setApiKey: setApiKey,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// 다른 컴포넌트에서 사용 가능
export function useAuth() {
  return useContext(AuthContext);
}
