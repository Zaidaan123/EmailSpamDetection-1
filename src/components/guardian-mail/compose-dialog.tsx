
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';
import type { SentEmail, InboxEmail } from '@/lib/types';
import { useEmailState } from '@/hooks/use-email-state';
import { useUser } from '@/firebase';

const formSchema = z.object({
  recipient: z.string().email({ message: 'Please enter a valid recipient email.' }),
  subject: z.string().min(1, 'Subject cannot be empty.'),
  body: z.string(),
});

interface ComposeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmailSent: (email: SentEmail) => void;
}

export function ComposeDialog({ open, onOpenChange, onEmailSent }: ComposeDialogProps) {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const { user } = useUser();
  const { setSentEmails, setInboxEmails } = useEmailState();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { recipient: '', subject: '', body: '' },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSending(true);

    // Simulate sending email
    setTimeout(() => {
      const now = new Date().toISOString();
      const newSentEmail: SentEmail = {
        id: `sent-${Date.now()}`,
        to: {
          name: values.recipient.split('@')[0] || 'Recipient',
          email: values.recipient,
        },
        subject: values.subject,
        body: `<p>${values.body.replace(/\n/g, '<br>')}</p>`,
        date: now,
      };

      // Add to sender's "Sent" list
      onEmailSent(newSentEmail);

      // "Deliver" the email to the recipient's inbox
      const newInboxEmail: InboxEmail = {
        id: `inbox-${Date.now()}`,
        from: {
          name: user?.email?.split('@')[0] || 'Sender',
          email: user?.email || 'sender@example.com',
          avatar: `https://i.pravatar.cc/150?u=${user?.uid || 'sender'}`,
        },
        subject: values.subject,
        snippet: values.body.substring(0, 100),
        body: `<p>${values.body.replace(/\n/g, '<br>')}</p>`,
        date: now,
        unread: true,
        starred: false,
        status: 'inbox',
        tags: [],
      };

      // This assumes the recipient exists in our mock/local system
      // In a real app, this would be a backend operation.
      // Here, we just add it to the global inbox list.
      setInboxEmails(prev => [newInboxEmail, ...prev]);

      setIsSending(false);
      onOpenChange(false);
      form.reset();

      toast({
        title: 'Email Sent!',
        description: `Your message to ${values.recipient} has been sent.`,
      });
    }, 1000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Compose Email</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="recipient"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To</FormLabel>
                  <FormControl>
                    <Input placeholder="recipient@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Your subject line" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Body</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Write your message here..." {...field} rows={10} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSending}>
                {isSending ? <Loader2 className="animate-spin" /> : <Send />}
                Send
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
