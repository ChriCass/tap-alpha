import type { StoreInfo } from "../../types";

interface FooterProps {
  store: StoreInfo | null;
}

export function Footer({ store }: FooterProps) {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-gray-500">
        <p className="font-medium text-gray-700">{store?.name}</p>
        {store?.email && <p>{store.email}</p>}
        {store?.phone && <p>{store.phone}</p>}
      </div>
    </footer>
  );
}
