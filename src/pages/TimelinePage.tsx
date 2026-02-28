import { Timeline } from "@/components/timeline";
import { useTranslation } from "react-i18next";

export function TimelinePage() {
  const { t } = useTranslation("sidebar");
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t("timeline")}</h1>
      <Timeline />
    </div>
  );
}
