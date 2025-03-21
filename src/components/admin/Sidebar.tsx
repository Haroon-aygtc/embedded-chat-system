import React, { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Settings,
  MessageSquare,
  Code,
  BarChart3,
  FileText,
  Users,
  ChevronDown,
  ChevronRight,
  LogOut,
  Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
}

const Sidebar = ({
  collapsed = false,
  onToggleCollapse = () => {},
  userName = "Admin User",
  userEmail = "admin@example.com",
  userAvatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
}: SidebarProps) => {
  const [activeItem, setActiveItem] = useState("dashboard");
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    contextRules: true,
    templates: false,
  });

  const toggleMenu = (menu: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      path: "/admin/dashboard",
    },
    {
      id: "widget",
      label: "Widget Config",
      icon: <Settings size={20} />,
      path: "/admin/widget-config",
    },
    {
      id: "contextRules",
      label: "Context Rules",
      icon: <MessageSquare size={20} />,
      path: "/admin/context-rules",
      submenu: [
        {
          id: "create",
          label: "Create Rule",
          path: "/admin/context-rules/create",
        },
        {
          id: "manage",
          label: "Manage Rules",
          path: "/admin/context-rules/manage",
        },
        { id: "test", label: "Test Rules", path: "/admin/context-rules/test" },
      ],
    },
    {
      id: "templates",
      label: "Prompt Templates",
      icon: <FileText size={20} />,
      path: "/admin/templates",
      submenu: [
        {
          id: "create",
          label: "Create Template",
          path: "/admin/templates/create",
        },
        {
          id: "manage",
          label: "Manage Templates",
          path: "/admin/templates/manage",
        },
      ],
    },
    {
      id: "embedCode",
      label: "Embed Code",
      icon: <Code size={20} />,
      path: "/admin/embed-code",
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: <BarChart3 size={20} />,
      path: "/admin/analytics",
    },
    {
      id: "apiKeys",
      label: "API Keys",
      icon: <Key size={20} />,
      path: "/admin/api-keys",
    },
    {
      id: "users",
      label: "User Management",
      icon: <Users size={20} />,
      path: "/admin/users",
    },
  ];

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-slate-900 text-white transition-all duration-300",
        collapsed ? "w-20" : "w-64",
      )}
    >
      {/* Logo and collapse button */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <MessageSquare className="text-blue-400" size={24} />
            <span className="font-bold text-lg">ChatAdmin</span>
          </div>
        )}
        {collapsed && (
          <MessageSquare className="text-blue-400 mx-auto" size={24} />
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className={cn(
            "text-slate-400 hover:text-white hover:bg-slate-800",
            collapsed && "mx-auto",
          )}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
        </Button>
      </div>

      {/* User profile */}
      <div
        className={cn(
          "flex items-center p-4 border-b border-slate-700",
          collapsed ? "flex-col" : "gap-3",
        )}
      >
        <Avatar className="h-10 w-10">
          <AvatarImage src={userAvatar} alt={userName} />
          <AvatarFallback className="bg-blue-600">
            {userName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-slate-400 truncate">{userEmail}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              {item.submenu ? (
                <div>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800",
                      activeItem === item.id && "bg-slate-800 text-white",
                      collapsed && "justify-center px-2",
                    )}
                    onClick={() => !collapsed && toggleMenu(item.id)}
                  >
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center">
                            {item.icon}
                            {!collapsed && (
                              <>
                                <span className="ml-3 flex-1 text-left">
                                  {item.label}
                                </span>
                                {expandedMenus[item.id] ? (
                                  <ChevronDown size={16} />
                                ) : (
                                  <ChevronRight size={16} />
                                )}
                              </>
                            )}
                          </span>
                        </TooltipTrigger>
                        {collapsed && (
                          <TooltipContent side="right">
                            {item.label}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </Button>

                  {!collapsed && expandedMenus[item.id] && (
                    <ul className="mt-1 pl-10 space-y-1">
                      {item.submenu.map((subItem) => (
                        <li key={`${item.id}-${subItem.id}`}>
                          <Link
                            to={subItem.path}
                            className={cn(
                              "block py-2 px-3 text-sm rounded-md text-slate-300 hover:text-white hover:bg-slate-800",
                              activeItem === `${item.id}-${subItem.id}` &&
                                "bg-slate-800 text-white",
                            )}
                            onClick={() =>
                              setActiveItem(`${item.id}-${subItem.id}`)
                            }
                          >
                            {subItem.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <Link to={item.path}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800",
                      activeItem === item.id && "bg-slate-800 text-white",
                      collapsed && "justify-center px-2",
                    )}
                    onClick={() => setActiveItem(item.id)}
                  >
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center">
                            {item.icon}
                            {!collapsed && (
                              <span className="ml-3">{item.label}</span>
                            )}
                          </span>
                        </TooltipTrigger>
                        {collapsed && (
                          <TooltipContent side="right">
                            {item.label}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </Button>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800",
            collapsed && "justify-center px-2",
          )}
          onClick={() => {
            const auth = useAuth();
            auth.logout();
            window.location.href = "/login";
          }}
        >
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center">
                  <LogOut size={20} />
                  {!collapsed && <span className="ml-3">Logout</span>}
                </span>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">Logout</TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
