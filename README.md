# bitsbarter 🪙

A modern, Bitcoin-native local classifieds platform built with Next.js, TypeScript, and Tailwind CSS. bitsbarter enables users to buy, sell, and trade goods and services using Bitcoin (sats/BTC) with built-in chat and Lightning escrow functionality.

## ✨ Features

- **Bitcoin-First**: All prices displayed in sats and BTC with real-time CAD conversion
- **Local Classifieds**: Location-based search with radius filtering
- **Built-in Chat**: In-app messaging system for buyer-seller communication
- **Lightning Escrow**: Secure payment escrow using Lightning Network hold invoices
- **Dark/Light Theme**: Toggle between dark and light modes
- **Responsive Design**: Mobile-first design that works on all devices
- **Saved Searches**: Save and manage search filters with notifications
- **Boost Listings**: Promote listings for increased visibility
- **Safety Features**: Built-in safety tips and terms of service

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL database (for production)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/bitboard.git
   cd bitboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/bitboard"
   COINGECKO_URL="https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=cad"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run prisma:generate
   
   # Run database migrations
   npm run prisma:migrate
   
   # Seed the database (optional)
   npm run seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js 13+ app directory
│   ├── api/               # API routes
│   │   ├── chat/          # Chat API endpoints
│   │   ├── escrow/        # Escrow API endpoints
│   │   ├── listings/      # Listings API endpoints
│   │   └── rate/          # Bitcoin price API
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Main page component
├── components/             # Reusable React components
│   ├── Nav.tsx            # Navigation component
│   ├── ListingCard.tsx    # Listing card component
│   ├── ChatModal.tsx      # Chat modal component
│   └── ...                # Other components
├── lib/                    # Utility libraries
│   ├── db.ts              # Database connection
│   ├── escrow.ts          # Escrow logic
│   ├── types.ts           # TypeScript type definitions
│   └── utils.ts           # Utility functions
└── styles/                 # Global styles
    └── globals.css        # Global CSS and Tailwind imports
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, CSS Modules
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (planned)
- **Bitcoin**: Lightning Network integration (planned)
- **Deployment**: Vercel, Railway, or self-hosted

## 📱 API Endpoints

### Listings
- `GET /api/listings` - Get all listings
- `POST /api/listings` - Create a new listing

### Bitcoin Price
- `GET /api/rate` - Get current BTC/CAD exchange rate

### Chat (Planned)
- `GET /api/chat/list` - Get chat conversations
- `POST /api/chat/send` - Send a message

### Escrow (Planned)
- `POST /api/escrow/propose` - Propose an escrow transaction

## 🎨 Customization

### Themes
The app supports both dark and light themes. Theme switching is handled by `next-themes` and can be customized in the `Nav` component.

### Colors
Custom color schemes can be modified in `tailwind.config.ts` and `src/styles/globals.css`.

### Components
All components are built with TypeScript and can be easily customized or extended.

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Self-Hosted
1. Build the application: `npm run build`
2. Start the production server: `npm start`
3. Set up reverse proxy (nginx/Apache) if needed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/bitboard/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/bitboard/discussions)
- **Documentation**: [Wiki](https://github.com/yourusername/bitboard/wiki)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Prisma](https://www.prisma.io/) - Database toolkit
- [Bitcoin](https://bitcoin.org/) - Digital currency
- [Lightning Network](https://lightning.network/) - Bitcoin scaling solution

---

**Built with ❤️ and ⚡ by the bitsbarter team**
