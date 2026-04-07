import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MainContent } from './MainContent';

export function Layout() {
  return (
    <div className="flex h-screen min-h-0 overflow-hidden bg-slate-100">
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <MainContent />
      </div>
    </div>
  );
}
