import { useEffect, useState } from "react";
import axios from "axios";
import { UserDto } from "../../models/UserDto";
import { Link, useNavigate } from "react-router-dom";

interface UnitDto {
  id: number;
  unitNumber: string;
  rent: number;
  description: string;
  imageUrl: string;
  bedrooms: number;
  bathrooms: number;
}

interface LeaseDto {
  id: number;
  unitNumber: string;
  tenantName: string;
  startDate: string;
  endDate: string;
  rent: number;
  deposit: number;
  status: string;
}

interface BalanceDto {
  rent: number;
  totalPaid: number;
  balanceDue: number;
  status: string;
  month: string;
}

interface TenantDashboardProps {
  currentUser?: UserDto;
}

const TenantDashboard: React.FC<TenantDashboardProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const [unit, setUnit] = useState<UnitDto | null>(null);
  const [lease, setLease] = useState<LeaseDto | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<BalanceDto | null>(null);
  const [isFirstMonth, setIsFirstMonth] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchTenantData();
    }
  }, [currentUser]);

  const fetchTenantData = async () => {
    try {
      // First check if tenant has a lease (lightest check)
      // If this fails with 404, user hasn't applied for a lease yet
      const leaseRes = await axios.get<LeaseDto>("/api/tenants/lease", { withCredentials: true });
      setLease(leaseRes.data);

      // If we have a lease, fetch the rest of the data in parallel
      const [unitRes, balanceRes] = await Promise.all([
        axios.get<UnitDto>("/api/tenants/unit", { withCredentials: true }),
        axios.get<BalanceDto>("/api/tenants/balance", { withCredentials: true }),
      ]);

      setUnit(unitRes.data);

      // Determine if it is the first month of the lease
      const isFirstMonth = (() => {
        const start = leaseRes.data?.startDate
          ? new Date(leaseRes.data.startDate)
          : null;

        if (!start) return false;

        const now = new Date();

        return (
          start.getFullYear() === now.getFullYear() &&
          start.getMonth() === now.getMonth()
        );
      })();

      setIsFirstMonth(isFirstMonth);

      // Compute adjusted payment status if first month
      let finalPayment = balanceRes.data;

      if (isFirstMonth) {
        finalPayment = {
          ...balanceRes.data,
          balanceDue:
            balanceRes.data.rent +
            leaseRes.data.deposit -
            balanceRes.data.totalPaid,

          status:
            balanceRes.data.totalPaid >=
            balanceRes.data.rent + leaseRes.data.deposit
              ? "Paid"
              : balanceRes.data.totalPaid > 0
              ? "Partial"
              : "Unpaid",
        };
      }

      // Set the final computed balance once
      setPaymentStatus(finalPayment);

      setError("");
    } catch (err: any) {
      console.error("Error fetching tenant data:", err);
      const msg = err.response?.data?.message || "Failed to fetch your data.";

      // If tenant has no lease/unit, redirect to properties page to apply
      if (err.response?.status === 404 || msg.includes("not found") || msg.includes("No tenant")) {
        navigate("/properties");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };


  if (loading)
    return <p className="text-gray-500 text-center mt-10">Loading your unit...</p>;

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg max-w-lg mx-auto">
        <p className="font-semibold">Error:</p>
        <p>{error}</p>
      </div>
    );
  }

  // Show pending application view if lease is pending or awaiting payment
  if (lease && (lease.status === "Pending" || lease.status === "Approved-AwaitingPayment")) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Home</h1>

        <div className="max-w-2xl mx-auto">
          {lease.status === "Pending" ? (
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 bg-amber-500 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Application Pending</h2>
                <p className="text-gray-600">Your lease application is under review by the landlord.</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-gray-800 mb-4">Application Details</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><strong>Unit:</strong> {lease.unitNumber}</p>
                  <p><strong>Requested Start Date:</strong> {new Date(lease.startDate).toLocaleDateString()}</p>
                  <p><strong>Requested End Date:</strong> {new Date(lease.endDate).toLocaleDateString()}</p>
                  <p><strong>Monthly Rent:</strong> ${lease.rent}</p>
                  <p><strong>Security Deposit:</strong> ${lease.deposit}</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong className="text-blue-800">What happens next?</strong> The landlord will review your application and either approve or deny it.
                  You'll receive an email notification once a decision has been made. If approved, you'll be able to make your payment to activate the lease.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Application Approved!</h2>
                <p className="text-gray-600">Your lease application has been approved. Complete payment to activate your lease.</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-gray-800 mb-4">Lease Details</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><strong>Unit:</strong> {lease.unitNumber}</p>
                  <p><strong>Start Date:</strong> {new Date(lease.startDate).toLocaleDateString()}</p>
                  <p><strong>End Date:</strong> {new Date(lease.endDate).toLocaleDateString()}</p>
                  <p><strong>Monthly Rent:</strong> ${lease.rent}</p>
                  <p><strong>Security Deposit:</strong> ${lease.deposit}</p>
                  <p className="text-lg font-bold text-blue-600 pt-2 border-t border-gray-200 mt-4">
                    <strong>Total Due:</strong> ${(lease.rent + lease.deposit).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="text-center">
                <Link
                  to="/makepayment"
                  className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Make Payment
                </Link>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-gray-700">
                  <strong className="text-amber-800">Important:</strong> Your lease will not be activated until payment is received.
                  Once payment is complete, you'll have full access to your tenant dashboard.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Home</h1>

      {/* GRID LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT COLUMN - Balance / Unit */}
        <div className="bg-white rounded-xl shadow p-6 border-t-4 border-green-400">
          <h2 className="text-lg font-semibold mb-2">Your {paymentStatus?.month} Balance</h2>

          <div className="text-4xl font-bold text-gray-800 mb-1">
            ${paymentStatus?.balanceDue?.toFixed(2) ?? "0.00"}
          </div>

          <p
            className={`text-sm font-medium mb-4 ${
              paymentStatus?.status === "Paid"
                ? "text-green-600"
                : paymentStatus?.status === "Partial"
                ? "text-yellow-600"
                : "text-red-600"
            }`}
          >
            Status: {paymentStatus?.status ?? "Unknown"}
          </p>

          {isFirstMonth && (
            <p className="text-sm text-blue-600 mb-2 font-medium">
              * Your security deposit is included in this month's balance.
            </p>
          )}

          <p className="text-sm text-gray-500 mb-4">
            Total Paid: ${paymentStatus?.totalPaid ?? 0} / Rent: $
            {paymentStatus?.rent ?? 0}
          </p>


          {lease && lease.status.toLowerCase() === "active" && (
            <div className="flex gap-2 mb-4">
              <Link
                to="/makepayment"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Make a Payment
              </Link>
            </div>
          )}

          {/* Unit image */}
          {unit?.imageUrl && (
            <img
              src={unit.imageUrl}
              alt={`Unit ${unit.unitNumber}`}
              className="rounded-lg shadow-sm mb-4 w-full max-h-48 object-cover"
            />
          )}

          {/* Unit info table */}
          <div className="border-t pt-4">

            <div className="mt-4 text-sm text-gray-700 space-y-1">
              <p>
                <strong>Unit:</strong> {unit?.unitNumber}
              </p>
              <p>
                <strong>Bedrooms:</strong> {unit?.bedrooms}
              </p>
              <p>
                <strong>Bathrooms:</strong> {unit?.bathrooms}
              </p>
              <p>
                <strong>Description:</strong> {unit?.description}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Lease Info */}
          <div className="bg-white rounded-xl shadow p-6 border-t-4 border-purple-400">
            <h2 className="font-semibold mb-3">📄 Lease Information</h2>

            {lease ? (
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <strong>Lease Start:</strong>{" "}
                  {new Date(lease.startDate).toLocaleDateString()}
                </p>
                <p>
                  <strong>Lease End:</strong>{" "}
                  {new Date(lease.endDate).toLocaleDateString()}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    className={`font-medium ${
                      lease.status.toLowerCase() === "active"
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    {lease.status}
                  </span>
                </p>
                <p>
                  <strong>Monthly Rent:</strong> ${lease.rent}
                </p>
                <p>
                  <strong>Security Deposit:</strong> ${lease.deposit}
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                No active lease found for your account.
              </p>
            )}
          </div>

          {/* Maintenance Requests */}
          <div className="bg-white rounded-xl shadow p-6 border-t-4 border-orange-400">
            <h2 className="font-semibold mb-3">🛠️ Maintenance Requests</h2>
            {lease && lease.status.toLowerCase() === "active" ? (
              <Link
                to="/editmaintenancerequests"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg mb-2 hover:bg-blue-700"
              >
                Request Maintenance
              </Link>
            ) : (
              <p className="text-gray-500 text-sm">
                You must have an active lease to request maintenance.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


export default TenantDashboard;