export type Bill = {
  id: string;
  filename: string;
  phone: string | null;
  name: string | null;
  orderId: string | null;
  status: string;
  createdAt: string;
  downloadUrl: string | null;
};

type GetBillResponse = {
  ok: boolean;
  message?: string;
  bill?: Bill;
};

function getBackendUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!baseUrl) {
    throw new Error("Missing NEXT_PUBLIC_BACKEND_URL environment variable");
  }
  return baseUrl.replace(/\/+$/, "");
}

function getMerchantKey(): string {
  const merchantKey = process.env.MERCHANT_KEY;
  if (!merchantKey) {
    throw new Error("Missing MERCHANT_KEY environment variable");
  }
  return merchantKey;
}

export async function fetchBillById(billId: string): Promise<Bill> {
  if (!billId?.trim()) {
    throw new Error("billId is required");
  }

  const url = `${getBackendUrl()}/bills/${encodeURIComponent(billId)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getMerchantKey()}`,
    },
    cache: "no-store",
  });

  const data = (await response.json()) as GetBillResponse;

  if (!response.ok || !data.ok || !data.bill) {
    throw new Error(data.message || "Failed to fetch bill");
  }

  return data.bill;
}
