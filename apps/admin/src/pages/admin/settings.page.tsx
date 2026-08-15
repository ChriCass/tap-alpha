import { useEffect, useState } from "react";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { LoadingSpinner } from "../../components/common/loading-spinner";
import { useToast } from "../../components/polaris";
import { api } from "../../services/api";
import type { StoreSetting } from "../../types";

export function SettingsPage() {
  const [store, setStore] = useState<StoreSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast, toastMarkup } = useToast();

  useEffect(() => {
    api
      .getStoreSettings()
      .then((res) => setStore(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!store) return;

    setSaving(true);
    try {
      const res = await api.updateStoreSettings({
        name: store.name,
        email: store.email,
        phone: store.phone,
        address: store.address,
      });
      setStore(res.data);
      showToast("Datos de la tienda guardados");
    } catch {
      showToast("No se pudieron guardar los cambios", "critical");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Configuración</h1>

      <div className="max-w-[640px]">
        <Card>
          <h2 className="text-base font-semibold mb-4">Datos de la tienda</h2>
          {loading || !store ? (
            <LoadingSpinner />
          ) : (
            <>
              <div className="flex flex-col gap-4">
                <Input
                  label="Nombre de la tienda"
                  name="store_name"
                  value={store.name}
                  onChange={(e) => setStore({ ...store, name: e.target.value })}
                />
                <Input
                  label="Email de contacto"
                  name="email"
                  type="email"
                  value={store.email ?? ""}
                  onChange={(e) => setStore({ ...store, email: e.target.value })}
                />
                <Input
                  label="Teléfono"
                  name="phone"
                  type="tel"
                  value={store.phone ?? ""}
                  onChange={(e) => setStore({ ...store, phone: e.target.value })}
                />
                <Input
                  label="Dirección fiscal"
                  name="address"
                  value={store.address ?? ""}
                  onChange={(e) => setStore({ ...store, address: e.target.value })}
                />
              </div>
              <div className="mt-6">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Guardando…" : "Guardar cambios"}
                </Button>
              </div>
            </>
          )}
        </Card>

        <div className="mt-6">
          <Card>
            <h2 className="text-base font-semibold mb-4">Envíos</h2>
            <div className="flex flex-col gap-4">
              <Input label="Costo de envío base (S/)" name="shipping_base" type="number" defaultValue="15.00" />
              <Input label="Envío gratis desde (S/)" name="free_shipping" type="number" defaultValue="200.00" />
            </div>
            <div className="mt-6">
              <Button>Guardar cambios</Button>
            </div>
          </Card>
        </div>
      </div>

      {toastMarkup}
    </div>
  );
}
