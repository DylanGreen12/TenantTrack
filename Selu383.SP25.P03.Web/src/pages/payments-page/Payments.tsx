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

interface PaymentsPageProps {
  currentUser?: UserDto;
}

export default function PaymentsPage({ currentUser }: PaymentsPageProps) {
  const [payments, setPayments] = useState<PaymentDto[]>([]);
  const [tenants, setTenants] = useState<TenantDto[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);

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

  const handleStatusUpdate = async (paymentId: number, newStatus: string) => {
    try {
      const payment = payments.find(p => p.id === paymentId);
      if (!payment) return;

      await axios.put(`/api/payments/${paymentId}`, {
        ...payment,
        status: newStatus
      });
      setMessage("Payment status updated successfully!");
      setShowMessage(true);
      await fetchPayments();
    } catch (err) {
      console.error("Error updating payment status:", err);
      setError("Failed to update payment status");
      setShowMessage(true);
    }
  };

  if (!currentUser) {
    return (
      <div className="p-20px max-w-1200px mx-auto bg-gray-50">
        <h1 className="text-gray-800 text-2xl font-semibold mb-10px">Payments</h1>
        <div className="my-4 p-4 rounded-lg shadow-inner border border-red-300 bg-red-100 text-red-800 text-sm">
          Please log in to view payments
        </div>
      </div>
    );
  }

  return (
    <div className="p-20px max-w-1200px mx-auto bg-gray-50">
      <h1 className="text-gray-800 text-2xl font-semibold mb-10px">Payments</h1>

      {/* Action buttons based on role */}
      <div className="mb-20px flex gap-10px">
        {isLandlord && (
          <Link
            to="/recordpayment"
            className="bg-blue-500 text-white py-10px px-20px rounded-8px text-14px hover:bg-blue-700 transition-colors inline-block"
          >
            Record Payment
          </Link>
        )}
        {isTenant && (
          <Link
            to="/makepayment"
            className="bg-green-500 text-white py-10px px-20px rounded-8px text-14px hover:bg-green-700 transition-colors inline-block"
          >
            Make Payment
          </Link>
        )}
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

      <div className="payments-list">
        <h2 className="text-lg font-semibold mb-10px text-gray-800">
          {isLandlord && `All Payments (${payments.length})`}
          {isTenant && `Payment History (${payments.length})`}
        </h2>
        
        {isTenant && (
          <p className="text-gray-600 mb-10px text-sm">
            View your payment history below. Use "Make Payment" to submit a new payment.
          </p>
        )}

        {payments.length === 0 ? (
          <p className="text-gray-600">No payments found.</p>
        ) : (
          <table className="w-full border-collapse mt-5 text-sm bg-[#fdfefe] rounded-lg overflow-hidden shadow-sm">
            <thead>
              <tr className="bg-[#f3f4f6]">
                {isLandlord && <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Tenant</th>}
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Amount</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Date</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Method</th>
                <th className="p-12px text-left border-b font-semibold text-[#374151]">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment, i) => (
                <tr
                  key={payment.id}
                  className={`${i % 2 === 0 ? "bg-white" : "bg-[#f9fafb]"} hover:bg-[#ebf5ff] transition-colors`}
                >
                  {isLandlord && <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{getTenantName(payment.tenantId)}</td>}
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">${payment.amount.toFixed(2)}</td>
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{payment.date}</td>
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{payment.paymentMethod}</td>
                  <td className="p-12px border-b text-[#111827]">
                    {isLandlord ? (
                      <select
                        value={payment.status}
                        onChange={(e) => handleStatusUpdate(payment.id!, e.target.value)}
                        className={`px-2 py-1 rounded-md text-12px border-none ${
                          payment.status === 'Paid' ? 'bg-green-600 text-white' : 
                          payment.status === 'Pending' ? 'bg-yellow-500 text-white' : 
                          'bg-red-600 text-white'
                        }`}
                      >
                        <option>Pending</option>
                        <option>Paid</option>
                        <option>Failed</option>
                      </select>
                    ) : (
                      <span className={`py-4px px-8px rounded-4px text-12px inline-block ${
                        payment.status === 'Paid' ? 'bg-green-600 text-white' : 
                        payment.status === 'Pending' ? 'bg-yellow-500 text-white' : 
                        'bg-red-600 text-white'
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