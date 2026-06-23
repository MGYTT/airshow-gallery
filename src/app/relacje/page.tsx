import type { Metadata } from "next";
import StoriesArchive from "@/components/stories/StoriesArchive";

export const metadata: Metadata = {
  title:       "Relacje — AirShow Gallery",
  description: "Archiwum relacji fotograficznych z pokazów lotniczych. Przeżyj każdy pokaz od środka.",
};

export default function RelacjePage() {
  return <StoriesArchive />;
}