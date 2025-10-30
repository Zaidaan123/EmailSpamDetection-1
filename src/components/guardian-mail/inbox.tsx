
'use client';

import * as React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

import type { InboxEmail, SummarizationState, EmailRiskLevel, UserSettings } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Archive, Bot, Clock, Loader2, Mail as MailIcon, Reply, Trash, FileText, Shield, ShieldCheck, ShieldAlert, Star } from 'lucide-react';
import { useDashboardState } from '@/hooks/use-dashboard-state';
import { summarizeEmailAction, analyzeUrlAction, analyzeEmailAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useEmailState } from '@/hooks/use-email-state';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

const RiskIcon = ({ riskLevel }: { riskLevel?: EmailRiskLevel }) => {
    if (!riskLevel || riskLevel === 'unknown') return null;
    if (riskLevel === 'analyzing') {
        return <TooltipTrigger asChild><Loader2 className="size-4 text-muted-foreground animate-spin" /></TooltipTrigger>;
    }

    const icons = {
        low: { Icon: ShieldCheck, color: 'text-green-500', label: 'Low Risk' },
        medium: { Icon: ShieldAlert, color: 'text-yellow-500', label: 'Medium Risk' },
        high: { Icon: ShieldAlert, color: 'text-red-500', label: 'High Risk' },
    };

    const { Icon, color, label } = icons[riskLevel];

    return (
        <TooltipTrigger asChild>
            <Icon className={cn("size-4", color)} aria-label={label} />
        </TooltipTrigger>
    );
};

