
'use client';

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';
import { InboxEmail, SentEmail } from '@/lib/types';
import { inboxEmails as initialInboxEmails, sentEmails as initialSentEmails } from '@/lib/mock-data';

// Keys for localStorage
const INBOX_EMAILS_KEY = 'guardianmail_inbox_emails';
const SENT_EMAILS_KEY = 'guardianmail_sent_emails';


interface EmailContextType {
  inboxEmails: InboxEmail[];
  setInboxEmails: Dispatch<SetStateAction<InboxEmail[]>>;
  sentEmails: SentEmail[];
  setSentEmails: Dispatch<SetStateAction<SentEmail[]>>;
}

const EmailContext = createContext<EmailContextType | undefined>(undefined);

export const EmailProvider = ({ children }: { children: ReactNode }) => {
  const [inboxEmails, setInboxEmails] = useState<InboxEmail[]>([]);
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on initial mount
  useEffect(() => {
    try {
      const storedInbox = localStorage.getItem(INBOX_EMAILS_KEY);
      if (storedInbox) {
        setInboxEmails(JSON.parse(storedInbox));
      } else {
        setInboxEmails(initialInboxEmails);
      }

      const storedSent = localStorage.getItem(SENT_EMAILS_KEY);
      if (storedSent) {
        setSentEmails(JSON.parse(storedSent));
      } else {
        setSentEmails(initialSentEmails);
      }
    } catch (error) {
      console.error("Failed to load emails from localStorage", error);
      // Fallback to initial mock data if localStorage fails
      setInboxEmails(initialInboxEmails);
      setSentEmails(initialSentEmails);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever emails change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(INBOX_EMAILS_KEY, JSON.stringify(inboxEmails));
      } catch (error) {
        console.error("Failed to save inbox emails to localStorage", error);
      }
    }
  }, [inboxEmails, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(SENT_EMAILS_KEY, JSON.stringify(sentEmails));
      } catch (error) {
        console.error("Failed to save sent emails to localStorage", error);
      }
    }
  }, [sentEmails, isLoaded]);


  return (
    <EmailContext.Provider value={{ inboxEmails, setInboxEmails, sentEmails, setSentEmails }}>
      {children}
    </EmailContext.Provider>
  );
};

export const useEmailState = () => {
  const context = useContext(EmailContext);
  if (context === undefined) {
    throw new Error('useEmailState must be used within an EmailProvider');
  }
  return context;
};
