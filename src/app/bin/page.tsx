'use client';
import { useState, useEffect } from 'react';
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
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/theme-toggle';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { useEmailState } from '@/hooks/use-email-state';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function BinPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { inboxEmails, setInboxEmails } = useEmailState();

  const [selectedEmailIds, setSelectedEmailIds] = useState<Set<string>>(new Set());

  const trashedEmails = inboxEmails.filter(e => e.status === 'trash');

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  const toggleSelection = (emailId: string) => {
    setSelectedEmailIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(emailId)) {
        newSet.delete(emailId);
      } else {
        newSet.add(emailId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedEmailIds.size === trashedEmails.length) {
      setSelectedEmailIds(new Set());
    } else {
      setSelectedEmailIds(new Set(trashedEmails.map(e => e.id)));
    }
  };

  const recoverSelectedEmails = () => {
    setInboxEmails(emails => emails.map(email => 
      selectedEmailIds.has(email.id) ? { ...email, status: 'inbox' } : email
    ));
    toast({ title: `${selectedEmailIds.size} conversation(s) moved to inbox.` });
    setSelectedEmailIds(new Set());
  };

  const deletePermanently = () => {
    setInboxEmails(emails => emails.filter(email => !selectedEmailIds.has(email.id)));
    toast({ variant: 'destructive', title: `${selectedEmailIds.size} conversation(s) permanently deleted.` });
    setSelectedEmailIds(new Set());
  };


  if (isUserLoading || !user) {
     return (
       <div className="flex h-screen w-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Logo />
            <Skeleton className="h-8 w-48" />
            <p className="text-sm text-muted-foreground">Loading...</p>
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
                <SidebarMenuButton tooltip="Bin" isActive>
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
        <div className="h-full flex flex-col">
            <div className="p-4 border-b">
                <h1 className="text-3xl font-bold font-headline">Bin</h1>
                <p className="text-muted-foreground">Items in the bin will be deleted forever after 30 days.</p>
            </div>

            <div className="p-2 border-b flex items-center justify-between">
              <div className="flex items-center gap-2 p-2">
                <Checkbox
                  id="select-all"
                  checked={selectedEmailIds.size === trashedEmails.length && trashedEmails.length > 0}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
                 <label htmlFor="select-all" className="text-sm font-medium">Select All</label>
              </div>
              {selectedEmailIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={recoverSelectedEmails}>Recover</Button>
                  <Button variant="destructive" onClick={deletePermanently}>Delete Forever</Button>
                </div>
              )}
            </div>

            <ScrollArea className="flex-1">
                {trashedEmails.length > 0 ? (
                    trashedEmails.map(email => (
                        <div key={email.id} className="flex items-center gap-4 p-4 border-b">
                            <Checkbox 
                              checked={selectedEmailIds.has(email.id)}
                              onCheckedChange={() => toggleSelection(email.id)}
                            />
                            <div className="flex-1 grid grid-cols-5 items-center gap-4">
                               <p className="font-semibold truncate col-span-1">{email.from.name}</p>
                               <p className="truncate col-span-3">
                                <span className="font-medium">{email.subject}</span>
                                <span className="text-muted-foreground"> - {email.snippet}</span>
                               </p>
                               <p className="text-sm text-muted-foreground justify-self-end">{format(new Date(email.date), 'MMM d')}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center text-center p-16">
                        <Trash2 className="size-16 text-muted-foreground/50" />
                        <h2 className="mt-4 text-xl font-semibold">The bin is empty</h2>
                        <p className="mt-2 text-sm text-muted-foreground">Deleted emails will appear here.</p>
                    </div>
                )}
            </ScrollArea>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
