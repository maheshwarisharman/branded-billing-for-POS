# Customer Invoice App

A simple Next.js app for customers to view invoice details and open/download the invoice PDF using a shared branded bill link.

This app is designed for the billing flow where:
1. Merchant generates a bill in POS.
2. Backend stores metadata + PDF.
3. Merchant shares a branded link with the customer.
4. Customer opens this app route with a `billId` and sees the invoice.

---

## Tech Stack

- Next.js (App Router)
- React
- TypeScript

---

## Project Location

`branded-billing-software/customer-invoice-app`

---

## Prerequisites

- Node.js 18+ (recommended: Node 20)
- npm / pnpm / yarn
- Running backend API with `GET /bills/:id` endpoint

---

## Environment Variables

Create a `.env.local` file in this directory using `.env.example` as reference:

- `NEXT_PUBLIC_BACKEND_URL`  
  Backend base URL (without trailing slash), for example: `http://localhost:3000`
- `MERCHANT_KEY`  
  Merchant auth key used as bearer token for the bill fetch request

Example:

```/dev/null/.env.local#L1-2
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
MERCHANT_KEY=your_merchant_key_here
```

---

## Install Dependencies

From `branded-billing-software/customer-invoice-app`:

```/dev/null/install.sh#L1-1
npm install
```

---

## Run in Development

```/dev/null/dev.sh#L1-1
npm run dev
```

Default port is `3001`.

---

## Build and Start

```/dev/null/build.sh#L1-2
npm run build
npm run start
```

---

## Route Usage

### Invoice page route

`/invoice/[billId]`

Example:

```/dev/null/url.txt#L1-1
http://localhost:3001/invoice/8d7d6f14-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

The page should:
- Read `billId` from route params
- Call backend `GET /bills/:id`
- Send header: `Authorization: Bearer <MERCHANT_KEY>`
- Render metadata (name, phone, orderId, status, createdAt, filename)
- Provide PDF actions (open/download) using `downloadUrl`

---

## Backend Contract Used

The app relies on the backend response shape from `GET /bills/:id`:

```/dev/null/backend-response.json#L1-16
{
  "ok": true,
  "bill": {
    "id": "string",
    "filename": "string",
    "phone": "string | null",
    "name": "string | null",
    "orderId": "string | null",
    "status": "string",
    "createdAt": "string",
    "downloadUrl": "string | null"
  }
}
```

---

## Notes

- `downloadUrl` is presigned and time-limited (currently 15 minutes in backend).
- Never expose merchant keys in client-side code for production-grade deployments.  
  For a production setup, prefer routing backend calls through a server component or API route that safely handles secrets.
- This app is intentionally simple and focused on customer invoice viewing flow.