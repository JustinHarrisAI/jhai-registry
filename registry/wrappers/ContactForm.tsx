'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

/**
 * ContactForm — the one form on a service site, validated client-side and painted from tokens.
 *
 * WHY A LIBRARY FOR THIS
 * Next's own form actions handle submission perfectly well, and for a newsletter box they are
 * enough. What they do not give you is per-field feedback before the round trip: a mistyped
 * email that only reports itself after a submit and a page transition reads as broken, and on a
 * quote request — the form that carries the money — that is the difference between a lead and a
 * bounce. react-hook-form supplies the field state; zod supplies one schema that validates the
 * same way on the client and inside a server action, so the rules cannot drift apart.
 *
 * WHAT THIS DOES NOT DO
 * It does not send anything. `onSubmit` is the caller's, because where a lead goes is a per
 * client decision — a server action, a CRM webhook, an email relay — and baking one in would
 * make this item unusable for the next client.
 */

export const contactSchema = z.object({
  name: z.string().min(2, 'Tell me who you are.'),
  email: z.string().email('That address does not look right.'),
  message: z.string().min(10, 'A sentence or two is plenty.'),
});

export type ContactValues = z.infer<typeof contactSchema>;

export interface ContactFormContent {
  nameLabel?: string;
  emailLabel?: string;
  messageLabel?: string;
  submitLabel?: string;
  successMessage?: string;
}

export interface ContactFormProps {
  /** Receives validated values. Throw to surface a submission error to the reader. */
  onSubmit: (values: ContactValues) => Promise<void> | void;
  content?: ContactFormContent;
  className?: string;
}

export function ContactForm({ onSubmit, content = {}, className }: ContactFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<ContactValues>({ resolver: zodResolver(contactSchema), mode: 'onBlur' });

  const {
    nameLabel = 'Name',
    emailLabel = 'Email',
    messageLabel = 'What do you need?',
    submitLabel = 'Send',
    successMessage = 'Thank you. I will reply personally.',
  } = content;

  if (isSubmitSuccessful) {
    return (
      <p className={`text-ui-lede text-foreground ${className ?? ''}`} role="status">
        {successMessage}
      </p>
    );
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className={`flex flex-col gap-[var(--ui-gap-inline)] ${className ?? ''}`}
    >
      <Field id="name" label={nameLabel} error={errors.name?.message}>
        <input id="name" autoComplete="name" {...register('name')} className={INPUT} />
      </Field>

      <Field id="email" label={emailLabel} error={errors.email?.message}>
        <input id="email" type="email" autoComplete="email" {...register('email')} className={INPUT} />
      </Field>

      <Field id="message" label={messageLabel} error={errors.message?.message}>
        <textarea id="message" rows={4} {...register('message')} className={`${INPUT} h-auto py-3`} />
      </Field>

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-[var(--ui-button-h)] rounded-[var(--ui-radius-inner)] bg-primary px-6
                   text-primary-foreground transition-opacity duration-[var(--ui-dur-fast)]
                   ease-[var(--ui-ease)] hover:opacity-90 disabled:opacity-60
                   focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {isSubmitting ? 'Sending…' : submitLabel}
      </button>
    </form>
  );
}

const INPUT =
  'h-[var(--ui-field-h)] w-full rounded-[var(--ui-radius-inner)] border border-input bg-background ' +
  'px-3 text-foreground placeholder:text-muted-foreground ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

function Field({
  id, label, error, children,
}: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-ui-caption text-muted-foreground">{label}</label>
      {children}
      {/*
        The error is announced, not just coloured. Colour alone fails anyone who cannot see it,
        and on a lead form that is a lost enquiry rather than a cosmetic miss.
      */}
      {error ? (
        <p role="alert" className="text-ui-micro text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
