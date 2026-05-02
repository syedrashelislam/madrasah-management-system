import { toBengaliNumber } from "@/lib/constants";
import Icon from "@/components/Icon";

interface Props {
  filtered: number;
  safePage: number;
  totalPages: number;
  pageSize: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}

export default function FeeTransactionsPagination({
  filtered,
  safePage,
  totalPages,
  pageSize,
  setCurrentPage,
}: Props) {
  if (filtered === 0) return null;

  const btnBase = (disabled: boolean): React.CSSProperties => ({
    padding: "4px 10px",
    borderRadius: 6,
    fontSize: 12,
    cursor: disabled ? "not-allowed" : "pointer",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: disabled ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)",
    transition: "all 0.2s",
  });

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(
      (p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1,
    )
    .reduce<(number | "dots")[]>((acc, p, i, arr) => {
      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("dots");
      acc.push(p);
      return acc;
    }, []);

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        fontSize: 13,
        color: "rgba(255,255,255,0.5)",
      }}
    >
      {/* Left: info */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span>
          মোট {toBengaliNumber(filtered)} টির মধ্যে{" "}
          {toBengaliNumber((safePage - 1) * pageSize + 1)}–
          {toBengaliNumber(Math.min(safePage * pageSize, filtered))} দেখানো
          হচ্ছে
        </span>
      </div>

      {/* Right: page buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <button
          onClick={() => setCurrentPage(1)}
          disabled={safePage <= 1}
          style={btnBase(safePage <= 1)}
        >
          <Icon name="fa-angle-double-left" size={11} />
        </button>
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={safePage <= 1}
          style={btnBase(safePage <= 1)}
        >
          <Icon name="fa-chevron-left" size={11} />
        </button>

        {pageNumbers.map((item, i) =>
          item === "dots" ? (
            <span
              key={`dots-${i}`}
              style={{ padding: "0 4px", color: "rgba(255,255,255,0.3)" }}
            >
              …
            </span>
          ) : (
            <button
              key={item}
              onClick={() => setCurrentPage(item as number)}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                background:
                  safePage === item
                    ? "#d4af37"
                    : "rgba(255,255,255,0.05)",
                border:
                  safePage === item
                    ? "1px solid #d4af37"
                    : "1px solid rgba(255,255,255,0.1)",
                color:
                  safePage === item
                    ? "#0a1f0a"
                    : "rgba(255,255,255,0.7)",
              }}
            >
              {toBengaliNumber(item as number)}
            </button>
          ),
        )}

        <button
          onClick={() =>
            setCurrentPage((p) => Math.min(totalPages, p + 1))
          }
          disabled={safePage >= totalPages}
          style={btnBase(safePage >= totalPages)}
        >
          <Icon name="fa-chevron-right" size={11} />
        </button>
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={safePage >= totalPages}
          style={btnBase(safePage >= totalPages)}
        >
          <Icon name="fa-angle-double-right" size={11} />
        </button>
      </div>
    </div>
  );
}
