import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/build-with-sarvam")({
  beforeLoad: () => {
    throw redirect({ to: "/events/build-with-sarvam" });
  },
});
