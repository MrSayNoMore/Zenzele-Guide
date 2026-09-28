# Auth email templates

Branded versions of Supabase's auth emails. Supabase doesn't read these files
automatically on a hosted project. Paste each one into
**Supabase → Authentication → Emails → Templates**.

| Supabase template | File | Subject |
| --- | --- | --- |
| Confirmation | `confirmation.html` | Confirm your email for Zenzele Guide |
| Magic Link | `magic_link.html` | Your Zenzele Guide sign-in link |
| Recovery | `recovery.html` | Reset your Zenzele Guide password |
| Email Change | `email_change.html` | Confirm your new email for Zenzele Guide |
| Invite | `invite.html` | You're invited to Zenzele Guide |

For each template: set the **Subject**, switch the body to **Source**, and replace it with the file's contents.

- Links go to `https://zenzeleguide.co.za/auth/confirm?token_hash=…` (the app's
  `/auth/confirm` page verifies the token), so emails never show the Supabase
  project address. This needs **Authentication → URL Configuration → Site URL**
  set to `https://zenzeleguide.co.za`.
- The greeting uses `{{ .Data.first_name }}` (saved at sign-up) and falls back to "Hi there".
- The logo is served from `https://zenzeleguide.co.za/email/mark.png` (`public/email/mark.png`).
- The sender name and address ("Supabase Auth", `noreply@mail.app.supabase.io`) can only
  be changed with custom SMTP: **Authentication → Emails → SMTP Settings**.
