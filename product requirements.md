# Product Requirements Document: The Graduation Social Gallery

**Version:** 3.0 (Full Scope with UI/UX Integration)
**Date:** [Date of creation]
**Author:** [Your Name]

## 1. Overview

This document outlines the product requirements for the "Graduation Social Gallery," a modern, fully-featured social media web application. The platform is designed to provide an interactive and engaging community space for sharing, celebrating, and preserving photos from a graduation event.

-   **Vision:** To create a centralized, beautiful, and feature-rich social platform for graduates and their friends to share and interact with graduation memories in real-time.

-   **Design Philosophy: Modern Elegance**
    -   **Photo-First:** The UI will be a quiet, elegant frame that makes the user-uploaded photos the primary focus.
    -   **Clean & Uncluttered:** The design will prioritize generous whitespace, clear typography, and a limited color palette to avoid visual noise.
    -   **Intuitive & Accessible:** The application flow must be obvious to all users, regardless of technical proficiency, and follow accessibility best practices.

## 2. Technical Stack & Architecture

-   **Frontend:** React (using Vite), hosted on Vercel.
-   **Backend:** Python (using FastAPI), hosted on Alibaba Cloud Elastic Compute Service (ECS).
-   **Database:** PostgreSQL, managed via Supabase.
-   **File Storage:** Alibaba Cloud Object Storage Service (OSS).

## 3. User Roles & Permissions
*(This section remains unchanged, as it defines functional access, not design)*

1.  **Anonymous Visitor (Not Logged In)**
2.  **Registered User (Logged In)**
3.  **Administrator (You)**

## 4. Functional Requirements

### 4.1. Core Content & Gallery Features
-   **[F-01] Photo Upload:** Registered users must be able to upload images via a clean, simple modal or dedicated page.
-   **[F-02] Photo Tagging:** Users must be able to add text tags during upload. On the photo detail page, tags will be displayed as clickable elements leading to a filtered gallery view.
-   **[F-03] Photo Albums (Many-to-Many):** Users can organize photos into named albums. A single photo can be assigned to multiple albums.
-   **[F-04] Main Gallery View:** The homepage will display photos in a responsive **masonry grid** to elegantly handle various aspect ratios. Users can sort the content by "Most Recent," "Most Popular," and "Featured."
-   **[F-05] Search Functionality:** A subtle search bar, integrated into the main navigation, will allow users to find photos by caption/tag and users by username.

### 4.2. User Authentication & Profiles
-   **[F-06] Authentication Pages:** The Login and Register pages will be minimalist, featuring a centered form card to minimize distractions and focus the user on the task.
-   **[F-07] User Profile Page:** Each user will have a public profile page featuring:
    -   A prominent header with their profile picture, username, bio, and key stats (Followers, Following).
    -   A **tabbed interface** below the header to navigate between a "Photos" grid and a view of their "Albums."

### 4.3. Social Interaction
-   **[F-08] Liking System:** An interactive heart icon on each photo card will allow users to like a photo. The icon will show a filled state when liked, providing immediate visual feedback.
-   **[F-09] Commenting System:** The photo detail page will feature a dedicated comment section where users can post new comments and view a chronologically ordered list of existing comments.
-   **[F-10] Follow System:** A "Follow/Unfollow" button will be clearly displayed on user profiles. The button state and text must clearly indicate the current follow status.
-   **[F-11] Leaderboards:** A dedicated page will display ranked lists of users and content in a clean, table-based format.

### 4.4. Administration & Moderation
-   **[F-12] Content Reporting:** Users can report content via a subtle "more options" (three-dot) menu on images and comments.
-   **[F-13] Featured Content:** Photos marked as "featured" by an admin will display a distinct visual badge (e.g., a small crown or star icon) on their card in the gallery.

### 4.5. Real-Time Features (WebSockets)
-   **[F-14] Real-Time Notifications:** A bell icon in the main navigation will indicate new notifications with a badge. Clicking the icon will open a clean dropdown list of recent, real-time updates.
-   **[F-15] Live Commenting:** New comments on a photo detail page will appear in the comment list in real-time without requiring a page refresh, potentially with a subtle highlight or animation to draw attention.

## 5. User Interface & User Experience (UI/UX) Requirements

### 5.1. Visual Design
-   **[UI-01] Color Palette:**
    -   **Primary Background:** Off-White or very light gray (e.g., `#F8F9FA`).
    -   **Primary Text:** Dark Charcoal (e.g., `#212529`).
    -   **Accent Color:** A celebratory Gold (e.g., `#D4AF37`) or a classy University Blue, used for primary buttons, links, and active states.
-   **[UI-02] Typography:**
    -   **Headings:** An elegant Serif font (e.g., Playfair Display, Lora).
    -   **Body & UI Text:** A highly readable Sans-Serif font (e.g., Inter, Lato).

### 5.2. Layout & Component Design
-   **[UI-03] Main Layout:** The content will be centered in a container with a maximum width (e.g., 1200px) on desktop devices to ensure readability.
-   **[UI-04] Navigation Bar:** The navbar will be clean and persistent. It will display the site logo, search bar, and user actions (Upload, Notifications, Profile/Login). On mobile, it must collapse into a hamburger menu.
-   **[UI-05] Image Cards:** The primary component for displaying photos. Cards will have a consistent design with rounded corners and subtle hover effects (e.g., a slight lift via box-shadow).

### 5.3. Micro-interactions & Polish
-   **[UI-06] Loading States:** The application must use **Skeleton Screens** that mimic the layout of the content while it is loading. This provides a better perceived performance than a generic spinner.
-   **[UI-07] Transitions & Feedback:** All interactive elements (buttons, links, tabs) must have smooth CSS transitions for hover and active states to make the interface feel fluid and responsive.

## 6. Non-Functional Requirements
-   **[NF-01] Performance:** The app must be fast. This includes optimized images, efficient database queries, and fast server response times.
-   **[NF-02] Security:** Adherence to best practices including password hashing, protection against SQL injection and XSS, and secure credential management is mandatory.
-   **[NF-03] Responsiveness:** The application must be fully usable and aesthetically pleasing on a wide range of devices, from mobile phones to widescreen desktops.

## 7. Out of Scope (Future Considerations)
-   A personalized "Following" feed on the homepage.
-   Direct messaging between users.
-   Advanced backend image processing (e.g., watermarking).