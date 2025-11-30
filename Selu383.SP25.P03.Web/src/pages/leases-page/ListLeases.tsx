import React, { useState, useEffect } from "react";
import axios from "axios";
import { UserDto } from "../../models/UserDto";
import { Link } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import PaymentForm from "../../components/PaymentForm";

interface LeaseDto {
  id?: number;
  unitNumber: string;
  tenantId: number;
  firstName: string;
  lastName: string;
  startDate: string;
  endDate: string;
  rent: number;
  deposit: number;
  status: string;
}

interface EditLeasesProps {
  currentUser?: UserDto;
}

// Initialize Stripe (replace with your publishable key)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder");

const ListLeases: React.FC<EditLeasesProps> = ({ currentUser }) => {
  const [leases, setLeases] = useState<LeaseDto[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState<"firstName" | "lastName" | "unitNumber">("firstName");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentLeaseId, setPaymentLeaseId] = useState<number | null>(null);
  const [approveStartDate, setApproveStartDate] = useState("");
  const [approveEndDate, setApproveEndDate] = useState("");
  const [approveDeposit, setApproveDeposit] = useState("");
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedLeaseId, setSelectedLeaseId] = useState<number | null>(null);

  // Check if user is Admin or Landlord
  const isAdmin = currentUser?.roles?.includes("Admin") || false;
  const isLandlord = currentUser?.roles?.includes("Landlord") || false;
  const isTenant = currentUser?.roles?.includes("Tenant") || false;

  useEffect(() => {
    if (currentUser) {
      fetchLeases();
    }
  }, [currentUser]);

  const fetchLeases = async () => {
    try {
      const response = await axios.get<LeaseDto[]>("/api/leases");
      setLeases(response.data);
    } catch (err) {
      setError("Failed to fetch leases");
      setMessage("Failed to fetch leases.");
      setShowMessage(true);
      console.error("Error fetching leases:", err);
    }
  };

  // Backend now handles role-based filtering, so we just apply search/filter criteria
  const filteredLeases = leases.filter(lease => {
    // Search filter
    const fieldValue = lease[searchField]?.toString().toLowerCase() || "";
    const matchesSearch = fieldValue.includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = filterStatus ? lease.status === filterStatus : true;

    // Date filter
    const leaseStart = new Date(lease.startDate);
    const leaseEnd = new Date(lease.endDate);

    const matchesStartDate = filterStartDate ? leaseStart >= new Date(filterStartDate) : true;
    const matchesEndDate = filterEndDate ? leaseEnd <= new Date(filterEndDate) : true;

    return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
  });

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this lease?")) {
      return;
    }

    try {
      await axios.delete(`/api/leases/${id}`);
      setMessage("Lease deleted successfully!");
      setShowMessage(true);
      await fetchLeases();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to delete lease";
      setError(errorMsg);
      setMessage(errorMsg);
      setShowMessage(true);
      console.error("Error deleting lease:", err);
    }
  };

  const handleApprove = async (id: number) => {
    setSelectedLeaseId(id);
    setShowApproveModal(true);
  };

  const submitLeaseApproval = async () => {
    try {
      await axios.post(`/api/leases/${selectedLeaseId}/approve`, {
        startDate: approveStartDate,
        endDate: approveEndDate,
        deposit: Number(approveDeposit),
        activate: true
      });

      setShowApproveModal(false);
      fetchLeases();
    } catch (err) {
      console.error("Approval error:", err);
    }
  };

  const handleDeny = async (id: number) => {
    const reason = prompt("Please provide a reason for denying this application (optional):");
    if (reason === null) return; // User cancelled

    try {
      await axios.post(`/api/leases/${id}/deny`, { reason: reason || undefined });
      setMessage("Lease application denied. Email sent to tenant.");
      setShowMessage(true);
      await fetchLeases();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to deny lease";
      setError(errorMsg);
      setMessage(errorMsg);
      setShowMessage(true);
      console.error("Error denying lease:", err);
    }
  };

  const handlePayNow = async (leaseId: number) => {
    try {
      // Create payment intent
      const response = await axios.post(`/api/payments/lease/${leaseId}/create-intent`);
      const { clientSecret, amount: totalAmount } = response.data;

      setPaymentClientSecret(clientSecret);
      setPaymentAmount(totalAmount);
      setPaymentLeaseId(leaseId);
      setShowPaymentModal(true);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to create payment";
      setError(errorMsg);
      setMessage(errorMsg);
      setShowMessage(true);
      console.error("Error creating payment intent:", err);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setPaymentClientSecret(null);
    setMessage("Payment successful! Your lease is now active.");
    setShowMessage(true);
    fetchLeases();
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    setPaymentClientSecret(null);
  };


  return (
      <div className="leases-list">
        <h2>
          {isAdmin ? "All Leases" : "Your Leases"} ({filteredLeases.length})
        </h2>
        {/* Filters Section */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
            {isAdmin && (
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                Admin View - All Leases
              </div>
            )}
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-white p-4 rounded-lg shadow">
              {/* Search Field */}

              {/* Search Term with magnifying glass */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Term
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={`Search by ${searchField}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64 pl-10 pr-3 py-2 rounded-md border border-gray-300 text-black bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
                  />
                  {/* Magnifying glass icon */}
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1110.5 3a7.5 7.5 0 016.15 13.65z"
                    />
                  </svg>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search By
                </label>
                <select
                  value={searchField}
                  onChange={(e) =>
                    setSearchField(
                      e.target.value as "firstName" | "lastName" | "unitNumber"
                    )
                  }
                  className="w-full px-3 py-2 rounded-md border border-gray-300 text-black bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="firstName">First Name</option>
                  <option value="lastName">Last Name</option>
                  <option value="unitNumber">Unit</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 text-black bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">--Choose Status--</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved-AwaitingPayment">Approved - Awaiting Payment</option>
                  <option value="Active">Active</option>
                  <option value="Expired">Expired</option>
                  <option value="Terminated">Terminated</option>
                  <option value="Denied">Denied</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date (From)
                </label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-64 px-3 py-2 rounded-md border border-gray-300 text-black bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date (To)
                </label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-64 px-3 py-2 rounded-md border border-gray-300 text-black bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
        {filteredLeases.length === 0 ? (
          <p>
            {isAdmin 
              ? "No leases found in the system." 
              : "No leases match your filters."
            }
          </p>
        ) : (
          <table className="w-full border-collapse mt-5 text-sm bg-[#fdfefe] rounded-lg overflow-hidden shadow-sm">
            <thead>
              <tr className="bg-[#f3f4f6]">
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Unit</th>
                {isAdmin && (
                  <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Tenant ID</th>
                )}
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">First Name</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Last Name</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Start Date</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">End Date</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Rent</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Deposit</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Status</th>
                <th className="p-12px text-left border-b font-semibold text-[#374151]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeases.map((lease, i) => (
                <tr
                  key={lease.id}
                  className={`${i % 2 === 0 ? "bg-white" : "bg-[#f9fafb]"} hover:bg-[#ebf5ff] transition-colors`}
                >
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{lease.unitNumber}</td>
                  {isAdmin && (
                    <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827] text-sm">
                      {lease.tenantId}
                    </td>
                  )}
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{lease.firstName}</td>
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{lease.lastName}</td>
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">
                    {new Date(lease.startDate).toLocaleDateString()}
                  </td>
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">
                    {new Date(lease.endDate).toLocaleDateString()}
                  </td>
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">${lease.rent.toFixed(2)}</td>
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">${lease.deposit.toFixed(2)}</td>
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      lease.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                      lease.status === "Approved-AwaitingPayment" ? "bg-blue-100 text-blue-800" :
                      lease.status === "Active" ? "bg-green-100 text-green-800" :
                      lease.status === "Denied" ? "bg-red-100 text-red-800" :
                      lease.status === "Expired" ? "bg-orange-100 text-orange-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {lease.status === "Approved-AwaitingPayment" ? "Awaiting Payment" : lease.status}
                    </span>
                  </td>
                  <td className="p-12px border-b flex gap-2">
                    {lease.status === "Pending" && (isAdmin || isLandlord) ? (
                      <>
                        <button
                          onClick={() => lease.id && handleApprove(lease.id)}
                          className="bg-[#22c55e] text-white py-6px px-12px rounded-md text-12px hover:bg-[#16a34a] transition-colors"
                          title="Approve application"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => lease.id && handleDeny(lease.id)}
                          className="bg-[#ef4444] text-white py-6px px-12px rounded-md text-12px hover:bg-[#dc2626] transition-colors"
                          title="Deny application"
                        >
                          Deny
                        </button>
                      </>
                    ) : lease.status === "Approved-AwaitingPayment" && isTenant ? (
                      <button
                        onClick={() => lease.id && handlePayNow(lease.id)}
                        className="bg-[#3b82f6] text-white py-6px px-12px rounded-md text-12px hover:bg-[#2563eb] transition-colors font-semibold"
                        title="Pay now to activate lease"
                      >
                        Pay Now (${(lease.rent + lease.deposit).toFixed(2)})
                      </button>
                    ) : (
                      <>
                        <Link
                          to={`/lease/${lease.id}`}
                          className="bg-[#3b82f6] text-white py-6px px-12px rounded-md text-12px hover:bg-[#2563eb] transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => lease.id && handleDelete(lease.id)}
                          className="bg-[#ef4444] text-white py-6px px-12px rounded-md text-12px hover:bg-[#dc2626] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            {error && showMessage && (
              <div className="my-4 p-4 rounded-lg shadow-inner border border-red-300 bg-red-100 text-red-800 text-sm">
                {error}
              </div>
            )}

            {!error && message && (
              <div className="my-4 p-4 rounded-lg shadow-inner border border-green-300 bg-green-100 text-green-800 text-sm">
                {message}
              </div>
            )}
          </table>
        )}

        {/* APPROVE LEASE MODAL */}
        {showApproveModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
              <h3 className="text-lg font-semibold mb-4">
                Approve Lease – Set Details
              </h3>

              {/* Start Date */}
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                value={approveStartDate}
                onChange={(e) => setApproveStartDate(e.target.value)}
                className="w-full border p-2 rounded mb-4"
              />

              {/* End Date */}
              <label className="block mb-2 text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                value={approveEndDate}
                onChange={(e) => setApproveEndDate(e.target.value)}
                className="w-full border p-2 rounded mb-4"
              />

              {/* Deposit */}
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Security Deposit
              </label>
              <input
                type="number"
                placeholder="Enter deposit amount"
                value={approveDeposit}
                onChange={(e) => setApproveDeposit(e.target.value)}
                className="w-full border p-2 rounded mb-4"
              />

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  Cancel
                </button>

                <button
                  onClick={submitLeaseApproval}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Approve Lease
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && paymentClientSecret && paymentLeaseId && (
          <Elements stripe={stripePromise} options={{ clientSecret: paymentClientSecret }}>
            <PaymentForm
              leaseId={paymentLeaseId}
              amount={paymentAmount}
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          </Elements>
        )}
    </div>
  );
};

export default ListLeases;