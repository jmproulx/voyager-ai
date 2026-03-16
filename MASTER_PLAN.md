# Voyager AI — Master Plan

> **AI-Powered Business Travel Platform**
> Competing with BizTrip.AI — conversation-first corporate travel management

---

## 1. Product Vision

Voyager AI replaces the traditional search-bar-driven corporate travel booking experience with an **AI conversational agent** that understands travel policies, traveler preferences, and real-time market conditions. Travelers describe what they need in natural language; the AI handles the rest.

### Core Differentiators
- **Conversation-first UX** — no search bars, no manual filtering. Ask for what you need.
- **Multi-agent architecture** — specialized AI agents for booking, expenses, policy, and alerts
- **Real API integrations** — real flights, real hotels, real prices. NO mock data anywhere.
- **Policy-aware by default** — every recommendation respects corporate travel rules
- **Proactive intelligence** — calendar scanning, price monitoring, disruption alerts

### Target Users
- Business travelers (frequent flyers, road warriors)
- Travel managers / admins
- Finance teams (expense oversight)
- Corporate travel management companies (TMCs)

---

## 2. Competitive Intelligence Summary

### BizTrip.AI (Primary Competitor)
- **Founded:** 2024, San Francisco
- **Team:** Tom Romary (CEO, ex-Yapta founder), Scott Persinger (CTO, ex-Stripe), Andrew Ng (Co-founder, AI Fund)
- **Funding:** $2.5M pre-seed (AI Fund, RRE Ventures, Sabre Corporation)
- **Status:** Enterprise pilots (Moderna, Cain Travel), GA target Q2 2026
- **Key tech:** Proprietary Travel LLM, multi-agent architecture, Sabre GDS partnership
- **Stack:** Next.js (confirmed from app.biztrip.ai)

### Their Key Features
1. Conversational booking (natural language → curated policy-compliant options)
2. Continuous price tracking & automatic re-shopping post-booking
3. Corporate travel policy automation
4. Real-time itinerary change management
5. Calendar scanning for proactive trip suggestions
6. Cerebri AI data integration (historical T&E data)

### Their Weaknesses We Can Exploit
1. Pre-revenue, <10 employees — we can move faster on features
2. Heavy Sabre dependency — we integrate multiple GDS/NDC sources
3. No public product yet — we ship first
4. Narrow enterprise focus — we can also serve SMBs
5. No expense management depth — we build it natively

