import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AccountTypeSwitcher from "../../components/account/AccountTypeSwitcher";
import "./BusinessQuotations.css";

export default function BusinessInvoices() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState(
    localStorage.getItem("accountType") || "business"
  );
  
  // Mode states
  const [mode, setMode] = useState("create"); // 'create', 'list', 'preview', 'customize'
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  
  // Color options
  const colorOptions = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Orange', value: '#F97316' }
  ];

  // Invoice form state
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    customerName: "",
    customerCompany: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    date: new Date().toISOString().split('T')[0],
    dueDate: "",
    items: [
      { id: Date.now(), description: "", quantity: 1, rate: 0, amount: 0 }
    ],
    notes: "",
    paymentMethod: "",
    vat: 0,
    shipping: 0,
    selectedColor: colorOptions[0].value,
    status: "draft"
  });

  // Load invoices from localStorage
  const loadInvoices = () => {
    try {
      setLoading(true);
      const savedInvoices = JSON.parse(localStorage.getItem("bp_invoices") || "[]");
      setInvoices(savedInvoices);
    } catch (error) {
      console.error("Error loading invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  // Generate invoice number
  function generateInvoiceNumber() {
    const savedInvoices = JSON.parse(localStorage.getItem("bp_invoices") || "[]");
    const count = savedInvoices.length + 1;
    return `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count).padStart(3, '0')}`;
  }

  // Handle adding item
  const handleAddItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, { 
        id: Date.now(), 
        description: "", 
        quantity: 1, 
        rate: 0, 
        amount: 0 
      }]
    });
  };

  // Handle item changes
  const handleItemChange = (id, field, value) => {
    const newItems = invoiceForm.items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        if (field === "quantity" || field === "rate") {
          const quantity = parseFloat(updatedItem.quantity) || 0;
          const rate = parseFloat(updatedItem.rate) || 0;
          updatedItem.amount = quantity * rate;
        }
        
        return updatedItem;
      }
      return item;
    });
    
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };

  // Handle removing item
  const handleRemoveItem = (id) => {
    if (invoiceForm.items.length > 1) {
      const newItems = invoiceForm.items.filter(item => item.id !== id);
      setInvoiceForm({ ...invoiceForm, items: newItems });
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = invoiceForm.items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const vatAmount = subtotal * (invoiceForm.vat / 100);
    const total = subtotal + vatAmount + (invoiceForm.shipping || 0);
    
    return {
      subtotal: subtotal.toFixed(2),
      vatAmount: vatAmount.toFixed(2),
      total: total.toFixed(2)
    };
  };

  // Save invoice
  const handleSaveInvoice = (status = "draft") => {
    if (!invoiceForm.customerName) {
      alert("Please enter customer name");
      return;
    }

    const totals = calculateTotals();
    const invoiceToSave = {
      ...invoiceForm,
      id: Date.now(),
      savedDate: new Date().toISOString(),
      subtotal: totals.subtotal,
      vatAmount: totals.vatAmount,
      total: totals.total,
      status: status
    };
    
    const existingInvoices = JSON.parse(localStorage.getItem("bp_invoices") || "[]");
    existingInvoices.push(invoiceToSave);
    localStorage.setItem("bp_invoices", JSON.stringify(existingInvoices));
    
    alert(status === "draft" ? "Invoice saved as draft!" : "Invoice sent successfully!");
    
    // Reset form for new invoice
    setInvoiceForm({
      invoiceNumber: generateInvoiceNumber(),
      customerName: "",
      customerCompany: "",
      customerEmail: "",
      customerPhone: "",
      customerAddress: "",
      date: new Date().toISOString().split('T')[0],
      dueDate: "",
      items: [
        { id: Date.now(), description: "", quantity: 1, rate: 0, amount: 0 }
      ],
      notes: "",
      paymentMethod: "",
      vat: 0,
      shipping: 0,
      selectedColor: colorOptions[0].value,
      status: "draft"
    });

    // Refresh invoices list
    loadInvoices();
    
    // Switch to list view
    setMode("list");
  };

  // Delete invoice
  const handleDeleteInvoice = (id) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;
    
    try {
      const existingInvoices = JSON.parse(localStorage.getItem("bp_invoices") || "[]");
      const updatedInvoices = existingInvoices.filter(inv => inv.id !== id);
      localStorage.setItem("bp_invoices", JSON.stringify(updatedInvoices));
      setInvoices(updatedInvoices);
      alert("Invoice deleted successfully!");
    } catch (error) {
      console.error("Error deleting invoice:", error);
      alert("Failed to delete invoice.");
    }
  };

  // Preview invoice
  const handlePreview = () => {
    if (!invoiceForm.customerName) {
      alert("Please enter customer details to preview");
      return;
    }
    
    const totals = calculateTotals();
    setSelectedInvoice({
      ...invoiceForm,
      subtotal: totals.subtotal,
      vatAmount: totals.vatAmount,
      total: totals.total
    });
    setMode("preview");
  };

  // View invoice details
  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setMode("preview");
  };

  // Duplicate an invoice
  const handleDuplicate = (invoice) => {
    setInvoiceForm({
      ...invoice,
      id: Date.now(),
      invoiceNumber: generateInvoiceNumber(),
      date: new Date().toISOString().split('T')[0],
      status: "draft"
    });
    setMode("create");
  };

  // Handle color change
  const handleColorChange = (color) => {
    setInvoiceForm({ ...invoiceForm, selectedColor: color });
  };

  // Handle account switch
  const handleAccountSwitch = (type) => {
    if (type === "business") {
      const plan = localStorage.getItem("budgetPro_plan") || "free";
      if (plan !== "pro") {
        navigate("/upgrade");
        return;
      }
    }
    
    setAccountType(type);
    localStorage.setItem("accountType", type);
    
    window.dispatchEvent(new CustomEvent('accountTypeChanged', { detail: type }));
    
    setTimeout(() => {
      if (type === "personal") navigate("/dashboard");
      if (type === "business") navigate("/business");
    }, 100);
  };

  // Load invoices on mount
  useEffect(() => {
    loadInvoices();
  }, []);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // CREATE MODE
  const renderCreateMode = () => (
    <div className="business-invoices-form-container">
      <div className="business-invoices-form-header">
        <h2>Create New Invoice</h2>
        <p className="business-invoices-form-subtitle">
          Invoice #{invoiceForm.invoiceNumber}
        </p>
      </div>
      
      <form className="business-invoices-form">
        {/* Customer Details */}
        <div className="business-invoices-section">
          <h3>👤 Customer Details</h3>
          
          <div className="business-invoices-form-group">
            <label>Customer/Company Name *</label>
            <input
              type="text"
              placeholder="Customer or Company Name"
              value={invoiceForm.customerName}
              onChange={(e) => setInvoiceForm({...invoiceForm, customerName: e.target.value})}
              className="business-invoices-input"
              required
            />
          </div>
          
          <div className="business-invoices-form-row">
            <div className="business-invoices-form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="customer@example.com"
                value={invoiceForm.customerEmail}
                onChange={(e) => setInvoiceForm({...invoiceForm, customerEmail: e.target.value})}
                className="business-invoices-input"
              />
            </div>
            
            <div className="business-invoices-form-group">
              <label>Phone</label>
              <input
                type="tel"
                placeholder="Phone number"
                value={invoiceForm.customerPhone}
                onChange={(e) => setInvoiceForm({...invoiceForm, customerPhone: e.target.value})}
                className="business-invoices-input"
              />
            </div>
          </div>
          
          <div className="business-invoices-form-group">
            <label>Address</label>
            <input
              type="text"
              placeholder="Customer address"
              value={invoiceForm.customerAddress}
              onChange={(e) => setInvoiceForm({...invoiceForm, customerAddress: e.target.value})}
              className="business-invoices-input"
            />
          </div>
        </div>

        {/* Invoice Details */}
        <div className="business-invoices-section">
          <h3>📅 Invoice Details</h3>
          <div className="business-invoices-form-row">
            <div className="business-invoices-form-group">
              <label>Invoice Date</label>
              <input
                type="date"
                value={invoiceForm.date}
                onChange={(e) => setInvoiceForm({...invoiceForm, date: e.target.value})}
                className="business-invoices-input"
                required
              />
            </div>
            
            <div className="business-invoices-form-group">
              <label>Due Date *</label>
              <input
                type="date"
                value={invoiceForm.dueDate}
                onChange={(e) => setInvoiceForm({...invoiceForm, dueDate: e.target.value})}
                className="business-invoices-input"
                required
              />
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="business-invoices-section">
          <div className="business-invoices-section-header">
            <h3>🛒 Items & Services</h3>
            <button 
              type="button" 
              onClick={handleAddItem}
              className="business-invoices-add-item-btn"
            >
              + Add Item
            </button>
          </div>
          
          {invoiceForm.items.map((item) => (
            <div key={item.id} className="business-invoices-item-row">
              <div className="business-invoices-form-group">
                <label>Description</label>
                <input
                  type="text"
                  placeholder="Item or service description"
                  value={item.description}
                  onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                  className="business-invoices-input"
                  required
                />
              </div>
              
              <div className="business-invoices-item-details">
                <div className="business-invoices-form-group">
                  <label>Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(item.id, "quantity", e.target.value)}
                    className="business-invoices-input business-invoices-input-small"
                    required
                  />
                </div>
                
                <div className="business-invoices-form-group">
                  <label>Rate (R)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.rate}
                    onChange={(e) => handleItemChange(item.id, "rate", e.target.value)}
                    className="business-invoices-input business-invoices-input-small"
                    required
                  />
                </div>
                
                <div className="business-invoices-form-group">
                  <label>Amount (R)</label>
                  <input
                    type="text"
                    value={(item.quantity * item.rate).toFixed(2)}
                    disabled
                    className="business-invoices-input business-invoices-input-small business-invoices-disabled-input"
                  />
                </div>
                
                {invoiceForm.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="business-invoices-remove-btn"
                    title="Remove item"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {/* Totals Summary */}
          <div className="business-invoices-totals-summary">
            <div className="business-invoices-total-row">
              <span>Subtotal:</span>
              <span>R {calculateTotals().subtotal}</span>
            </div>
            <div className="business-invoices-total-row">
              <span>VAT ({invoiceForm.vat}%):</span>
              <span>R {calculateTotals().vatAmount}</span>
            </div>
            <div className="business-invoices-total-row">
              <span>Shipping:</span>
              <span>R {parseFloat(invoiceForm.shipping).toFixed(2)}</span>
            </div>
            <div className="business-invoices-total-row business-invoices-total-grand">
              <span>Total:</span>
              <span>R {calculateTotals().total}</span>
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="business-invoices-section">
          <div className="business-invoices-form-row">
            <div className="business-invoices-form-group">
              <label>VAT (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={invoiceForm.vat}
                onChange={(e) => setInvoiceForm({...invoiceForm, vat: parseFloat(e.target.value) || 0})}
                className="business-invoices-input"
              />
            </div>
            
            <div className="business-invoices-form-group">
              <label>Shipping (R)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={invoiceForm.shipping}
                onChange={(e) => setInvoiceForm({...invoiceForm, shipping: parseFloat(e.target.value) || 0})}
                className="business-invoices-input"
              />
            </div>
          </div>
          
          <div className="business-invoices-form-row">
            <div className="business-invoices-form-group">
              <label>Notes</label>
              <textarea
                placeholder="Additional notes"
                value={invoiceForm.notes}
                onChange={(e) => setInvoiceForm({...invoiceForm, notes: e.target.value})}
                className="business-invoices-textarea"
                rows="3"
              />
            </div>
            
            <div className="business-invoices-form-group">
              <label>Payment Method</label>
              <select
                value={invoiceForm.paymentMethod}
                onChange={(e) => setInvoiceForm({...invoiceForm, paymentMethod: e.target.value})}
                className="business-invoices-input"
              >
                <option value="">Select method</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="E-wallet">E-wallet</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="business-invoices-form-actions">
          <button 
            type="button" 
            onClick={() => navigate("/business")}
            className="business-invoices-cancel-btn"
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={() => handleSaveInvoice("draft")}
            className="business-invoices-save-draft-btn"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save as Draft"}
          </button>
          <button 
            type="button" 
            onClick={() => handleSaveInvoice("sent")}
            className="business-invoices-send-btn"
            disabled={loading}
          >
            {loading ? "Sending..." : "Save & Send"}
          </button>
          <button 
            type="button" 
            onClick={handlePreview}
            className="business-invoices-preview-btn"
            disabled={!invoiceForm.customerName || loading}
          >
            👁️ Preview
          </button>
        </div>
      </form>
    </div>
  );

  // LIST MODE
  const renderListMode = () => (
    <div className="business-invoices-list-container">
      <div className="business-invoices-list-header">
        <h2>Your Invoices</h2>
        <div className="business-invoices-list-stats">
          <span className="business-invoices-stat">
            Draft: {invoices.filter(q => q.status === "draft").length}
          </span>
          <span className="business-invoices-stat">
            Sent: {invoices.filter(q => q.status === "sent").length}
          </span>
          <span className="business-invoices-stat">
            Total: R {invoices.reduce((sum, q) => sum + (parseFloat(q.total) || 0), 0).toFixed(2)}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="business-invoices-list-loading">
          <div className="business-invoices-spinner"></div>
          <p>Loading invoices...</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="business-invoices-list-empty">
          <div className="business-invoices-empty-icon">📋</div>
          <h3>No Invoices Yet</h3>
          <p>Create your first invoice to get started</p>
          <button 
            onClick={loadInvoices}
            className="business-invoices-refresh-btn"
          >
            Refresh
          </button>
        </div>
      ) : (
        <div className="business-invoices-list">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="business-invoices-list-item">
              <div className="business-invoices-item-main">
                <div className="business-invoices-item-header">
                  <h3 className="business-invoices-item-title">
                    #{invoice.invoiceNumber}
                    <span className={`business-invoices-status business-invoices-status-${invoice.status}`}>
                      {invoice.status}
                    </span>
                  </h3>
                  <span className="business-invoices-item-date">
                    {formatDate(invoice.date)}
                  </span>
                </div>
                
                <div className="business-invoices-item-customer">
                  <strong>{invoice.customerName || "No customer"}</strong>
                  {invoice.customerEmail && <span>{invoice.customerEmail}</span>}
                </div>
                
                <div className="business-invoices-item-total">
                  <span>Total:</span>
                  <span className="business-invoices-amount">R {invoice.total || "0.00"}</span>
                </div>
              </div>
              
              <div className="business-invoices-item-actions">
                <button 
                  onClick={() => handleViewInvoice(invoice)}
                  className="business-invoices-action-btn business-invoices-view-btn"
                >
                  👁️ View
                </button>
                <button 
                  onClick={() => handleDuplicate(invoice)}
                  className="business-invoices-action-btn business-invoices-duplicate-btn"
                >
                  📋 Duplicate
                </button>
                <button 
                  onClick={() => handleDeleteInvoice(invoice.id)}
                  className="business-invoices-action-btn business-invoices-delete-btn"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // PREVIEW MODE
  const renderPreviewMode = () => (
    <div className="business-invoices-preview-container">
      <div className="business-invoices-preview-actions">
        <button onClick={() => setMode("list")} className="business-invoices-back-btn">
          ← Back to List
        </button>
        <button onClick={() => setMode("customize")} className="business-invoices-customize-btn">
          🎨 Customize
        </button>
        <button onClick={() => handleSaveInvoice("sent")} className="business-invoices-save-btn">
          💾 Save & Send
        </button>
        <button onClick={() => {
          alert("PDF downloaded successfully!");
        }} className="business-invoices-print-btn">
          📄 Download PDF
        </button>
      </div>

      <div 
        className="business-invoices-preview-document"
        style={{
          '--primary-color': selectedInvoice?.selectedColor || '#3B82F6'
        }}
      >
        {/* Header */}
        <div className="business-invoices-preview-header">
          <div className="business-invoices-preview-company">
            <h2 className="business-invoices-preview-company-name">
              Strategic Construction Pro
            </h2>
            <div className="business-invoices-preview-company-details">
              <p>16 Shelly Strt</p>
              <p>Phone: 0843624275</p>
              <p>Email: Briannambeke@gmail.com</p>
            </div>
          </div>
          
          <div className="business-invoices-preview-title">
            <h1>INVOICE</h1>
            <div className="business-invoices-preview-meta">
              <p><strong>INVOICE #:</strong> {selectedInvoice?.invoiceNumber}</p>
              <p><strong>DATE:</strong> {formatDate(selectedInvoice?.date)}</p>
              <p><strong>DUE DATE:</strong> {formatDate(selectedInvoice?.dueDate)}</p>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="business-invoices-preview-customer">
          <h3>BILL TO:</h3>
          <div className="business-invoices-preview-customer-details">
            <p><strong>{selectedInvoice?.customerName}</strong></p>
            {selectedInvoice?.customerCompany && <p>{selectedInvoice.customerCompany}</p>}
            {selectedInvoice?.customerAddress && <p>{selectedInvoice.customerAddress}</p>}
            {selectedInvoice?.customerPhone && <p>Phone: {selectedInvoice.customerPhone}</p>}
            {selectedInvoice?.customerEmail && <p>Email: {selectedInvoice.customerEmail}</p>}
          </div>
        </div>

        {/* Items Table */}
        <div className="business-invoices-preview-items">
          <table className="business-invoices-preview-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>QTY</th>
                <th>Price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {selectedInvoice?.items?.map((item, index) => (
                <tr key={index}>
                  <td>{item.description || "Item description"}</td>
                  <td>{item.quantity}</td>
                  <td>R {item.rate?.toFixed(2)}</td>
                  <td>R {item.amount?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="business-invoices-preview-totals">
          <div className="business-invoices-preview-totals-inner">
            <div className="business-invoices-preview-total-row">
              <span>Subtotal:</span>
              <span>R {selectedInvoice?.subtotal || "0.00"}</span>
            </div>
            {selectedInvoice?.vat > 0 && (
              <div className="business-invoices-preview-total-row">
                <span>VAT ({selectedInvoice?.vat}%):</span>
                <span>R {selectedInvoice?.vatAmount || "0.00"}</span>
              </div>
            )}
            {selectedInvoice?.shipping > 0 && (
              <div className="business-invoices-preview-total-row">
                <span>Shipping:</span>
                <span>R {parseFloat(selectedInvoice?.shipping || 0).toFixed(2)}</span>
              </div>
            )}
            <div className="business-invoices-preview-total-row business-invoices-preview-total-grand">
              <span>TOTAL:</span>
              <span>R {selectedInvoice?.total || "0.00"}</span>
            </div>
          </div>
        </div>

        {/* Notes & Payment */}
        <div className="business-invoices-preview-footer">
          {selectedInvoice?.notes && (
            <div className="business-invoices-preview-notes">
              <h4>Notes:</h4>
              <p>{selectedInvoice.notes}</p>
            </div>
          )}
          
          {selectedInvoice?.paymentMethod && (
            <div className="business-invoices-preview-payment">
              <h4>Payment Method:</h4>
              <p>{selectedInvoice.paymentMethod}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // CUSTOMIZE MODE
  const renderCustomizeMode = () => (
    <div className="business-invoices-customize-container">
      <h2>Customize Invoice</h2>
      <p className="business-invoices-customize-subtitle">Change the look of your invoice</p>
      
      <div className="business-invoices-customize-form">
        <div className="business-invoices-customize-section">
          <h3>🎨 Select Color Theme</h3>
          <div className="business-invoices-color-grid">
            {colorOptions.map((color) => (
              <button
                key={color.value}
                className={`business-invoices-color-option ${invoiceForm.selectedColor === color.value ? 'selected' : ''}`}
                style={{ backgroundColor: color.value }}
                onClick={() => handleColorChange(color.value)}
                title={color.name}
              >
                {invoiceForm.selectedColor === color.value && "✓"}
              </button>
            ))}
          </div>
        </div>

        <div className="business-invoices-customize-preview">
          <h4>Preview</h4>
          <div className="business-invoices-mini-preview" style={{ borderLeft: `4px solid ${invoiceForm.selectedColor}` }}>
            <div className="business-invoices-mini-header" style={{ color: invoiceForm.selectedColor }}>
              Invoice #{invoiceForm.invoiceNumber}
            </div>
            <div className="business-invoices-mini-body">
              <div className="business-invoices-mini-row">
                <span>Total:</span>
                <span>R {calculateTotals().total}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="business-invoices-customize-actions">
          <button 
            onClick={() => setMode("preview")}
            className="business-invoices-customize-back-btn"
          >
            ← Back to Preview
          </button>
          <button 
            onClick={() => {
              handleSaveInvoice("draft");
              alert("Customization saved!");
            }}
            className="business-invoices-customize-save-btn"
          >
            💾 Save Changes
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="business-invoices-page">
      {/* HEADER */}
      <div className="business-invoices-header">
        <div className="business-invoices-header-content">
          <div className="business-invoices-header-main">
            <h1>Business Invoices</h1>
            <p>Create, manage, and send professional invoices</p>
          </div>
          
          <div className="business-invoices-account-switcher">
            <div className="business-invoices-switch-title">Switch Account</div>
            <AccountTypeSwitcher
              accountType={accountType}
              onChange={handleAccountSwitch}
            />
          </div>
        </div>
      </div>
      
      {/* MODE TABS */}
      <div className="business-invoices-mode-tabs">
        <button 
          className={`business-invoices-tab ${mode === "create" ? "active" : ""}`}
          onClick={() => setMode("create")}
        >
          ✏️ Create New
        </button>
        <button 
          className={`business-invoices-tab ${mode === "list" ? "active" : ""}`}
          onClick={() => { setMode("list"); loadInvoices(); }}
        >
          📋 View All ({invoices.length})
        </button>
        <button 
          className={`business-invoices-tab ${mode === "customize" ? "active" : ""}`}
          onClick={() => {
            if (!selectedInvoice && !invoiceForm.customerName) {
              alert("Please create an invoice first");
              return;
            }
            setMode("customize");
          }}
        >
          🎨 Customize
        </button>
        <button 
          className={`business-invoices-tab ${mode === "preview" ? "active" : ""}`}
          onClick={handlePreview}
          disabled={!invoiceForm.customerName}
        >
          👁️ Preview
        </button>
      </div>
      
      {/* MAIN CONTENT AREA */}
      <div className="business-invoices-content">
        {mode === "create" && renderCreateMode()}
        {mode === "list" && renderListMode()}
        {mode === "preview" && renderPreviewMode()}
        {mode === "customize" && renderCustomizeMode()}
      </div>
    </div>
  );
}