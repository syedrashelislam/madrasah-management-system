import { useSettings } from "./useSettings";
import { toast } from "sonner";

export function useMaxUploadSize() {
  const { data: settings = [] } = useSettings();
  const maxKB = Number(settings.find(s => s.key === "max_upload_size_kb")?.value) || 500;

  const validateFile = (file: File): boolean => {
    const fileSizeKB = file.size / 1024;
    if (fileSizeKB > maxKB) {
      toast.error(`ফাইলের আকার ${Math.round(fileSizeKB)}KB, সর্বোচ্চ ${maxKB}KB অনুমোদিত`);
      return false;
    }
    return true;
  };

  return { maxKB, validateFile };
}
