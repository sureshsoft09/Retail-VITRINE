#!/bin/bash
# Frontend Firebase Hosting Deployment Script (Bash)
set -e

echo -e "\033[0;32mDeploying VITRINE Frontend to Firebase Hosting...\033[0m"

# Configuration
PROJECT_ID="gcp-aibuildercup-project"

# Set the Firebase project
echo -e "\033[1;33mSetting Firebase project...\033[0m"
firebase use "$PROJECT_ID"

# Install dependencies if node_modules doesn't exist or package-lock.json is newer
if [ ! -d "node_modules" ] || [ "package-lock.json" -nt "node_modules" ]; then
    echo -e "\033[1;33mInstalling dependencies...\033[0m"
    npm install
fi

# Build the React application for production
echo -e "\033[1;33mBuilding React application for production...\033[0m"
npm run build

# Check if build was successful
if [ ! -d "build" ]; then
    echo -e "\033[0;31mBuild failed - build directory not found!\033[0m"
    exit 1
fi

# Deploy to Firebase Hosting
echo -e "\033[1;33mDeploying to Firebase Hosting...\033[0m"
firebase deploy --only hosting

echo -e "\033[0;32mDeployment completed!\033[0m"
echo -e "\033[0;36mYour app is now live at: https://$PROJECT_ID.web.app\033[0m"
echo -e "\033[0;36mAlternative URL: https://$PROJECT_ID.firebaseapp.com\033[0m"
