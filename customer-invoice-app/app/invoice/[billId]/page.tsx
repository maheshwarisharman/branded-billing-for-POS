import Link from "next/link";
import { fetchBillById } from "@/lib/bills";

function formatDate(input: string): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusClass(status: string): string {
  const normalized = status.trim().toLowerCase();
  if (normalized === "paid") return "status-pill status-pill--paid";
  if (normalized === "failed") return "status-pill status-pill--failed";
  if (normalized === "cancelled") return "status-pill status-pill--cancelled";
  if (normalized === "received") return "status-pill status-pill--received";
  return "status-pill status-pill--default";
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
            <h1 className="invoice-title">Invoice #{bill.id}</h1>
            <p className="invoice-subtitle">
              Generated on {formatDate(bill.createdAt)}
            </p>
          </header>

          <section className="invoice-meta">
            <div className="meta-item">
              <p className="meta-label">Status</p>
              <p className="meta-value">
                <span className={statusClass(bill.status)}>{bill.status}</span>
              </p>
            </div>

            <div className="meta-item">
              <p className="meta-label">Order ID</p>
              <p className="meta-value">{bill.orderId || "—"}</p>
            </div>

            <div className="meta-item">
              <p className="meta-label">Customer Name</p>
              <p className="meta-value">{bill.name || "—"}</p>
            </div>

            <div className="meta-item">
              <p className="meta-label">Phone</p>
              <p className="meta-value">{bill.phone || "—"}</p>
            </div>

            <div className="meta-item">
              <p className="meta-label">File Name</p>
              <p className="meta-value">{bill.filename}</p>
            </div>

            <div className="meta-item">
              <p className="meta-label">Bill ID</p>
              <p className="meta-value">{bill.id}</p>
            </div>
          </section>

          <section className="invoice-actions">
            {bill.downloadUrl ? (
              <>
                <a
                  href={bill.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="button button-primary"
                >
                  Open PDF
                </a>
                <a
                  href={bill.downloadUrl}
                  download
                  className="button button-outline"
                >
                  Download PDF
                </a>
              </>
            ) : (
              <button className="button button-danger" disabled>
                PDF unavailable
              </button>
            )}

            <Link href="/" className="button button-outline">
              Back
            </Link>
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
