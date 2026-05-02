import { Skeleton } from "@/components/ui/skeleton";

const DataSectionSkeleton = ({
  rows = 5,
  columns = 4,
  cards = 0,
}: {
  rows?: number;
  columns?: number;
  cards?: number;
}) => {
  return (
    <div className="space-y-4">
      {cards > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: cards }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full bg-muted/60" />
          ))}
        </div>
      )}

      <div className="content-box" style={{ padding: 0 }}>
        <div className="space-y-3 p-4 sm:p-5">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
              {Array.from({ length: columns }).map((__, columnIndex) => (
                <Skeleton key={columnIndex} className="h-11 w-full bg-muted/40" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DataSectionSkeleton;
