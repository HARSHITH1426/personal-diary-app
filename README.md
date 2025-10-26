# Core Diary

Core Diary is a modern, secure, and private digital journal built to provide a clean and focused writing experience. It's a place for your thoughts, memories, and daily reflections, with AI-powered writing prompts to help you get started when you're feeling stuck.

<!-- You can add a screenshot of your application here! -->
<!-- ![Core Diary Screenshot](link_to_your_screenshot.png) -->

---

## Features

*   **Secure User Accounts:** Full authentication (sign up, login, password reset) powered by Firebase Authentication ensures your entries are private.
*   **Rich Text Editor:** A simple and clean interface for writing, editing, and formatting your diary entries.
*   **AI-Powered Writing Prompts:** If you're unsure what to write about, you can generate a personalized writing suggestion based on your recent entries.
*   **Entry Management:** Easily create, read, update, and delete your diary entries.
*   **Search and Filter:** Quickly find entries by searching for keywords or filtering by a specific date using the built-in calendar.
*   **Tagging System:** Organize your entries with comma-separated tags for easy categorization and searching.
*   **Responsive Design:** A beautiful and functional interface that works seamlessly on both desktop and mobile devices.

---

## Tech Stack

This project was built with a modern, full-stack JavaScript framework and ecosystem:

*   **Framework:** [Next.js](https://nextjs.org/) (React)
*   **Backend & Database:** [Firebase](https://firebase.google.com/) (Authentication & Firestore)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) with [ShadCN UI](https://ui.shadcn.com/) for components.
*   **Generative AI:** [Google's Gemini models](https://ai.google.dev/) via [Genkit](https://firebase.google.com/docs/genkit).
*   **State Management:** [Zustand](https://github.com/pmndrs/zustand)
*   **Form Handling:** [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) for validation.
*   **Icons:** [Lucide React](https://lucide.dev/)

---

## Getting Started: Running the Project Locally

To run this project on your own computer, follow these steps.

### Prerequisites

You must have [Node.js](https://nodejs.org/en) (version 18 or later) and npm installed on your machine.

### 1. Clone the repository

First, clone the project from GitHub to your local machine.

```bash
git clone https://github.com/HARSHITH1426/core-diary-app.git
```

### 2. Navigate to the Project Directory

Change into the folder that was just created.

```bash
cd core-diary-app
```

### 3. Install Dependencies

Install all of the project's software packages using npm.

```bash
npm install
```

### 4. Run the Development Server

Start the local development server.

```bash
npm run dev
```

### 5. Open in Your Browser

Once the server is running, you will see a message in your terminal. Open your web browser and go to the following address:

**http://localhost:9002**

You should now see the application running! Any changes you make to the code will automatically reload in the browser.
