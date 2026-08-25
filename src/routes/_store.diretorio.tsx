import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_store/diretorio")({
  component: DiretorioLayout,
});

function DiretorioLayout() {
  return (
    <div className="w-full">
      <Outlet />
    </div>
  );
}
