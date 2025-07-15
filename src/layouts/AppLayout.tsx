import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { useAuth } from "@/hooks/useAuth"
import { Outlet } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Bell, Menu } from "lucide-react"
import NotificationCenter from "@/components/NotificationCenter"

export function AppLayout() {
  const { user } = useAuth()

  if (!user) {
    return <Outlet />
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Mobile Header */}
          <header className="flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
            <SidebarTrigger />
            <div className="flex-1" />
            <NotificationCenter />
          </header>

          {/* Desktop Header */}
          <header className="hidden md:flex h-14 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <div className="flex-1" />
            <NotificationCenter />
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}