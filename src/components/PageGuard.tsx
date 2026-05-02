import { ReactNode } from "react";
import { useUserRole, type PageKey } from "@/hooks/useUserRole";
import PageSkeleton from "@/components/PageSkeleton";
import AccessDenied from "@/components/AccessDenied";

interface PageGuardProps {
  pageKey: PageKey;
  children: ReactNode;
}

const PageGuard = ({ pageKey, children }: PageGuardProps) => {
  const { isLoading, hasPageAccess } = useUserRole();

  if (isLoading) {
    return <PageSkeleton showTable rows={5} />;
  }

  if (!hasPageAccess(pageKey)) {
    return <AccessDenied />;
  }

  return <>{children}</>;
};

export default PageGuard;
