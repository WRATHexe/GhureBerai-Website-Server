# TourBuzz Server

**Live API:** [https://wrath-ghureberai-server.vercel.app/](https://wrath-ghureberai-server.vercel.app/)

---

## Overview

TourBuzz is a backend REST API for a tour booking platform, built with **Node.js**, **Express**, **MongoDB**, and **Firebase Authentication**.  
It powers features like tour package management, user bookings, and secure guide dashboards.

---

## Features

- **Tour Packages:**

  - List all available tours
  - Search by name or destination
  - Add, update, and delete packages (guide only)

- **Bookings:**

  - Book a tour (authenticated users)
  - View your bookings
  - Mark bookings as completed

- **Authentication:**

  - Secure endpoints with Firebase Auth
  - Role-based access for guides and users

- **MongoDB Integration:**
  - Stores packages and bookings
  - Efficient queries and updates

---

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Atlas)
- **Authentication:** Firebase Admin SDK
- **Deployment:** Vercel ([API link](https://wrath-ghureberai-server.vercel.app/))

---

## API Endpoints

| Method | Endpoint            | Description                   | Auth Required |
| ------ | ------------------- | ----------------------------- | ------------- |
| GET    | `/tourPackages`     | List/search all tour packages | No            |
| GET    | `/tourPackages/:id` | Get details of a tour package | No            |
| POST   | `/tourPackages`     | Add a new tour package        | Guide         |
| PUT    | `/tourPackages/:id` | Update a tour package         | Guide         |
| DELETE | `/tourPackages/:id` | Delete a tour package         | Guide         |
| GET    | `/my-tourPackages`  | List your own packages        | Guide         |
| GET    | `/bookings`         | List your bookings            | User          |
| POST   | `/bookings`         | Book a tour                   | User          |
| PATCH  | `/bookings/:id`     | Update booking status         | User          |

---

## Getting Started (Local Development)

1. **Clone the repo:**

   ```sh
   git clone https://github.com/your-username/your-repo.git
   cd your-repo
   ```

2. **Install dependencies:**

   ```sh
   npm install
   ```

3. **Set up environment variables:**

   - Create a `.env` file with your MongoDB credentials.

4. **Run the server:**
   ```sh
   node index.js
   ```

---

## Security

- **Secrets are not committed** to the repository.
- All sensitive keys are managed via environment variables.
- Firebase Admin credentials are kept out of version control.

---

## Contact

**Author:** Fardin Ruhian  
**Email:** fardinruhian001@gmail.com

---

> _Thank you for reviewing my project!_
