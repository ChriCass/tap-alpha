import { useState } from "react";
import { Modal, PButton } from "../polaris";
import { normalizeHeader, parseCsv } from "../../utils/csv";
import { api } from "../../services/api";
import type { ProductFilterOptions, ProductInput, ProductStatus } from "../../types";

interface ProductImportModalProps {
  open: boolean;
  options: ProductFilterOptions | null;
  onClose: () => void;
  onImported: (count: number) => void;
}

interface ParsedRow {
  input: ProductInput;
  label: string;
}

const COLUMN_ALIASES: Record<string, string> = {
  nombre: "name",
  name: "name",
  titulo: "name",
  precio: "price",
  price: "price",
  estado: "status",
  status: "status",
  proveedor: "vendor",
  vendor: "vendor",
  categoria: "category",
  category: "category",
  sku: "sku",
  stock: "stock",
  inventario: "stock",
  etiquetas: "tags",
  tags: "tags",
  descripcion: "description",
  description: "description",
};

const STATUSES: ProductStatus[] = ["draft", "active", "archived"];

export function ProductImportModal({
  open,
  options,
  onClose,
  onImported,
}: ProductImportModalProps) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [failures, setFailures] = useState<string[]>([]);

  const reset = () => {
    setRows([]);
    setParseError(null);
    setFailures([]);
    setImporting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = async (file: File) => {
    setParseError(null);
    setFailures([]);

    const table = parseCsv(await file.text());

    if (table.length < 2) {
      setParseError("El archivo no tiene filas de datos.");
      setRows([]);

      return;
    }

    const headers = table[0].map((header) => COLUMN_ALIASES[normalizeHeader(header)] ?? "");

    if (!headers.includes("name")) {
      setParseError('Falta la columna "nombre" (o "name") en la cabecera.');
      setRows([]);

      return;
    }

    const parsed: ParsedRow[] = [];

    for (const line of table.slice(1)) {
      const record: Record<string, string> = {};

      headers.forEach((key, index) => {
        if (key) record[key] = line[index] ?? "";
      });

      if (!record.name) continue;

      const status = STATUSES.includes(record.status as ProductStatus)
        ? (record.status as ProductStatus)
        : "draft";
      const categoryId = options?.categories.find(
        (category) => normalizeHeader(category.name) === normalizeHeader(record.category ?? ""),
      )?.id;

      parsed.push({
        label: record.name,
        input: {
          name: record.name,
          description: record.description || null,
          base_price: Number(record.price ?? 0) || 0,
          status,
          vendor: record.vendor || null,
          category_id: categoryId ?? null,
          tags: record.tags ? record.tags.split("|").map((tag) => tag.trim()) : [],
          variants: [
            {
              sku: record.sku || `${slugify(record.name)}-1`,
              name: "Default Title",
              price_adjustment: 0,
              stock: Number(record.stock ?? 0) || 0,
            },
          ],
        },
      });
    }

    setRows(parsed);
  };

  const handleImport = async () => {
    setImporting(true);
    const errors: string[] = [];
    let imported = 0;

    for (const row of rows) {
      try {
        await api.createProduct(row.input);
        imported++;
      } catch (error) {
        errors.push(`${row.label}: ${(error as Error).message}`);
      }
    }

    setImporting(false);
    setFailures(errors);

    if (imported > 0) {
      onImported(imported);
    }

    if (errors.length === 0) {
      handleClose();
    }
  };

  return (
    <Modal
      open={open}
      title="Importar productos por CSV"
      onClose={handleClose}
      footer={
        <>
          <PButton onClick={handleClose} disabled={importing}>
            Cancelar
          </PButton>
          <PButton
            variant="primary"
            onClick={handleImport}
            disabled={rows.length === 0 || importing}
          >
            {importing ? "Importando…" : `Importar ${rows.length || ""} productos`}
          </PButton>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-[13px] text-ink-sub">
          Columnas admitidas: <code>nombre</code>, <code>precio</code>, <code>estado</code>,{" "}
          <code>proveedor</code>, <code>categoria</code>, <code>sku</code>,{" "}
          <code>stock</code>, <code>etiquetas</code> (separadas por <code>|</code>) y{" "}
          <code>descripcion</code>.
        </p>

        <label className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-dashed border-line-strong bg-surface-sub px-4 py-6 text-center transition-colors hover:bg-surface-hover">
          <span className="text-[13px] font-medium text-ink">Selecciona un archivo CSV</span>
          <span className="text-xs text-ink-sub">o arrástralo sobre esta zona</span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
        </label>

        {parseError && <p className="text-[13px] text-critical-ink">{parseError}</p>}

        {rows.length > 0 && (
          <div className="max-h-48 overflow-y-auto rounded-lg border border-line">
            <table className="w-full text-[13px]">
              <thead className="bg-surface-sub text-ink-sub">
                <tr>
                  <th className="px-3 py-1.5 text-left font-medium">Producto</th>
                  <th className="px-3 py-1.5 text-right font-medium">Precio</th>
                  <th className="px-3 py-1.5 text-right font-medium">Stock</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index} className="border-t border-line">
                    <td className="px-3 py-1.5">{row.label}</td>
                    <td className="px-3 py-1.5 text-right">{row.input.base_price}</td>
                    <td className="px-3 py-1.5 text-right">{row.input.variants?.[0]?.stock ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {failures.length > 0 && (
          <div className="rounded-lg bg-critical-bg px-3 py-2 text-[13px] text-critical-ink">
            <p className="font-medium">No se pudieron importar {failures.length} filas:</p>
            <ul className="mt-1 list-disc pl-4">
              {failures.slice(0, 5).map((failure) => (
                <li key={failure}>{failure}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
