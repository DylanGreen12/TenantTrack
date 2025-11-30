import React, { useState, useEffect } from "react";
import axios from "axios";
import { UserDto } from "../../models/UserDto";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface TenantDto {
  id: number;
  unitNumber: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface LeaseDto {
  id: number;
  status: string;
  rent: number;
}

interface MakePaymentProps {
  currentUser?: UserDto;
}

function PaymentForm({ lease, tenant }: { lease: LeaseDto; tenant: TenantDto }) {
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();

  const [amount, setAmount] = useState<string>(lease.rent.toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [clientSecret, setClientSecret] = useState("");

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const createPaymentIntent = async () => {
    try {
      setError("");
      const amountNum = parseFloat(amount);

      if (isNaN(amountNum) || amountNum <= 0) {
        setError("Please enter a valid amount");
        return;
      }

      const response = await axios.post("/api/payments/rent/create-intent", {
        amount: amountNum
      });

      setClientSecret(response.data.clientSecret);

      return response.data.clientSecret;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to initialize payment";
      setError(errorMsg);
      console.error("Error creating payment intent:", err);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError("Stripe has not loaded yet. Please try again.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      // Create payment intent if not already created
      let secret = clientSecret;
      if (!secret) {
        secret = await createPaymentIntent();
        if (!secret) {
          setLoading(false);
          return;
        }
      }

      // Get card element
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setError("Card information is missing");
        setLoading(false);
        return;
      }

      // Confirm card payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${tenant.firstName} ${tenant.lastName}`,
            email: tenant.email
          }
        }
      });

      if (stripeError) {
        setError(stripeError.message || "Payment failed");
        setLoading(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        // Confirm payment with backend
        await axios.post("/api/payments/rent/confirm", {
          paymentIntentId: paymentIntent.id,
          amount: parseFloat(amount)
        });

        setMessage("Payment successful! Thank you for your payment.");

        // Redirect after 2 seconds
        setTimeout(() => {
          navigate("/payments");
        }, 2000);
      } else {
        setError("Payment was not completed. Please try again.");
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to process payment";
      setError(errorMsg);
      console.error("Error processing payment:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-20px max-w-1200px mx-auto bg-gray-50">
      <h1 className="text-gray-800 text-2xl font-semibold mb-10px">Make Payment</h1>

      {tenant && (
        <div className="mb-20px p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-blue-800 font-semibold mb-2">Your Information</h3>
          <p className="text-blue-700 text-sm">
            <strong>Name:</strong> {tenant.firstName} {tenant.lastName}<br />
            <strong>Unit:</strong> {tenant.unitNumber}<br />
            <strong>Monthly Rent:</strong> ${lease.rent.toFixed(2)}
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white text-gray-800 shadow-lg p-24px rounded-12px border border-gray-300"
      >
        <h2 className="text-lg font-semibold mb-24px">Payment Details</h2>

        {/* Amount */}
        <div className="mb-20px">
          <label htmlFor="amount" className="block mb-6px font-medium text-gray-700">
            Payment Amount *
          </label>
          <div className="flex items-center gap-8px">
            <span className="text-gray-500 text-lg">$</span>
            <input
              type="number"
              id="amount"
              name="amount"
              step="0.01"
              min="0"
              value={amount}
              onChange={handleAmountChange}
              className="flex-1 px-3 py-2 text-black border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
              required
              placeholder="0.00"
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Default amount is your monthly rent. You can adjust if making a partial payment.
          </p>
        </div>

        {/* Card Information */}
        <div className="mb-20px">
          <label className="block mb-6px font-medium text-gray-700">
            Card Information *
          </label>
          <div className="px-3 py-3 border border-gray-300 rounded-lg shadow-inner bg-white">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#000',
                    '::placeholder': {
                      color: '#6b7280',
                    },
                  },
                  invalid: {
                    color: '#ef4444',
                  },
                },
                hidePostalCode: false
              }}
            />
          </div>
        </div>

        {/* Info Box */}
        <div className="mb-20px p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-800 text-sm">
            <strong>Secure Payment:</strong> Your payment will be processed securely through Stripe.
            Your card information is never stored on our servers.
          </p>
        </div>

        {error && (
          <div className="my-4 p-4 rounded-lg shadow-inner border border-red-300 bg-red-100 text-red-800 text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="my-4 p-4 rounded-lg shadow-inner border border-green-300 bg-green-100 text-green-800 text-sm">
            {message}
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-wrap gap-12px mt-24px">
          <button
            type="submit"
            disabled={loading || !stripe || !elements}
            className="bg-[#22c55e] text-white py-10px px-20px rounded-md text-14px hover:bg-[#1e7e34] disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading ? "Processing Payment..." : `Pay $${parseFloat(amount || "0").toFixed(2)}`}
          </button>

          <button
            type="button"
            onClick={() => navigate("/payments")}
            disabled={loading}
            className="bg-gray-400 text-white py-10px px-20px rounded-md text-14px hover:bg-gray-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default function MakePayment({ currentUser }: MakePaymentProps) {
  const navigate = useNavigate();
  const [currentTenant, setCurrentTenant] = useState<TenantDto | null>(null);
  const [lease, setLease] = useState<LeaseDto | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (currentUser) {
      // Check lease FIRST before fetching tenant data
      fetchLease();
    }
  }, [currentUser]);

  const fetchLease = async () => {
    try {
      const response = await axios.get<LeaseDto>("/api/tenants/lease");
      setLease(response.data);

      // Redirect if no active lease
      if (
        !response.data ||
        !["active", "approved-awaitingpayment"].includes(
          response.data.status.toLowerCase()
        )
      ) {
        setError("You must have an active or pending approval lease to make payments.");
        setTimeout(() => navigate("/"), 2000);
        return;
      }

      // Only fetch tenant data if lease is active
      fetchCurrentTenant();
    } catch (err) {
      console.error("Error fetching lease:", err);
      setError("You must have an active lease to make payments.");
      setTimeout(() => navigate("/"), 2000);
    }
  };

  const fetchCurrentTenant = async () => {
    try {
      const response = await axios.get<TenantDto[]>("/api/tenants");
      // Match tenant by email - check both user's email and userName fields
      const myTenant = response.data.find(t =>
        t.email.toLowerCase() === currentUser?.email?.toLowerCase() ||
        t.email.toLowerCase() === currentUser?.userName?.toLowerCase()
      );

      if (myTenant) {
        setCurrentTenant(myTenant);
      } else {
        setError("No tenant account found. Please contact your landlord to set up your tenant profile.");
      }
    } catch (err) {
      console.error("Error fetching tenant info:", err);
      setError("Failed to fetch tenant information");
    }
  };

  if (!currentUser) {
    return (
      <div className="p-20px max-w-1200px mx-auto">
        <h1 className="text-gray-800">Make Payment</h1>
        <div className="text-[#dc3545] my-10px py-10px bg-[#f8d7da] border-1 border-[#f5c6cb] rounded-4px">
          Please log in to make a payment
        </div>
      </div>
    );
  }

  if ((!currentTenant || !lease) && !error) {
    return (
      <div className="p-20px max-w-1200px mx-auto bg-gray-50">
        <h1 className="text-gray-800 text-2xl font-semibold mb-10px">Make Payment</h1>
        <div className="my-4 p-4 rounded-lg shadow-inner border border-blue-300 bg-blue-100 text-blue-800 text-sm">
          Loading your information...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-20px max-w-1200px mx-auto bg-gray-50">
        <h1 className="text-gray-800 text-2xl font-semibold mb-10px">Make Payment</h1>
        <div className="my-4 p-4 rounded-lg shadow-inner border border-red-300 bg-red-100 text-red-800 text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm lease={lease!} tenant={currentTenant!} />
    </Elements>
  );
}
