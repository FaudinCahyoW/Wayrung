import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-[#1B1730] font-sans">
      <div className="grid grid-cols-1 md:grid-cols-[232px_1fr]">
        <Sidebar />
        <div className="flex flex-col min-h-screen">
          <Topbar />
          <main className="flex-1 px-5 pb-28 pt-6 md:px-8 md:pb-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}