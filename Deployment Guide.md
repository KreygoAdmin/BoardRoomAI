# **BoardRoom AI: Server Deployment Guide**

This guide explains how to deploy the BoardRoom AI boardroom simulator to a self-hosted Windows/Linux server using Cloudflare Tunnels for secure public access.

## **1\. Prerequisites**

Before starting, ensure the following are installed on the server:

* **Node.js** (v18 or higher)  
* **Git**  
* **Cloudflared** (The Cloudflare Tunnel CLI)

## **2\. Server Setup & Installation**

### **Step A: Clone the Repository**

Open a terminal (PowerShell or Bash) on your server:

git clone \[https://github.com/KreygoAdmin/BoardRoomAI.git\](https://github.com/KreygoAdmin/BoardRoomAI.git)  
cd BoardRoomAI

### **Step B: Install Dependencies**

npm install

### **Step C: Environment Variables**

Create a .env file in the root directory:

VITE\_SUPABASE\_URL=your\_supabase\_project\_url  
VITE\_SUPABASE\_ANON\_KEY=your\_supabase\_anon\_key

## **3\. Production Build & Hosting**

To ensure the app is fast and secure, do not use npm run dev in production. Instead, build the static files and serve them.

### **Step A: Build the Project**

npm run build

This will generate a dist/ folder containing the optimized application.

### **Step B: Start the Production Server**

Use serve to host the files on a specific port (e.g., 5173):

\# Run using npx (no install required)  
npx serve \-s dist \-l 5173

*Tip: To keep this running in the background on Windows, use a process manager like **PM2** or run it as a scheduled task.*

## **4\. Cloudflare Tunnel Configuration**

### **Step A: Update config.yml**

Edit your config.yml (e.g., in C:\\Cloudflared\\config.yml) to route traffic to the app:

tunnel: your-tunnel-uuid  
credentials-file: C:\\Cloudflared\\your-tunnel-uuid.json

ingress:  
  \- hostname: boardroom.kreygo.com  
    service: http://localhost:5173  
  \- service: http\_status:404

### **Step B: Route DNS**

If you haven't already, link the subdomain to your tunnel:

cloudflared tunnel route dns your-tunnel-uuid boardroom.kreygo.com

### **Step C: Restart the Tunnel**

Restart the Cloudflare service in services.msc or via CLI to apply changes.

## **5\. Stripe & Supabase Final Checklist**

1. **Stripe Redirect:** Go to your Stripe Dashboard \-\> Payment Links \-\> Edit. Set the "Redirect after payment" URL to https://boardroom.kreygo.com/?upgraded=true.  
2. **Supabase RLS:** Ensure **Row Level Security** is enabled on both boardrooms and profiles tables in the Supabase dashboard.  
3. **Supabase Auth:** Ensure https://boardroom.kreygo.com is added to the "Allow Redirect URLs" list in **Authentication \> Settings**.

## **6\. Maintenance**

To update the app when you push new code to GitHub:

git pull  
npm install  
npm run build  
\# The 'serve' command will automatically pick up the new dist folder  
