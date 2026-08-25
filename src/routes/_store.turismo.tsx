import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_store/turismo")({
  component: TurismoLayout,
});

function TurismoLayout() {
  return (
    <div className="w-full">
      <Outlet />
    </div>
  );
}
