import { ControlPanel } from "@/components/page.client";
import { Suspense } from "react";

export default function Home() {
  return (
    <main>
      <Suspense>
        <ControlPanel />
      </Suspense>
    </main>
  );
}
