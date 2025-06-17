# Product Requirements Document: The Graduation Social Gallery

**Version:** 2.0 (Full Scope)
**Date:** [Date of creation]
**Author:** [Your Name]

## 1. Overview

This document outlines the product requirements for the "Graduation Social Gallery," a modern, fully-featured social media web application. The platform is designed to provide an interactive and engaging community space for sharing, celebrating, and preserving photos from a graduation event. It incorporates a rich feature set including user accounts, social interaction, content organization, moderation, and real-time capabilities.

-   **Vision:** To create a centralized, beautiful, and feature-rich social platform for graduates and their friends to share and interact with graduation memories in real-time.
-   **Target Audience:** Graduating students, friends, family, and event attendees.

## 2. Technical Stack & Architecture

The application will be built using a modern, decoupled architecture to ensure scalability, performance, and a superior developer experience.

-   **Frontend:**
    -   **Framework:** React (using Vite for development).
    -   **Hosting:** Vercel.
-   **Backend:**
    -   **Framework:** Python (using FastAPI).
    -   **Hosting:** Alibaba Cloud Elastic Compute Service (ECS).
-   **Database:**
    -   **Service:** Supabase.
    -   **Type:** PostgreSQL.
    -   **Usage:** Supabase will provide the managed PostgreSQL database. All backend interactions with the database will be handled by FastAPI.
-   **File Storage:**
    -   **Service:** Alibaba Cloud Object Storage Service (OSS).
    -   **Usage:** All user-uploaded binary files (gallery photos, profile pictures) will be stored in an Alibaba Cloud OSS bucket. The database will only store the public URLs to these files.

## 3. User Roles & Permissions

1.  **Anonymous Visitor (Not Logged In):**
    -   Can view the main photo gallery, user profiles, albums, and photo details.
    -   Can search for photos and users.
    -   Can "like" photos.
    -   Can download photos if the owner has permitted it.
    -   Cannot upload, comment, follow, report content, or access settings.

2.  **Registered User (Logged In):**
    -   All permissions of an Anonymous Visitor.
    -   Can upload photos and add captions/tags.
    -   Can create and manage photo albums, and assign a single photo to multiple albums.
    -   Can comment on photos.
    -   Can follow and unfollow other users.
    -   Can report inappropriate content.
    -   Can manage their own profile (bio, profile picture) and settings (password, download permissions).
    -   Can view their private notifications in real-time.
    -   Can delete their own content (photos, comments, albums).

3.  **Administrator (You):**
    -   All permissions of a Registered User.
    -   Can mark photos as "Featured" ("Editor's Pick").
    -   Can access a moderation dashboard to view and resolve reported content.
    -   Can delete any photo, comment, album, or user on the platform.

## 4. Functional Requirements

### 4.1. Core Content & Gallery Features
-   **[F-01] Photo Upload:** Registered users must be able to upload image files (e.g., JPEG, PNG) with an accompanying text caption.
-   **[F-02] Photo Tagging:** During upload, users must be able to add multiple text tags to a photo. Tags must be searchable and clickable, leading to a filtered gallery view of all photos with that tag.
-   **[F-03] Photo Albums (Many-to-Many):** Users must be able to create named albums. A single photo can be assigned to one or more albums. Albums must be visible on the user's profile.
-   **[F-04] Main Gallery View:** The homepage must display a grid of photos, sortable by "Most Recent," "Most Popular (by likes)," and "Featured."
-   **[F-05] Search Functionality:** The application must have a search bar that returns results for users (by username) and photos (by caption/tag).

### 4.2. User Authentication & Profiles
-   **[F-06] User Registration:** New users must be able to create an account using a username, email, and password. Passwords must be securely hashed.
-   **[F-07] User Login:** Registered users must be able to log in to access authenticated features. The system will use JWT for session management.
-   **[F-08] User Profile Page:** Each user must have a public profile page displaying their profile picture, username, bio, follower/following counts, and a gallery of their albums and photos.

### 4.3. Social Interaction
-   **[F-09] Liking System:** Any user can "like" a photo. The total like count must be publicly displayed.
-   **[F-10] Commenting System:** Logged-in users must be able to post text comments on photos.
-   **[F-11] Follow System:** Logged-in users must be able to "follow" and "unfollow" other registered users.
-   **[F-12] Leaderboards:** A dedicated page will display leaderboards for "Most Followed Users" and "Most Liked Photos."

### 4.4. Account Management & Permissions
-   **[F-13] Settings Page:** Registered users must have a private settings page to:
    -   Update their profile information (bio, picture).
    -   Change their password.
    -   Enable or disable photo downloads for all their content via a single toggle.
-   **[F-14] Photo Download:** A download button must be present on photos. This action is conditional on the owner's permission setting and triggers a notification to the owner.

### 4.5. Administration & Moderation
-   **[F-15] Content Reporting:** Users must be able to "report" inappropriate images or comments with an optional reason.
-   **[F-16] Admin Dashboard:** An admin-only interface must exist to view a queue of reported items and take action (e.g., delete content, dismiss report).
-   **[F-17] Featured Content:** An admin must have the ability to toggle a "featured" status on any photo.

### 4.6. Real-Time Features (WebSockets)
-   **[F-18] Real-Time Notifications:** When a user receives a new notification for a like, comment, follow, or download, it must be pushed to their client in real time and trigger a UI update without a page reload.
-   **[F-19] Live Commenting:** When a user is viewing a photo's detail page, new comments posted by other users must appear on the page instantly without requiring a manual refresh.

## 5. Non-Functional Requirements

-   **[NF-01] Performance:** The application must be fast and responsive. Page load times should be minimized by using optimized images, efficient database queries with proper indexing, and a well-configured CDN for static assets.
-   **[NF-02] Security:** All sensitive data must be handled securely. This includes hashing passwords, using prepared statements to prevent SQL injection, validating all user input to prevent XSS, protecting all private/admin routes with auth middleware, and using secure environment variables for all credentials.
-   **[NF-03] Usability:** The user interface must be intuitive, clean, and fully responsive, providing a seamless experience on both desktop and mobile devices.
-   **[NF-04] Scalability:** The architecture (Vercel, FastAPI on ECS, Supabase, OSS) is designed to handle a growing number of users and photos with high availability.

## 6. Out of Scope (Future Considerations)

The following features will not be included in the initial release but may be considered for future versions:

-   A personalized "Following" feed on the homepage for logged-in users.
-   Direct messaging between users.
-   Advanced backend image processing (e.g., automatic watermarking or generating multiple thumbnail sizes).