### Market Context
- $1.5T global business travel market
- AI-in-travel growing at 34.1% CAGR
- Only 2% of travelers trust full AI autonomy → **"AI proposes, human confirms"** pattern is critical
- Key competitors: Navan ($9.2B, IPO'd), SAP Concur (legacy), TravelPerk/Perk, Spotnana

---

## 3. Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | **Next.js 15** (App Router) | Full-stack TypeScript, SSR, API routes, same as BizTrip |
| Language | **TypeScript** | End-to-end type safety |
| Database | **PostgreSQL** + **Prisma ORM** | Reliable, scalable, great DX |
| Auth | **Auth.js v5** (NextAuth) | Industry standard, supports OAuth + credentials |
| UI | **Tailwind CSS** + **shadcn/ui** | Rapid, beautiful, accessible components |
| AI Engine | **Claude API** (Anthropic SDK) | Tool calling, streaming, vision for OCR |
| Client State | **Zustand** | Lightweight, no boilerplate |
| Flights API | **Amadeus Self-Service** + **Duffel** | Amadeus for breadth, Duffel for best DX + NDC |
| Hotels API | **Amadeus Hotel Search** | Same integration, hotel inventory |
| Flight Status | **FlightAware AeroAPI** | Real-time tracking, delay predictions |
| Carbon | **Climatiq API** | CO2 estimates per flight/hotel |
| Calendar | **Google Calendar API** | Most common corporate calendar |
| Receipt OCR | **Claude Vision** (multimodal) | No extra API — use Claude to read receipts |
| Email | **Resend** | Transactional emails (confirmations, alerts) |
| Deployment | **Vercel** | Zero-config Next.js hosting |

---

## 4. Database Schema (Core Entities)

```
Organization {
  id, name, domain, logo
  travelPolicy -> TravelPolicy
  users -> User[]
}

User {
  id, email, name, role (TRAVELER | MANAGER | ADMIN)
  organizationId -> Organization
  preferences (JSON: seat, airline, hotel chain, meal, loyalty programs)
  trips -> Trip[]
  expenses -> Expense[]
}

Trip {
  id, name, status (PLANNING | BOOKED | ACTIVE | COMPLETED | CANCELLED)
  userId -> User
  startDate, endDate, destination
  bookings -> Booking[]
  expenses -> Expense[]
  itinerary -> ItineraryItem[]
}

Booking {
  id, type (FLIGHT | HOTEL | CAR_RENTAL)
  tripId -> Trip
  status (PENDING | CONFIRMED | CANCELLED | CHANGED)
  provider (AMADEUS | DUFFEL)
  providerBookingId
  details (JSON: flight number, airline, departure, arrival, hotel name, etc.)
  price, currency
  policyCompliant (boolean)
  policyViolationReason (string?)
  carbonKg (float)
}

Expense {
  id, tripId -> Trip, userId -> User
  category (FLIGHT | HOTEL | MEAL | TRANSPORT | OTHER)
  amount, currency
  receiptUrl, receiptOcrData (JSON)
  status (PENDING | APPROVED | REJECTED)
  merchantName, date, description
  approvedBy -> User?
}

TravelPolicy {
  id, organizationId -> Organization
  rules (JSON array of policy rules)
  maxFlightPrice, maxHotelPrice
  preferredAirlines[], preferredHotelChains[]
  requireApprovalAbove (threshold amount)
  advanceBookingDays (minimum)
  allowBusinessClass (boolean)
  internationalRequiresApproval (boolean)
}

Conversation {
  id, userId -> User
  messages -> Message[]
  tripId -> Trip? (linked trip if any)
  createdAt, updatedAt
}

Message {
  id, conversationId -> Conversation
  role (USER | ASSISTANT | TOOL)
  content (text)
  toolCalls (JSON?)
  toolResults (JSON?)
  createdAt
}

FlightAlert {
  id, bookingId -> Booking
  type (PRICE_DROP | DELAY | CANCELLATION | GATE_CHANGE)
  details (JSON)
  acknowledged (boolean)
  createdAt
}

ApprovalRequest {
  id, bookingId -> Booking
  requesterId -> User
  approverId -> User
  status (PENDING | APPROVED | REJECTED)
  reason, responseNote
  createdAt, respondedAt
}
```

---

## 5. Development Phases

### Phase 0: Foundation (Task #2 — MUST complete before feature teams)
**Owner:** Foundation Team (or main orchestrator)

- [x] Initialize Git repo
- [ ] Create Next.js 15 project with TypeScript
- [ ] Configure Prisma with PostgreSQL schema (all entities above)
- [ ] Set up Auth.js v5 with credentials + Google OAuth
- [ ] Install and configure Tailwind CSS + shadcn/ui
- [ ] Create base layout: sidebar + top nav + main content area
- [ ] Create shared TypeScript types matching Prisma schema
- [ ] Set up API route structure (`/api/trips`, `/api/bookings`, etc.)
- [ ] Configure environment variables template (.env.example)
- [ ] Set up Zustand stores (auth, ui, chat)
- [ ] Create CLAUDE.md with project conventions
- [ ] Push to GitHub, create `main` branch

### Phase 1: Feature Development (4 Parallel Teams in Worktrees)

#### Team 1: AI Conversational Agent + Chat UI
**Branch:** `feature/ai-agent`
**Files:** `src/app/(dashboard)/chat/`, `src/lib/ai/`, `src/components/chat/`

Deliverables:
1. **Claude API integration** with Anthropic SDK
   - Streaming responses via AI SDK or direct SSE
   - System prompt with travel domain knowledge
   - Conversation context management
2. **Tool calling system** — Claude calls tools to take actions:
   - `searchFlights(from, to, date, passengers, class)` → calls Amadeus/Duffel
   - `searchHotels(location, checkin, checkout, guests)` → calls Amadeus
   - `createTrip(name, destination, dates)` → creates Trip in DB
   - `addBookingToTrip(tripId, bookingDetails)` → saves booking
   - `getItinerary(tripId)` → fetches full itinerary
   - `checkPolicy(bookingDetails)` → validates against org policy
   - `getFlightStatus(flightNumber, date)` → calls FlightAware
   - `calculateCarbon(bookingId)` → calls Climatiq
3. **Chat UI**
   - Full-height chat panel (left side or full page)
   - Streaming message display with markdown rendering
   - Rich cards for flight/hotel results (inline in chat)
   - "Confirm booking" buttons within chat flow
   - Conversation history sidebar
   - New conversation / continue conversation
4. **Conversation persistence** — save to DB, reload on page visit

#### Team 2: Travel Search & Booking Engine
**Branch:** `feature/travel-booking`
**Files:** `src/lib/travel/`, `src/app/api/travel/`, `src/components/travel/`

Deliverables:
1. **Amadeus Self-Service API integration**
   - Flight search (one-way, round-trip, multi-city)
   - Flight offers price (confirm pricing)
   - Hotel search by city/coordinates
   - Hotel offers (availability + pricing)
   - Authentication (OAuth2 client credentials)
   - Rate limiting and error handling
2. **Duffel API integration**
   - Flight search with NDC content
   - Offer requests and pricing
   - Booking creation
   - Order management
3. **Search Results UI** (standalone pages, also used by AI agent)
   - Flight results cards (airline, times, stops, price, CO2)
   - Hotel results cards (name, rating, amenities, price, photos)
   - Filters (price range, stops, airline, times, rating)
   - Sort (price, duration, departure time, rating)
   - Price comparison badge (Amadeus vs Duffel)
4. **Booking Flow**
   - Select offer → Review details → Passenger info → Confirm
   - Save booking to DB with provider reference
   - Confirmation page with booking details
5. **Price utilities**
   - Currency formatting
   - Price comparison logic
   - Carbon calculation per booking

#### Team 3: Trip Management, Calendar & Alerts
**Branch:** `feature/trip-management`
**Files:** `src/app/(dashboard)/trips/`, `src/lib/calendar/`, `src/lib/alerts/`, `src/components/trips/`

Deliverables:
1. **Trip CRUD**
   - Create trip (manual or from AI chat)
   - Trip list view (upcoming, active, past)
   - Trip detail page with full itinerary
   - Edit trip details, cancel trip
2. **Itinerary Builder/Viewer**
   - Timeline view of all bookings + events
   - Day-by-day breakdown
   - Map view with route (optional, stretch)
   - Add custom events (meetings, dinners, etc.)
3. **Google Calendar Integration**
   - OAuth2 flow for Google Calendar
   - Read upcoming events to detect travel needs
   - Write trip events back to calendar
   - "You have a meeting in NYC on March 25th — want me to book travel?" proactive suggestions
4. **FlightAware Integration**
   - Real-time flight status tracking
   - Delay/cancellation detection
   - Gate change alerts
   - Background polling for active flights
5. **Alert System**
   - In-app notification center
   - Flight disruption alerts
   - Toast notifications for real-time updates
   - Alert history

#### Team 4: Expenses, Policy Engine & Analytics
**Branch:** `feature/expenses-policy`
**Files:** `src/app/(dashboard)/expenses/`, `src/app/(dashboard)/analytics/`, `src/lib/policy/`, `src/lib/expenses/`

Deliverables:
1. **Expense Management**
   - Add expense manually (amount, category, merchant, date)
   - Receipt photo upload
   - **Claude Vision OCR** — extract merchant, amount, date, items from receipt image
   - Auto-categorize expenses
   - Link expenses to trips
   - Expense list with filters (trip, category, status, date range)
2. **Corporate Travel Policy Engine**
   - Policy rule definitions (JSON-based)
   - Real-time policy checking on bookings
   - Policy violation warnings with explanations
   - Budget tracking per trip / per traveler / per org
   - Preferred vendor enforcement
3. **Approval Workflows**
   - Request approval for out-of-policy bookings
   - Manager approval/rejection UI
   - Approval history and audit trail
   - Email notifications for pending approvals
4. **Analytics Dashboard**
   - Total spend over time (line chart)
   - Spend by category (pie chart)
   - Top destinations (bar chart)
   - Policy compliance rate
   - Average booking lead time
   - Carbon footprint summary (Climatiq integration)
   - Per-traveler spending breakdown
5. **Expense Reports**
   - Generate PDF expense report per trip
   - Export to CSV

### Phase 2: Integration & Polish (Task #7)
- Merge all 4 feature branches to main
- Resolve merge conflicts
- End-to-end flow testing: Chat → Search → Book → Trip → Expense
- UI consistency pass
- Error handling audit
- Loading states and skeleton screens
- Mobile responsiveness check
- Seed data for demo (real API responses cached for demo mode)

---

## 6. API Keys Required

| Service | Environment Variable | Signup URL | Free Tier |
|---------|---------------------|------------|-----------|
| Anthropic (Claude) | `ANTHROPIC_API_KEY` | console.anthropic.com | Pay-as-you-go |
| Amadeus | `AMADEUS_API_KEY`, `AMADEUS_API_SECRET` | developers.amadeus.com | Test: free, Prod: paid |
| Duffel | `DUFFEL_ACCESS_TOKEN` | duffel.com | Test mode: free |
| FlightAware | `FLIGHTAWARE_API_KEY` | flightaware.com/aeroapi | Free tier: 100 calls/mo |
| Climatiq | `CLIMATIQ_API_KEY` | climatiq.io | Free tier available |
| Google Calendar | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | console.cloud.google.com | Free |
| Resend | `RESEND_API_KEY` | resend.com | Free: 100 emails/day |
| Database | `DATABASE_URL` | — | Local PostgreSQL |

**IMPORTANT:** All teams should use test/sandbox modes for Amadeus and Duffel during development. These provide realistic data without real charges.

---

## 7. Project Structure

```
voyager-ai/
├── MASTER_PLAN.md              # This file
├── CLAUDE.md                   # Project conventions for Claude Code
├── .env.example                # Environment variable template
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Seed data
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Landing / login redirect
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx      # Dashboard shell (sidebar + nav)
│   │   │   ├── chat/
│   │   │   │   └── page.tsx    # AI Chat interface (Team 1)
│   │   │   ├── trips/
│   │   │   │   ├── page.tsx    # Trip list (Team 3)
│   │   │   │   └── [id]/page.tsx  # Trip detail (Team 3)
│   │   │   ├── search/
│   │   │   │   ├── flights/page.tsx  # Flight search (Team 2)
│   │   │   │   └── hotels/page.tsx   # Hotel search (Team 2)
│   │   │   ├── expenses/
│   │   │   │   └── page.tsx    # Expense management (Team 4)
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx    # Analytics dashboard (Team 4)
│   │   │   ├── approvals/
│   │   │   │   └── page.tsx    # Approval queue (Team 4)
│   │   │   └── settings/
│   │   │       └── page.tsx    # User/org settings
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── chat/route.ts           # AI chat endpoint (Team 1)
│   │       ├── travel/
│   │       │   ├── flights/route.ts    # Flight search (Team 2)
│   │       │   ├── hotels/route.ts     # Hotel search (Team 2)
│   │       │   └── book/route.ts       # Booking creation (Team 2)
│   │       ├── trips/route.ts          # Trip CRUD (Team 3)
│   │       ├── calendar/route.ts       # Calendar sync (Team 3)
│   │       ├── alerts/route.ts         # Flight alerts (Team 3)
│   │       ├── expenses/route.ts       # Expense CRUD (Team 4)
│   │       ├── expenses/ocr/route.ts   # Receipt OCR (Team 4)
│   │       ├── policy/route.ts         # Policy check (Team 4)
│   │       └── analytics/route.ts      # Analytics data (Team 4)
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopNav.tsx
│   │   │   └── DashboardShell.tsx
│   │   ├── chat/               # Team 1 components
│   │   ├── travel/             # Team 2 components
│   │   ├── trips/              # Team 3 components
│   │   └── expenses/           # Team 4 components
│   ├── lib/
│   │   ├── ai/                 # Claude API, tools, prompts (Team 1)
│   │   ├── travel/             # Amadeus, Duffel clients (Team 2)
│   │   ├── calendar/           # Google Calendar client (Team 3)
│   │   ├── alerts/             # FlightAware, notification logic (Team 3)
│   │   ├── expenses/           # OCR, categorization (Team 4)
│   │   ├── policy/             # Policy engine (Team 4)
│   │   ├── prisma.ts           # Prisma client singleton
│   │   ├── auth.ts             # Auth.js config
│   │   └── utils.ts            # Shared utilities
│   ├── stores/                 # Zustand stores
│   │   ├── chat-store.ts
│   │   ├── trip-store.ts
│   │   └── ui-store.ts
│   └── types/                  # Shared TypeScript types
│       ├── travel.ts
│       ├── trip.ts
│       ├── expense.ts
│       └── policy.ts
└── public/
    └── images/
```

---

## 8. Team Coordination Rules

1. **Each team works in its own worktree** on a dedicated feature branch
2. **Teams must only modify files in their designated directories** (see structure above)
3. **Shared files** (`prisma/schema.prisma`, `src/lib/prisma.ts`, `src/lib/auth.ts`, `src/types/`) are set up by Foundation and should NOT be modified by feature teams unless absolutely necessary
4. **No mock data** — every API integration must use real sandbox/test APIs
5. **Each team creates a PR** when done — PRs are reviewed before merge
6. **Integration order:** Team 2 (booking) and Team 4 (expenses/policy) first, then Team 3 (trips — depends on bookings), then Team 1 (AI agent — depends on all tools being available)

---

## 9. AI Agent System Prompt (Team 1 Reference)

The AI agent should be prompted as a corporate travel assistant with these capabilities:
- Natural language trip planning
- Flight and hotel search (via tool calls)
- Booking creation with policy compliance checking
- Itinerary management
- Expense tracking assistance
- Proactive suggestions based on calendar

Key behavior: **"AI proposes, human confirms"** — never auto-book without explicit confirmation. Present options, explain tradeoffs, and wait for user approval.

---

## 10. Success Criteria for MVP

- [ ] User can sign up, log in, and set up their organization
- [ ] User can chat with AI to search flights and hotels with real API results
- [ ] User can book a flight or hotel through the chat or search UI
- [ ] Bookings are saved and appear in trip itineraries
- [ ] User can upload a receipt and have it auto-parsed via Claude Vision
- [ ] Corporate travel policy rules are checked on every booking
- [ ] Out-of-policy bookings trigger approval requests
- [ ] Trip timeline shows all bookings and events
- [ ] Analytics dashboard shows real spending data
- [ ] Flight status alerts work for booked flights
- [ ] Google Calendar integration detects upcoming travel needs
- [ ] Carbon footprint is calculated for bookings
- [ ] Everything uses REAL data from APIs (no mocks, no hardcoded data)
