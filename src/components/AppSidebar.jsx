import {
  ArrowLeft,
  Upload,
  Film,
  Edit,
  MessageSquare,
  Settings,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "./ui/sidebar"
import { ScrollArea } from "./ui/scroll-area"

const menuGroups = [
  {
    label: "Content",
    items: [
      { title: "Uploads", icon: Upload, tab: "uploads" },
      { title: "Videos", icon: Film, tab: "videos" },
    ],
  },
  {
    label: "Tools",
    items: [
      { title: "Edit", icon: Edit, tab: "edit" },
      { title: "Captions", icon: MessageSquare, tab: "captions" },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Exports", icon: Download, tab: "exports" },
      { title: "Settings", icon: Settings, tab: "settings" },
    ],
  },
]

export function AppSidebar({ activeTab, onTabClick, onBack }) {
  const { toggleSidebar, open } = useSidebar()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onBack} tooltip="Back to Projects">
              <ArrowLeft />
              <span>Back</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <ScrollArea className="h-full">
          {menuGroups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.tab}>
                      <SidebarMenuButton
                        onClick={() => onTabClick(item.tab)}
                        isActive={activeTab === item.tab}
                        tooltip={item.title}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleSidebar} tooltip={open ? "Collapse" : "Expand"}>
              {open ? <ChevronLeft /> : <ChevronRight />}
              <span>Collapse</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
