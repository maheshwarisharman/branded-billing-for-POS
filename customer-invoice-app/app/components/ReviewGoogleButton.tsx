"use client";

import { useMemo, useState } from "react";

type ReviewGoogleButtonProps = {
  googleReviewUrl?: string;
  onSubmitLowRating?: (payload: { rating: number; review?: string }) => void;
};

const DEFAULT_GOOGLE_REVIEW_URL =
  "https://g.page/r/CUSTOMER_GOOGLE_REVIEW_LINK/review";

export default function ReviewGoogleButton({
  googleReviewUrl = DEFAULT_GOOGLE_REVIEW_URL,
  onSubmitLowRating,
}: ReviewGoogleButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const activeRating = useMemo(
    () => (hoveredRating > 0 ? hoveredRating : selectedRating),
    [hoveredRating, selectedRating],
  );

  const openModal = () => {
    setIsOpen(true);
    setSubmitted(false);
    setSelectedRating(0);
    setHoveredRating(0);
    setReviewText("");
  };

  const closeModal = () => {
    setIsOpen(false);
    setHoveredRating(0);
  };

  const handleStarClick = (rating: number) => {
    setSelectedRating(rating);

    if (rating >= 4) {
      // Immediate redirect for positive rating
      window.location.href = googleReviewUrl;
      return;
    }
  };

  const handleSubmitLowRating = () => {
    if (selectedRating === 0 || selectedRating > 3) return;

    const payload = {
      rating: selectedRating,
      review: reviewText.trim() ? reviewText.trim() : undefined,
    };

    if (onSubmitLowRating) {
      onSubmitLowRating(payload);
    } else {
      // Placeholder default behavior
      console.log("Low rating feedback submitted:", payload);
    }

    setSubmitted(true);
  };

  return (
    <>
      <button
        type="button"
        className="google-review-button"
        onClick={openModal}
      >
        <span className="google-review-g" aria-hidden="true">
          <span className="g-blue">G</span>
          <span className="g-red">o</span>
          <span className="g-yellow">o</span>
          <span className="g-blue">g</span>
          <span className="g-green">l</span>
          <span className="g-red">e</span>
        </span>
        <span className="google-review-text">Review us on Google</span>
      </button>

      {isOpen ? (
        <div
          className="review-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-modal-title"
        >
          <div className="review-modal-card">
            <div className="review-modal-header">
              <h3 id="review-modal-title" className="review-modal-title">
                Rate your experience
              </h3>
              <button
                type="button"
                aria-label="Close review modal"
                className="review-modal-close"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <p className="review-modal-subtitle">Tap a star to rate us</p>

            <div
              className="review-stars"
              onMouseLeave={() => setHoveredRating(0)}
              aria-label="5 star rating selector"
            >
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  className={`review-star ${activeRating >= rating ? "review-star--active" : ""}`}
                  aria-label={`${rating} star${rating > 1 ? "s" : ""}`}
                  onMouseEnter={() => setHoveredRating(rating)}
                  onClick={() => handleStarClick(rating)}
                >
                  ★
                </button>
              ))}
            </div>

            {selectedRating > 0 && selectedRating <= 3 ? (
              <div className="review-low-rating-wrap">
                <label htmlFor="review-textarea" className="review-text-label">
                  Tell us what went wrong (optional)
                </label>
                <textarea
                  id="review-textarea"
                  className="review-textarea"
                  rows={4}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your feedback..."
                />

                {!submitted ? (
                  <button
                    type="button"
                    className="button button-primary"
                    onClick={handleSubmitLowRating}
                    disabled={selectedRating === 0}
                  >
                    Submit
                  </button>
                ) : (
                  <p
                    className="alert alert-success"
                    style={{ margin: "0.75rem 0 0" }}
                  >
                    Thanks for your feedback.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
