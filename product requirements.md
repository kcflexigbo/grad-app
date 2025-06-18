# Product Requirements: The Graduation Social Gallery
**Version**: 3.0 (Design & Full Scope)
**Author**: [Your Name]

## 1. Overview

This document outlines the product requirements for the "Graduation Social Gallery," a modern, fully-featured social media web application. The platform is designed to provide an interactive and engaging community space for sharing, celebrating, and preserving photos from a graduation event. It incorporates a rich feature set including user accounts, social interaction, content organization, moderation, and real-time capabilities.

*   **Vision**: To create a centralized, beautiful, and feature-rich social platform for graduates and their friends to share and interact with graduation memories, presented with a clean and elegant design.
*   **Target Audience**: Graduating students, friends, family, and event attendees.

## 2. Design Philosophy & UI/UX

The application's design will adhere to a philosophy of **"Modern Elegance."** The UI should be a quiet, sophisticated frame that makes the user-generated content the hero.

### 2.1. Core Principles & Visual Identity

*   **Photo-First**: The layout and color scheme must prioritize making photos stand out. The primary gallery view will use a `Masonry Grid Layout`.
*   **Clean & Uncluttered**: Generous use of whitespace, a constrained color palette, and clear typography to avoid visual noise.
*   **Intuitive & Accessible**: The user flow must be obvious and usable for a non-technical audience, with clear navigation and calls-to-action.
*   **Responsive & Mobile-First**: The design must be fully functional and visually appealing on all screen sizes, from mobile phones to desktops, built using responsive design principles.

**Visual Identity:**
*   **Color Palette**:
    *   Background: Off-White or very light gray (e.g., `#F8F9FA`).
    *   Text & Dark Elements: Dark Charcoal or Slate Gray (e.g., `#212529`).
    *   Accent Color: A celebratory and elegant color like a rich Gold or a deep University Blue, used sparingly for buttons, links, and highlights.
*   **Typography**:
    *   Headings: A sophisticated Serif font (e.g., `Playfair Display`, `Lora`).
    *   Body & UI Text: A highly readable, clean Sans-Serif font (e.g., `Inter`, `Lato`).

### 2.2. Design Inspiration & Feature Modeling

To ensure an intuitive and successful user experience, the design will draw inspiration from leading social media platforms, adapting their best features to our specific use case.

| Platform      | Inspired Feature                                                        | Rationale for Our App                                                                                                                                              |
| ------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Instagram** | **Primary Template:** Visual-first feed, profile grid, simple "like" mechanic. | Our platform is fundamentally about photo sharing. Instagram's focus on large, high-quality visuals and its intuitive profile layout are a perfect model for our core UX. |
| **Reddit**    | **Ranking & Sorting System:** Sorting by "Hot," "Top," and "New."           | Reddit's ability to surface the best content is crucial for our leaderboard and ranking features. We will adapt its sorting logic to create dynamic leaderboards for photos. |
| **Pinterest** | **Discovery & Layout:** Masonry Grid Layout for galleries.                | Pinterest's dynamic, multi-column grid is visually engaging and ideal for displaying our main gallery and "Top Photos" leaderboard, allowing users to see more content at a glance. |

### 2.3. User Experience (UX)

*   **Loading States**: Skeleton screens will be used to provide a perceived performance boost while data is being fetched.
*   **Micro-interactions**: Subtle hover effects, smooth CSS transitions, and clear visual feedback (e.g., on `like` clicks) are required for all interactive elements.

## 3. Technical Stack & Architecture

The application will be built using a modern, decoupled architecture.

| Component       | Technology / Service                                       | Host / Environment      |
| --------------- | ---------------------------------------------------------- | ----------------------- |
| **Frontend**    | React (Vite), Tailwind CSS                                 | Vercel                  |
| **Backend**     | Python, FastAPI                                            | Alibaba Cloud ECS       |
| **Database**    | PostgreSQL                                                 | Supabase                |
| **File Storage**| Object Storage Service (for image uploads)                 | Alibaba Cloud OSS       |
| **Real-Time**   | WebSockets (for notifications & live comments)             | FastAPI / Uvicorn       |

## 4. User Roles & Permissions

| Role                | Description                                                                                                                              | Key Permissions Confirmed by Code Model (`models.User`)                                |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Anonymous User**  | Any visitor who is not logged in.                                                                                                        | - View public photo gallery, user profiles, and albums.<br>- Cannot interact (like, comment, follow). |
| **Registered User** | A user who has created an account and is logged in.                                                                                      | - All Anonymous permissions.<br>- Create/edit/delete own content (photos, albums, comments).<br>- Like photos, follow users, and manage account settings.<br>- Report content. |
| **Administrator**   | A trusted user with elevated privileges, managed via the `is_admin` flag.                                                                 | - All Registered User permissions.<br>- Access an Admin Dashboard.<br>- Review and resolve reports.<br>- Toggle `is_featured` status on images.<br>- Can delete any user's content. |

