
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertTriangle, Bot, Copy, FlaskConical, Loader2, Sparkles, Wand2, Info, BarChart, MessageCircle, Send, User } from 'lucide-react';
import { marked } from 'marked';

import { analyzeEmailAction, analyzeUrlAction, generateReplyAction, generateSecurityBriefingAction, securityCoachAction, summarizeEmailAction } from '@/app/actions';
import type { CoachMessage, EmailAnalysisState, ReplyGenerationState, SecurityBriefingState, SummarizationState, UrlAnalysisState, UserSettings } from '@/lib/types';
import { mockEmails } from '@/lib/mock-data';
import { useDashboardState } from '@/hooks/use-dashboard-state';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { RiskScoreIndicator } from './risk-score-indicator';
import { Skeleton } from '../ui/skeleton';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Label } from '../ui/label';
import { EmailAnalyticsChart } from './email-analytics-chart';
import { useFirestore, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { ScrollArea } from '../ui/scroll-area';

const emailSchema = z.object({
  emailSubject: z.string().min(1, 'Subject is required.'),
  senderDomain: z.string().min(1, 'Sender domain is required.'),
  senderIp: z.string().ip({ message: 'Please enter a valid IP address.' }).optional().or(z.literal('')),
  emailBody: z.string().min(1, 'Email body is required.'),
  urlList: z.array(z.string().url()).optional(),
});

const urlSchema = z.object({
  url: z.string().url('Please enter a valid URL.'),
});

const coachSchema = z.object({
    question: z.string().min(1, 'Cannot send an empty message.'),
});

export function GuardianMailDashboard() {
  const { toast } = useToast();
  const { analyzeEmailFromInbox, clearAnalyzeEmailFromInbox } = useDashboardState();
  const [activeTab, setActiveTab] = useState(analyzeEmailFromInbox ? 'email' : 'analytics');

  const [emailState, setEmailState] = useState<EmailAnalysisState>({ status: 'idle', result: null, error: null });
  const [urlState, setUrlState] = useState<UrlAnalysisState>({ status: 'idle', result: null, error: null });
  const [replyState, setReplyState] = useState<ReplyGenerationState>({ status: 'idle', result: null, error: null });
  const [briefingState, setBriefingState] = useState<SecurityBriefingState>({ status: 'idle', result: null, error: null });
  const [summarizationState, setSummarizationState] = useState<SummarizationState>({ status: 'idle', result: null, error: null });
  
  const [coachMessages, setCoachMessages] = useState<CoachMessage[]>([]);
  const [isCoachLoading, setIsCoachLoading] = useState(false);
  const coachScrollAreaRef = useRef<HTMLDivElement>(null);


  const { user } = useUser();
  const firestore = useFirestore();

  const settingsDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid, 'settings', 'ai');
  }, [firestore, user]);

  const { data: userSettings } = useDoc<UserSettings>(settingsDocRef);


  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { emailSubject: '', senderDomain: '', senderIp: '', emailBody: '', urlList: [] },
  });

  const urlForm = useForm<z.infer<typeof urlSchema>>({
    resolver: zodResolver(urlSchema),
    defaultValues: { url: '' },
  });

  const coachForm = useForm<z.infer<typeof coachSchema>>({
    resolver: zodResolver(coachSchema),
    defaultValues: { question: '' },
  });


  useEffect(() => {
    const fetchBriefing = async () => {
      setBriefingState({ status: 'loading', result: null, error: null });
      const { data, error } = await generateSecurityBriefingAction({});
      if (error) {
        setBriefingState({ status: 'error', result: null, error });
        toast({ variant: 'destructive', title: 'Briefing Failed', description: error });
      } else {
        setBriefingState({ status: 'success', result: data, error: null });
      }
    };
    fetchBriefing();
  }, [toast]);

  const handleEmailSubmit = useCallback(async (values: z.infer<typeof emailSchema>) => {
    setEmailState({ status: 'loading', result: null, error: null });
    setReplyState({ status: 'idle', result: null, error: null });

    const sensitivity = userSettings ? userSettings.sensitivity / 100 : 0.5;

    const { data, error } = await analyzeEmailAction({ ...values, sensitivity });
    if (error) {
      setEmailState({ status: 'error', result: null, error });
      toast({ variant: 'destructive', title: 'Analysis Failed', description: error });
    } else {
      setEmailState({ status: 'success', result: data, error: null });
    }
  }, [toast, userSettings]);

  useEffect(() => {
    if (analyzeEmailFromInbox) {
      emailForm.reset(analyzeEmailFromInbox);
      handleEmailSubmit(analyzeEmailFromInbox);
      clearAnalyzeEmailFromInbox();
      setActiveTab('email');
    }
  }, [analyzeEmailFromInbox, emailForm, handleEmailSubmit, clearAnalyzeEmailFromInbox]);


  const handleUrlSubmit = async (values: z.infer<typeof urlSchema>) => {
    setUrlState({ status: 'loading', result: null, error: null });
    const { data, error } = await analyzeUrlAction(values);
    if (error) {
      setUrlState({ status: 'error', result: null, error });
      toast({ variant: 'destructive', title: 'Analysis Failed', description: error });
    } else {
      setUrlState({ status: 'success', result: data, error: null });
    }
  };

  const handleGenerateReply = async () => {
    const emailContent = emailForm.getValues('emailBody');
    const riskFactors = emailState.result?.riskFactors;

    if (!emailContent) return;

    setReplyState({ status: 'loading', result: null, error: null });
    const { data, error } = await generateReplyAction({
      emailContent,
      threatSignals: riskFactors?.join(', '),
    });

    if (error) {
      setReplyState({ status: 'error', result: null, error });
      toast({ variant: 'destructive', title: 'Reply Generation Failed', description: error });
    } else {
      setReplyState({ status: 'success', result: data, error: null });
    }
  };

  const handleSummarize = async () => {
    const emailContent = emailForm.getValues('emailBody');
    if (!emailContent) return;

    setSummarizationState({ status: 'loading', result: null, error: null });
    const { data, error } = await summarizeEmailAction({ emailBody: emailContent });
    if (error) {
      setSummarizationState({ status: 'error', result: null, error });
      toast({ variant: 'destructive', title: 'Summarization Failed', description: error });
    } else {
      setSummarizationState({ status: 'success', result: data, error: null });
    }
  };

  const handleCoachSubmit = async (values: z.infer<typeof coachSchema>) => {
    const userMessage: CoachMessage = { role: 'user', content: values.question };
    setCoachMessages(prev => [...prev, userMessage]);
    setIsCoachLoading(true);
    coachForm.reset();

    const history = coachMessages.map(m => ({ role: m.role, content: m.content }));

    const { data, error } = await securityCoachAction({ question: values.question, history });

    if (error) {
        const errorMessage: CoachMessage = { role: 'model', content: `Sorry, I ran into an error: ${error}` };
        setCoachMessages(prev => [...prev, errorMessage]);
        toast({ variant: 'destructive', title: 'Security Coach Error', description: error });
    } else if (data) {
        const modelMessage: CoachMessage = { role: 'model', content: data.answer };
        setCoachMessages(prev => [...prev, modelMessage]);
    }
    setIsCoachLoading(false);
  };
  
  useEffect(() => {
    if (coachScrollAreaRef.current) {
        coachScrollAreaRef.current.scrollTo(0, coachScrollAreaRef.current.scrollHeight);
    }
  }, [coachMessages]);


  const loadMockEmail = (index: number) => {
    const email = mockEmails[index];
    emailForm.reset({
      emailSubject: email.subject,
      senderDomain: email.senderDomain,
      senderIp: email.senderIp,
      emailBody: email.body,
      urlList: email.urlList
    });
    setEmailState({ status: 'idle', result: null, error: null });
    setReplyState({ status: 'idle', result: null, error: null });
    setSummarizationState({ status: 'idle', result: null, error: null });
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to Clipboard', description: `${type} has been copied.` });
  };

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Analysis Dashboard</h1>
        <p className="text-muted-foreground">
          Leverage our Transformer-driven NLP framework to identify phishing attempts with high precision.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-xl">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="coach">Security Coach</TabsTrigger>
          <TabsTrigger value="email">Email Analysis</TabsTrigger>
          <TabsTrigger value="url">URL Analysis</TabsTrigger>
        </TabsList>
        <TabsContent value="analytics" className="mt-4">
            <div className="grid grid-cols-1 gap-8">
                <Card className="animate-in fade-in-0 duration-500">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><BarChart /> Security Analytics</CardTitle>
                        <CardDescription>Your email security overview for the last 7 days.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <EmailAnalyticsChart />
                    </CardContent>
                </Card>

                <Card className="animate-in fade-in-0 duration-500">
                    <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Info /> Proactive Security Briefing</CardTitle>
                    <CardDescription>Your daily summary of emerging email security threats.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    {briefingState.status === 'loading' && (
                        <div className="space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        </div>
                    )}
                    {briefingState.status === 'error' && <p className="text-destructive">{briefingState.error}</p>}
                    {briefingState.status === 'success' && briefingState.result && (
                        <div
                        className="prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: marked(briefingState.result.briefing) }}
                        />
                    )}
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
        <TabsContent value="coach" className="mt-4">
            <Card className="h-[70vh] flex flex-col">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><MessageCircle /> Security Coach</CardTitle>
                    <CardDescription>Ask "Guardian," our AI security expert, any questions about email security.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                    <ScrollArea className="h-full" ref={coachScrollAreaRef}>
                        <div className="p-6 space-y-4">
                            {coachMessages.length === 0 && (
                                <div className="text-center text-muted-foreground">
                                    <p>Ask me anything about cybersecurity!</p>
                                    <p className="text-xs">e.g., "What is phishing?" or "How can I spot a fake email?"</p>
                                </div>
                            )}
                            {coachMessages.map((msg, index) => (
                                <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                   {msg.role === 'model' && <Bot className="size-6 shrink-0 text-primary" />}
                                    <div className={`rounded-lg px-4 py-2 max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                       <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: marked(msg.content) }} />
                                    </div>
                                    {msg.role === 'user' && <User className="size-6 shrink-0" />}
                                </div>
                            ))}
                             {isCoachLoading && (
                                <div className="flex items-start gap-3">
                                    <Bot className="size-6 shrink-0 text-primary" />
                                    <div className="rounded-lg px-4 py-2 bg-muted flex items-center">
                                        <Loader2 className="size-5 animate-spin"/>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
                <CardFooter className="border-t pt-6">
                     <Form {...coachForm}>
                        <form onSubmit={coachForm.handleSubmit(handleCoachSubmit)} className="w-full flex items-center gap-2">
                           <FormField control={coachForm.control} name="question" render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormControl>
                                        <Input placeholder="Type your security question..." {...field} disabled={isCoachLoading} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <Button type="submit" disabled={isCoachLoading}><Send/></Button>
                        </form>
                    </Form>
                </CardFooter>
            </Card>
        </TabsContent>
        <TabsContent value="email">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><Bot /> Email Details</CardTitle>
                <CardDescription>Enter the email information below or load an example.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...emailForm}>
                  <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
                    <FormField control={emailForm.control} name="emailSubject" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl><Input placeholder="e.g., Urgent Action Required" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={emailForm.control} name="senderDomain" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sender Domain</FormLabel>
                          <FormControl><Input placeholder="e.g., example.com" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={emailForm.control} name="senderIp" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sender IP (Optional)</FormLabel>
                          <FormControl><Input placeholder="e.g., 209.85.220.41" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={emailForm.control} name="emailBody" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Body</FormLabel>
                        <FormControl><Textarea placeholder="Paste the full email body here..." {...field} rows={8} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" disabled={emailState.status === 'loading'} className="w-full">
                      {emailState.status === 'loading' && <Loader2 className="animate-spin" />}
                      <span>Analyze Email</span>
                    </Button>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex-col sm:flex-row gap-2">
                 <p className="text-sm text-muted-foreground mr-auto">Or load examples:</p>
                {mockEmails.map((email, i) => (
                  <Button key={i} variant="outline" size="sm" onClick={() => loadMockEmail(i)}>
                    <FlaskConical className="mr-2" />
                    {email.label.split(' ')[0]}
                  </Button>
                ))}
              </CardFooter>
            </Card>

            <div className="space-y-8">
              {emailState.status === 'idle' && summarizationState.status === 'idle' && (
                <Card className="flex flex-col items-center justify-center text-center p-8 h-full">
                    <Bot className="size-16 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-semibold">AI Analysis</h3>
                    <p className="text-sm text-muted-foreground">Your email analysis results will appear here.</p>
                </Card>
              )}
              {emailState.status === 'loading' && (
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-4">
                    <Skeleton className="size-40 rounded-full" />
                    <Skeleton className="h-6 w-1/4" />
                    <Separator />
                    <Skeleton className="h-6 w-1/3" />
                    <div className="flex flex-wrap gap-2">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-6 w-28" />
                    </div>
                  </CardContent>
                </Card>
              )}
              {emailState.status === 'success' && emailState.result && (
                <Card className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                  <CardHeader>
                    <CardTitle className="font-headline">Analysis Result</CardTitle>
                    <CardDescription>
                      {emailState.result.justification}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <RiskScoreIndicator score={emailState.result.phishingScore} />
                     {emailState.result.isPhishing && (
                      <Alert variant="destructive">
                        <AlertTriangle />
                        <AlertTitle className="font-headline">Phishing Detected</AlertTitle>
                        <AlertDescription>
                          This email was flagged as a potential phishing attempt based on your sensitivity settings.
                        </AlertDescription>
                      </Alert>
                    )}
                    {emailState.result.riskFactors.length > 0 && (
                      <div className="space-y-2 text-center">
                        <h3 className="font-semibold font-headline">Key Risk Factors</h3>
                        <div className="flex flex-wrap justify-center gap-2">
                          {emailState.result.riskFactors.map((factor, i) => (
                            <Badge key={i} variant="destructive">{factor}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                   <CardFooter>
                       <Button variant="outline" onClick={handleSummarize} disabled={summarizationState.status === 'loading'} className="w-full">
                            {summarizationState.status === 'loading' ? <Loader2 className="animate-spin" /> : <Sparkles />}
                            Summarize Email
                        </Button>
                   </CardFooter>
                </Card>
              )}
              {summarizationState.status !== 'idle' && (
                 <Card className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><Sparkles className="text-accent"/>AI-Generated Summary</CardTitle>
                        <CardDescription>A concise summary of the email content.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {summarizationState.status === 'loading' && (
                             <div className="space-y-2">
                                <Skeleton className="h-5 w-1/3"/>
                                <Skeleton className="h-20 w-full"/>
                             </div>
                        )}
                         {summarizationState.status === 'success' && summarizationState.result && (
                             <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: marked(summarizationState.result.summary) }}/>
                        )}
                    </CardContent>
                 </Card>
              )}
               {emailState.status === 'success' && emailState.result && (
                <Card className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><Wand2 className="text-accent"/>AI-Assisted Reply</CardTitle>
                        <CardDescription>Generate a safe, professional reply suggestion.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {replyState.status === 'idle' && (
                           <Button onClick={handleGenerateReply} className="w-full bg-accent hover:bg-accent/90">
                                <Wand2 /> Generate Safe Reply
                           </Button>
                        )}
                        {replyState.status === 'loading' && (
                             <div className="space-y-2">
                                <Skeleton className="h-5 w-1/3"/>
                                <Skeleton className="h-20 w-full"/>
                             </div>
                        )}
                         {replyState.status === 'success' && replyState.result && (
                            <div>
                                <Label htmlFor="safe-reply" className="font-semibold">Suggested Reply</Label>
                                <Textarea id="safe-reply" readOnly value={replyState.result.safeReply} rows={5} className="mt-2 bg-muted/50"/>
                            </div>
                        )}
                    </CardContent>
                    {replyState.status === 'success' && replyState.result && (
                        <CardFooter className="justify-end gap-2">
                            <Button variant="ghost" onClick={handleGenerateReply} disabled={replyState.status === 'loading'}>
                                {replyState.status === 'loading' ? <Loader2 className="animate-spin" /> : <Wand2 />}
                                Regenerate
                            </Button>
                            <Button onClick={() => copyToClipboard(replyState.result!.safeReply, 'Reply')}>
                                <Copy /> Copy Reply
                            </Button>
                        </CardFooter>
                    )}
                </Card>
               )}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="url">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><Bot /> URL Details</CardTitle>
                        <CardDescription>Enter a URL to assess its risk level.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...urlForm}>
                        <form onSubmit={urlForm.handleSubmit(handleUrlSubmit)} className="space-y-4">
                            <FormField control={urlForm.control} name="url" render={({ field }) => (
                            <FormItem>
                                <FormLabel>URL</FormLabel>
                                <FormControl><Input placeholder="https://example.com" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )} />
                            <Button type="submit" disabled={urlState.status === 'loading'} className="w-full">
                                {urlState.status === 'loading' && <Loader2 className="animate-spin" />}
                                <span>Analyze URL</span>
                            </Button>
                        </form>
                        </Form>
                    </CardContent>
                </Card>

                <div className="space-y-8">
                {urlState.status === 'loading' && (
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-2/3" />
                        </CardHeader>
                        <CardContent className="flex flex-col items-center gap-4">
                            <Skeleton className="size-40 rounded-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                        </CardContent>
                    </Card>
                )}
                {urlState.status === 'success' && urlState.result && (
                    <Card className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                        <CardHeader>
                            <CardTitle className="font-headline">URL Analysis Result</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <RiskScoreIndicator score={urlState.result.riskScore} />
                            <Alert variant={urlState.result.riskScore > 0.7 ? "destructive" : "default"}>
                                <AlertTriangle />
                                <AlertTitle className="font-headline">Justification</AlertTitle>
                                <AlertDescription>{urlState.result.justification}</AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                )}
                </div>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
