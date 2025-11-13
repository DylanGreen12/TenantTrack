import { useEffect, useState } from "react";
import axios from "axios";
import { UserDto } from "../../models/UserDto";
import { Link } from "react-router-dom";

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
  const [unit, setUnit] = useState<UnitDto | null>(null);
  const [lease, setLease] = useState<LeaseDto | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<BalanceDto | null>(null);
  

  useEffect(() => {
    if (currentUser) {
      fetchTenantData();
    }
  }, [currentUser]);

  const fetchTenantData = async () => {
    try {
      const [unitRes, leaseRes, balanceRes] = await Promise.all([
        axios.get<UnitDto>("/api/tenants/unit", { withCredentials: true }),
        axios.get<LeaseDto>("/api/tenants/lease", { withCredentials: true }),
        axios.get<BalanceDto>("/api/tenants/balance", { withCredentials: true }),
      ]);
      setUnit(unitRes.data);
      setLease(leaseRes.data);
      setPaymentStatus(balanceRes.data);
      
      setError("");
    } catch (err: any) {
      console.error("Error fetching tenant data:", err);
      const msg = err.response?.data?.message || "Failed to fetch your data.";
      setError(msg);
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