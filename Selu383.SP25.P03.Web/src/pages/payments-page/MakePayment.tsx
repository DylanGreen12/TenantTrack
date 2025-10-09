import React, { useState, useEffect } from "react";
import axios from "axios";
import { UserDto } from "../../models/UserDto";
import { useNavigate } from "react-router-dom";

interface TenantDto {
  id: number;
  unitNumber: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface PaymentFormData {
  tenantId: number;
  amount: number;
  date: string;
  paymentMethod: string;
  status: string;
}

interface MakePaymentProps {
  currentUser?: UserDto;
}

export default function MakePayment({ currentUser }: MakePaymentProps) {
  const navigate = useNavigate();
  const [currentTenant, setCurrentTenant] = useState<TenantDto | null>(null);
  const [formData, setFormData] = useState<PaymentFormData>({
    tenantId: 0,
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: "",
    status: "Pending"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (currentUser) {
      fetchCurrentTenant();
    }
  }, [currentUser]);

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
        setFormData(prev => ({
          ...prev,
          tenantId: myTenant.id
        }));
      } else {
        setError("No tenant account found. Please contact your landlord to set up your tenant profile.");
      }
    } catch (err) {
      console.error("Error fetching tenant info:", err);
      setError("Failed to fetch tenant information");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "amount" ? (value === "" ? 0 : Number(value)) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError("Please log in to make a payment");
      return;
    }

    if (!currentTenant) {
      setError("Tenant account not found. Please contact your landlord.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await axios.post("/api/payments", formData);
      setMessage("Payment submitted successfully! Your landlord will review it.");
      
      // Reset form
      setFormData({
        tenantId: currentTenant.id,
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        paymentMethod: "",
        status: "Pending"
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/payments");
      }, 2000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to submit payment";
      setError(errorMsg);
      console.error("Error submitting payment:", err);
    } finally {
      setLoading(false);
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

  if (!currentTenant && !error) {
    return (
      <div className="p-20px max-w-1200px mx-auto bg-gray-50">
        <h1 className="text-gray-800 text-2xl font-semibold mb-10px">Make Payment</h1>
        <div className="my-4 p-4 rounded-lg shadow-inner border border-blue-300 bg-blue-100 text-blue-800 text-sm">
          Loading your tenant information...
        </div>
      </div>
    );
  }

  return (
    <div className="p-20px max-w-1200px mx-auto bg-gray-50">
      <h1 className="text-gray-800 text-2xl font-semibold mb-10px">Make Payment</h1>

      {currentTenant && (
        <div className="mb-20px p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-blue-800 font-semibold mb-2">Your Information</h3>
          <p className="text-blue-700 text-sm">
            <strong>Name:</strong> {currentTenant.firstName} {currentTenant.lastName}<br />
            <strong>Unit:</strong> {currentTenant.unitNumber}
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
            Amount *
          </label>
          <div className="flex items-center gap-8px">
            <span className="text-gray-500 text-lg">$</span>
            <input
              type="number"
              id="amount"
              name="amount"
              step="0.01"
              min="0"
              value={formData.amount === 0 ? "" : formData.amount}
              onChange={handleInputChange}
              className="flex-1 px-3 py-2 text-black border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
              required
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Payment Date */}
        <div className="mb-20px">
          <label htmlFor="date" className="block mb-6px font-medium text-gray-700">
            Payment Date *
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            className="w-full px-12px py-10px border bg-white text-black border-gray-300 rounded-8px text-14px focus:(outline-none ring-2 ring-blue-400)"
            required
          />
        </div>

        {/* Payment Method */}
        <div className="mb-20px">
          <label htmlFor="paymentMethod" className="block mb-6px font-medium text-gray-700">
            Payment Method *
          </label>
          <select
            id="paymentMethod"
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleInputChange}
            className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
            required
          >
            <option value="">-- Select Payment Method --</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Debit Card">Debit Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Check">Check</option>
            <option value="Cash">Cash</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Info Box */}
        <div className="mb-20px p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-yellow-800 text-sm">
            <strong>Note:</strong> Your payment will be marked as "Pending" until your landlord confirms receipt.
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
            disabled={loading || !currentTenant}
            className="bg-[#22c55e] text-white py-10px px-20px rounded-md text-14px hover:bg-[#1e7e34] disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading ? "Submitting..." : "Submit Payment"}
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