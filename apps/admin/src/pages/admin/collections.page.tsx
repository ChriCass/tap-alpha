import { useCallback, useEffect, useState } from "react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { LoadingSpinner } from "../../components/common/loading-spinner";
import { api } from "../../services/api";
import type { Collection } from "../../types";

export function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const res = await api.getCollections();
    setCollections(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Colecciones</h1>
        <Button>+ Nueva colección</Button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
          {collections.map((c) => (
            <Card key={c.id}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold mb-1">{c.name}</h3>
                  <p className="text-xs text-gray-500">
                    {c.type === "manual" ? "Manual" : "Automática"} ·{" "}
                    {c.products_count ?? 0} productos
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm">Editar</Button>
                  <Button variant="ghost" size="sm" className="!text-red-600">Eliminar</Button>
                </div>
              </div>
            </Card>
          ))}
          {collections.length === 0 && (
            <p className="text-gray-500">No hay colecciones aún</p>
          )}
        </div>
      )}
    </div>
  );
}
