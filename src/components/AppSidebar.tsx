import { useState, useEffect } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { 
  ChefHat, 
  LayoutDashboard, 
  Calendar, 
  Package, 
  DollarSign, 
  BarChart3, 
  Settings, 
  Users,
  LogOut 
} from "lucide-react"

interface Profile {
  full_name: string | null
  role: string | null
  mess_id: string | null
}

const adminItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Menu Management", url: "/menu", icon: Calendar },
  { title: "Inventory", url: "/inventory", icon: Package },
  { title: "Finances", url: "/finances", icon: DollarSign },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
]

const memberItems = [
  { title: "My Dashboard", url: "/member-dashboard", icon: LayoutDashboard },
  { title: "Settings", url: "/settings", icon: Settings },
]

export function AppSidebar() {
  const { user, signOut } = useAuth()
  const { state } = useSidebar()
  const location = useLocation()
  const [profile, setProfile] = useState<Profile | null>(null)
  
  const currentPath = location.pathname
  const collapsed = !useSidebar().open

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    if (!user) return
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, role, mess_id')
        .eq('user_id', user.id)
        .single()
      
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const isActive = (path: string) => currentPath === path
  
  // Determine navigation items based on user role
  const navigationItems = profile?.role === 'admin' || profile?.role === 'manager' 
    ? adminItems 
    : memberItems
  
  const isExpanded = navigationItems.some((item) => isActive(item.url))

  const getNavClasses = (active: boolean) =>
    active 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent/50"

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent>
        {/* Header */}
        <SidebarGroup>
          <div className="flex items-center gap-2 px-2 py-4">
            <ChefHat className="h-6 w-6 text-primary" />
            {!collapsed && (
              <div>
                <h2 className="font-semibold text-sm">Mess Manager</h2>
                {profile?.full_name && (
                  <p className="text-xs text-muted-foreground">{profile.full_name}</p>
                )}
              </div>
            )}
          </div>
        </SidebarGroup>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink 
                        to={item.url} 
                        className={getNavClasses(isActive(item.url))}
                      >
                        <Icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Info */}
        {!collapsed && profile && (
          <SidebarGroup className="mt-auto">
            <SidebarGroupLabel>User Info</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-2 py-2 space-y-2">
                {profile.role && (
                  <Badge variant="secondary" className="text-xs">
                    {profile.role}
                  </Badge>
                )}
                <p className="text-xs text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Logout */}
        <SidebarGroup className={!collapsed && profile ? "" : "mt-auto"}>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={signOut}
                  className="hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                >
                  <LogOut className="h-4 w-4" />
                  {!collapsed && <span>Sign Out</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}