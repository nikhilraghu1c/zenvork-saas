// This curated catalog is the Phase 1 source of truth for implemented Zenvork feature guidance.
const zenvorkFeatureCatalog = [
  {
    id: "account-access",
    title: "Account access",
    description: "Owner and staff sign-in, sign-out, and current account boundaries.",
    keywords: ["login", "log in", "sign in", "logout", "log out", "password", "account", "session"],
    content: `Account access:
- Only business owners and staff have Zenvork login accounts; clients do not log in.
- Sign in accepts the registered email address or 10-digit mobile number with a password.
- Signing out clears the authenticated browser session.
- Password reset, staff deactivation, role changes, and account removal are not available in the current product.`,
  },
  {
    id: "business-registration",
    title: "Business registration and business types",
    description: "Creating a business owner account and choosing a configured business type.",
    keywords: [
      "register",
      "registration",
      "sign up",
      "signup",
      "create business",
      "business type",
      "salon",
      "clinic",
    ],
    content: `Business registration and business types:
- Registration creates one business and its first owner account together.
- Choose an active business type from the registration form; its active resource types configure what the business can use, such as people, chairs, rooms, or equipment.
- Registration does not sign the new owner in automatically; use the Login page afterwards.
- Business editing, suspension, ownership transfer, and business deletion are not available in the current product.`,
  },
  {
    id: "dashboard",
    title: "Dashboard summary",
    description: "Business operational summary for today, week, or month.",
    keywords: [
      "dashboard",
      "summary",
      "overview",
      "booking health",
      "no-show rate",
      "top services",
      "top staff",
    ],
    content: `Dashboard summary:
- The Dashboard is available to signed-in owners and staff for today, week, or month.
- It shows scheduled-booking count, earned, collected, and outstanding revenue, booking-health counts, no-show rate, active staff count, top services, and top staff.
- Earned revenue uses completed bookings by actual end time. Collected and outstanding split that completed revenue by current manual payment status.
- Active staff count means enabled person resources; it is not an attendance count.
- This Assistant cannot view your current dashboard figures yet.`,
  },
  {
    id: "bookings",
    title: "Bookings and appointment lifecycle",
    description:
      "Creating, scheduling, checking in, and completing appointments.",
    keywords: [
      "booking",
      "bookings",
      "appointment",
      "appointments",
      "schedule",
      "scheduled",
      "pending",
      "check-in",
      "check in",
      "checked in",
      "reschedule",
      "cancel",
      "cancelled",
      "no show",
      "complete",
      "completion",
    ],
    content: `Bookings and appointment lifecycle:
- Create a booking from the Booking workspace.
- A booking can stay pending until you add a complete schedule.
- It becomes scheduled when staff provide a date, start time, and end time.
- A scheduled booking can be checked in only with active assigned resources.
- Checking in records the actual start time. Completing records the actual end time and requires at least one service.
- Pending or scheduled bookings can be checked in, cancelled, or marked no-show. A checked-in booking can be completed. Completed, cancelled, and no-show bookings cannot be changed further.
- You can change the client only while a booking is pending. You can change resources and schedule while it is pending or scheduled.`,
  },
  {
    id: "payments",
    title: "Booking payment status",
    description: "Manual paid or unpaid settlement status for completed bookings.",
    keywords: ["payment", "payments", "paid", "unpaid", "settled", "settlement", "paidat"],
    content: `Booking payment status:
- Owners and staff can mark a booking paid or unpaid only after it is completed.
- Mark it paid when its payment has been manually settled.
- Zenvork records when a booking is marked paid. Moving it back to unpaid clears that record.
- This is operational reporting only: it does not create invoices, process payments, calculate taxes, or support partial payments or refunds.`,
  },
  {
    id: "clients",
    title: "Clients",
    description:
      "The private client directory and booking-time client selection.",
    keywords: [
      "client",
      "clients",
      "customer",
      "customers",
      "contact",
      "contacts",
    ],
    content: `Clients:
- The Clients workspace contains clients for your business only.
- Staff can find clients by name, mobile number, or email.
- When creating a booking, staff can select an existing client or create a new client for the same business.`,
  },
  {
    id: "resources",
    title: "Resources",
    description:
      "Business resources, their configured types, and their optional staff links.",
    keywords: ["resource", "resources", "resource type", "assigned resource"],
    content: `Resources:
- Only owners can create resources.
- Owners and staff can list and inspect their business's resources.
- A resource can optionally be linked to the owner or an existing staff member.
- Each resource uses a resource type configured for that business.`,
  },
  {
    id: "services",
    title: "Service catalogue",
    description: "Owner-managed services, pricing, duration, and retirement behavior.",
    keywords: [
      "service",
      "services",
      "service catalogue",
      "service catalog",
      "duration",
      "price",
      "retire service",
      "deactivate service",
    ],
    content: `Service catalogue:
- Owners create and update services; owners and staff can view the service list and active booking options.
- A service has a name, optional description, non-negative price, duration, and active state.
- Service names are unique within one business.
- Deactivating a service retires it from new booking choices but does not change the service details already saved on existing bookings.
- There is no service delete action in the current product.`,
  },
  {
    id: "staff",
    title: "Staff management",
    description: "Owner-managed staff accounts within one business.",
    keywords: ["staff", "team", "employee", "employees", "member", "members"],
    content: `Staff management:
- Only an owner manages staff accounts.
- New accounts are created as staff users for the owner's business.
- A staff account belongs to one business only.`,
  },
  {
    id: "analytics",
    title: "Revenue Analytics",
    description:
      "Owner-only revenue reporting and its current Assistant limitation.",
    keywords: [
      "analytics",
      "revenue",
      "earnings",
      "income",
      "sales",
      "collection",
      "collections",
      "outstanding",
      "billed",
      "collected",
    ],
    content: `Revenue Analytics:
- Revenue Analytics is available only to owners.
- It shows billed, collected, outstanding, daily, and service-level revenue from completed bookings.
- This Assistant cannot view your actual revenue figures yet.`,
  },
  {
    id: "reminders",
    title: "Appointment reminders",
    description: "Manual reminder workflow for owners and staff.",
    keywords: ["reminder", "reminders", "whatsapp", "skip", "sent today"],
    content: `Appointment reminders:
- Owners and staff use the manual appointment-reminder workspace.
- It has To send, Upcoming, and Sent today views.
- WhatsApp opens a prefilled client message and Copy uses the browser clipboard; neither action alone records a reminder as sent.
- Staff can confirm sent, mark sent directly, or skip a reminder.`,
  },
  {
    id: "assistant",
    title: "AI Assistant conversations",
    description: "Private conversation management and retention.",
    keywords: [
      "assistant",
      "conversation",
      "conversations",
      "chat",
      "history",
      "rename",
      "delete",
    ],
    content: `AI Assistant conversations:
- Conversations are private to the signed-in user within their business.
- Users can create, rename, delete, and reopen their own conversations.
- Inactive conversations and their messages are deleted after seven days.`,
  },
];

export { zenvorkFeatureCatalog };
