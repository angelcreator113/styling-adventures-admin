export default function FanLayout() {
  return (
    <div className="app-shell" data-shell="fan">
      <AdminTopbar />

      <div className="app-shell__body">
        <aside className="app-sidebar" data-sidebar="fan">
          <SidebarFan />
        </aside>

        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
