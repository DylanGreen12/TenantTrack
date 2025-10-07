import { useState, useEffect } from "react";
import axios from "axios";
import { UserDto } from "../../models/UserDto";
import { Link } from "react-router-dom";

interface TenantDto {
  id: number;
  unitNumber: string;
  firstName: string;
  lastName: string;
}

interface MakePaymentProps {
  currentUser?: UserDto;
}

export default function MakePayment({ currentUser }: MakePaymentProps) {
  const [tenants, setTenants] = useState<TenantDto[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<number>(0);
  const [amount, setAmount] = useState<number>(0);

  // Check user roles
  const isTenant = currentUser?.roles?.includes("Tenant");
  const isLandlord = currentUser?.roles?.includes("Landlord") || currentUser?.roles?.includes("Admin");

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
    }
  };

  if (!currentUser) {
    return (
      <div className="p-20px max-w-1200px mx-auto bg-gray-50">
        <h1 className="text-gray-800 text-2xl font-semibold mb-10px">Make Payment</h1>
        <div className="my-4 p-4 rounded-lg shadow-inner border border-red-300 bg-red-100 text-red-800 text-sm">
          Please log in to make a payment
        </div>
      </div>
    );
  }

  if (!isTenant && !isLandlord) {
    return (
      <div className="p-20px max-w-1200px mx-auto bg-gray-50">
        <h1 className="text-gray-800 text-2xl font-semibold mb-10px">Make Payment</h1>
        <div className="my-4 p-4 rounded-lg shadow-inner border border-red-300 bg-red-100 text-red-800 text-sm">
          You don't have permission to make payments
        </div>
      </div>
    );
  }

  return (
    <div className="p-20px max-w-1200px mx-auto bg-gray-50">
      <h1 className="text-gray-800 text-2xl font-semibold mb-10px">Make Payment</h1>
      
      <div className="bg-white text-gray-800 shadow-lg p-24px rounded-12px border border-gray-300 mb-30px">
        <h2 className="text-lg font-semibold mb-24px">Online Payment</h2>
        
        {/* Coming Soon Notice */}
        <div className="my-4 p-6 rounded-lg shadow-inner border border-blue-300 bg-blue-50 text-blue-900">
          <h3 className="font-semibold text-lg mb-2">🚀 Coming Soon!</h3>
          <p className="mb-3">
            Online payment processing is currently under development. Soon you'll be able to:
          </p>
          <ul className="list-disc list-inside space-y-1 mb-3 text-sm">
            <li>Pay rent securely with credit/debit card</li>
            <li>Set up automatic recurring payments</li>
            <li>View payment confirmation instantly</li>
            <li>Access detailed payment history</li>
          </ul>
          <p className="text-sm">
            <strong>In the meantime:</strong> Please contact your landlord directly to arrange payment.
          </p>
        </div>

        {/* Preview of future form structure */}
        <div className="opacity-50 pointer-events-none">
          <div className="mb-20px">
            <label htmlFor="tenantId" className="block mb-6px font-medium text-gray-700">
              Select Your Tenant Profile
            </label>
            <select
              id="tenantId"
              name="tenantId"
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
              disabled
            >
              <option value={0}>-- Select Tenant Profile --</option>
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
              value={amount === 0 ? "" : amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-inner bg-white focus:(outline-none ring-2 ring-blue-400)"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              disabled
            />
          </div>

          <div className="mb-20px">
            <label className="block mb-6px font-medium text-gray-700">
              Payment Method
            </label>
            <div className="space-y-2">
              <div className="flex items-center p-3 border border-gray-300 rounded-lg bg-gray-50">
                <input
                  type="radio"
                  id="card"
                  name="paymentMethod"
                  value="card"
                  disabled
                  className="mr-2"
                />
                <label htmlFor="card" className="flex items-center">
                  💳 Credit/Debit Card
                </label>
              </div>
              <div className="flex items-center p-3 border border-gray-300 rounded-lg bg-gray-50">
                <input
                  type="radio"
                  id="bank"
                  name="paymentMethod"
                  value="bank"
                  disabled
                  className="mr-2"
                />
                <label htmlFor="bank" className="flex items-center">
                  🏦 Bank Account (ACH)
                </label>
              </div>
            </div>
          </div>

          <button 
            type="button" 
            disabled
            className="bg-blue-500 text-white py-10px px-20px rounded-8px text-14px opacity-50 cursor-not-allowed"
          >
            Pay Now (Coming Soon)
          </button>
        </div>

        <div className="flex flex-wrap gap-12px mt-24px border-t border-gray-200 pt-24px">
          <Link 
            to="/payments"
            className="bg-blue-500 text-white py-10px px-20px rounded-8px text-14px hover:bg-blue-700 inline-block"
          >
            View Payment History
          </Link>
          
          <Link 
            to="/editcontact"
            className="bg-gray-400 text-white py-10px px-20px rounded-8px text-14px hover:bg-gray-500 inline-block"
          >
            Update Contact Info
          </Link>
        </div>
      </div>

      {/* Information Box */}
      <div className="bg-white text-gray-800 shadow-lg p-24px rounded-12px border border-gray-300">
        <h3 className="font-semibold text-lg mb-3">💡 Payment Information</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            <strong>Rent Due Date:</strong> Check your lease agreement for specific due dates
          </p>
          <p>
            <strong>Late Fees:</strong> May apply after the grace period specified in your lease
          </p>
          <p>
            <strong>Questions?</strong> Contact your landlord through the contact information provided in your lease
          </p>
        </div>
      </div>
    </div>
  );
}