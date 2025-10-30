'use client';
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
import { Logo } from '@/components/guardian-mail/logo';
import { Bot, LayoutDashboard, LogOut, Mail, Send, ShieldAlert, Settings, UserCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth, useUser } from '@/firebase';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

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
            <p className="text-sm text-muted-foreground">Loading your profile...</p>
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
              <Link href="/inbox">
                <SidebarMenuButton tooltip="Inbox">
                  <Mail />
                  <span className="font-headline">Inbox</span>
                </SidebarMenuButton>
              </Link>
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
                <SidebarMenuButton tooltip={user.email || 'Account'} isActive>
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
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold font-headline mb-8">User Profile</h1>
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>Your personal account details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={user.photoURL || undefined} />
                            <AvatarFallback>
                                {user.email?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-xl font-semibold">{user.displayName || 'No name set'}</p>
                            <p className="text-muted-foreground">{user.email}</p>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <h3 className="font-semibold">User ID</h3>
                        <p className="text-sm text-muted-foreground bg-muted p-2 rounded-md font-mono">{user.uid}</p>
                     </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold">Email Verified</h3>
                        <p className="text-sm text-muted-foreground">{user.emailVerified ? 'Yes' : 'No'}</p>
                     </div>
                     <Button variant="outline" disabled>Edit Profile (coming soon)</Button>
                </CardContent>
            </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
