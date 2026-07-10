import React, { useEffect, useRef, useState } from "react";
import Pagination from "../components/Pagination";
import { agentAPI, loadAPI, paymentAPI, receiptAPI } from "../services/api";

import Button from "../components/Button";
import Form from "../components/Form";
import Modal from "../components/Modal";
import { formatDate } from "../utils/dateUtils";
import { showConfirm, showError, showSuccess } from "../utils/toast";

// Status badge colors — shared with the Invoices design
const STATUS_STYLES = {
  paid: "bg-green-100 text-green-800",
  partial: "bg-yellow-100 text-yellow-800",
  unpaid: "bg-red-100 text-red-800",
};

// Money formatter — 2 decimals, matches the Invoices projection
const fmt = (n) =>
  (n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// 📊 Compact summary card — matches the Invoices/InvoicesReport design language
const SummaryCard = ({ title, value, icon, color = "blue" }) => {
  const accent =
    {
      blue: {
        border: "border-blue-500",
        box: "bg-blue-500",
        text: "text-blue-600",
      },
      green: {
        border: "border-green-500",
        box: "bg-green-500",
        text: "text-green-600",
      },
      red: {
        border: "border-red-500",
        box: "bg-red-500",
        text: "text-red-600",
      },
      purple: {
        border: "border-purple-500",
        box: "bg-purple-500",
        text: "text-purple-600",
      },
      orange: {
        border: "border-orange-500",
        box: "bg-orange-500",
        text: "text-orange-600",
      },
    }[color] || {};

  return (
    <div
      className={`bg-white rounded-lg shadow p-3 flex items-center gap-3 border-l-4 ${accent.border}`}
    >
      <div className={`${accent.box} p-2 rounded-lg`}>
        <span className="text-white text-sm">{icon}</span>
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide">{title}</p>
        <p className={`text-base font-bold ${accent.text}`}>{value}</p>
      </div>
    </div>
  );
};

const MultiSearchableSelect = ({
  label,
  value = [],
  onChange,
  options,
  placeholder = "All",
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase()),
  );

  const toggle = (val) => {
    onChange(
      value.includes(val) ? value.filter((v) => v !== val) : [...value, val],
    );
  };

  const displayLabel =
    value.length === 0
      ? placeholder
      : value.length === 1
        ? value[0]
        : `${value.length} selected`;

  return (
    <div className="flex flex-col gap-1" ref={ref}>
      <label className="text-xs text-gray-500 font-medium">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-44 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 flex justify-between items-center"
        >
          <span
            className={
              value.length ? "text-gray-800 truncate" : "text-gray-400"
            }
          >
            {displayLabel}
          </span>
          <svg
            className="w-4 h-4 text-gray-400 shrink-0 ml-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {open && (
          <div
            className="absolute z-50 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="p-2">
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {value.length > 0 && (
              <div className="px-3 pb-2">
                <button
                  onClick={() => onChange([])}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Clear all
                </button>
              </div>
            )}
            <ul className="max-h-48 overflow-y-auto">
              {filtered.map((o) => (
                <li
                  key={o}
                  onClick={() => toggle(o)}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 flex items-center gap-2 ${value.includes(o) ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-800"}`}
                >
                  <input
                    type="checkbox"
                    checked={value.includes(o)}
                    onChange={() => {}}
                    className="pointer-events-none"
                  />
                  {o}
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-sm text-gray-400">No results</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default function Payments() {
  const STATUS_OPTIONS = ["paid", "partial", "unpaid"];
  const [payments, setPayments] = useState([]);
  const [loads, setLoads] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("vehicle-acquisition");
  const [searchQuery, setSearchQuery] = useState("");
  // const [statusFilter, setStatusFilter] = useState('unpaid');
  const [statusFilter, setStatusFilter] = useState(["unpaid"]);

  // Additional filters
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [companyDriverFilter, setCompanyDriverFilter] = useState("");
  const [agentFilter, setAgentFilter] = useState("");
  const [agents, setAgents] = useState([]);

  // Installment registration modal
  const [isInstallmentOpen, setIsInstallmentOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [installmentValues, setInstallmentValues] = useState({
    amount: "",
    paid_date: "",
    notes: "",
  });
  const [installmentErrors, setInstallmentErrors] = useState({});

  // Installment edit modal
  const [isEditInstallmentOpen, setIsEditInstallmentOpen] = useState(false);
  const [editingInstallmentId, setEditingInstallmentId] = useState(null);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editInstallmentValues, setEditInstallmentValues] = useState({
    amount: "",
    paid_date: "",
    notes: "",
  });
  const [editInstallmentErrors, setEditInstallmentErrors] = useState({});

  useEffect(() => {
    fetchPayments(); // status is applied client-side (defaults to 'unpaid')
    fetchLoads();
    agentAPI
      .getAll()
      .then((res) => setAgents(res.data))
      .catch(() => {});
  }, []);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const response = await paymentAPI.getAll();
      setPayments(response.data);
    } catch (error) {
      showError("Failed to fetch payments");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLoads = async () => {
    try {
      const response = await loadAPI.getAll();
      setLoads(response.data);
    } catch (error) {
      showError("Failed to fetch loads");
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query) {
      fetchPayments();
      return;
    }

    try {
      setIsLoading(true);
      const response = await paymentAPI.search(query);
      setPayments(response.data);
    } catch (error) {
      showError("Failed to search payments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterByStatus = (status) => {
    setStatusFilter(status); // applied client-side in displayPayments
  };

  const handleRegisterInstallment = async (
    paymentId,
    amount,
    paid_date,
    notes,
  ) => {
    if (!amount || amount <= 0) {
      setInstallmentErrors({ amount: "Amount must be greater than 0" });
      return;
    }

    if (!paid_date) {
      setInstallmentErrors({ paid_date: "Payment date is required" });
      return;
    }

    try {
      setIsLoading(true);
      await paymentAPI.registerInstallment(paymentId, {
        amount: parseFloat(amount),
        paid_date,
        notes,
      });
      showSuccess("Installment registered successfully");
      setIsInstallmentOpen(false);
      setSelectedPaymentId(null);
      setInstallmentValues({ amount: "", paid_date: "", notes: "" });
      setInstallmentErrors({});
      fetchPayments();
    } catch (error) {
      showError(
        error.response?.data?.message || "Failed to register installment",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditInstallment = (payment, installment) => {
    setEditingPaymentId(payment._id);
    setEditingInstallmentId(installment._id);
    setEditInstallmentValues({
      amount: installment.amount,
      paid_date: installment.paid_date
        ? new Date(installment.paid_date).toISOString().split("T")[0]
        : "",
      notes: installment.notes || "",
    });
    setEditInstallmentErrors({});
    setIsEditInstallmentOpen(true);
  };

  const handleUpdateInstallment = async (amount, paid_date, notes) => {
    if (!amount || amount <= 0) {
      setEditInstallmentErrors({ amount: "Amount must be greater than 0" });
      return;
    }

    if (!paid_date) {
      setEditInstallmentErrors({ paid_date: "Payment date is required" });
      return;
    }

    try {
      setIsLoading(true);
      await paymentAPI.updateInstallment(
        editingPaymentId,
        editingInstallmentId,
        {
          amount: parseFloat(amount),
          paid_date,
          notes,
        },
      );
      showSuccess("Installment updated successfully");
      setIsEditInstallmentOpen(false);
      setEditingInstallmentId(null);
      setEditingPaymentId(null);
      setEditInstallmentValues({ amount: "", paid_date: "", notes: "" });
      setEditInstallmentErrors({});
      fetchPayments();
    } catch (error) {
      showError(
        error.response?.data?.message || "Failed to update installment",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInstallment = (payment, installment) => {
    showConfirm(
      "Are you sure you want to delete this installment?",
      async () => {
        try {
          setIsLoading(true);
          await paymentAPI.deleteInstallment(payment._id, installment._id);
          showSuccess("Installment deleted successfully");
          fetchPayments();
        } catch (error) {
          showError(
            error.response?.data?.message || "Failed to delete installment",
          );
        } finally {
          setIsLoading(false);
        }
      },
    );
  };

  const handlePrintReceipt = async (payment) => {
    try {
      setPrintingReceiptId(payment._id);
      let response;

      if (payment.payment_type === "vehicle-acquisition") {
        response = await receiptAPI.generateCompanyReceipt(payment._id);
      } else if (payment.payment_type === "driver-rental") {
        response = await receiptAPI.generateDriverReceipt(payment._id);
      } else {
        showError("Invalid payment type for receipt generation");
        return;
      }

      const blobUrl = URL.createObjectURL(response.data);
      window.open(blobUrl, "_blank");
    } catch (error) {
      showError("Failed to generate receipt");
    } finally {
      setPrintingReceiptId(null);
    }
  };

  const handlePrintInstallmentReceipt = async (payment, installment) => {
    try {
      setPrintingInstallmentId(installment._id);
      let response;

      if (payment.payment_type === "vehicle-acquisition") {
        response = await receiptAPI.generateCompanyInstallmentReceipt(
          payment._id,
          installment._id,
        );
      } else if (payment.payment_type === "driver-rental") {
        response = await receiptAPI.generateDriverInstallmentReceipt(
          payment._id,
          installment._id,
        );
      } else {
        showError("Invalid payment type for receipt generation");
        return;
      }

      const blobUrl = URL.createObjectURL(response.data);
      window.open(blobUrl, "_blank");
    } catch (error) {
      showError("Failed to generate installment receipt");
    } finally {
      setPrintingInstallmentId(null);
    }
  };

  const getSelectedPayment = () => {
    return payments.find((p) => p._id === selectedPaymentId);
  };

  const [printingReceiptId, setPrintingReceiptId] = useState(null);
  const [printingInstallmentId, setPrintingInstallmentId] = useState(null);
  const [expandedPaymentId, setExpandedPaymentId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Reset page when tab or any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    activeTab,
    statusFilter,
    startDateFilter,
    endDateFilter,
    companyDriverFilter,
    agentFilter,
    searchQuery,
  ]);

  const columns = [
    {
      key: "expand",
      label: "",
      render: (_, payment) =>
        payment.installments?.length > 0 && (
          <button
            onClick={() =>
              setExpandedPaymentId(
                expandedPaymentId === payment._id ? null : payment._id,
              )
            }
            className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
          >
            {expandedPaymentId === payment._id ? "Hide" : "Show"}
          </button>
        ),
    },
    { key: "payee", label: "Payee", render: () => "EESA Transport Co." },
    {
      key: "payer",
      label:
        activeTab === "vehicle-acquisition" ? "Company Name" : "Driver Name",
    },
    ...(activeTab === "driver-rental"
      ? [
          {
            key: "agent",
            label: "Agent",
            render: (_, payment) => payment.load_id?.agent_id?.name || "-",
          },
        ]
      : []),
    { key: "plate_no", label: "Vehicle Number" },
    { key: "vehicle_type", label: "Vehicle Type" },
    {
      key: "total_amount",
      label: "Amount",
      render: (amount) => `${fmt(amount)} SR`,
    },
    {
      key: "transaction_date",
      label: "Transaction Date",
      render: (date) => (date ? formatDate(date) : "N/A"),
    },
    {
      key: "total_paid",
      label: "Paid",
      render: (amount) => (
        <span className="text-green-700 font-medium">{fmt(amount)} SR</span>
      ),
    },
    {
      key: "total_due",
      label: "Due",
      render: (amount) => (
        <span className="text-red-700 font-medium">{fmt(amount)} SR</span>
      ),
    },
    {
      key: "payment_type",
      label: "Type",
      render: (payment_type) => (
        <span className="px-3 py-1 rounded text-sm font-medium bg-blue-100 text-blue-800">
          {payment_type === "vehicle-acquisition" && "Vehicle Acq."}
          {payment_type === "driver-rental" && "Driver Rental"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (status) => (
        <span
          className={`px-2 py-1 rounded text-xs font-semibold capitalize ${STATUS_STYLES[status] || "bg-gray-100 text-gray-800"}`}
        >
          {status || "unpaid"}
        </span>
      ),
    },
  ];

  const actions = [
    {
      label: "Register Payment",
      onClick: (payment) => {
        setSelectedPaymentId(payment._id);
        setInstallmentValues({ amount: "", notes: "" });
        setInstallmentErrors({});
        setIsInstallmentOpen(true);
      },
      variant: "success",
    },
  ];

  // Filter payments based on tab and additional filters
  // Search is already handled by backend API (searches by vehicle number)
  // Status is filtered client-side (defaults to 'unpaid')
  const statusFiltered =
    statusFilter.length === 0
      ? payments
      : payments.filter((payment) => statusFilter.includes(payment.status));
  let displayPayments = statusFiltered.filter(
    (p) => p.payment_type === activeTab,
  );

  // Apply additional client-side filters
  if (startDateFilter) {
    displayPayments = displayPayments.filter((p) => {
      if (!p.transaction_date) return false;
      return new Date(p.transaction_date) >= new Date(startDateFilter);
    });
  }

  if (endDateFilter) {
    displayPayments = displayPayments.filter((p) => {
      if (!p.transaction_date) return false;
      return new Date(p.transaction_date) <= new Date(endDateFilter);
    });
  }

  if (companyDriverFilter) {
    displayPayments = displayPayments.filter((p) => {
      const payee = p.payee?.toLowerCase() || "";
      const payer = p.payer?.toLowerCase() || "";
      const filter = companyDriverFilter.toLowerCase();
      return payee.includes(filter) || payer.includes(filter);
    });
  }

  if (agentFilter && activeTab === "driver-rental") {
    displayPayments = displayPayments.filter((p) => {
      const agentName = p.load_id?.agent_id?.name?.toLowerCase() || "";
      return agentName.includes(agentFilter.toLowerCase());
    });
  }

  const vehicleAcqCount = statusFiltered.filter(
    (p) => p.payment_type === "vehicle-acquisition",
  ).length;
  const driverRentalCount = statusFiltered.filter(
    (p) => p.payment_type === "driver-rental",
  ).length;

  const selectedPayment = getSelectedPayment();

  // 📊 Calculate Summary Statistics
  const calculateSummary = () => {
    if (!displayPayments || displayPayments.length === 0) {
      return { totalAmount: 0, totalPaid: 0, totalDue: 0, count: 0 };
    }

    const totalAmount = displayPayments.reduce(
      (sum, p) => sum + (p.total_amount || 0),
      0,
    );
    const totalPaid = displayPayments.reduce(
      (sum, p) => sum + (p.total_paid || 0),
      0,
    );
    const totalDue = displayPayments.reduce(
      (sum, p) => sum + (p.total_due || 0),
      0,
    );
    const count = displayPayments.length;

    return { totalAmount, totalPaid, totalDue, count };
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Payments
        </h1>
        <p className="text-gray-600 text-xs md:text-sm mt-1">
          Manage payment records and installments. Payments are automatically
          created when you create rental transactions.
        </p>
      </div>

      {/* Info Banner */}
      {/* <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800 text-sm">
          <strong>ℹ️ Info:</strong> Payments are automatically created when vehicles are added or loads are created.
          Use "Register Payment" to record installments. Status updates: unpaid → partial → paid
        </p>
      </div> */}

      {/* Summary Cards — top of page */}
      {displayPayments.length > 0 &&
        (() => {
          const summary = calculateSummary();
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <SummaryCard
                title="Total Amount"
                value={`${fmt(summary.totalAmount)} SR`}
                icon="💰"
                color="blue"
              />
              <SummaryCard
                title="Total Paid"
                value={`${fmt(summary.totalPaid)} SR`}
                icon="✅"
                color="green"
              />
              <SummaryCard
                title="Total Due"
                value={`${fmt(summary.totalDue)} SR`}
                icon="⏳"
                color="red"
              />
              <SummaryCard
                title="Total Payments"
                value={summary.count}
                icon="📋"
                color="purple"
              />
            </div>
          );
        })()}

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => {
            setActiveTab("vehicle-acquisition");
            setAgentFilter("");
          }}
          className={`px-4 py-3 font-medium transition-colors border-b-2 ${
            activeTab === "vehicle-acquisition"
              ? "text-blue-600 border-blue-600"
              : "text-gray-600 border-transparent hover:text-gray-800"
          }`}
        >
          Vehicle Details{" "}
          <span className="text-xs text-gray-500 ml-2">
            ({vehicleAcqCount})
          </span>
        </button>
        <button
          onClick={() => setActiveTab("driver-rental")}
          className={`px-4 py-3 font-medium transition-colors border-b-2 ${
            activeTab === "driver-rental"
              ? "text-blue-600 border-blue-600"
              : "text-gray-600 border-transparent hover:text-gray-800"
          }`}
        >
          Driver Rental{" "}
          <span className="text-xs text-gray-500 ml-2">
            ({driverRentalCount})
          </span>
        </button>
      </div>

      {/* Filters — Invoices-style panel (in place of the summary tiles) */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by vehicle number..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => handleFilterByStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Status</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partially Paid</option>
              <option value="paid">Paid</option>
            </select>
          </div> */}
          <MultiSearchableSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS}
            placeholder="All Status"
          />
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To Date</label>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Company / Driver
            </label>
            <input
              type="text"
              placeholder="Filter by name..."
              value={companyDriverFilter}
              onChange={(e) => setCompanyDriverFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
            />
          </div>
          {activeTab === "driver-rental" && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Agent</label>
              <select
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Agents</option>
                {agents.map((agent) => (
                  <option key={agent._id} value={agent.name}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Payments Table with Nested History */}
      <div className="mb-8">
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(displayPayments.length / pageSize)}
          totalItems={displayPayments.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
        <div className="overflow-x-auto bg-white rounded-lg shadow mt-3">
          <table className="w-full border-collapse min-w-max">
            <thead>
              <tr className="bg-gray-100 border-b">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-3 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-gray-800 whitespace-nowrap"
                  >
                    {col.label}
                  </th>
                ))}
                <th className="px-3 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-gray-800 whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {displayPayments
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((payment) => (
                  <React.Fragment key={payment._id}>
                    {/* Main payment row */}
                    <tr className="border-b hover:bg-gray-50">
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-700"
                        >
                          {col.render
                            ? col.render(payment[col.key], payment)
                            : payment[col.key]}
                        </td>
                      ))}
                      <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-700">
                        <div className="flex gap-1 md:gap-2 flex-wrap">
                          <button
                            onClick={() => {
                              setSelectedPaymentId(payment._id);
                              setInstallmentValues({ amount: "", notes: "" });
                              setInstallmentErrors({});
                              setIsInstallmentOpen(true);
                            }}
                            className="px-3 py-1 bg-green-100 text-green-800 rounded text-xs font-medium hover:bg-green-200 transition-colors"
                          >
                            Pay
                          </button>
                          <button
                            onClick={() => handlePrintReceipt(payment)}
                            disabled={printingReceiptId === payment._id}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium hover:bg-blue-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {printingReceiptId === payment._id
                              ? "Printing..."
                              : "Print Receipt"}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded history row */}
                    {expandedPaymentId === payment._id &&
                      payment.installments &&
                      payment.installments.length > 0 && (
                        <tr className="bg-blue-50 border-b">
                          <td
                            colSpan={columns.length + 1}
                            className="px-6 py-4"
                          >
                            <div className="space-y-3">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                  <strong>Progress:</strong>{" "}
                                  {fmt(payment.total_paid)} SR /{" "}
                                  {fmt(payment.total_amount)} SR
                                </span>
                                <span className="text-gray-600">
                                  <strong>
                                    {payment.total_amount > 0
                                      ? Math.round(
                                          (payment.total_paid /
                                            payment.total_amount) *
                                            100,
                                        )
                                      : 0}
                                    %
                                  </strong>
                                </span>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-sm bg-white border border-gray-200 rounded">
                                  <thead className="bg-gray-100 border-b border-gray-200">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-gray-700">
                                        #
                                      </th>
                                      <th className="px-4 py-2 text-left text-gray-700">
                                        Amount
                                      </th>
                                      <th className="px-4 py-2 text-left text-gray-700">
                                        Date Paid
                                      </th>
                                      <th className="px-4 py-2 text-left text-gray-700">
                                        Notes
                                      </th>
                                      <th className="px-4 py-2 text-left text-gray-700">
                                        Actions
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {payment.installments.map(
                                      (installment, idx) => (
                                        <tr
                                          key={installment._id}
                                          className="border-b border-gray-200 hover:bg-gray-50"
                                        >
                                          <td className="px-4 py-2 text-gray-800">
                                            {idx + 1}
                                          </td>
                                          <td className="px-4 py-2 text-gray-800">
                                            {fmt(installment.amount)} SR
                                          </td>
                                          <td className="px-4 py-2 text-gray-800">
                                            {installment.paid_date
                                              ? formatDate(
                                                  installment.paid_date,
                                                )
                                              : "N/A"}
                                          </td>
                                          <td className="px-4 py-2 text-gray-800">
                                            {installment.notes || "-"}
                                          </td>
                                          <td className="px-4 py-2 text-gray-800">
                                            <div className="flex gap-2 flex-wrap">
                                              <button
                                                onClick={() =>
                                                  handlePrintInstallmentReceipt(
                                                    payment,
                                                    installment,
                                                  )
                                                }
                                                disabled={
                                                  printingInstallmentId ===
                                                  installment._id
                                                }
                                                className="px-3 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium hover:bg-purple-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                              >
                                                {printingInstallmentId ===
                                                installment._id
                                                  ? "Printing..."
                                                  : "Print"}
                                              </button>
                                              <button
                                                onClick={() =>
                                                  handleEditInstallment(
                                                    payment,
                                                    installment,
                                                  )
                                                }
                                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
                                              >
                                                Edit
                                              </button>
                                              <button
                                                onClick={() =>
                                                  handleDeleteInstallment(
                                                    payment,
                                                    installment,
                                                  )
                                                }
                                                className="px-3 py-1 bg-red-100 text-red-800 rounded text-xs font-medium hover:bg-red-200 transition-colors"
                                              >
                                                Delete
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      ),
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                  </React.Fragment>
                ))}
            </tbody>
          </table>
        </div>

        {displayPayments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No payments found
          </div>
        )}
      </div>

      {/* Register Installment Modal */}
      <Modal
        isOpen={isInstallmentOpen}
        onClose={() => {
          setIsInstallmentOpen(false);
          setSelectedPaymentId(null);
          setInstallmentValues({ amount: "", paid_date: "", notes: "" });
          setInstallmentErrors({});
        }}
        title="Register Payment"
        size="lg"
        footer={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsInstallmentOpen(false);
                setSelectedPaymentId(null);
                setInstallmentValues({ amount: "", paid_date: "", notes: "" });
                setInstallmentErrors({});
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                handleRegisterInstallment(
                  selectedPaymentId,
                  installmentValues.amount,
                  installmentValues.paid_date,
                  installmentValues.notes,
                )
              }
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Register Payment"}
            </Button>
          </div>
        }
      >
        {selectedPayment && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Total Amount:</strong>{" "}
                {fmt(selectedPayment.total_amount)} SR
              </p>
              <p className="text-sm text-gray-600">
                <strong>Already Paid:</strong> {fmt(selectedPayment.total_paid)}{" "}
                SR
              </p>
              <p className="text-sm text-gray-600">
                <strong>Remaining Due:</strong> {fmt(selectedPayment.total_due)}{" "}
                SR
              </p>
            </div>

            <Form
              fields={[
                {
                  name: "amount",
                  label: "Amount to Pay",
                  type: "number",
                  placeholder: `Max: ${fmt(selectedPayment.total_due)} SR`,
                  required: true,
                },
                {
                  name: "paid_date",
                  label: "Payment Date",
                  type: "date",
                  required: true,
                },
                {
                  name: "notes",
                  label: "Notes (Optional)",
                  type: "textarea",
                  placeholder: "Enter notes for this payment",
                },
              ]}
              values={installmentValues}
              errors={installmentErrors}
              onChange={setInstallmentValues}
              isLoading={isLoading}
            />
          </div>
        )}
      </Modal>

      {/* Edit Installment Modal */}
      <Modal
        isOpen={isEditInstallmentOpen}
        onClose={() => {
          setIsEditInstallmentOpen(false);
          setEditingInstallmentId(null);
          setEditingPaymentId(null);
          setEditInstallmentValues({ amount: "", paid_date: "", notes: "" });
          setEditInstallmentErrors({});
        }}
        title="Edit Installment"
        size="lg"
        footer={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditInstallmentOpen(false);
                setEditingInstallmentId(null);
                setEditingPaymentId(null);
                setEditInstallmentValues({
                  amount: "",
                  paid_date: "",
                  notes: "",
                });
                setEditInstallmentErrors({});
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                handleUpdateInstallment(
                  editInstallmentValues.amount,
                  editInstallmentValues.paid_date,
                  editInstallmentValues.notes,
                )
              }
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Update Installment"}
            </Button>
          </div>
        }
      >
        <Form
          fields={[
            {
              name: "amount",
              label: "Amount to Pay",
              type: "number",
              placeholder: "Enter amount",
              required: true,
            },
            {
              name: "paid_date",
              label: "Payment Date",
              type: "date",
              required: true,
            },
            {
              name: "notes",
              label: "Notes (Optional)",
              type: "textarea",
              placeholder: "Enter notes for this payment",
            },
          ]}
          values={editInstallmentValues}
          errors={editInstallmentErrors}
          onChange={setEditInstallmentValues}
          isLoading={isLoading}
        />
      </Modal>
    </div>
  );
}
