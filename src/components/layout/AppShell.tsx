import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export function AppShell() {
  return (
    <div className="mx-auto min-h-screen max-w-[428px] bg-white shadow-sm">
      <Header />
      <main className="px-4 py-4">
        <Outlet />
      </main>
    </div>
  );
}