export function Inbox() {
  const { inboxEmails, setInboxEmails } = useEmailState();
  const [selectedEmailIds, setSelectedEmailIds] = useState<Set<string>>(new Set());
  const [activeEmailId, setActiveEmailId] = useState<string | null>(inboxEmails.find(e => e.status === 'inbox')?.id || null);

  const [summarizationState, setSummarizationState] = useState<SummarizationState>({ status: 'idle', result: null, error: null });
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [processedEmailBody, setProcessedEmailBody] = useState<string | null>(null);

  const { setAnalyzeEmailFromInbox } = useDashboardState();
  const router = useRouter();
  const { toast } = useToast();

  const { user } = useUser();
  const firestore = useFirestore();

  const settingsDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid, 'settings', 'ai');
  }, [firestore, user]);

  const { data: userSettings } = useDoc<UserSettings>(settingsDocRef);

  const activeEmail = useMemo(() => inboxEmails.find(email => email.id === activeEmailId), [inboxEmails, activeEmailId]);
  const inboxViewEmails = useMemo(() => inboxEmails.filter(e => e.status === 'inbox'), [inboxEmails]);

  const runBulkAnalysis = useCallback(async () => {
    const emailsToAnalyze = inboxEmails.filter(e => e.status === 'inbox' && !e.riskLevel);
    if (emailsToAnalyze.length === 0) return;

    // Mark emails as 'analyzing' in the UI immediately
    setInboxEmails(currentEmails =>
      currentEmails.map(e => emailsToAnalyze.find(a => a.id === e.id) ? { ...e, riskLevel: 'analyzing' } : e)
    );

    const sensitivity = userSettings ? userSettings.sensitivity / 100 : 0.5;

    const analysisPromises = emailsToAnalyze.map(async (email) => {
      const urlRegex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/g;
      const urls = Array.from(email.body.matchAll(urlRegex), m => m[2]);

      const { data, error } = await analyzeEmailAction({
        emailSubject: email.subject,
        senderDomain: email.from.email.split('@')[1] || 'unknown.com',
        emailBody: email.body,
        urlList: urls,
        sensitivity: sensitivity,
      });

      let riskLevel: EmailRiskLevel = 'low';
      if (error) {
        riskLevel = 'unknown';
      } else if (data) {
        if (data.isPhishing) {
          riskLevel = data.phishingScore > 0.7 ? 'high' : 'medium';
        }
      }
      return { id: email.id, riskLevel };
    });

    const results = await Promise.all(analysisPromises);
    
    setInboxEmails(currentEmails =>
      currentEmails.map(e => {
        const result = results.find(r => r.id === e.id);
        return result ? { ...e, riskLevel: result.riskLevel } : e;
      })
    );
  }, [inboxEmails, setInboxEmails, userSettings]);

  useEffect(() => {
    runBulkAnalysis();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSettings]); // Run when settings (sensitivity) are loaded/changed

  useEffect(() => {
    if (activeEmail) {
      setProcessedEmailBody(null); // Reset while processing
      const processEmailBody = async () => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(activeEmail.body, 'text/html');
        const links = Array.from(doc.querySelectorAll('a'));
        
        if (links.length === 0) {
          setProcessedEmailBody(activeEmail.body);
          return;
        }

        const riskPromises = links.map(link => 
          analyzeUrlAction({ url: link.href })
            .then(result => ({ href: link.href, ...result }))
        );

        const results = await Promise.all(riskPromises);

        results.forEach(({ href, data, error }) => {
          const linkElements = doc.querySelectorAll(`a[href="${href}"]`);
          linkElements.forEach(link => {
            if (link.parentElement?.dataset.inboxLinkWrapper) {
              return; // Already wrapped
            }
            const wrapper = doc.createElement('span');
            wrapper.className = 'inline-flex items-center gap-1';
            wrapper.dataset.inboxLinkWrapper = 'true';
            
            const icon = doc.createElement('span');
            icon.dataset.risk = error ? 'unknown' : (data?.riskScore ?? 0) > 0.7 ? 'high' : (data?.riskScore ?? 0) > 0.4 ? 'medium' : 'low';
            icon.dataset.tooltip = error ? 'Could not analyze this link.' : data?.justification || 'No justification provided.';
            
            link.parentNode?.insertBefore(wrapper, link);
            wrapper.appendChild(link.cloneNode(true)); // Use clone to avoid moving the same node if URL appears multiple times
            wrapper.appendChild(icon);
            link.remove();
          });
        });

        setProcessedEmailBody(doc.body.innerHTML);
      };

      processEmailBody();
    }
  }, [activeEmail]);

  const handleAnalyzeClick = () => {
    if (activeEmail) {
      const urlRegex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/g;
      const urls = [];
      let match;
      while ((match = urlRegex.exec(activeEmail.body)) !== null) {
        urls.push(match[2]);
      }
      
      const emailDataForAnalysis = {
        emailSubject: activeEmail.subject,
        senderDomain: activeEmail.from.email.split('@')[1] || 'unknown.com',
        senderIp: '203.0.113.15', 
        emailBody: activeEmail.body,
        urlList: urls,
      };

      setAnalyzeEmailFromInbox(emailDataForAnalysis);
      router.push('/');
    }
  };

  const handleSummarizeClick = async () => {
    if (!activeEmail) return;

    setSummarizationState({ status: 'loading', result: null, error: null });
    setIsSummaryDialogOpen(true);

    const { data, error } = await summarizeEmailAction({ emailBody: activeEmail.body });

    if (error) {
      setSummarizationState({ status: 'error', result: null, error });
    } else {
      setSummarizationState({ status: 'success', result: data, error: null });
    }
  }

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
    if (selectedEmailIds.size === inboxViewEmails.length) {
      setSelectedEmailIds(new Set());
    } else {
      setSelectedEmailIds(new Set(inboxViewEmails.map(e => e.id)));
    }
  };

  const toggleStarred = (e: React.MouseEvent, emailId: string) => {
    e.stopPropagation();
    setInboxEmails(emails => emails.map(email => 
      email.id === emailId ? { ...email, starred: !email.starred } : email
    ));
  };
  
  const moveSelectedToTrash = () => {
    setInboxEmails(emails => emails.map(email => 
      selectedEmailIds.has(email.id) ? { ...email, status: 'trash' } : email
    ));
    const newActiveEmail = inboxEmails.find(e => e.status === 'inbox' && !selectedEmailIds.has(e.id));
    setActiveEmailId(newActiveEmail?.id || null);
    setSelectedEmailIds(new Set());
    toast({ title: `${selectedEmailIds.size} conversation(s) moved to the bin.`});
  };
  
  const renderProcessedBody = () => {
    if (!processedEmailBody) {
      return (
         <div className="prose prose-sm dark:prose-invert max-w-none space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
         </div>
      );
    }
  
    const createMarkup = () => {
        return { __html: processedEmailBody };
    }

    const BodyWithTooltips = () => {
        const bodyRef = React.useRef<HTMLDivElement>(null);
        
        React.useEffect(() => {
            if (bodyRef.current) {
                const icons = bodyRef.current.querySelectorAll('span[data-risk]');
                icons.forEach(iconEl => {
                    const icon = iconEl as HTMLElement;
                    const risk = icon.dataset.risk;
                    const tooltipText = icon.dataset.tooltip || 'No details available.';
                    
                    let IconComponent: React.ElementType = Shield;
                    let colorClass = "text-gray-400";
        
                    if (risk === 'low') {
                        IconComponent = ShieldCheck;
                        colorClass = "text-green-500";
                    } else if (risk === 'medium') {
                        IconComponent = ShieldAlert;
                        colorClass = "text-yellow-500";
                    } else if (risk === 'high') {
                        IconComponent = ShieldAlert;
                        colorClass = "text-red-500";
                    }
                    
                    const tooltipContent = (
                        <div className="flex items-center gap-2">
                            <IconComponent className={cn("size-4", colorClass)} />
                            <p>{tooltipText}</p>
                        </div>
                    );

                    const trigger = (
                        <IconComponent className={cn("size-4 shrink-0 cursor-pointer", colorClass)} />
                    );
                    
                    const root = (
                      <TooltipProvider>
                          <Tooltip>
                              <TooltipTrigger asChild>
                                  {trigger}
                              </TooltipTrigger>
                              <TooltipContent>
                                  {tooltipContent}
                              </TooltipContent>
                          </Tooltip>
                      </TooltipProvider>
                    );
                    
                    const tempDiv = document.createElement('div');
                    const reactRoot = require('react-dom/client').createRoot(tempDiv);
                    reactRoot.render(root);
                    icon.innerHTML = '';
                    icon.appendChild(tempDiv);
                });
            }
        }, [processedEmailBody]);

        return <div ref={bodyRef} className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={createMarkup()} />
    }

    return <BodyWithTooltips />;
  };

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col">
        <div className="p-4 border-b flex items-center justify-between gap-2">
          <div>
            <h1 className="text-3xl font-bold font-headline">Inbox</h1>
            <p className="text-muted-foreground">You have {inboxViewEmails.filter(e => e.unread).length} unread messages.</p>
          </div>
          {selectedEmailIds.size > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={moveSelectedToTrash}>
                  <Trash className="size-5" />
                  <span className="sr-only">Delete</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 overflow-hidden">
          <div className="col-span-1 border-r flex flex-col">
            <div className="p-2 border-b">
              <div className="flex items-center gap-2 p-2">
                <Checkbox
                  id="select-all"
                  checked={selectedEmailIds.size === inboxViewEmails.length && inboxViewEmails.length > 0}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
                <label htmlFor="select-all" className="text-sm font-medium">Select All</label>
              </div>
            </div>
            <ScrollArea>
              <div className="flex flex-col">
                {inboxViewEmails.map((email) => (
                  <div
                    key={email.id}
                    onClick={() => setActiveEmailId(email.id)}
                    className={cn(
                      'flex items-start gap-2 p-3 text-left text-sm transition-colors cursor-pointer border-b',
                      'hover:bg-accent',
                      activeEmailId === email.id && 'bg-accent',
                      email.unread && 'bg-primary/5'
                    )}
                  >
                    <div className="flex items-center gap-3 pt-1">
                      <Checkbox
                        checked={selectedEmailIds.has(email.id)}
                        onCheckedChange={() => toggleSelection(email.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select email from ${email.from.name}`}
                      />
                      <button onClick={(e) => toggleStarred(e, email.id)}>
                        <Star className={cn("size-4", email.starred ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground')} />
                      </button>
                    </div>
                    <div className="flex-1 overflow-hidden" onClick={() => setActiveEmailId(email.id)}>
                        <div className="flex items-center justify-between">
                          <p className={cn("font-semibold truncate", email.unread && "font-bold")}>
                            {email.from.name}
                          </p>
                          <p className={cn("text-xs text-muted-foreground", email.unread && "font-bold text-foreground")}>
                            {format(new Date(email.date), 'PP')}
                          </p>
                        </div>
                         <div className="flex items-center gap-2">
                            <Tooltip>
                                <RiskIcon riskLevel={email.riskLevel} />
                                <TooltipContent>
                                    <p>{email.riskLevel === 'analyzing' ? 'Analyzing...' : `This email is considered ${email.riskLevel} risk.`}</p>
                                </TooltipContent>
                            </Tooltip>
                            <p className={cn("text-sm truncate", email.unread && "font-bold")}>{email.subject}</p>
                        </div>
                         <p className="text-xs text-muted-foreground line-clamp-1">{email.snippet}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col">
            {activeEmail ? (
              <>
                <div className="flex items-center p-4 border-b gap-2 flex-wrap">
                   <Button onClick={handleAnalyzeClick}><Bot /> Analyze with AI</Button>
                   <Button onClick={handleSummarizeClick} variant="outline" disabled={summarizationState.status === 'loading'}><FileText /> Summarize</Button>
                  <Separator orientation="vertical" className="h-6 mx-2 hidden md:block" />
                  <Button variant="ghost" size="icon"><Reply /><span className="sr-only">Reply</span></Button>
                  <Button variant="ghost" size="icon"><Archive /><span className="sr-only">Archive</span></Button>
                  <Separator orientation="vertical" className="h-6 mx-2 hidden md:block" />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
                    <Clock className="size-4" />
                    <span>{format(new Date(activeEmail.date), 'PPP p')}</span>
                  </div>
                </div>
                <ScrollArea className="flex-1 p-4 md:p-6">
                  {activeEmail.riskLevel && (activeEmail.riskLevel === 'high' || activeEmail.riskLevel === 'medium') && (
                    <Alert variant={activeEmail.riskLevel === 'high' ? 'destructive' : 'default'} className={cn('mb-4', activeEmail.riskLevel === 'medium' && 'bg-yellow-500/10 border-yellow-500/50 text-yellow-700 dark:text-yellow-400 [&>svg]:text-yellow-500')}>
                      <ShieldAlert className="h-4 w-4" />
                      <AlertTitle className="font-bold">Security Warning</AlertTitle>
                      <AlertDescription>
                        This email has been flagged as **{activeEmail.riskLevel} risk**. Please be cautious with links and attachments.
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="flex justify-between items-start">
                    <h2 className="text-2xl font-bold font-headline mb-4">{activeEmail.subject}</h2>
                    <button onClick={(e) => toggleStarred(e, activeEmail.id)}>
                        <Star className={cn("size-5", activeEmail.starred ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground hover:text-yellow-400')} />
                    </button>
                  </div>
                  <div className="flex items-center gap-4 mb-6">
                     <Avatar className="size-10">
                          <AvatarImage src={activeEmail.from.avatar} alt={activeEmail.from.name} />
                          <AvatarFallback>{activeEmail.from.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                          <p className="font-semibold">{activeEmail.from.name}</p>
                          <p className="text-sm text-muted-foreground">{activeEmail.from.email}</p>
                      </div>
                  </div>
                  {renderProcessedBody()}
                  {activeEmail.tags && activeEmail.tags.length > 0 && (
                      <div className="mt-6 flex gap-2">
                          {activeEmail.tags.map(tag => (
                              <Badge key={tag} variant="secondary">{tag}</Badge>
                          ))}
                      </div>
                  )}
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <MailIcon className="size-16 text-muted-foreground/50" />
                <h2 className="mt-4 text-xl font-semibold">No Email Selected</h2>
                <p className="mt-2 text-sm text-muted-foreground">{inboxViewEmails.length > 0 ? "Please select an email to view its content." : "Your inbox is empty."}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <AlertDialog open={isSummaryDialogOpen} onOpenChange={setIsSummaryDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <FileText /> Email Summary
              </AlertDialogTitle>
              <AlertDialogDescription>
                AI-generated summary of the selected email.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="max-h-[60vh] overflow-y-auto p-1">
              {summarizationState.status === 'loading' && (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="animate-spin text-primary" size={32} />
                </div>
              )}
              {summarizationState.status === 'error' && (
                <p className="text-destructive">{summarizationState.error}</p>
              )}
              {summarizationState.status === 'success' && summarizationState.result && (
                <div
                  className="prose prose-sm dark:prose-invert"
                  dangerouslySetInnerHTML={{
                    __html: summarizationState.result.summary.replace(/•/g, '<li>'),
                  }}
                />
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TooltipProvider>
    );
}
