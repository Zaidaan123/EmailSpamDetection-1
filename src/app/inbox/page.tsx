
'use client';
import { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { Inbox } from '@/components/guardian-mail/inbox';
import { Logo } from '@/components/guardian-mail/logo';
import { Bot, LayoutDashboard, LogOut, Mail, Send, ShieldAlert, Settings, UserCircle, Pencil, Trash2, Star } from 'lucide-react';
import Link from 'next/link';
import { useAuth, useUser } from '@/firebase';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ComposeDialog } from '@/components/guardian-mail/compose-dialog';
import type { SentEmail } from '@/lib/types';
import { ThemeToggle } from '@/components/theme-toggle';
import { useEmailState } from '@/hooks/use-email-state';


export default function InboxPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  
  const { setSentEmails } = useEmailState();

  const handleEmailSent = (email: SentEmail) => {
    setSentEmails(prev => [email, ...prev]);
  };


  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  if (isUserLoading || !user) {
     return (
       <div className="flex h-screen w-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Logo />
            <Skeleton className="h-8 w-48" />
            <p className="text-sm text-muted-foreground">Loading your inbox...</p>
          </div>
       </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
           <div className="p-2">
            <Button className="w-full" onClick={() => setIsComposeOpen(true)}>
              <Pencil />
              <span>Compose</span>
            </Button>
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/">
                <SidebarMenuButton tooltip="Dashboard">
                  <LayoutDashboard />
                  <span className="font-headline">Dashboard</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Inbox" isActive>
                <Mail />
                <span className="font-headline">Inbox</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <Link href="/sent">
                <SidebarMenuButton tooltip="Sent">
                  <Send />
                  <span className="font-headline">Sent</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <Link href="/bin">
                <SidebarMenuButton tooltip="Bin">
                  <Trash2 />
                  <span className="font-headline">Bin</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/spam">
                <SidebarMenuButton tooltip="Spam">
                  <ShieldAlert />
                  <span className="font-headline">Spam</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/ai-settings">
                <SidebarMenuButton tooltip="AI Settings">
                  <Bot />
                  <span className="font-headline">AI Settings</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/settings">
                <SidebarMenuButton tooltip="Settings">
                  <Settings />
                  <span className="font-headline">Settings</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/profile">
                <SidebarMenuButton tooltip={user.email || 'Account'}>
                  <UserCircle />
                  <span className="font-headline truncate">{user.email || 'Account'}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton tooltip="Logout" onClick={() => auth.signOut()}>
                <LogOut />
                <span className="font-headline">Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <div className="flex justify-center">
                    <ThemeToggle />
                </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <Inbox />
      </SidebarInset>
      <ComposeDialog open={isComposeOpen} onOpenChange={setIsComposeOpen} onEmailSent={handleEmailSent} />
    </SidebarProvider>
  );
}
