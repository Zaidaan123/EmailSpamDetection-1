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
import { Bot, LayoutDashboard, LogOut, Mail, Send, ShieldAlert, Settings, UserCircle, Bell, Palette, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth, useUser } from '@/firebase';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
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
            <p className="text-sm text-muted-foreground">Loading Settings...</p>
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
                <SidebarMenuButton tooltip="Settings" isActive>
                  <Settings />
                  <span className="font-headline">Settings</span>
                </SidebarMenuButton>
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
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold font-headline mb-8">Settings</h1>
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Application Settings</CardTitle>
                    <CardDescription>Manage your application preferences.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="space-y-4">
                        <h3 className="font-semibold flex items-center gap-2"><Palette/> Appearance</h3>
                         <div className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                                <Label htmlFor="theme-mode">Theme</Label>
                                <p className="text-sm text-muted-foreground">Select your preferred color scheme.</p>
                            </div>
                            <ThemeToggle />
                        </div>
                    </div>
                    
                    <Separator />

                    <div className="space-y-4">
                        <h3 className="font-semibold flex items-center gap-2"><Bell /> Notifications</h3>
                         <div className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                                <Label htmlFor="desktop-notifications">Desktop Notifications</Label>
                                <p className="text-sm text-muted-foreground">Receive notifications on your desktop.</p>
                            </div>
                            <Switch id="desktop-notifications" disabled />
                        </div>
                    </div>
                    
                     <Separator />

                     <div className="space-y-4">
                        <h3 className="font-semibold flex items-center gap-2"><UserCircle /> Account</h3>
                         <div className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                                <Label>Profile</Label>
                                <p className="text-sm text-muted-foreground">View and manage your account details.</p>
                            </div>
                            <Button variant="outline" asChild>
                                <Link href="/profile">Go to Profile</Link>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
