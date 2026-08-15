import { Link } from "react-router-dom";

interface HeaderProps {
  storeName: string;
}

export function Header({ storeName }: HeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center px-4">
        <Link to="/" className="text-lg font-semibold tracking-tight text-gray-900">
          {storeName}
        </Link>
      </div>
    </header>
  );
}
