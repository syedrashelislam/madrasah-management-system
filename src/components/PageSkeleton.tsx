import { Skeleton } from "@/components/ui/skeleton";

const PageSkeleton = ({
  rows = 4,
  showTable = false,
}: {
  rows?: number;
  showTable?: boolean;
}) => {
  return (
    <div className="page-skeleton">
      <div className="page-header">
        <Skeleton className="mb-3 h-8 w-48 bg-muted/70" />
        <Skeleton className="h-4 w-72 max-w-full bg-muted/50" />
      </div>

      <div className="content-box">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full bg-muted/60" />
          ))}
        </div>
      </div>

      {showTable && (
        <div className="content-box" style={{ padding: 0 }}>
          <div className="p-5">
            <Skeleton className="h-5 w-40 bg-muted/60" />
          </div>
          <div className="space-y-3 p-5 pt-0">
            {Array.from({ length: rows }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full bg-muted/40" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PageSkeleton;
