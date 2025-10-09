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

interface RecordPaymentProps {
  currentUser?: UserDto;
}

export default function RecordPayment({ currentUser }: RecordPaymentProps) {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<TenantDto[]>([]);
  const [formData, setFormData] = useState<PaymentFormData>({
    tenantId: 0,
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: "",
    status: "Paid" // Default to Paid for landlord recordings
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (currentUser) {
      fetchTenants();
    }
  }, [currentUser]);

  const fetchTenants = async () => {
    try {
      const response = await axios.get<TenantDto[]>("/api/tenants");
      setTenants(response.data);
    } catch (err) {
      console.error("Error fetching tenants:", err);
      setError("Failed to fetch tenants");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "tenantId" || name === "amount" 
        ? (value === "" ? 0 : Number(value)) 
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError("Please log in to record payments");
      return;
    }

    if (formData.tenantId === 0) {
      setError("Please select a tenant");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await axios.post("/api/payments", formData);
      setMessage("Payment recorded successfully!");
      
      // Reset form
      setFormData({
        tenantId: 0,
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        paymentMethod: "",
        status: "Paid"
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/payments");
      }, 2000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to record payment";
      setError(errorMsg);
      console.error("Error recording payment:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="p-20px max-w-1200px mx-auto">
        <h1 className="text-gray-800">Record Payment</h1>
        <div className="text-[#dc3545] my-10px py-10px bg-[#f8d7da] border-1 border-[#f5c6cb] rounded-4px">
          Please log in to record payments
        </div>
      </div>
    );
  }

  return (
    <div className="p-20px max-w-1200px mx-auto bg-gray-50">
      <h1 className="text-gray-800 text-2xl font-semibold mb-10px">Record Payment</h1>
      
      <div className="mb-20px p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-blue-700 text-sm">
          <strong>Note:</strong> Use this form to record payments received from tenants (cash, check, etc.). 
          The payment will be marked with the status you select.
        </p>
      </div>

      <form 
        onSubmit={handleSubmit} 
        className="bg-white text-gray-800 shadow-lg p-24px rounded-12px border border-gray-300"
      >
        <h2 className="text-lg font-semibold mb-24px">Payment Details</h2>

        {/* Tenant Selection */}
        <div className="mb-20px">
          <label htmlFor="tenantId" className="block mb-6px font-medium text-gray-700">
            Tenant *
          </label>
          <select
            id="tenantId"
            name="tenantId"
            value={formData.tenantId}
            onChange={handleInputChange}
            className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
            required
          >
            <option value={0}>-- Select Tenant --</option>
            {tenants.map(tenant => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.firstName} {tenant.lastName} (Unit {tenant.unitNumber})
              </option>
            ))}
          </select>
        </div>

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
            <option value="Cash">Cash</option>
            <option value="Check">Check</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Debit Card">Debit Card</option>
            <option value="Money Order">Money Order</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Status */}
        <div className="mb-20px">
          <label htmlFor="status" className="block mb-6px font-medium text-gray-700">
            Status *
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
            required
          >
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
          </select>
          <p className="text-gray-600 text-xs mt-2">
            Select "Paid" if you've already received the payment, or "Pending" if you're expecting it.
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
            disabled={loading || tenants.length === 0}
            className="bg-[#667eea] text-white py-10px px-20px rounded-md text-14px hover:bg-[#5563d6] disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading ? "Recording..." : "Record Payment"}
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