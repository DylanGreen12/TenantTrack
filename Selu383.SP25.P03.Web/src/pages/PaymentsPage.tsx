import React, { useState, useEffect } from "react";
import axios from "axios";
//import "../styles/PaymentsPage.css";

interface PaymentDto {
  id?: number;
  tenantId: number;
  amount: number;
  date: string;
  paymentMethod: string;
  status: string;
}

interface CurrentUser {
  id: number;
  userName: string;
  roles?: string[]; // landlord, tenant
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentDto[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [formData, setFormData] = useState<PaymentDto>({
    tenantId: 0,
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "Credit Card",
    status: "Pending"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchPayments();
    }
  }, [currentUser]);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get<CurrentUser>("/api/authentication/me");
      setCurrentUser(response.data);
      setFormData(prev => ({
        ...prev,
        tenantId: response.data.id // for tenants making payments
      }));
    } catch (err) {
      console.error("Error fetching current user:", err);
      setError("Please log in to view payments");
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await axios.get<PaymentDto[]>("/api/payments");
      // tenants only see their own
      if (currentUser?.roles?.includes("tenant")) {
        setPayments(response.data.filter(p => p.tenantId === currentUser.id));
      } else {
        setPayments(response.data);
      }
    } catch (err) {
      setError("Failed to fetch payments");
      console.error("Error fetching payments:", err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "amount" ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    setError("");

    try {
      await axios.post("/api/payments", formData);
      setFormData({
        tenantId: currentUser.id,
        amount: 0,
        date: new Date().toISOString().split("T")[0],
        paymentMethod: "Credit Card",
        status: "Pending"
      });
      await fetchPayments();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit payment");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="payments-page">
        <h1>Payments</h1>
        <div className="error-message">Please log in to view payments</div>
      </div>
    );
  }

  return (
    <div className="payments-page">
      <h1>Payments</h1>
      <p className="user-info">Logged in as: {currentUser.userName}</p>

      {currentUser.roles?.includes("tenant") && (
        <form onSubmit={handleSubmit} className="payment-form">
          <h2>Make a Payment</h2>
          <div className="form-group">
            <label htmlFor="amount">Amount:</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="paymentMethod">Payment Method:</label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleInputChange}
            >
              <option>Credit Card</option>
              <option>Bank Transfer</option>
              <option>Cash</option>
            </select>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Processing..." : "Submit Payment"}
          </button>
        </form>
      )}

      <div className="payments-list">
        <h2>{currentUser.roles?.includes("tenant") ? "My Payments" : "All Payments"}</h2>
        {payments.length === 0 ? (
          <p>No payments found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Amount</th>
                <th>Date</th>
                <th>Method</th>
                <th>Status</th>
                {!currentUser.roles?.includes("tenant") && <th>Tenant ID</th>}
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.id}>
                  <td>${payment.amount.toFixed(2)}</td>
                  <td>{payment.date}</td>
                  <td>{payment.paymentMethod}</td>
                  <td>{payment.status}</td>
                  {!currentUser.roles?.includes("tenant") && (
                    <td>{payment.tenantId}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
