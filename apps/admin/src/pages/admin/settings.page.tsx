import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";

export function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Configuración</h1>

      <div className="max-w-[640px]">
        <Card>
          <h2 className="text-base font-semibold mb-4">Datos de la tienda</h2>
          <div className="flex flex-col gap-4">
            <Input label="Nombre de la tienda" name="store_name" defaultValue="Mi Tienda" />
            <Input label="Email de contacto" name="email" type="email" defaultValue="contacto@mitienda.com" />
            <Input label="Teléfono" name="phone" type="tel" />
            <Input label="Dirección fiscal" name="address" />
          </div>
          <div className="mt-6">
            <Button>Guardar cambios</Button>
          </div>
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
    </div>
  );
}
