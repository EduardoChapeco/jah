import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_store/empregos")({
  component: EmpregosLayout,
});

function EmpregosLayout() {
  return (
    <div className="w-full">
      <Outlet />
    </div>
  );
}
