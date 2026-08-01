"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Bell, CalendarDays, FolderKanban, LayoutDashboard, LogOut, RefreshCw, Scale, Search } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar"

const navigation = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/causas", label: "Causas", icon: FolderKanban },
  { href: "/sisfe", label: "SISFE", icon: RefreshCw },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/alertas", label: "Alertas", icon: Bell },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { session, logout } = useAuth()
  const signOut = async () => { await logout(); router.replace("/") }

  return (
    <SidebarProvider className="overflow-x-hidden">
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="p-4">
          <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#17345f] text-white"><Scale className="size-5" /></span>
            <div className="min-w-0"><p className="truncate text-sm font-semibold">Antenucci Penal</p><p className="truncate text-xs text-muted-foreground">Gestor de causas</p></div>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navegacion</SidebarGroupLabel>
            <SidebarGroupContent><SidebarMenu>{navigation.map((item) => (
              <SidebarMenuItem key={item.href}><SidebarMenuButton render={<Link href={item.href} />} isActive={pathname.startsWith(item.href)} tooltip={item.label}><item.icon /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>
            ))}</SidebarMenu></SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-3">
          <div className="flex items-center gap-3 overflow-hidden rounded-lg border bg-background p-2">
            <Avatar className="size-8"><AvatarFallback>{session?.user.email.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar>
            <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{session?.user.fullName || session?.user.email}</p><p className="truncate text-[10px] text-muted-foreground">{session?.role}</p></div>
            <Button variant="ghost" size="icon-sm" onClick={signOut} title="Cerrar sesion"><LogOut /></Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-w-0 overflow-x-hidden bg-stone-50/70">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur md:px-6">
          <SidebarTrigger />
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><Search className="size-3.5" /> Usa la busqueda de causas para encontrar expedientes, personas o delitos.</div>
        </header>
        <div className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-7">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
