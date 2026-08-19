"use client";

import React, { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { 
  Package, 
  Search, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from "lucide-react";

// Product Data Schema
interface Product {
  id: string;
  name: string;
  barcode: string;
  price: number;
  stock: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  updatedAt: string;
}

// Initial Mock Data
const MOCK_PRODUCTS: Product[] = [
  { id: "1", name: "Premium Laser Scanner", barcode: "019019808123", price: 299.99, stock: 45, status: "In Stock", updatedAt: "2026-08-19" },
  { id: "2", name: "Heavy Duty Rugged Tablet", barcode: "088591123456", price: 850.00, stock: 8, status: "Low Stock", updatedAt: "2026-08-18" },
  { id: "3", name: "RFID Smart Tags (100pk)", barcode: "072517822998", price: 49.50, stock: 120, status: "In Stock", updatedAt: "2026-08-17" },
  { id: "4", name: "Industrial Label Printer", barcode: "049000007894", price: 420.00, stock: 0, status: "Out of Stock", updatedAt: "2026-08-15" },
  { id: "5", name: "Bluetooth Inventory Scanner", barcode: "079357318922", price: 189.00, stock: 15, status: "In Stock", updatedAt: "2026-08-14" },
  { id: "6", name: "Mountable Fixed-Mount Scanner", barcode: "044000012342", price: 599.00, stock: 3, status: "Low Stock", updatedAt: "2026-08-10" },
  { id: "7", name: "USB Cradle Charger", barcode: "085002134599", price: 35.00, stock: 50, status: "In Stock", updatedAt: "2026-08-08" },
];

export default function ProductsPage() {
  const [data, setData] = useState<Product[]>(MOCK_PRODUCTS);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // Define Columns
  const columns = React.useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1.5 font-semibold text-xs uppercase tracking-wider text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <span>Product Name</span>
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        ),
        cell: (info) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200/50 dark:border-zinc-700/50">
              <Package className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            </div>
            <span className="font-semibold text-zinc-950 dark:text-zinc-50 text-sm">{info.getValue() as string}</span>
          </div>
        ),
      },
      {
        accessorKey: "barcode",
        header: () => <span className="font-semibold text-xs uppercase tracking-wider text-zinc-500">Barcode</span>,
        cell: (info) => <code className="text-xs font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded border border-zinc-200/50 dark:border-zinc-700/50">{info.getValue() as string}</code>,
      },
      {
        accessorKey: "price",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1.5 font-semibold text-xs uppercase tracking-wider text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <span>Price</span>
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        ),
        cell: (info) => <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">${(info.getValue() as number).toFixed(2)}</span>,
      },
      {
        accessorKey: "stock",
        header: () => <span className="font-semibold text-xs uppercase tracking-wider text-zinc-500">Stock Qty</span>,
        cell: (info) => <span className="font-medium text-zinc-600 dark:text-zinc-400 text-sm">{info.getValue() as number} items</span>,
      },
      {
        accessorKey: "status",
        header: () => <span className="font-semibold text-xs uppercase tracking-wider text-zinc-500">Status</span>,
        cell: (info) => {
          const val = info.getValue() as string;
          let colorClass = "";
          let Icon = CheckCircle2;
          if (val === "In Stock") {
            colorClass = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30";
            Icon = CheckCircle2;
          } else if (val === "Low Stock") {
            colorClass = "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/30";
            Icon = AlertTriangle;
          } else {
            colorClass = "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-100 dark:border-rose-900/30";
            Icon = XCircle;
          }
          return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClass}`}>
              <Icon className="w-3.5 h-3.5" />
              <span>{val}</span>
            </span>
          );
        },
      },
      {
        accessorKey: "updatedAt",
        header: () => <span className="font-semibold text-xs uppercase tracking-wider text-zinc-500">Last Synced</span>,
        cell: (info) => <span className="text-xs text-zinc-500 dark:text-zinc-400">{info.getValue() as string}</span>,
      },
    ],
    []
  );

  // Setup Table Hook
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
            <Package className="w-6 h-6 text-cyan-500" />
            <span>Products Database</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            Displaying mock inventory synced from local database. Powered by TanStack Table.
          </p>
        </div>
        <div>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-medium text-sm transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products, barcodes, states..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder-muted-foreground text-foreground"
          />
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border text-foreground font-medium text-sm hover:bg-muted/40 transition-colors">
          <Filter className="w-4 h-4" />
          <span>Filters</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="border border-border rounded-xl bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr 
                  key={headerGroup.id}
                  className="border-b border-border bg-muted/50"
                >
                  {headerGroup.headers.map((header) => (
                    <th 
                      key={header.id} 
                      className="px-6 py-4 font-semibold text-muted-foreground text-xs"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border">
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr 
                    key={row.id}
                    className="hover:bg-muted/30 transition-colors bg-card text-foreground"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 align-middle">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    No products found. Try adjusting your search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
          <span className="text-xs text-muted-foreground">
            Showing Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-foreground text-xs font-semibold hover:bg-muted/40 transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-foreground text-xs font-semibold hover:bg-muted/40 transition-colors disabled:opacity-40"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