## 5. Functional Requirements

#### 5.1. Core Content & Gallery Features
*   `[F-01]` **Photo Upload**: Allows registered users to upload image files (`image_url`) with a `caption`.
*   `[F-02]` **Photo Tagging**: Allows users to add multiple text `tags` to photos upon creation. The system supports a `image_tags` many-to-many relationship.
*   `[F-03]` **Photo Albums**: Allows users to create named `albums` and associate photos with them. A single photo can exist in multiple albums (`image_albums` many-to-many relationship).
*   `[F-04]` **Main Gallery View**: The homepage displays photos in a Masonry Grid Layout, with server-side sorting by:
    *   **Most Recent**: `order_by(created_at.desc())`
    *   **Most Popular**: Based on `likes` count.
    *   **Featured**: Filter by `is_featured == True`.
*   `[F-05]` **Search**: Provides a global search bar to find:
    *   Users by `username`.
    *   Photos by `caption` text or associated `tags`.

#### 5.2. User Authentication & Profiles
*   `[F-06]` **Authentication**: Provides secure user registration (`/auth/register`) and login (`/auth/token`) using JWT-based sessions and hashed passwords (`pwd_context`).
*   `[F-07]` **User Profile Page**: A public profile for each user displaying their `username`, `bio`, `profile_picture_url`, and follower/following counts. Includes a tabbed interface for:
    *   `Photos`: A grid of the user's uploaded images.
    *   `Albums`: A list of the user's created albums.
    *   `Likes` (Optional): A grid of photos the user has liked.

#### 5.3. Social Interaction
*   `[F-08]` **Liking System**: Authenticated users can `like` and `unlike` photos. The total like count is public. Implemented via the `Like` model.
*   `[F-09]` **Commenting System**: Authenticated users can post text `comments` on photos. Implemented via the `Comment` model.
*   `[F-10]` **Follow System**: Authenticated users can `follow` and `unfollow` other users. Implemented via the `Follow` model.
*   `[F-11]` **Leaderboards**: A dedicated page displaying rankings for:
    *   **Most Followed Users**.
    *   **Most Liked Photos**.

#### 5.4. Account Management & Permissions
*   `[F-12]` **Settings Page**: A private, authenticated route where users can:
    *   Update their `bio` and `profile_picture_url`.
    *   Change their password.
    *   Manage content permissions (e.g., `allow_downloads`).
*   `[F-13]` **Photo Download**: A download button is present on photos. It is active based on the owner's `allow_downloads` setting. A `download` type `Notification` is triggered upon successful download.

#### 5.5. Administration & Moderation
*   `[F-14]` **Content Reporting**: Authenticated users can report inappropriate images or comments for administrative review. Implemented via the `Report` model.
*   `[F-15]` **Admin Dashboard**: An admin-only interface to view, filter, and manage reported content, with actions to change a report's `status` (pending, resolved, dismissed).
*   `[F-16]` **Feature Content**: An admin can toggle the `is_featured` boolean on any `Image` to promote it on the gallery's "Featured" sort view.

#### 5.6. Real-Time Features (WebSockets)
*   `[F-17]` **Real-Time Notifications**: New notifications (`like`, `comment`, `follow`) are pushed to the client in real time without requiring a page refresh. Implemented via the `Notification` model and a WebSocket connection.
*   `[F-18]` **Live Commenting**: New comments on a photo's detail page appear instantly for all currently active viewers of that page.

## 6. Non-Functional Requirements
*   `[NF-01]` **Performance**: The API must be fast and responsive. This includes using optimized images (handled by frontend/OSS), efficient database queries with indexing, and pagination for all list endpoints (`skip`, `limit`).
*   `[NF-02]` **Security**: Application must adhere to security best practices, including hashing passwords (`bcrypt`), validating all user input (Pydantic models), protecting routes (`get_current_user` dependency), and using secure environment variables for secrets (`JWT_SECRET_KEY`).
*   `[NF-03]` **Usability & Responsiveness**: The UI must be intuitive and provide a seamless experience on both desktop and mobile, leveraging Tailwind CSS's responsive design utilities.
*   `[NF-04]` **Scalability**: The chosen architecture (Vercel, FastAPI on ECS, Supabase, OSS) is designed to handle a growing number of users and photos with horizontal scaling capabilities.

## 7. Out of Scope (Future Considerations)
*   A personalized "Following" feed on the homepage.
*   Direct messaging between users.
*   Advanced backend image processing (e.g., automatic watermarking).
*   Video uploads.

##THIS IS A REAL APP