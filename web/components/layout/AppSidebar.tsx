
"use client";

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, APP_NAME, APP_LOGO_ICON } from '@/lib/constants';
import type { NavItem, Role } from '@/types';
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Button } from '../ui/button';
import { LogOut } from 'lucide-react';


interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const { currentRole, currentUser, logout } = useAuth();
  const pathname = usePathname();

  const isNavItemAllowed = (item: NavItem, role: Role) => {
    return item.allowedRoles.includes(role);
  };

  const renderNavItems = (items: NavItem[], isSubmenu = false) => {
    return items.filter(item => isNavItemAllowed(item, currentRole)).map((item) => {
      const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
      const LinkComponent = isSubmenu ? SidebarMenuSubButton : SidebarMenuButton;
      const ItemComponent = isSubmenu ? SidebarMenuSubItem : SidebarMenuItem;

      const linkProps: Omit<ComponentProps<typeof Link>, 'href' | 'children'> = {};
      if (isSubmenu) { // SidebarMenuSubButton renders an <a>
        linkProps.asChild = true;
        // passHref is not needed here because asChild={true} automatically passes href
        // and SidebarMenuSubButton is a forwardRef component that accepts href.
      }

      if (item.subItems && item.subItems.length > 0) {
        const filteredSubItems = item.subItems.filter(subItem => isNavItemAllowed(subItem, currentRole));
        if (filteredSubItems.length === 0) return null;

        return (
          <SidebarMenuItem key={item.label}>
            <SidebarMenuButton
              asChild={false}
              isActive={isActive}
              className="justify-between"
            >
              <div className="flex items-center gap-2">
                <item.icon className="h-5 w-5" />
                <span className="truncate">{item.label}</span>
              </div>
            </SidebarMenuButton>
            <SidebarMenuSub>
              {renderNavItems(filteredSubItems, true)}
            </SidebarMenuSub>
          </SidebarMenuItem>
        );
      }

      return (
        <ItemComponent key={item.label}>
          <Link href={item.href} {...linkProps}>
            <LinkComponent
              asChild={false} // LinkComponent itself renders its designated tag (<button> or <a>)
              isActive={isActive}
              tooltip={item.label}
            >
              <item.icon className="h-5 w-5" />
              <span className="truncate">{item.label}</span>
            </LinkComponent>
          </Link>
        </ItemComponent>
      );
    });
  };

  return (
    <Sidebar className={cn("border-r", className)}>
      <SidebarHeader className="border-b">
        <Link href="/dashboard" className="flex items-center gap-2 font-headline text-xl font-semibold text-primary p-2">
          <APP_LOGO_ICON className="h-7 w-7" />
          <span>{APP_NAME}</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className="h-full">
          <SidebarMenu>
            {renderNavItems(NAV_ITEMS)}
          </SidebarMenu>
        </ScrollArea>
      </SidebarContent>
      {currentUser && (
        <>
          <SidebarSeparator />
          <SidebarFooter className="p-2">
            <div className='p-2 text-sm'>
              <p className="font-semibold">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground">{currentRole}</p>
            </div>
            <Button variant="ghost" className="w-full justify-start gap-2" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </SidebarFooter>
        </>
      )}
    </Sidebar>
  );
}
