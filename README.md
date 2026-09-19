# Chatty - Real-Time Chat Application Frontend

A modern, responsive chat application frontend built with Next.js 15, TypeScript, and Tailwind CSS. This is the frontend client for the Chatty application that connects to a .NET backend API.

## 🚀 Features

- **User Authentication** - Secure sign in and sign up with JWT token management
- **Real-Time Messaging** - Interactive chat interface with message status indicators (sent, delivered, seen)
- **Dark Mode Support** - Beautiful dark/light theme toggle
- **Responsive Design** - Fully responsive layout that works on all devices
- **File Attachments** - Support for sending images, videos, documents, and camera captures
- **User Profile** - User profile management and settings
- **Modern UI/UX** - Clean and intuitive interface built with modern design principles
- **State Management** - Redux Toolkit for efficient state management
- **Type Safety** - Full TypeScript support for better development experience

## 🛠️ Tech Stack

- **Framework**: [Next.js 15.2.3](https://nextjs.org/) (App Router)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4.0](https://tailwindcss.com/)
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **UI Components**: [lebify-ui](https://www.npmjs.com/package/lebify-ui)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Notifications**: [React Hot Toast](https://react-hot-toast.com/)
- **Charts**: [ApexCharts](https://apexcharts.com/)
- **Calendar**: [FullCalendar](https://fullcalendar.io/)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (version 18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/) or [pnpm](https://pnpm.io/)
- The [Chatty Backend API](https://github.com/omaroueidat/ChattyApp) running and accessible

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd Chatty
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
   ```
   
   Replace `http://localhost:5000/api` with your backend API URL.

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 🏗️ Project Structure

```
Chatty/
├── public/                 # Static assets (images, icons, logos)
│   └── images/
│       ├── brand/         # Brand icons
│       ├── country/       # Country flags
│       ├── error/         # Error page illustrations
│       ├── icons/         # File type icons
│       ├── logo/          # Application logos
│       └── user/          # User avatars
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── auth/          # Authentication pages (signin, signup)
│   │   ├── chat/          # Chat interface
│   │   └── profile/       # User profile page
│   ├── components/        # React components
│   │   ├── auth/          # Authentication components
│   │   ├── common/        # Shared components (ChatWindow, etc.)
│   │   ├── form/          # Form components
│   │   ├── header/        # Header components
│   │   ├── providers/     # Context providers
│   │   └── ui/            # UI components
│   ├── context/           # React Context providers
│   ├── hooks/             # Custom React hooks
│   ├── icons/             # SVG icons
│   ├── layout/            # Layout components (Header, Sidebar)
│   ├── lib/               # Utility libraries
│   │   └── api/           # API client and endpoints
│   ├── store/             # Redux store configuration
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── next.config.ts         # Next.js configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Project dependencies
```

## 🔌 Backend Integration

This frontend connects to the Chatty backend API. Make sure you have the backend running:

- **Backend Repository**: [https://github.com/omaroueidat/ChattyApp](https://github.com/omaroueidat/ChattyApp)
- **Backend Developer**: [@omaroueidat](https://github.com/omaroueidat)

The frontend communicates with the backend through RESTful API endpoints. Configure the `NEXT_PUBLIC_API_BASE_URL` environment variable to point to your backend server.

## 📱 Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check code quality

## 🎨 Key Features in Detail

### Authentication
- Secure JWT-based authentication
- Token storage and management
- Protected routes with automatic redirects
- User session persistence

### Chat Interface
- Real-time message display
- Message status indicators (sent, delivered, seen)
- File attachment support
- Typing indicators
- User presence status
- Search functionality
- Chat management (clear, delete)

### User Experience
- Responsive sidebar with collapsible navigation
- Dark/light theme toggle
- Smooth animations and transitions
- Loading states and error handling
- Toast notifications for user feedback

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary.

## 👥 Credits

- **Backend Developer**: [@omaroueidat](https://github.com/omaroueidat)
- **Backend Repository**: [ChattyApp](https://github.com/omaroueidat/ChattyApp)

## 📞 Support

If you encounter any issues or have questions, please open an issue in the repository.

---

Built with ❤️ using Next.js and TypeScript
