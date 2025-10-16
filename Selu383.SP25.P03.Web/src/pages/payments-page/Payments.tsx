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
  email: string;
}

interface StaffDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  propertyId: number;
}

interface PaymentsPageProps {
  currentUser?: UserDto;
}

export default function PaymentsPage({ currentUser }: PaymentsPageProps) {
  const [payments, setPayments] = useState<PaymentDto[]>([]);
  const [tenants, setTenants] = useState<TenantDto[]>([]);
  const [currentTenantId, setCurrentTenantId] = useState<number | null>(null);
  const [staffRecord, setStaffRecord] = useState<StaffDto | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Check user roles
  const isLandlord = currentUser?.roles?.includes("Landlord") || currentUser?.roles?.includes("Admin");
  const isStaff = currentUser?.roles?.includes("Maintenance");
  const isTenant = currentUser?.roles?.includes("Tenant");

  useEffect(() => {
    if (currentUser) {
      initializeData();
    }
  }, [currentUser]);

  const initializeData = async () => {
    try {
      // Staff members need to check if they have a property assignment
      if (isStaff) {
        await fetchStaffRecord();
      }
      
      // Landlords and Staff need the tenants list for display
      if (isLandlord || isStaff) {
        await fetchTenants();
      }
      
      // Tenants need to find their tenant record first
      if (isTenant) {
        await fetchCurrentTenantId();
        await fetchPayments();
      } else {
        // Landlords and Staff fetch payments directly
        await fetchPayments();
      }
    } catch (err) {
      console.error("Error initializing data:", err);
    }
  };

  const fetchStaffRecord = async () => {
    try {
      const response = await axios.get<StaffDto[]>("/api/staff");
      // Match staff by email - check both user's email and userName fields
      const myStaff = response.data.find(s => 
        s.email.toLowerCase() === currentUser?.email?.toLowerCase() ||
        s.email.toLowerCase() === currentUser?.userName?.toLowerCase()
      );
      
      if (myStaff) {
        setStaffRecord(myStaff);
        
        // Check if staff has been assigned to a property
        if (!myStaff.propertyId || myStaff.propertyId === 0) {
          setError("You have not been assigned to a property yet. Please contact your administrator.");
        }
      } else {
        setError("No staff record found for your account. Please contact your administrator.");
      }
    } catch (err) {
      console.error("Error fetching staff record:", err);
      setError("Failed to fetch staff information");
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await axios.get<TenantDto[]>("/api/tenants");
      setTenants(response.data);
    } catch (err) {
      console.error("Error fetching tenants:", err);
    }
  };

  const fetchCurrentTenantId = async (): Promise<number | null> => {
    try {
      const response = await axios.get<TenantDto[]>("/api/tenants");
      const myTenant = response.data.find(t => 
        t.email.toLowerCase() === currentUser?.email?.toLowerCase() ||
        t.email.toLowerCase() === currentUser?.userName?.toLowerCase()
      );
      if (myTenant) {
        setCurrentTenantId(myTenant.id);
        return myTenant.id;
      } else {
        setError("No tenant account found for your user. Please contact your landlord.");
        return null;
      }
    } catch (err) {
      console.error("Error fetching tenant info:", err);
      setError("Failed to fetch tenant information");
      return null;
    }
  };

  const fetchPayments = async () => {
    try {
      // The backend will handle filtering based on authentication
      const response = await axios.get<PaymentDto[]>("/api/payments");
      setPayments(response.data);
    } catch (err) {
      setError("Failed to fetch payments");
      console.error("Error fetching payments:", err);
    }
  };

  const getTenantName = (tenantId: number): string => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? `${tenant.firstName} ${tenant.lastName} (Unit ${tenant.unitNumber})` : `Unknown Tenant (ID: ${tenantId})`;
  };

  const getTenantUnit = (tenantId: number): string => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? tenant.unitNumber : '';
  };

  // Filter payments based on search term
  const filteredPayments = payments.filter(payment => {
    if (!searchTerm) return true;

    const tenantName = getTenantName(payment.tenantId).toLowerCase();
    const unitNumber = getTenantUnit(payment.tenantId).toLowerCase();
    const search = searchTerm.toLowerCase();

    return tenantName.includes(search) || unitNumber.includes(search);
  });

  const handleStatusUpdate = async (paymentId: number, newStatus: string) => {
    if (!isLandlord) {
      setError("You don't have permission to update payment status");
      setShowMessage(true);
      return;
    }

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

  const handleDelete = async (paymentId: number) => {
    if (!isLandlord) {
      setError("You don't have permission to delete payments");
      setShowMessage(true);
      return;
    }

    // Check if we're running locally (feature/payments-maintenance branch)
    const isLocalDevelopment = window.location.hostname === 'localhost' ||
                               window.location.hostname === '127.0.0.1';

    if (!isLocalDevelopment) {
      setError("Delete functionality only works on feature/payments-maintenance branch (localhost)");
      setShowMessage(true);
      return;
    }

    if (!window.confirm("Are you sure you want to delete this payment? This action cannot be undone.")) {
      return;
    }

    try {
      await axios.delete(`/api/payments/${paymentId}`);
      setMessage("Payment deleted successfully!");
      setShowMessage(true);
      await fetchPayments();
    } catch (err) {
      console.error("Error deleting payment:", err);
      setError("Failed to delete payment");
      setShowMessage(true);
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

  // Show warning for staff without property assignment
  if (isStaff && staffRecord && (!staffRecord.propertyId || staffRecord.propertyId === 0)) {
    return (
      <div className="p-20px max-w-1200px mx-auto bg-gray-50">
        <h1 className="text-gray-800 text-2xl font-semibold mb-10px">Payments</h1>
        <div className="my-4 p-4 rounded-lg shadow-inner border border-yellow-300 bg-yellow-100 text-yellow-800 text-sm">
          <strong>Property Assignment Required</strong>
          <p className="mt-2">You have not been assigned to a property yet. Please contact your administrator to assign you to a property before you can view payments.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-20px max-w-1200px mx-auto bg-gray-50">
      <h1 className="text-gray-800 text-2xl font-semibold mb-10px">
        {isLandlord && "Payments"}
        {isStaff && "Payments"}
        {isTenant && "My Payments"}
      </h1>

      {/* Action buttons based on role */}
      <div className="mb-20px flex gap-10px">
        {isLandlord && (
          <Link
            to="/recordpayment"
            className="bg-[#667eea] text-white py-10px px-20px rounded-md text-14px hover:bg-[#5563d6] transition-colors inline-block shadow-sm"
          >
            Record Payment
          </Link>
        )}
        {isTenant && currentTenantId && (
          <Link
            to="/makepayment"
            className="bg-[#22c55e] text-white py-10px px-20px rounded-md text-14px hover:bg-[#1e7e34] transition-colors inline-block shadow-sm"
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

      <div className="payments-list bg-white shadow-lg p-24px rounded-12px border border-gray-300">
        <div className="flex justify-between items-center mb-10px">
          <h2 className="text-lg font-semibold text-gray-800">
            {(isLandlord || isStaff) && `All Payments (${filteredPayments.length}${searchTerm ? ` of ${payments.length}` : ''})`}
            {isTenant && `Payment History (${payments.length})`}
          </h2>

          {/* Search box for landlords/staff */}
          {(isLandlord || isStaff) && (
            <input
              type="text"
              placeholder="Search by name or unit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-200 bg-gray-50 text-gray-800 rounded-lg text-sm focus:(outline-none ring-2 ring-[#667eea] bg-white) w-64"
            />
          )}
        </div>
        
        {isTenant && !currentTenantId && (
          <div className="my-4 p-4 rounded-lg shadow-inner border border-yellow-300 bg-yellow-100 text-yellow-800 text-sm">
            <strong>No tenant account found.</strong> You need to apply for a unit first. 
            Visit the <a href="/properties" className="underline font-semibold">View Properties</a> page to apply for a unit.
          </div>
        )}
        
        {isTenant && currentTenantId && (
          <p className="text-gray-600 mb-10px text-sm">
            View your payment history below. Use "Make Payment" to submit a new payment.
          </p>
        )}

        {filteredPayments.length === 0 && payments.length === 0 && (!isTenant || currentTenantId) ? (
          <p className="text-gray-600">No payments found.</p>
        ) : filteredPayments.length === 0 && searchTerm ? (
          <p className="text-gray-600">No payments match your search.</p>
        ) : filteredPayments.length > 0 ? (
          <table className="w-full border-collapse mt-5 text-sm bg-[#fdfefe] rounded-lg overflow-hidden shadow-sm">
            <thead>
              <tr className="bg-[#f3f4f6]">
                {(isLandlord || isStaff) && <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Tenant</th>}
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Amount</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Date</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Method</th>
                <th className="p-12px text-left border-b border-r border-[#e5e7eb] font-semibold text-[#374151]">Status</th>
                {isLandlord && <th className="p-12px text-left border-b font-semibold text-[#374151]">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment, i) => (
                <tr
                  key={payment.id}
                  className={`${i % 2 === 0 ? "bg-white" : "bg-[#f9fafb]"} hover:bg-[#ebf5ff] transition-colors`}
                >
                  {(isLandlord || isStaff) && <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{getTenantName(payment.tenantId)}</td>}
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">${payment.amount.toFixed(2)}</td>
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{payment.date}</td>
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">{payment.paymentMethod}</td>
                  <td className="p-12px border-b border-r border-[#e5e7eb] text-[#111827]">
                    {isLandlord ? (
                      <select
                        value={payment.status}
                        onChange={(e) => handleStatusUpdate(payment.id!, e.target.value)}
                        className={`px-2 py-1 rounded-md text-12px border ${
                          payment.status === 'Paid' ? 'bg-white text-gray-800 border-gray-300' :
                          payment.status === 'Pending' ? 'bg-[#c7d2fe] text-gray-800 border-none' :
                          'bg-[#764ba2] text-white border-none'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Failed">Failed</option>
                      </select>
                    ) : (
                      <span className={`py-4px px-8px rounded-4px text-12px inline-block ${
                        payment.status === 'Paid' ? 'bg-white text-gray-800 border border-gray-300' :
                        payment.status === 'Pending' ? 'bg-[#c7d2fe] text-gray-800' :
                        'bg-[#764ba2] text-white'
                      }`}>
                        {payment.status}
                      </span>
                    )}
                  </td>
                  {isLandlord && (
                    <td className="p-12px border-b text-[#111827]">
                      <button
                        onClick={() => handleDelete(payment.id!)}
                        className="bg-[#ef4444] text-white py-6px px-12px rounded-md text-12px hover:bg-[#dc2626] transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  );
}