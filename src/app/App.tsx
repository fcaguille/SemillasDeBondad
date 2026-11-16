import { RouterProvider } from "react-router";
import { MotionConfig } from "motion/react";
import { router } from "./routes";
import { IntroPrograma } from "@/components/IntroPrograma";

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <><RouterProvider router={router} /><IntroPrograma /></>
    </MotionConfig>
  );
}
