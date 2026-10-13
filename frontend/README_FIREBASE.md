# Frontend Firebase Hosting Deployment Guide

This guide covers deploying the **VITRINE Autonomous Commerce Frontend** to Firebase Hosting across multisite endpoints.

## Prerequisites
- **Node.js and npm**: Ensure Node.js (v18+) and npm are installed
- **Firebase CLI**: Install with `npm install -g firebase-tools`
- **Firebase Authentication**: Pre-configured with Service Account credentials (`firebase_key.json`)
- **Backend Deployed**: Backend services (`vitrine-bff`, `vitrine-ucp`) running on Cloud Run

## Multisite Architecture
The project is configured for Firebase Multisite Hosting under project `gcp-aibuildercup-project`:
1. `vitrine-autonomous-commerce`
2. `vitrine-autonoumous-commerce`
3. `gcp-aibuildercup-project`

---

## Deployment Options

### Option 1: PowerShell Script (Windows)
Run from the `frontend/` directory:
```powershell
./deploy.ps1
```

### Option 2: Bash Script (Linux/Mac)
```bash
chmod +x deploy.sh
./deploy.sh
```

### Option 3: Manual Deployment
#### Step 1: Install Dependencies
```bash
npm install
```

#### Step 2: Build the Application
```bash
npm run build
```
*This creates the production build in the `build/` directory.*

#### Step 3: Deploy to All Firebase Multisites
```bash
firebase deploy --only hosting
```

---

## Live Production URLs
- **Primary Custom URL**: **[https://vitrine-autonomous-commerce.web.app](https://vitrine-autonomous-commerce.web.app)**
- **User Alias URL**: **[https://vitrine-autonoumous-commerce.web.app](https://vitrine-autonoumous-commerce.web.app)**
- **Default Project URL**: **[https://gcp-aibuildercup-project.web.app](https://gcp-aibuildercup-project.web.app)**
