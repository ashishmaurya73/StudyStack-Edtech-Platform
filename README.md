# 📚 StudyStack Online Education Platform (MERN App)

🌐 **Website Link**  
🔗 [Live Demo - Frontend](https://studystack-edtech.vercel.app)  
🔗 [Backend API](https://studystack-backend.onrender.com)

---

## 📖 Project Description

StudyStack is a feature-rich online education platform that empowers users to **create**, **explore**, and **review** educational content. Built on the robust MERN stack (MongoDB, ExpressJS, ReactJS, and NodeJS), the platform is designed to:

- 🎓 Deliver an engaging and interactive learning experience for students worldwide.
- 👩‍🏫 Provide instructors with a space to share their expertise and connect with learners globally.

This README covers key technical details, including:

- System Architecture (high-level structure and diagrams)
- Front-end & Back-end Overview
- API Design with endpoints
- Deployment Strategy
- Testing Approach
- Future Enhancements

In essence, StudyStack is a **dynamic and user-friendly ed-tech solution** aimed at delivering high-quality learning and teaching experiences.

---

## 🛠️ System Architecture

The architecture of StudyStack follows a **client-server model**, with:

- **Frontend**: Acting as the client, communicating via RESTful API calls.
- **Backend & Database**: Serving data and handling authentication, course management, and payment logic.

---

## 🎨 Front-End

The front end of StudyStack is developed using **ReactJS**, enabling a **responsive** and **dynamic user interface**. It communicates with the backend via RESTful API calls.

### 💡 Student Features:
- **Homepage**: Introduction to the platform with links to courses and account details.
- **Course Catalog**: Browse all available courses with descriptions and ratings.
- **Wishlist & Cart**: Save courses for later or proceed to purchase.
- **Course Content Viewer**: Access enrolled courses with videos and supplementary materials.
- **Profile Management**: View and edit user details.

### 👩‍🏫 Instructor Features:
- **Instructor Dashboard**: Manage courses and track ratings/feedback.
- **Insights**: View analytics like student engagement and revenue.
- **Course Management Tools**: Create, update, and manage course content.

### 🔐 Admin (Future Scope):
- **Admin Dashboard**: Monitor platform-wide stats and manage users/courses.

### 🔑 Key Libraries/Tools:
- **ReactJS**, **Redux**: For building and managing complex UI states.
- **Tailwind CSS**: For responsive styling and design.

---

## 🔗 Back-End

The backend is implemented using **NodeJS** and **ExpressJS**, with **MongoDB** as the database.

### Features:
- **Authentication & Authorization**: Secure sign-up/login, OTP verification, and password recovery.
- **Course Management APIs**: For instructors to create/manage courses and for students to explore them.
- **Payment Integration**: Seamless checkout flow using **Razorpay**.
- **Media Management**: **Cloudinary** integration for storing images/videos.
- **Data Security**: Password hashing with **bcrypt** and JWT-based authentication.

### 🔑 Key Libraries/Tools:
- **ExpressJS**, **JWT**, **Mongoose**, **Bcrypt**, **Cloudinary**

### 🗄️ Data Models:
- **User (Student/Instructor)**: Stores account and course details.
- **Course**: Holds information like title, description, media links, and ratings.

---

## 📡 API Design

The StudyStack API adheres to **RESTful principles** and uses JSON for data exchange.

### 📖 API Endpoints

| Endpoint                        | Method | Description                                      |
|----------------------------------|--------|--------------------------------------------------|
| `/api/auth/signup`              | POST   | Create a new user account (student or instructor)|
| `/api/auth/login`               | POST   | Authenticate user and generate JWT token         |
| `/api/auth/verify-otp`          | POST   | Verify OTP for email confirmation                |
| `/api/auth/forgot-password`     | POST   | Send password reset link to email                |
| `/api/courses`                  | GET    | Fetch all available courses                      |
| `/api/courses/:id`              | GET    | Fetch a specific course by ID                    |
| `/api/courses`                  | POST   | Add a new course                                 |
| `/api/courses/:id`              | PUT    | Update an existing course                        |
| `/api/courses/:id`              | DELETE | Delete a course by ID                            |
| `/api/courses/:id/rate`         | POST   | Add a rating (1–5) to a course                   |

---

## 🚀 Deployment

- **Frontend**: Deployed on [Vercel](https://vercel.com) for fast and secure delivery with global CDN support.  
- **Backend API**: Hosted on [Render](https://render.com) with **HTTPS** enabled and **CORS** configured for cross-origin requests.

---

## ✅ Testing

- **Unit Testing & Integration Testing**: Ensures each component and API works as intended.  
- **Tools Used**:  
  - [Postman](https://www.postman.com/)  

---

## 🔮 Future Enhancements

- 🛡️ **Admin Panel**: Full-featured admin management tools.  
- 📊 **Advanced Analytics**: For instructors and admins.  
- 📱 **Mobile App Version**: To enhance accessibility and user experience on smartphones. 
 

