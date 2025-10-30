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
import { useAuth, useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { doc } from 'firebase/firestore';
import { UserSettings } from '@/lib/types';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';


export default function AiSettingsPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [settings, setSettings] = useState<UserSettings>({ sensitivity: 50, replyTone: 'neutral' });
  
  const settingsDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid, 'settings', 'ai');
  }, [firestore, user]);

  const { data: settingsData, isLoading: isLoadingSettings, error: settingsError } = useDoc<UserSettings>(settingsDocRef);

  useEffect(() => {
    if (settingsData) {
      setSettings({
        sensitivity: settingsData.sensitivity ?? 50,
        replyTone: settingsData.replyTone ?? 'neutral'
      });
    }
  }, [settingsData]);


  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  const handleSaveChanges = () => {
     if (!settingsDocRef) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not save settings. User not authenticated.',
      });
      return;
    }
    
    setDocumentNonBlocking(settingsDocRef, settings, { merge: true });

    toast({
        title: 'Settings Saved',
        description: 'Your AI settings have been updated.',
    });
  }

  const handleSensitivityChange = (value: number[]) => {
    setSettings(s => ({ ...s, sensitivity: value[0] }));
  };

  const handleReplyToneChange = (value: 'formal' | 'neutral' | 'casual') => {
    setSettings(s => ({ ...s, replyTone: value as 'formal' | 'neutral' | 'casual' }));
  };

  if (isUserLoading || !user) {
     return (
       <div className="flex h-screen w-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Logo />
            <Skeleton className="h-8 w-48" />
            <p className="text-sm text-muted-foreground">Loading AI Settings...</p>
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
                <SidebarMenuButton tooltip="AI Settings" isActive>
                  <Bot />
                  <span className="font-headline">AI Settings</span>
                </SidebarMenuButton>
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
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold font-headline mb-8">AI Settings</h1>
             {isLoadingSettings && (
                <Card className="max-w-2xl">
                    <CardHeader>
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-24" />
                    </CardContent>
                </Card>
            )}

            {settingsError && (
                 <Alert variant="destructive" className="max-w-2xl">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error Loading Settings</AlertTitle>
                    <AlertDescription>
                        Could not load your AI settings. This might be due to a network issue or missing permissions. Please try again later. If this is the first time you are using the app, try saving the settings first.
                    </AlertDescription>
                </Alert>
            )}

            {!isLoadingSettings && !settingsError && (
              <Card className="max-w-2xl">
                  <CardHeader>
                      <CardTitle>Fine-Tune Your AI Assistant</CardTitle>
                      <CardDescription>Adjust the behavior of GuardianMail's AI to fit your preferences.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                      <div className="space-y-4">
                          <Label htmlFor="sensitivity" className="text-base font-semibold">Phishing Detection Sensitivity</Label>
                          <div className="flex items-center gap-4">
                              <span className="text-sm text-muted-foreground">Less Strict</span>
                              <Slider
                                  id="sensitivity"
                                  value={[settings.sensitivity]}
                                  onValueChange={handleSensitivityChange}
                                  max={100}
                                  step={1}
                                  className="flex-1"
                              />
                              <span className="text-sm text-muted-foreground">More Strict</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                              Adjust how aggressively the AI flags potential phishing emails. Higher sensitivity means a lower threshold for flagging.
                          </p>
                      </div>

                      <div className="space-y-4">
                          <Label className="text-base font-semibold">AI-Assisted Reply Tone</Label>
                          <RadioGroup value={settings.replyTone} onValueChange={(val) => handleReplyToneChange(val as any)} className="flex flex-col sm:flex-row gap-4">
                              <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="formal" id="formal" />
                                  <Label htmlFor="formal">Formal</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="neutral" id="neutral" />
                                  <Label htmlFor="neutral">Neutral</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="casual" id="casual" />
                                  <Label htmlFor="casual">Casual</Label>
                              </div>
                          </RadioGroup>
                          <p className="text-xs text-muted-foreground">
                              Choose the default tone for AI-generated email replies.
                          </p>
                      </div>
                      <Button onClick={handleSaveChanges}>Save Changes</Button>
                  </CardContent>
              </Card>
            )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
