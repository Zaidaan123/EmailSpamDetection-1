
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
import { Bot, LayoutDashboard, LogOut, Mail, Send, ShieldAlert, Settings, UserCircle, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ComposeDialog } from '@/components/guardian-mail/compose-dialog';
import type { SentEmail } from '@/lib/types';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/theme-toggle';
import { useEmailState } from '@/hooks/use-email-state';

export default function SentPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const { sentEmails, setSentEmails } = useEmailState();
  const [selectedEmail, setSelectedEmail] = useState<SentEmail | null>(sentEmails[0] || null);

  useEffect(() => {
    if (!selectedEmail && sentEmails.length > 0) {
      setSelectedEmail(sentEmails[0]);
    }
  }, [sentEmails, selectedEmail]);

  const handleEmailSent = (email: SentEmail) => {
    const updatedSentEmails = [email, ...sentEmails];
    setSentEmails(updatedSentEmails);
    setSelectedEmail(email);
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
              <Link href="/inbox">
                <SidebarMenuButton tooltip="Inbox">
                  <Mail />
                  <span className="font-headline">Inbox</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton tooltip="Sent" isActive>
                <Send />
                <span className="font-headline">Sent</span>
              </SidebarMenuButton>
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
        <div className="h-full flex flex-col">
           <div className="p-4 border-b">
              <h1 className="text-3xl font-bold font-headline">Sent</h1>
              <p className="text-muted-foreground">A list of emails you have sent.</p>
           </div>
           <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 overflow-hidden">
                <div className="col-span-1 border-r flex flex-col">
                    <ScrollArea>
                        {sentEmails.map((email) => (
                            <button
                                key={email.id}
                                onClick={() => setSelectedEmail(email)}
                                className={`flex flex-col items-start gap-2 p-4 text-left text-sm transition-colors hover:bg-accent w-full ${selectedEmail?.id === email.id ? 'bg-accent' : ''}`}
                            >
                                <div className="flex w-full items-start gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold truncate">To: {email.to.name}</p>
                                            <p className="text-xs text-muted-foreground">{format(new Date(email.date), 'PP')}</p>
                                        </div>
                                        <p className="font-bold">{email.subject}</p>
                                        <p className="text-xs text-muted-foreground line-clamp-1" dangerouslySetInnerHTML={{ __html: email.body }} />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </ScrollArea>
                </div>
                <div className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col">
                    {selectedEmail ? (
                        <>
                           <div className="p-4 border-b">
                                <p className="text-sm text-muted-foreground">
                                    Sent on {format(new Date(selectedEmail.date), 'PPP p')}
                                </p>
                           </div>
                           <ScrollArea className="flex-1 p-4 md:p-6">
                                <h2 className="text-2xl font-bold font-headline mb-4">{selectedEmail.subject}</h2>
                                <div className="flex items-center gap-4 mb-6">
                                   <Avatar className="size-10">
                                        <AvatarFallback>{selectedEmail.to.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">To: {selectedEmail.to.name}</p>
                                        <p className="text-sm text-muted-foreground">{selectedEmail.to.email}</p>
                                    </div>
                                </div>
                                <Separator />
                                <div className="prose prose-sm dark:prose-invert max-w-none mt-6" dangerouslySetInnerHTML={{ __html: selectedEmail.body }}/>
                           </ScrollArea>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-center">
                            <p className="text-muted-foreground">No email selected.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </SidebarInset>
      <ComposeDialog open={isComposeOpen} onOpenChange={setIsComposeOpen} onEmailSent={handleEmailSent} />
    </SidebarProvider>
  );
}
