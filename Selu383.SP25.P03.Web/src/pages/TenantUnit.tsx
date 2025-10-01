import { useEffect, useState } from "react";

interface UnitDto {
  id: number;
  unitNumber: string;
  status: string;
  rent: number;
  description: string;
}

function TenantUnit() {
  const [unit, setUnit] = useState<UnitDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUnit = async () => {
      try {
        const response = await fetch("/api/tenants/me/unit", {
          credentials: "include", // send cookies if using Identity auth
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch unit");
        }

        const data: UnitDto = await response.json();
        setUnit(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUnit();
  }, []);

  if (loading) return <p className="text-gray-500">Loading your unit...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  if (!unit) {
    return <p className="text-gray-700">You don’t currently have a unit assigned.</p>;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Unit</h2>
      <p><strong>Unit Number:</strong> {unit.unitNumber}</p>
      <p><strong>Status:</strong> {unit.status}</p>
      <p><strong>Rent:</strong> ${unit.rent}</p>
      <p><strong>Description:</strong> {unit.description}</p>
    </div>
  );
}

export default TenantUnit;