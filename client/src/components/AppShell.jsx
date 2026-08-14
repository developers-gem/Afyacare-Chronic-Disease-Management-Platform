import Sidebar from "./Sidebar.jsx";

export default function AppShell({ children }) {
  return (
    <div className="flex min-h-screen bg-sand-50">
      <Sidebar />
      <main className="flex-1 min-w-0 px-8 py-8">{children}</main>
    </div>
  );
}
