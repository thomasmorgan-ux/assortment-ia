import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MainContent } from './MainContent';

export function Layout() {
  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <MainContent />
      </div>
    </div>
  );
}
