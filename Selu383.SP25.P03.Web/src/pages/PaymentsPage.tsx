import { useState, useEffect } from "react";
import axios from "axios";
import { UserDto } from "../models/UserDto";

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

interface PaymentsPageProps {
  currentUser?: UserDto;
}

export default function PaymentsPage({ currentUser }: PaymentsPageProps) {
  const [payments, setPayments] = useState<PaymentDto[]>([]);
  const [tenants, setTenants] = useState<TenantDto[]>([]);
  const [formData, setFormData] = useState<PaymentDto>({
    tenantId: 0,
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "Card",
    status: "Pending"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check user roles
  const isLandlord = currentUser?.roles?.includes("Landlord") || currentUser?.roles?.includes("Admin");
  const isTenant = currentUser?.roles?.includes("Tenant");

  useEffect(() => {
    if (isLandlord) {
      fetchTenants();
    }
    if (currentUser) {
      fetchPayments();
    }
  }, [currentUser]);

  const fetchTenants = async () => {
    try {
      const response = await axios.get<TenantDto[]>("/api/tenants");
      setTenants(response.data);
    } catch (err) {
      console.error("Error fetching tenants:", err);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await axios.get<PaymentDto[]>("/api/payments");
      setPayments(response.data);
    } catch (err) {
      setError("Failed to fetch payments");
      console.error("Error fetching payments:", err);
    }
  };

  const getTenantName = (tenantId: number): string => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? `${tenant.firstName} ${tenant.lastName} (Unit ${tenant.unitNumber})` : `Tenant ID: ${tenantId}`;
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
    if (!currentUser) return;

    if (!formData.tenantId || formData.tenantId === 0) {
      setError("Please select a tenant");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await axios.post("/api/payments", formData);
      setFormData({
        tenantId: 0,
        amount: 0,
        date: new Date().toISOString().split("T")[0],
        paymentMethod: "Card",
        status: "Pending"
      });
      await fetchPayments();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit payment");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (paymentId: number, newStatus: string) => {
    try {
      const payment = payments.find(p => p.id === paymentId);
      if (!payment) return;

      await axios.put(`/api/payments/${paymentId}`, {
        ...payment,
        status: newStatus
      });
      await fetchPayments();
    } catch (err) {
      console.error("Error updating payment status:", err);
      setError("Failed to update payment status");
    }
  };

  if (!currentUser) {
    return (
      <div className="p-20px max-w-1200px mx-auto">
        <h1 className="text-gray-800">Payments</h1>
        <div className="text-[#dc3545] my-10px py-10px bg-[#f8d7da] border-1 border-[#f5c6cb] rounded-4px">
          Please log in to view payments
        </div>
      </div>
    );
  }

  return (
    <div className="p-20px max-w-1200px mx-auto">
      <h1 className="text-gray-800">Payments</h1>
      <p className="text-gray-700">Logged in as: {currentUser.userName} ({currentUser.roles?.join(", ")})</p>

      {/* Only Landlords can record payments */}
      {isLandlord && (
        <form onSubmit={handleSubmit} className="bg-[#00061f] text-white p-20px rounded-8px mb-30px">
          <h2>Record a Payment</h2>
          
          <div className="mb-15px">
            <label htmlFor="tenantId" className="block mb-5px font-bold">Tenant:</label>
            <select
              id="tenantId"
              name="tenantId"
              value={formData.tenantId}
              onChange={handleInputChange}
              className="w-full p-8px border-1 border-[#ddd] rounded-4px text-14px text-black"
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

          <div className="mb-15px">
            <label htmlFor="amount" className="block mb-5px font-bold">Amount:</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              className="w-full p-8px border-1 border-[#ddd] rounded-4px text-14px text-black"
              step="0.01"
              min="0.01"
              required
            />
          </div>

          <div className="mb-15px">
            <label htmlFor="date" className="block mb-5px font-bold">Date:</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="w-full p-8px border-1 border-[#ddd] rounded-4px text-14px text-black"
              required
            />
          </div>

          <div className="mb-15px">
            <label htmlFor="paymentMethod" className="block mb-5px font-bold">Payment Method:</label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleInputChange}
              className="w-full p-8px border-1 border-[#ddd] rounded-4px text-14px text-black"
            >
              <option>Card</option>
              <option>Cash</option>
              <option>Check</option>
              <option>Bank Transfer</option>
            </select>
          </div>

          <div className="mb-15px">
            <label htmlFor="status" className="block mb-5px font-bold">Status:</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full p-8px border-1 border-[#ddd] rounded-4px text-14px text-black"
            >
              <option>Pending</option>
              <option>Paid</option>
              <option>Failed</option>
            </select>
            <p className="text-gray-400 text-12px mt-5px">
              Select "Paid" for cash/immediate payments, or "Pending" if processing is needed
            </p>
          </div>

          {error && (
            <div className="text-[#721c24] my-10px py-10px px-15px bg-[#f8d7da] border border-[#f5c6cb] rounded-4px">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="bg-[#007bff] text-white py-10px px-20px border-none rounded-4px cursor-pointer text-14px hover:bg-[#0056b3] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Record Payment"}
          </button>
        </form>
      )}

      <div className="payments-list">
        <h2>
          {isLandlord && `All Payments (${payments.length})`}
          {isTenant && `Payment History (${payments.length})`}
        </h2>
        
        {isTenant && (
          <p className="text-gray-600 mb-10px">
            Tenants: Contact your landlord for payment processing. Payment integration coming soon!
          </p>
        )}

        {payments.length === 0 ? (
          <p>No payments found.</p>
        ) : (
          <table className="w-full text-white border-collapse mt-20px">
            <thead>
              <tr>
                {isLandlord && <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Tenant</th>}
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Amount</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Date</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Method</th>
                <th className="p-12px text-left border-b-1 border-[#ddd] bg-[#01101f] font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.id} className="bg-[#322c35]">
                  {isLandlord && <td className="p-12px text-left border-b-1 border-[#ddd]">{getTenantName(payment.tenantId)}</td>}
                  <td className="p-12px text-left border-b-1 border-[#ddd]">${payment.amount.toFixed(2)}</td>
                  <td className="p-12px text-left border-b-1 border-[#ddd]">{payment.date}</td>
                  <td className="p-12px text-left border-b-1 border-[#ddd]">{payment.paymentMethod}</td>
                  <td className="p-12px text-left border-b-1 border-[#ddd]">
                    {isLandlord ? (
                      <select
                        value={payment.status}
                        onChange={(e) => handleStatusUpdate(payment.id!, e.target.value)}
                        className={`py-4px px-8px rounded-4px text-12px border-none ${
                          payment.status === 'Paid' ? 'bg-green-600' : 
                          payment.status === 'Pending' ? 'bg-yellow-600' : 
                          'bg-red-600'
                        }`}
                      >
                        <option>Pending</option>
                        <option>Paid</option>
                        <option>Failed</option>
                      </select>
                    ) : (
                      <span className={`py-4px px-8px rounded-4px text-12px ${
                        payment.status === 'Paid' ? 'bg-green-600' : 
                        payment.status === 'Pending' ? 'bg-yellow-600' : 
                        'bg-red-600'
                      }`}>
                        {payment.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}