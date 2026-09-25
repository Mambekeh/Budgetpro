import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AccountTypeSwitcher from "../../components/account/AccountTypeSwitcher";
import "./BusinessInvoices.css";

export default function BusinessInvoices() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState(
    localStorage.getItem("accountType") || "business"
  );
  
  const [currentStep, setCurrentStep] = useState(1); // 1: Create, 2: Preview, 3: Customize
  
  // Color options
  const colorOptions = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Orange', value: '#F97316' }
  ];
  
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
      { id: 1, description: "", quantity: 1, rate: 0, amount: 0 }
    ],
    notes: "",
    paymentMethod: "",
    vat: 0,
    shipping: 0,
    selectedColor: colorOptions[0].value,
    status: "draft",
    template: "classic"
  });

  // Handle step navigation
  const nextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2); // Go to preview
    } else if (currentStep === 2) {
      setCurrentStep(3); // Go to customize
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const validateStep1 = () => {
    return invoiceForm.customerName.trim() !== "" && invoiceForm.dueDate !== "";
  };

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

  const handleItemChange = (index, field, value) => {
    const newItems = [...invoiceForm.items];
    newItems[index][field] = value;
    
    if (field === "quantity" || field === "rate") {
      const quantity = parseFloat(newItems[index].quantity) || 0;
      const rate = parseFloat(newItems[index].rate) || 0;
      newItems[index].amount = quantity * rate;
    }
    
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };

  const handleRemoveItem = (index) => {
    if (invoiceForm.items.length > 1) {
      const newItems = invoiceForm.items.filter((_, i) => i !== index);
      setInvoiceForm({ ...invoiceForm, items: newItems });
    }
  };

  const calculateTotal = () => {
    const subtotal = invoiceForm.items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const vatAmount = subtotal * (invoiceForm.vat / 100);
    return {
      subtotal: subtotal.toFixed(2),
      vatAmount: vatAmount.toFixed(2),
      total: (subtotal + vatAmount + (invoiceForm.shipping || 0)).toFixed(2)
    };
  };

  const handleSaveInvoice = () => {
    const totals = calculateTotal();
    const invoiceToSave = {
      ...invoiceForm,
      id: Date.now(),
      savedDate: new Date().toISOString(),
      totals: totals,
      status: "draft"
    };
    
    const existingInvoices = JSON.parse(localStorage.getItem("bp_invoices") || "[]");
    existingInvoices.push(invoiceToSave);
    localStorage.setItem("bp_invoices", JSON.stringify(existingInvoices));
    
    alert("Invoice saved successfully!");
    setCurrentStep(2); // Go to preview after save
  };

  const handleDownloadPDF = () => {
    // Simulate PDF download
    alert("PDF downloaded successfully!");
  };

  const handleSendInvoice = () => {
    const invoiceToSend = {
      ...invoiceForm,
      status: "sent",
      sentDate: new Date().toISOString()
    };
    
    const existingInvoices = JSON.parse(localStorage.getItem("bp_invoices") || "[]");
    existingInvoices.push(invoiceToSend);
    localStorage.setItem("bp_invoices", JSON.stringify(existingInvoices));
    
    alert("Invoice sent successfully!");
    navigate("/business");
  };

  const handleColorChange = (color) => {
    setInvoiceForm({ ...invoiceForm, selectedColor: color });
  };

  // Step 1: Create Invoice Form
  const renderCreateForm = () => (
    <form onSubmit={(e) => { e.preventDefault(); nextStep(); }}>
      <h3>Create Invoice</h3>
      
      <div className="form-group">
        <label>Invoice #</label>
        <input
          type="text"
          value={invoiceForm.invoiceNumber}
          onChange={(e) => setInvoiceForm({...invoiceForm, invoiceNumber: e.target.value})}
          className="disabled-input"
          readOnly
        />
      </div>
      
      <div className="form-group">
        <label>Customer/Company Name *</label>
        <input
          type="text"
          value={invoiceForm.customerName}
          onChange={(e) => setInvoiceForm({...invoiceForm, customerName: e.target.value})}
          required
        />
      </div>
      
      <div className="form-group">
        <label>Company Name</label>
        <input
          type="text"
          value={invoiceForm.customerCompany}
          onChange={(e) => setInvoiceForm({...invoiceForm, customerCompany: e.target.value})}
        />
      </div>
      
      <div className="form-group">
        <label>Customer Address</label>
        <input
          type="text"
          value={invoiceForm.customerAddress}
          onChange={(e) => setInvoiceForm({...invoiceForm, customerAddress: e.target.value})}
        />
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={invoiceForm.customerEmail}
            onChange={(e) => setInvoiceForm({...invoiceForm, customerEmail: e.target.value})}
          />
        </div>
        
        <div className="form-group">
          <label>Phone</label>
          <input
            type="tel"
            value={invoiceForm.customerPhone}
            onChange={(e) => setInvoiceForm({...invoiceForm, customerPhone: e.target.value})}
          />
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label>Invoice Date</label>
          <input
            type="date"
            value={invoiceForm.date}
            onChange={(e) => setInvoiceForm({...invoiceForm, date: e.target.value})}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Due Date *</label>
          <input
            type="date"
            value={invoiceForm.dueDate}
            onChange={(e) => setInvoiceForm({...invoiceForm, dueDate: e.target.value})}
            required
          />
        </div>
      </div>
      
      <h4>Items</h4>
      
      {invoiceForm.items.map((item, index) => (
        <div key={item.id} className="item-row">
          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              placeholder="Item or service description"
              value={item.description}
              onChange={(e) => handleItemChange(index, "description", e.target.value)}
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Rate (R)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={item.rate}
                onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Amount (R)</label>
              <input
                type="text"
                value={(item.quantity * item.rate).toFixed(2)}
                disabled
                className="disabled-input"
              />
            </div>
            
            {invoiceForm.items.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveItem(index)}
                className="remove-item-btn"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      ))}
      
      <div className="add-item-container">
        <button
          type="button"
          onClick={handleAddItem}
          className="add-item-btn"
        >
          Add Another Item
        </button>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label>VAT (%)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={invoiceForm.vat}
            onChange={(e) => setInvoiceForm({...invoiceForm, vat: parseFloat(e.target.value) || 0})}
          />
        </div>
        
        <div className="form-group">
          <label>Shipping (R)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={invoiceForm.shipping}
            onChange={(e) => setInvoiceForm({...invoiceForm, shipping: parseFloat(e.target.value) || 0})}
          />
        </div>
      </div>
      
      <div className="notes-payment-section">
        <div className="form-group">
          <label>Notes</label>
          <textarea
            value={invoiceForm.notes}
            onChange={(e) => setInvoiceForm({...invoiceForm, notes: e.target.value})}
            rows="3"
          />
        </div>
        
        <div className="form-group">
          <label>Payment Method</label>
          <select
            value={invoiceForm.paymentMethod}
            onChange={(e) => setInvoiceForm({...invoiceForm, paymentMethod: e.target.value})}
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
      
      <div className="step-actions">
        <button type="button" onClick={() => navigate("/business")} className="cancel-btn">
          Cancel
        </button>
        <button type="submit" className="next-btn">
          Preview Invoice
        </button>
      </div>
    </form>
  );

  // Step 2: Preview Invoice
  const renderPreview = () => {
    const totals = calculateTotal();
    
    return (
      <div className="preview-container">
        <h3>Preview Invoice</h3>
        
        <div className="invoice-preview" style={{ borderLeft: `4px solid ${invoiceForm.selectedColor}` }}>
          <div className="invoice-header">
            <div className="invoice-from">
              <h4>Strategic Construction Pro</h4>
              <p>16 Shelly Strt</p>
              <p>0843624275</p>
              <p>Briannambeke@gmail.com</p>
            </div>
            
            <div className="invoice-meta">
              <div className="invoice-number">
                <strong>INVOICE #:</strong> {invoiceForm.invoiceNumber}
              </div>
              <div><strong>DATE:</strong> {invoiceForm.date}</div>
              <div><strong>DUE DATE:</strong> {invoiceForm.dueDate}</div>
            </div>
          </div>
          
          <div className="invoice-to">
            <h4>BILL TO</h4>
            <p><strong>{invoiceForm.customerCompany || invoiceForm.customerName}</strong></p>
            {invoiceForm.customerAddress && <p>{invoiceForm.customerAddress}</p>}
            {invoiceForm.customerPhone && <p>{invoiceForm.customerPhone}</p>}
            {invoiceForm.customerEmail && <p>{invoiceForm.customerEmail}</p>}
          </div>
          
          <div className="invoice-items">
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>QTY</th>
                  <th>Price</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoiceForm.items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.description || "Item description"}</td>
                    <td>{item.quantity}</td>
                    <td>R{item.rate.toFixed(2)}</td>
                    <td>R{item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3">Subtotal</td>
                  <td>R{totals.subtotal}</td>
                </tr>
                {invoiceForm.vat > 0 && (
                  <tr>
                    <td colSpan="3">VAT ({invoiceForm.vat}%)</td>
                    <td>R{totals.vatAmount}</td>
                  </tr>
                )}
                {invoiceForm.shipping > 0 && (
                  <tr>
                    <td colSpan="3">Shipping</td>
                    <td>R{parseFloat(invoiceForm.shipping).toFixed(2)}</td>
                  </tr>
                )}
                <tr className="total-row">
                  <td colSpan="3"><strong>TOTAL</strong></td>
                  <td><strong>R{totals.total}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          {invoiceForm.notes && (
            <div className="invoice-notes">
              <h4>Notes</h4>
              <p>{invoiceForm.notes}</p>
            </div>
          )}
          
          {invoiceForm.paymentMethod && (
            <div className="invoice-payment">
              <h4>Payment Method</h4>
              <p>{invoiceForm.paymentMethod}</p>
            </div>
          )}
        </div>
        
        <div className="preview-actions">
          <button type="button" onClick={prevStep} className="cancel-btn">
            Back to Edit
          </button>
          <div className="preview-action-group">
            <button type="button" onClick={handleSaveInvoice} className="save-btn">
              Save Only
            </button>
            <button type="button" onClick={() => setCurrentStep(3)} className="customize-btn">
              Customize
            </button>
            <button type="button" onClick={handleDownloadPDF} className="download-btn">
              Download PDF
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Step 3: Customize Invoice
  const renderCustomize = () => (
    <div className="customize-container">
      <h3>Customize Invoice</h3>
      
      <div className="color-options">
        <h4>Select Color Theme</h4>
        <div className="color-grid">
          {colorOptions.map((color) => (
            <button
              key={color.value}
              className={`color-option ${invoiceForm.selectedColor === color.value ? 'selected' : ''}`}
              style={{ backgroundColor: color.value }}
              onClick={() => handleColorChange(color.value)}
              title={color.name}
            />
          ))}
        </div>
      </div>
      
      <div className="customize-preview">
        <h4>Preview</h4>
        <div className="mini-preview" style={{ borderLeft: `4px solid ${invoiceForm.selectedColor}` }}>
          <div className="mini-header" style={{ color: invoiceForm.selectedColor }}>
            Invoice #{invoiceForm.invoiceNumber}
          </div>
          <div className="mini-body">
            <div className="mini-row">
              <span>Total:</span>
              <span>R{calculateTotal().total}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="customize-actions">
        <button type="button" onClick={() => setCurrentStep(2)} className="cancel-btn">
          Back to Preview
        </button>
        <div className="customize-action-group">
          <button type="button" onClick={handleSaveInvoice} className="save-btn">
            Save Changes
          </button>
          <button type="button" onClick={handleSendInvoice} className="send-btn">
            Send Invoice
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="business-page">
      {/* HEADER */}
      <div className="business-header-section">
        <div className="header-content">
          <div className="welcome-message">
            <h2>
              {currentStep === 1 && "Create Invoice"}
              {currentStep === 2 && "Preview Invoice"}
              {currentStep === 3 && "Customize Invoice"}
            </h2>
            <p>
              {currentStep === 1 && "Fill in customer and item details"}
              {currentStep === 2 && "Review your invoice before sending"}
              {currentStep === 3 && "Customize the look of your invoice"}
            </p>
          </div>
          
          <div className="account-switcher-section">
            <div className="switch-account-title">Switch Account</div>
            <AccountTypeSwitcher
              accountType={accountType}
              onChange={(type) => {
                setAccountType(type);
                if (type === "personal") navigate("/dashboard");
                if (type === "business") navigate("/business");
              }}
            />
          </div>
        </div>
      </div>
      
      {/* STEP INDICATOR */}
      <div className="step-indicator">
        <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
          <span className="step-number">1</span>
          <span className="step-label">Create</span>
        </div>
        <div className="step-line"></div>
        <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-label">Preview</span>
        </div>
        <div className="step-line"></div>
        <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
          <span className="step-number">3</span>
          <span className="step-label">Customize</span>
        </div>
      </div>
      
      {/* CONTENT */}
      <div className="business-content">
        <div className="form-container">
          {currentStep === 1 && renderCreateForm()}
          {currentStep === 2 && renderPreview()}
          {currentStep === 3 && renderCustomize()}
        </div>
      </div>
    </div>
  );
}