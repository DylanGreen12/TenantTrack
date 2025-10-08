import { useState, useEffect } from "react";
import axios from "axios";
import { UserDto } from "../../models/UserDto";
import { Link } from "react-router-dom";

interface PaymentDto {
  id?: number;
  tenantId: number;
  amount: number;
  date: string;
  paymentMethod: string;
  status: string;
}

interface TenantDto {
  id: number;
  unitNumber: string;
  firstName: string;
  lastName: string;
}

interface RecordPaymentProps {
  currentUser?: UserDto;
}

export default function RecordPayment({ currentUser }: RecordPaymentProps) {
  const [tenants, setTenants] = useState<TenantDto[]>([]);
  const [formData, setFormData] = useState<PaymentDto>({
    tenantId: 0,
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "Cash",
    status: "Paid"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);

  // Check user roles
  const isLandlord = currentUser?.roles?.includes("Landlord") || currentUser?.roles?.includes("Admin");

  useEffect(() => {
    if (isLandlord) {
      fetchTenants();
    }
  }, [isLandlord]);

  const fetchTenants = async () => {
    try {
      const response = await axios.get<TenantDto[]>("/api/tenants");
      setTenants(response.data);
    } catch (err) {
      console.error("Error fetching tenants:", err);
      setError("Failed to fetch tenants");
      setShowMessage(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "amount" ? parseFloat(value) : name === "tenantId" ? parseInt(value) : value
    }));
  };

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
        setError("Please log in to record payments");
        setShowMessage(true);
        return;
    }

    if (!formData.tenantId || formData.tenantId === 0) {
        setError("Please select a tenant");
        setShowMessage(true);
        return;
    }

    if (formData.amount <= 0) {
        setError("Amount must be greater than 0");
        setShowMessage(true);
        return;
    }

    setLoading(true);
    setError("");
    setShowMessage(false);

    try {
        console.log("Submitting payment data:", formData); // ADD THIS LINE
        await axios.post("/api/payments", formData);
        setMessage("Payment recorded successfully!");
        setShowMessage(true);
        resetForm();
    } catch (err: any) {
        const errorMsg = err.response?.data?.message || "Failed to record payment";
        setError(errorMsg);
        setMessage(errorMsg);
        setShowMessage(true);
    } finally {
        setLoading(false);
    }
    };

  const resetForm = () => {
    setFormData({
      tenantId: 0,
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      paymentMethod: "Cash",
      status: "Paid"
    });
    setError("");
  };

  if (!currentUser) {
    return (
      <div className="p-20px max-w-1200px mx-auto bg-gray-50">
        <h1 className="text-gray-800 text-2xl font-semibold mb-10px">Record Payment</h1>
        <div className="my-4 p-4 rounded-lg shadow-inner border border-red-300 bg-red-100 text-red-800 text-sm">
          Please log in to record payments
        </div>
      </div>
    );
  }

  if (!isLandlord) {
    return (
      <div className="p-20px max-w-1200px mx-auto bg-gray-50">
        <h1 className="text-gray-800 text-2xl font-semibold mb-10px">Record Payment</h1>
        <div className="my-4 p-4 rounded-lg shadow-inner border border-red-300 bg-red-100 text-red-800 text-sm">
          You don't have permission to record payments. Only landlords can access this page.
        </div>
      </div>
    );
  }

  return (
    <div className="p-20px max-w-1200px mx-auto bg-gray-50">
      <h1 className="text-gray-800 text-2xl font-semibold mb-10px">Record Payment</h1>
      
      <form 
        onSubmit={handleSubmit}
        className="bg-white text-gray-800 shadow-lg p-24px rounded-12px border border-gray-300 mb-30px"
      >
        <h2 className="text-lg font-semibold mb-24px">Manual Payment Entry</h2>
        <p className="text-gray-600 text-sm mb-20px">
          Use this form to record payments received outside the system (cash, check, bank transfer, etc.)
        </p>
        
        <div className="mb-20px">
          <label htmlFor="tenantId" className="block mb-6px font-medium text-gray-700">
            Tenant
          </label>
          <select
            id="tenantId"
            name="tenantId"
            value={formData.tenantId}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-inner bg-white text-gray-800 focus:(outline-none ring-2 ring-blue-400)"
            required
          >
            <option value={0}>-- Select Tenant --</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.firstName} {t.lastName} (Unit {t.unitNumber})
              </option>
            ))}
          </select>
        </div>

        <div className="mb-20px">
          <label htmlFor="amount" className="block mb-6px font-medium text-gray-700">
            Amount ($)
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount === 0 ? "" : formData.amount}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-inner bg-white text-gray-800 focus:(outline-none ring-2 ring-blue-400)"
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
          />
        </div>

        <div className="mb-20px">
          <label htmlFor="date" className="block mb-6px font-medium text-gray-700">
            Payment Date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-inner bg-white text-gray-800 focus:(outline-none ring-2 ring-blue-400)"
            required
          />
        </div>

        <div className="mb-20px">
          <label htmlFor="paymentMethod" className="block mb-6px font-medium text-gray-700">
            Payment Method
          </label>
          <select
            id="paymentMethod"
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-inner bg-white text-gray-800 focus:(outline-none ring-2 ring-blue-400)"
          >
            <option value="Cash">Cash</option>
            <option value="Check">Check</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Money Order">Money Order</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="mb-20px">
          <label htmlFor="status" className="block mb-6px font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-inner bg-white text-gray-800 focus:(outline-none ring-2 ring-blue-400)"
          >
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
          <p className="text-gray-500 text-12px mt-5px">
            Select "Paid" for cash/immediate payments, or "Pending" if still processing
          </p>
        </div>

        {error && showMessage && (
          <div className="my-4 p-4 rounded-lg shadow-inner border border-red-300 bg-red-100 text-red-800 text-sm">
            {error}
          </div>
        )}

        {!error && message && showMessage && (
          <div className="my-4 p-4 rounded-lg shadow-inner border border-green-300 bg-green-100 text-green-800 text-sm">
            {message}
          </div>
        )}

        <div className="flex flex-wrap gap-12px mt-24px">
          <button 
            type="submit" 
            disabled={loading}
            className="bg-blue-500 text-white py-10px px-20px rounded-8px text-14px hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Recording..." : "Record Payment"}
          </button>

          <button
            type="button"
            onClick={resetForm}
            disabled={loading}
            className="bg-gray-400 text-white py-10px px-20px rounded-8px text-14px hover:bg-gray-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            Clear Form
          </button>

          <Link 
            to="/payments"
            className="bg-blue-500 text-white py-10px px-20px rounded-8px text-14px hover:bg-blue-700 inline-block"
          >
            View All Payments
          </Link>
        </div>
      </form>
    </div>
  );
}