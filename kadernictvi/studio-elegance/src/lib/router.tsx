import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type RouterValue = {
  pathname: string;
  navigate: (to: string, opts?: { replace?: boolean }) => void;
};

const RouterContext = createContext<RouterValue | null>(null);

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  const navigate = useCallback((to: string, opts?: { replace?: boolean }) => {
    if (opts?.replace) {
      window.history.replaceState({}, "", to);
    } else {
      window.history.pushState({}, "", to);
    }
    setPathname(window.location.pathname);
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const onPop = () => {
      setPathname(window.location.pathname);
      window.scrollTo(0, 0);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const value = useMemo(() => ({ pathname, navigate }), [pathname, navigate]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("useRouter must be used inside RouterProvider");
  return ctx;
}

export function AppLink({
  to,
  className,
  children,
  ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
  const { navigate } = useRouter();
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
