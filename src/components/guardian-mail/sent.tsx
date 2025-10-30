'use client';

import { useState, useEffect } from 'react';
import type { SentEmail } from '@/lib/types';
import { useEmailState } from '@/hooks/use-email-state';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { RiskTag } from '@/components/guardian-mail/risk-tag';
import { Trash2, Star } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function Sent() {
  const { sentEmails, setSentEmails } = useEmailState();
  const [selectedEmail, setSelectedEmail] = useState<SentEmail | null>(null);
  const [selectedEmailIds, setSelectedEmailIds] = useState<Set<string>>(new Set());

  // Effect to handle email selection and deselection
  useEffect(() => {
    // Select the first email if none is selected
    if (!selectedEmail && sentEmails.length > 0) {
      setSelectedEmail(sentEmails[0]);
    }
    // If all emails are deleted, clear the selected email
    else if (sentEmails.length === 0) {
      setSelectedEmail(null);
    }
  }, [sentEmails, selectedEmail]);

  const handleCheckboxChange = (emailId: string, checked: boolean) => {
    const newSelectedIds = new Set(selectedEmailIds);
    checked ? newSelectedIds.add(emailId) : newSelectedIds.delete(emailId);
    setSelectedEmailIds(newSelectedIds);
  };

  const handleDeleteSelected = () => {
    setSentEmails(sentEmails.filter(email => !selectedEmailIds.has(email.id)));
    setSelectedEmailIds(new Set());
  };

  // Function to handle starring/unstarring an email
  const toggleStar = (emailId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the click from selecting the email
    setSentEmails(
      sentEmails.map(email =>
        email.id === emailId ? { ...email, starred: !email.starred } : email
      )
    );
  };

  return (
    <div className="flex h-full flex-col">
      <TooltipProvider>
        <div className="flex items-center justify-between gap-2 border-b p-4">
          <div>
            <h1 className="font-headline text-3xl font-bold">Sent</h1>
            <p className="text-muted-foreground">
              You have sent {sentEmails.length} messages.
            </p>
          </div>
          {selectedEmailIds.size > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleDeleteSelected}>
                  <Trash2 className="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete selected</TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-3 lg:grid-cols-4">
          {/* Email List Column */}
          <div className="col-span-1 flex flex-col border-r">
            <ScrollArea className="h-full">
              {sentEmails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 p-4 text-sm transition-colors',
                    'hover:bg-accent/50 hover:text-foreground',
                    selectedEmail?.id === email.id && 'bg-accent',
                  )}
                >
                  <div className="flex items-center gap-3 pt-1">
                    <Checkbox
                      checked={selectedEmailIds.has(email.id)}
                      onCheckedChange={(checked: boolean) => handleCheckboxChange(email.id, checked)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Star
                      className={cn(
                        'size-5 cursor-pointer text-muted-foreground transition-colors hover:text-yellow-400',
                        email.starred && 'fill-yellow-400 text-yellow-400'
                      )}
                      onClick={(e) => toggleStar(email.id, e)}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate font-semibold">To: {email.to.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(email.date), 'PP')}
                      </p>
                    </div>
                    <p className="truncate font-bold">{email.subject}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: email.body }} />
                    <div className="mt-2">
                      {email.riskLevel && email.riskLevel !== 'unknown' && (
                        <RiskTag riskLevel={email.riskLevel} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>
          {/* Email Content Column */}
          <div className="col-span-1 flex flex-col md:col-span-2 lg:col-span-3">
            {selectedEmail ? (
              <>
                <div className="flex items-center justify-between border-b p-4">
                  <div className="flex items-center gap-2">
                    <h2 className="font-headline text-2xl font-bold">{selectedEmail.subject}</h2>
                    {selectedEmail.riskLevel && <RiskTag riskLevel={selectedEmail.riskLevel} />}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">Analyze with AI</Button>
                    <Button variant="outline" size="sm">Summarize</Button>
                  </div>
                </div>
                <ScrollArea className="flex-1 p-4 md:p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="size-10">
                        <AvatarFallback>{selectedEmail.to.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">To: {selectedEmail.to.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedEmail.to.email}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedEmail.date), 'PPP p')}
                    </p>
                  </div>
                  <Separator />
                  <div className="prose prose-sm dark:prose-invert mt-6 max-w-none" dangerouslySetInnerHTML={{ __html: selectedEmail.body }}/>
                </ScrollArea>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-center">
                <p className="text-muted-foreground">
                  {sentEmails.length > 0 ? 'Select an email to read' : 'Your sent folder is empty.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}