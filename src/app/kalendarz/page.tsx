import { Metadata } from "next";
import KalendarzClient from "./KalendarzClient";

export const metadata: Metadata = {
  title: "Kalendarz Pokazów Lotniczych 2026 — AirShow Gallery",
  description: "Kalendarz pokazów lotniczych 2026 w Polsce i blisko Polski. Sprawdź nadchodzące eventy lotnicze.",
};

export default function KalendarzPage() {
  return <KalendarzClient />;
}