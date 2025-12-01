import { useState, FormEvent } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

interface PaymentFormProps {
  leaseId: number;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PaymentForm({ leaseId, amount, onSuccess, onCancel }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Confirm the payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message || "An error occurred during payment");
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        // Confirm payment with our backend
        const response = await fetch(`/api/payments/lease/${leaseId}/confirm`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          setErrorMessage(errorData.message || "Failed to confirm payment");
          setIsProcessing(false);
          return;
        }

        // Success!
        onSuccess();
      }
    } catch (err) {
      setErrorMessage("An unexpected error occurred");
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Complete Your Payment</h2>
        <p className="text-gray-600 mb-6">
          Total Amount: <span className="font-bold text-xl">${amount.toFixed(2)}</span>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <PaymentElement />
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {errorMessage}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!stripe || isProcessing}
              className="flex-1 bg-[#3b82f6] text-white py-2 px-4 rounded-md hover:bg-[#2563eb] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? "Processing..." : `Pay $${amount.toFixed(2)}`}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
