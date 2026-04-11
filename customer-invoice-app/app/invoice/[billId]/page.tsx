import Link from "next/link";
import { fetchBillById } from "@/lib/bills";
import ReviewGoogleButton from "@/app/components/ReviewGoogleButton";

function formatDate(input: string): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function InvoicePage({
  params,
}: {
  params: { billId: string };
}) {
  let bill: {
    id: string;
    filename: string;
    phone: string | null;
    name: string | null;
    orderId: string | null;
    status: string;
    createdAt: string;
    downloadUrl: string | null;
  } | null = null;
  let errorMessage: string | null = null;

  try {
    bill = await fetchBillById(params.billId);
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "Unable to fetch invoice right now. Please try again shortly.";
  }

  if (!bill) {
    return (
      <main>
        <div className="page-shell">
          <section className="card">
            <div className="invoice-header">
              <h1 className="invoice-title">Invoice not available</h1>
              <p className="invoice-subtitle">
                We could not load this invoice at the moment.
              </p>
            </div>
            <p className="alert alert-error">
              {errorMessage ?? "Invoice was not found or is inaccessible."}
            </p>
            <div className="invoice-actions">
              <Link href="/" className="button button-outline">
                Back to home
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="page-shell">
        <section className="card">
          <header className="invoice-header">
            <div className="invoice-logo-wrap">
              <img
                src="https://homebakersmart.co.in/cdn/shop/files/MPPVV_DWI9HWHZweALK.jpg?v=1687093916&width=140"
                alt="Brand logo"
                width={140}
                height={140}
                className="invoice-logo"
              />
            </div>

            <div className="invoice-subtitle-row">
              <p className="invoice-subtitle">
                Generated on {formatDate(bill.createdAt)}
              </p>
              <div className="review-reward-text">
                <p>Share your google review screenshot with us on whatsapp to get <b>Rs. 100 cashback</b></p>
              </div>
              <ReviewGoogleButton />
            </div>
          </header>

          <section className="invoice-actions invoice-actions--single">
            {bill.downloadUrl ? (
              <a
                href={bill.downloadUrl}
                download
                className="button button-primary button-full"
              >
                Download Invoice PDF
              </a>
            ) : (
              <button className="button button-danger button-full" disabled>
                PDF unavailable
              </button>
            )}
          </section>

          {bill.downloadUrl ? (
            <section className="viewer-wrap">
              <iframe
                title={`Invoice ${bill.id}`}
                src={bill.downloadUrl}
                className="viewer-frame"
              />
              
            </section>
          ) : (
            <p className="alert alert-error">
              PDF preview is currently unavailable. Please try again in a
              moment.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
