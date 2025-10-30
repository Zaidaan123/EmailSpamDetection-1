# GuardianMail

## Overview
GuardianMail is a Next.js-based secure email client with advanced AI-powered threat detection and user safety features.

### Core Features
- **Phishing Email Detection:** Utilizes Transformer models (such as BERT/RoBERTa) to identify phishing attempts in email content.
- **URL & IP Risk Analysis:** Analyzes URLs using AI and threat intel to assign risk scores; checks sender IP against reputation sources.
- **Risk Indicator UI:** Displays visual cues within the mailbox for potential risks.
- **AI-Assisted Reply:** Context-aware AI that helps users draft safe, professional replies while avoiding risky interactions.
- **Layered Architecture:** Maintains clean data, model, and security layers for robust processing.

## Setup Instructions

### 1. Prerequisites
- **Node.js** (v18 or v20 recommended)
- **npm** (v9 or higher)

### 2. Install Dependencies
Open a terminal in the `EmailSpam-main` directory and run:

```sh
npm install
```

## Development
To start the development server (with hot reload):

```sh
npm run dev
```

By default, this runs at [http://localhost:9002](http://localhost:9002)

## Production Build & Start (Windows Compatible)
**Important:** Production build is required before starting the production server.

1. **Build the project:**
    ```sh
    npm run build
    ```
2. **Start the server:**
    ```sh
    npm run start
    ```
   This will serve your app in production mode. Default port is 3000.

If you get the error `Could not find a production build in the '.next' directory`, ensure the build step completes successfully (let it finish; don’t interrupt it).

## Troubleshooting
- **Build/start errors:**
  - Make sure you have run `npm run build` successfully before running `npm run start`.
  - If the build is interrupted or fails, resolve any reported errors and repeat `npm run build`.
  - Confirm you are running commands inside the `EmailSpam-main` directory.
  - After a successful build, the `.next` directory should be present.

- **TypeScript or Lint errors:**
  - Lint: `npm run lint`
  - Typecheck: `npm run typecheck`

## Project Structure
```
EmailSpam-main/
  |- src/
      |- ai/         # AI/ML pipelines and integrations
      |- app/        # App UI (pages, components)
      |- components/ # Reusable UI components
      |- firebase/   # Firebase config, hooks
      |- hooks/      # Custom React hooks
      |- lib/        # Utilities, types, mock data
  |- public/         # Public assets (if added)
  |- package.json    # Project dependencies & scripts
  |- next.config.ts  # Next.js configuration
```

## Additional Documentation
- See `docs/blueprint.md` for feature descriptions and style guidelines.

---

**Support:** If you run into issues, double check the troubleshooting section or raise an issue with error details and environment info.
