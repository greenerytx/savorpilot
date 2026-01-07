import { Outlet } from 'react-router-dom';
import { TopNav } from './TopNav';

export function MainLayout() {
  return (
    <div className="min-h-screen">
      <TopNav />

      {/* Main Content - Below nav */}
      <main className="pt-[100px] pb-12 px-4 sm:px-6 print:pt-0 print:px-0">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
