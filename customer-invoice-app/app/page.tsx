import Link from "next/link";

export default function HomePage() {
  return (
    <main className="home-page">
      <div className="home-container">
        <header className="home-header">
          <p className="home-badge">Customer Invoice Portal</p>
          <h1 className="home-title">View your invoice instantly</h1>
          <p className="home-description">
            Open your invoice using the secure bill link shared by the merchant.
          </p>
        </header>

        <section className="home-card">
          <h2 className="home-card-title">Invoice URL format</h2>
          <p className="home-card-description">
            Replace <code className="home-code-inline">{"{billId}"}</code> with
            your actual bill ID:
          </p>
          <div className="home-code-block">/invoice/{"{billId}"}</div>

          <div className="home-actions">
            <Link href="/invoice/demo-bill-id" className="home-button">
              Open sample invoice route
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
