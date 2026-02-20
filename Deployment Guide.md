# BoardRoom AI: Server Deployment Guide

This guide explains how to deploy the BoardRoom AI boardroom simulator to a self-hosted Windows server using Cloudflare Tunnels for secure public access.

## 1. Prerequisites

Install the following before starting:

### Node.js
```
winget install OpenJS.NodeJS
```
After installing, close and reopen your terminal, then verify: `node --version`

### Cloudflared
```
winget install Cloudflare.cloudflared
```

### Fix PowerShell Execution Policy (Windows only)
If you get a "running scripts is disabled" error when using npm:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 2. Server Setup & Installation

### Step A: Clone the Repository

```
git clone https://github.com/KreygoAdmin/BoardRoomAI.git
cd BoardRoomAI
```

### Step B: Install Dependencies

```
npm install
```

### Step C: Environment Variables

Create a `.env` file in the root directory:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 3. Production Build & Hosting

### Step A: Build the Project

```
npm run build
```

This generates a `dist/` folder containing the optimized application.

### Step B: Start the Production Server

```
npx serve -s dist -l 5173
```

> Tip: To keep this running in the background on Windows, use PM2 or run it as a scheduled task.

---

## 4. Cloudflare Tunnel Setup

### Step A: Authenticate with Cloudflare

Run this once — it opens a browser to log in and saves a certificate locally:

```
cloudflared tunnel login
```

### Step B: Create the Tunnel

```
cloudflared tunnel create boardroom
```

This creates a credentials JSON file at `C:\Users\<username>\.cloudflared\<tunnel-uuid>.json` and prints the tunnel UUID. Note the UUID for the next step.

### Step C: Configure config.yml

Edit `C:\Users\<username>\.cloudflared\config.yml` (create it if it doesn't exist):

```yaml
tunnel: <your-tunnel-uuid>
credentials-file: C:\Users\<username>\.cloudflared\<your-tunnel-uuid>.json

ingress:
  - hostname: boardroom.kreygo.com
    service: http://localhost:5173
  - service: http_status:404
```

Replace `<your-tunnel-uuid>` and `<username>` with your actual values.

### Step D: Route DNS

Link the subdomain to your tunnel (only needed once):

```
cloudflared tunnel route dns boardroom boardroom.kreygo.com
```

> If you get an error saying a record already exists, go to **dash.cloudflare.com** → your domain → **DNS**, delete the existing `boardroom` record, then rerun the command.

### Step E: Run as a Windows Service (auto-start on boot)

In an **Administrator** PowerShell:

```powershell
cloudflared service install
Start-Service cloudflared
```

To restart the service after config changes:

```powershell
Get-Process cloudflared | Stop-Process -Force
Start-Service cloudflared
```

---

## 5. Webhook Server Setup

The webhook server handles Stripe payment events and runs as a separate Python process on port 8000. It is exposed publicly via `api.kreygo.com` through the same Cloudflare tunnel.

### Step A: Install Python dependencies

```bash
cd webhook-server
python -m venv venv
venv/Scripts/python.exe -m pip install -r requirements.txt
```

### Step B: Configure environment variables

Create `webhook-server/.env`:

```
STRIPE_ENDPOINT_SECRET=whsec_...   # From Stripe Dashboard → Webhooks → your endpoint → Signing secret
STRIPE_SECRET_KEY=sk_live_...      # From Stripe Dashboard → Developers → API keys → Secret key
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # From Supabase Dashboard → Project Settings → API → service_role (secret)
```

### Step C: Start the webhook server

```bash
venv/Scripts/python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000
```

> To keep it running in the background, use PM2 or a Windows Scheduled Task (same approach as the frontend).

### Step D: Cloudflare tunnel

Ensure `C:\Users\<username>\.cloudflared\config.yml` includes:

```yaml
- hostname: api.kreygo.com
  service: http://localhost:8000
```

Route the DNS record once:
```
cloudflared tunnel route dns boardroom api.kreygo.com
```

Then restart the Cloudflare service to pick up the config change.

---

## 6. Stripe & Supabase Final Checklist

1. **Stripe Redirect:** Go to Stripe Dashboard → Payment Links → Edit. Set the "Redirect after payment" URL to `https://boardroom.kreygo.com/?upgraded=true`.
2. **Stripe Webhook Endpoint:** Go to Stripe Dashboard → Developers → Webhooks → Add endpoint. URL: `https://api.kreygo.com/webhooks/stripe`. Events: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`.
3. **Stripe Customer Portal:** Go to Stripe Dashboard → Settings → Billing → Customer portal → Activate portal. Enable "Cancel subscription" under Cancellation.
4. **Supabase RLS:** Ensure Row Level Security is enabled on `boardrooms`, `profiles`, and `saved_agents` tables.
5. **Supabase Auth:** Ensure `https://boardroom.kreygo.com` is added to "Allow Redirect URLs" in Authentication > Settings.
6. **Supabase profiles table:** Ensure the `profiles` table has these columns:
   - `plan` (text, default `'free'`)
   - `total_tokens` (int4, default `0`)
   - `messages_used` (int4, default `0`)
   - `billing_cycle_anchor` (timestamptz, default `now()`)
7. **Supabase increment_tokens function:** Run this in the SQL Editor:

```sql
CREATE OR REPLACE FUNCTION increment_tokens(user_id uuid, count integer)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE profiles SET total_tokens = COALESCE(total_tokens, 0) + count WHERE id = user_id;
$$;

GRANT EXECUTE ON FUNCTION increment_tokens(uuid, integer) TO authenticated;
```

---

## 7. Maintenance

To update the app when new code is pushed to GitHub:

```
git pull
npm install
npm run build
```

The running `serve` process will automatically pick up the new `dist/` folder.
