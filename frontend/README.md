# 🍽️ ReLive: Food Surplus and Shelter Matching

**ReLive** is a community-driven **Food & Shelter Redistribution Platform** built using **TypeScript** and **Vite**.  
It bridges the gap between **donors**, **volunteers**, **shelters**, and **recipients**, ensuring surplus food and essential resources are efficiently distributed to those in need.

---

## 🌍 Project Overview

This platform provides a unified system to manage food donations, requests, and volunteer logistics.  
It allows donors to contribute resources, shelters to request aid, and volunteers to coordinate deliveries — all while maintaining transparency and real-time tracking.

The backend design is modeled on an **ER diagram** that defines entities like **Donor**, **Volunteer**, **Shelter**, **Recipient**, **Donation**, **Request**, **Match**, and **Audit**.

---

## 🧩 Core Features

### 👥 Donors
- Register and post food donations
- Track donation status and delivery progress
- View nearby shelters and active requests

### 🏠 Shelters
- Submit food or accommodation requests
- Track donation allocations and occupancy
- Manage registered recipients

### 🙌 Volunteers
- Browse active volunteer opportunities
- Get assigned to donation or delivery tasks
- View upcoming and past assignments

### 🍱 Recipients
- Receive aid through verified shelters
- Update basic information via shelter coordination

### 🧾 Auditing
- Track all donation and request activities
- Maintain system transparency via audit logs

---

## 🎨 UI & Design

**FoodShare Connect** follows a clean, modern interface that promotes simplicity, accessibility, and engagement.

**Color Palette**
- Primary: `#00C2A8` (Mint Green)
- Secondary: `#4B9CD3` (Soft Blue)
- Background: `#F8F9FA`
- Text: `#333333`

**Typography**
- Headers: *Poppins* or *Montserrat*
- Body: *Roboto* or *Open Sans*

**Visual Style**
- Rounded cards and buttons (`border-radius: 12px`)
- Soft shadows for depth
- Consistent padding and spacing
- Mobile-first responsive layout

---

## 🧠 Pages Overview

| Page | Description |
|------|--------------|
| **Home** | Overview of mission, statistics, and quick action buttons (*Donate Now*, *Volunteer*) |
| **Donate** | Form for posting new donations (food type, expiry, quantity, location) |
| **Requests** | List of current food or shelter requests with filters |
| **Volunteer** | Search and sign up for volunteer opportunities |
| **Shelters** | View registered shelters with occupancy and availability info |
| **Login / Register** | Role-based access for Donors, Volunteers, and Shelters |
| **Dashboard** | Personalized view showing donations, matches, and activities |

---

## 🧱 Tech Stack

| Layer | Technology |
|--------|-------------|
| **Frontend** | TypeScript + Vite |
| **Styling** | TailwindCSS |
| **Icons** | Lucide / Feather Icons |
| **UI Framework** | React (or similar component-based structure) |
| **Future Backend** | Flask / Node.js |
| **Database** | PostgreSQL / Oracle (as per ER model) |

---

## 🚀 Getting Started

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-username/foodshare-connect.git
cd foodshare-connect
```

### 2️⃣ Install Dependencies
```bash
npm install
```
### 3️⃣ Run the Development Server
```bash 
npm run dev
```

