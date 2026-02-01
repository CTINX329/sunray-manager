import React, { useState, useEffect } from 'react';

// ============================================
// SUNRAY SAVVY - Formula & Inventory Manager
// ============================================

const App = () => {
  // State
  const [activeTab, setActiveTab] = useState('formulas');
  const [ingredients, setIngredients] = useState([]);
  const [formulas, setFormulas] = useState([]);
  const [batches, setBatches] = useState([]);
  
  // Modal states
  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Load data from localStorage on mount
  useEffect(() => {
    const savedIngredients = localStorage.getItem('sunray_ingredients');
    const savedFormulas = localStorage.getItem('sunray_formulas');
    const savedBatches = localStorage.getItem('sunray_batches');
    
    if (savedIngredients) setIngredients(JSON.parse(savedIngredients));
    if (savedFormulas) setFormulas(JSON.parse(savedFormulas));
    if (savedBatches) setBatches(JSON.parse(savedBatches));
  }, []);
  
  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('sunray_ingredients', JSON.stringify(ingredients));
  }, [ingredients]);
  
  useEffect(() => {
    localStorage.setItem('sunray_formulas', JSON.stringify(formulas));
  }, [formulas]);
  
  useEffect(() => {
    localStorage.setItem('sunray_batches', JSON.stringify(batches));
  }, [batches]);

  // Calculate formula cost per pound
  const calculateFormulaCost = (formulaIngredients) => {
    return formulaIngredients.reduce((total, fi) => {
      const ingredient = ingredients.find(i => i.id === fi.ingredientId);
      if (ingredient) {
        return total + (fi.percentage / 100) * ingredient.costPerLb;
      }
      return total;
    }, 0);
  };

  // Calculate total inventory value
  const calculateInventoryValue = () => {
    return ingredients.reduce((total, ing) => {
      return total + (ing.quantityLbs * ing.costPerLb);
    }, 0);
  };

  // Calculate units from batch
  const calculateUnits = (batchLbs, unitSizeLbs = 0.25) => {
    return Math.floor(batchLbs / unitSizeLbs);
  };

  // ============================================
  // INGREDIENT CRUD
  // ============================================
  const saveIngredient = (ingredient) => {
    if (ingredient.id) {
      setIngredients(prev => prev.map(i => i.id === ingredient.id ? ingredient : i));
    } else {
      setIngredients(prev => [...prev, { ...ingredient, id: Date.now() }]);
    }
    setShowIngredientModal(false);
    setEditingItem(null);
  };

  const deleteIngredient = (id) => {
    if (confirm('Delete this ingredient? This may affect formulas using it.')) {
      setIngredients(prev => prev.filter(i => i.id !== id));
    }
  };

  // ============================================
  // FORMULA CRUD
  // ============================================
  const saveFormula = (formula) => {
    if (formula.id) {
      setFormulas(prev => prev.map(f => f.id === formula.id ? formula : f));
    } else {
      setFormulas(prev => [...prev, { ...formula, id: Date.now() }]);
    }
    setShowFormulaModal(false);
    setEditingItem(null);
  };

  const deleteFormula = (id) => {
    if (confirm('Delete this formula?')) {
      setFormulas(prev => prev.filter(f => f.id !== id));
    }
  };

  // ============================================
  // BATCH OPERATIONS
  // ============================================
  const createBatch = (batch) => {
    const newBatch = {
      ...batch,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    setBatches(prev => [...prev, newBatch]);
    setShowBatchModal(false);
  };

  const completeBatch = (batchId) => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return;
    
    const formula = formulas.find(f => f.id === batch.formulaId);
    if (!formula) return;

    // Deduct ingredients from inventory
    const updatedIngredients = [...ingredients];
    formula.ingredients.forEach(fi => {
      const ingIndex = updatedIngredients.findIndex(i => i.id === fi.ingredientId);
      if (ingIndex !== -1) {
        const amountUsed = (fi.percentage / 100) * batch.batchSizeLbs;
        updatedIngredients[ingIndex] = {
          ...updatedIngredients[ingIndex],
          quantityLbs: Math.max(0, updatedIngredients[ingIndex].quantityLbs - amountUsed)
        };
      }
    });
    
    setIngredients(updatedIngredients);
    setBatches(prev => prev.map(b => 
      b.id === batchId ? { ...b, status: 'completed', completedAt: new Date().toISOString() } : b
    ));
  };

  const deleteBatch = (id) => {
    if (confirm('Delete this batch record?')) {
      setBatches(prev => prev.filter(b => b.id !== id));
    }
  };

  // ============================================
  // PRINT BATCH TICKET
  // ============================================
  const printBatchTicket = (batch) => {
    const formula = formulas.find(f => f.id === batch.formulaId);
    if (!formula) return;

    const ticketContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Batch Ticket - ${formula.name}</title>
        <style>
          @media print {
            body { margin: 0; padding: 20px; }
            .no-print { display: none; }
          }
          body {
            font-family: 'Georgia', serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            color: #4A4235;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #D4A853;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .logo { font-size: 24px; font-weight: bold; color: #6B7F5E; }
          .subtitle { font-size: 12px; color: #888; margin-top: 4px; }
          h1 { font-size: 20px; margin: 15px 0 5px; }
          .batch-info {
            background: #FAF8F3;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .batch-info p { margin: 5px 0; font-size: 14px; }
          .batch-number { font-size: 18px; font-weight: bold; color: #D4A853; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          th {
            background: #6B7F5E;
            color: white;
            font-weight: normal;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          td { font-size: 14px; }
          .weight { 
            font-weight: bold; 
            font-size: 16px;
            color: #4A4235;
          }
          .checkbox {
            width: 20px;
            height: 20px;
            border: 2px solid #6B7F5E;
            display: inline-block;
          }
          .totals {
            margin-top: 20px;
            padding: 15px;
            background: #4A4235;
            color: #FAF8F3;
            border-radius: 8px;
          }
          .totals p { margin: 5px 0; }
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            font-size: 11px;
            color: #888;
          }
          .signature-line {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
          }
          .signature-box {
            width: 45%;
            border-top: 1px solid #4A4235;
            padding-top: 5px;
            font-size: 12px;
          }
          .print-btn {
            background: #6B7F5E;
            color: white;
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            margin: 20px 0;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <button class="print-btn no-print" onclick="window.print()">🖨️ Print Ticket</button>
        
        <div class="header">
          <div class="logo">☀️ SUNRAY SAVVY</div>
          <div class="subtitle">Small Batch Skincare</div>
          <h1>BATCH PRODUCTION TICKET</h1>
        </div>
        
        <div class="batch-info">
          <p class="batch-number">Batch #${batch.id}</p>
          <p><strong>Product:</strong> ${formula.name}</p>
          <p><strong>Batch Size:</strong> ${batch.batchSizeLbs} lbs</p>
          <p><strong>Est. Units:</strong> ${calculateUnits(batch.batchSizeLbs)} × 4oz jars</p>
          <p><strong>Date Created:</strong> ${new Date(batch.createdAt).toLocaleDateString()}</p>
          <p><strong>Status:</strong> ${batch.status.toUpperCase()}</p>
        </div>
        
        <h3>Ingredients to Weigh</h3>
        <table>
          <thead>
            <tr>
              <th>✓</th>
              <th>Ingredient</th>
              <th>%</th>
              <th>Weight (lbs)</th>
              <th>Weight (oz)</th>
              <th>Weight (g)</th>
            </tr>
          </thead>
          <tbody>
            ${formula.ingredients.map(fi => {
              const ing = ingredients.find(i => i.id === fi.ingredientId);
              const weightLbs = (fi.percentage / 100) * batch.batchSizeLbs;
              const weightOz = weightLbs * 16;
              const weightG = weightLbs * 453.592;
              return `
                <tr>
                  <td><div class="checkbox"></div></td>
                  <td>${ing ? ing.name : 'Unknown'}</td>
                  <td>${fi.percentage}%</td>
                  <td class="weight">${weightLbs.toFixed(3)}</td>
                  <td>${weightOz.toFixed(2)}</td>
                  <td>${weightG.toFixed(1)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <p><strong>Total Batch Weight:</strong> ${batch.batchSizeLbs} lbs (${(batch.batchSizeLbs * 16).toFixed(1)} oz)</p>
          <p><strong>Cost per lb:</strong> $${calculateFormulaCost(formula.ingredients).toFixed(2)}</p>
          <p><strong>Total Batch Cost:</strong> $${(calculateFormulaCost(formula.ingredients) * batch.batchSizeLbs).toFixed(2)}</p>
        </div>
        
        <div class="signature-line">
          <div class="signature-box">Prepared By</div>
          <div class="signature-box">Date / Time</div>
        </div>
        
        <div class="footer">
          <p>Notes: ${batch.notes || 'None'}</p>
          <p>Generated by Sunray Savvy Formula Manager</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(ticketContent);
    printWindow.document.close();
  };

  // ============================================
  // MODALS
  // ============================================
  const IngredientModal = () => {
    const [form, setForm] = useState(editingItem || {
      name: '',
      costPerLb: '',
      quantityLbs: '',
      supplier: '',
      notes: ''
    });

    return (
      <div className="modal-overlay">
        <div className="modal">
          <h2>{editingItem ? 'Edit Ingredient' : 'Add Ingredient'}</h2>
          <div className="form-group">
            <label>Ingredient Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Shea Butter"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Cost per lb ($)</label>
              <input
                type="number"
                step="0.01"
                value={form.costPerLb}
                onChange={e => setForm({ ...form, costPerLb: parseFloat(e.target.value) || '' })}
                placeholder="0.00"
              />
            </div>
            <div className="form-group">
              <label>Quantity (lbs)</label>
              <input
                type="number"
                step="0.01"
                value={form.quantityLbs}
                onChange={e => setForm({ ...form, quantityLbs: parseFloat(e.target.value) || '' })}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Supplier (optional)</label>
            <input
              type="text"
              value={form.supplier}
              onChange={e => setForm({ ...form, supplier: e.target.value })}
              placeholder="e.g., Bulk Apothecary"
            />
          </div>
          <div className="form-group">
            <label>Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Any notes about this ingredient..."
            />
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => { setShowIngredientModal(false); setEditingItem(null); }}>
              Cancel
            </button>
            <button 
              className="btn-primary" 
              onClick={() => saveIngredient(form)}
              disabled={!form.name || !form.costPerLb}
            >
              Save Ingredient
            </button>
          </div>
        </div>
      </div>
    );
  };

  const FormulaModal = () => {
    const [form, setForm] = useState(editingItem || {
      name: '',
      description: '',
      ingredients: [],
      unitSize: 0.25,
      retailPrice: ''
    });
    const [selectedIngredient, setSelectedIngredient] = useState('');
    const [percentage, setPercentage] = useState('');

    const addIngredientToFormula = () => {
      if (!selectedIngredient || !percentage) return;
      const existing = form.ingredients.find(i => i.ingredientId === parseInt(selectedIngredient));
      if (existing) {
        alert('This ingredient is already in the formula');
        return;
      }
      setForm({
        ...form,
        ingredients: [...form.ingredients, {
          ingredientId: parseInt(selectedIngredient),
          percentage: parseFloat(percentage)
        }]
      });
      setSelectedIngredient('');
      setPercentage('');
    };

    const removeIngredientFromFormula = (ingredientId) => {
      setForm({
        ...form,
        ingredients: form.ingredients.filter(i => i.ingredientId !== ingredientId)
      });
    };

    const totalPercentage = form.ingredients.reduce((sum, i) => sum + i.percentage, 0);
    const formulaCost = calculateFormulaCost(form.ingredients);

    return (
      <div className="modal-overlay">
        <div className="modal modal-large">
          <h2>{editingItem ? 'Edit Formula' : 'Create Formula'}</h2>
          
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Formula Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Day Cream - Lemongrass"
              />
            </div>
            <div className="form-group">
              <label>Unit Size (lbs)</label>
              <input
                type="number"
                step="0.01"
                value={form.unitSize}
                onChange={e => setForm({ ...form, unitSize: parseFloat(e.target.value) || 0.25 })}
              />
            </div>
            <div className="form-group">
              <label>Retail Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={form.retailPrice}
                onChange={e => setForm({ ...form, retailPrice: parseFloat(e.target.value) || '' })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description (optional)</label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of this product..."
            />
          </div>

          <div className="formula-builder">
            <h3>Ingredients</h3>
            <div className="add-ingredient-row">
              <select 
                value={selectedIngredient} 
                onChange={e => setSelectedIngredient(e.target.value)}
              >
                <option value="">Select ingredient...</option>
                {ingredients.map(ing => (
                  <option key={ing.id} value={ing.id}>{ing.name} (${ing.costPerLb}/lb)</option>
                ))}
              </select>
              <input
                type="number"
                step="0.1"
                value={percentage}
                onChange={e => setPercentage(e.target.value)}
                placeholder="%"
                style={{ width: '80px' }}
              />
              <button className="btn-small" onClick={addIngredientToFormula}>Add</button>
            </div>

            <div className="formula-ingredients-list">
              {form.ingredients.length === 0 ? (
                <p className="empty-state">No ingredients added yet</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Ingredient</th>
                      <th>%</th>
                      <th>Cost Contribution</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.ingredients.map(fi => {
                      const ing = ingredients.find(i => i.id === fi.ingredientId);
                      const costContrib = ing ? (fi.percentage / 100) * ing.costPerLb : 0;
                      return (
                        <tr key={fi.ingredientId}>
                          <td>{ing ? ing.name : 'Unknown'}</td>
                          <td>{fi.percentage}%</td>
                          <td>${costContrib.toFixed(4)}/lb</td>
                          <td>
                            <button 
                              className="btn-delete-small"
                              onClick={() => removeIngredientFromFormula(fi.ingredientId)}
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className={`formula-totals ${totalPercentage !== 100 ? 'warning' : ''}`}>
              <span>Total: {totalPercentage.toFixed(1)}%</span>
              <span>Cost: ${formulaCost.toFixed(2)}/lb</span>
              <span>Unit Cost: ${(formulaCost * form.unitSize).toFixed(2)}</span>
              {form.retailPrice && (
                <span>Margin: {(((form.retailPrice - (formulaCost * form.unitSize)) / form.retailPrice) * 100).toFixed(1)}%</span>
              )}
            </div>
            {totalPercentage !== 100 && totalPercentage > 0 && (
              <p className="warning-text">⚠️ Formula should total 100%</p>
            )}
          </div>

          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => { setShowFormulaModal(false); setEditingItem(null); }}>
              Cancel
            </button>
            <button 
              className="btn-primary" 
              onClick={() => saveFormula(form)}
              disabled={!form.name || form.ingredients.length === 0}
            >
              Save Formula
            </button>
          </div>
        </div>
      </div>
    );
  };

  const BatchModal = () => {
    const [form, setForm] = useState({
      formulaId: '',
      batchSizeLbs: 40,
      notes: ''
    });

    const selectedFormula = formulas.find(f => f.id === parseInt(form.formulaId));

    return (
      <div className="modal-overlay">
        <div className="modal">
          <h2>Create Batch</h2>
          
          <div className="form-group">
            <label>Formula</label>
            <select 
              value={form.formulaId} 
              onChange={e => setForm({ ...form, formulaId: e.target.value })}
            >
              <option value="">Select formula...</option>
              {formulas.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Batch Size (lbs)</label>
            <input
              type="number"
              step="1"
              value={form.batchSizeLbs}
              onChange={e => setForm({ ...form, batchSizeLbs: parseFloat(e.target.value) || 0 })}
            />
            {selectedFormula && (
              <p className="helper-text">
                = {calculateUnits(form.batchSizeLbs, selectedFormula.unitSize)} units @ {selectedFormula.unitSize * 16}oz each
              </p>
            )}
          </div>

          <div className="form-group">
            <label>Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Any batch-specific notes..."
            />
          </div>

          {selectedFormula && (
            <div className="batch-preview">
              <h4>Batch Summary</h4>
              <p><strong>Est. Cost:</strong> ${(calculateFormulaCost(selectedFormula.ingredients) * form.batchSizeLbs).toFixed(2)}</p>
              <p><strong>Est. Units:</strong> {calculateUnits(form.batchSizeLbs, selectedFormula.unitSize)}</p>
              {selectedFormula.retailPrice && (
                <p><strong>Est. Revenue:</strong> ${(selectedFormula.retailPrice * calculateUnits(form.batchSizeLbs, selectedFormula.unitSize)).toFixed(2)}</p>
              )}
            </div>
          )}

          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setShowBatchModal(false)}>
              Cancel
            </button>
            <button 
              className="btn-primary" 
              onClick={() => createBatch(form)}
              disabled={!form.formulaId || !form.batchSizeLbs}
            >
              Create Batch
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="app">
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        :root {
          --gold: #D4A853;
          --gold-light: #E8C87A;
          --olive: #6B7F5E;
          --olive-light: #8A9F7A;
          --cream: #FAF8F3;
          --cream-dark: #F0EDE5;
          --brown: #4A4235;
          --brown-light: #6B6355;
          --white: #FFFFFF;
          --red: #C75050;
          --green: #5C8A5C;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: var(--cream);
          color: var(--brown);
          line-height: 1.5;
        }
        
        .app {
          min-height: 100vh;
        }
        
        /* Header */
        .header {
          background: var(--brown);
          color: var(--cream);
          padding: 20px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .logo-icon { font-size: 28px; }
        .logo-text { font-size: 20px; font-weight: 600; }
        .logo-sub { font-size: 11px; opacity: 0.7; text-transform: uppercase; letter-spacing: 2px; }
        
        .header-stats {
          display: flex;
          gap: 30px;
        }
        
        .stat {
          text-align: right;
        }
        
        .stat-value {
          font-size: 20px;
          font-weight: 600;
          color: var(--gold);
        }
        
        .stat-label {
          font-size: 11px;
          opacity: 0.7;
          text-transform: uppercase;
        }
        
        /* Tabs */
        .tabs {
          background: var(--white);
          padding: 0 40px;
          display: flex;
          gap: 0;
          border-bottom: 1px solid var(--cream-dark);
        }
        
        .tab {
          padding: 16px 24px;
          border: none;
          background: none;
          font-size: 14px;
          color: var(--brown-light);
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
        }
        
        .tab:hover { color: var(--brown); }
        .tab.active { 
          color: var(--olive); 
          border-bottom-color: var(--olive);
          font-weight: 600;
        }
        
        /* Content */
        .content {
          padding: 30px 40px;
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .content-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .content-header h1 {
          font-size: 24px;
          font-weight: 600;
        }
        
        /* Buttons */
        .btn-primary {
          background: var(--olive);
          color: var(--white);
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-primary:hover { background: var(--olive-light); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .btn-secondary {
          background: var(--cream-dark);
          color: var(--brown);
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
        }
        
        .btn-secondary:hover { background: #E5E2DA; }
        
        .btn-small {
          background: var(--gold);
          color: var(--white);
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 13px;
          cursor: pointer;
        }
        
        .btn-delete-small {
          background: none;
          border: none;
          color: var(--red);
          font-size: 18px;
          cursor: pointer;
          padding: 4px 8px;
        }
        
        .btn-icon {
          background: none;
          border: 1px solid var(--cream-dark);
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .btn-icon:hover { background: var(--cream-dark); }
        
        /* Cards */
        .card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }
        
        .card {
          background: var(--white);
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(74, 66, 53, 0.06);
        }
        
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        
        .card-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--brown);
        }
        
        .card-subtitle {
          font-size: 13px;
          color: var(--brown-light);
          margin-top: 2px;
        }
        
        .card-actions {
          display: flex;
          gap: 8px;
        }
        
        .card-body p {
          font-size: 14px;
          color: var(--brown-light);
          margin-bottom: 8px;
        }
        
        .card-body strong {
          color: var(--brown);
        }
        
        .card-stats {
          display: flex;
          gap: 20px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--cream-dark);
        }
        
        .card-stat {
          text-align: center;
        }
        
        .card-stat-value {
          font-size: 18px;
          font-weight: 600;
          color: var(--olive);
        }
        
        .card-stat-label {
          font-size: 11px;
          color: var(--brown-light);
          text-transform: uppercase;
        }
        
        /* Tables */
        table {
          width: 100%;
          border-collapse: collapse;
        }
        
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid var(--cream-dark);
        }
        
        th {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--brown-light);
          font-weight: 600;
        }
        
        td { font-size: 14px; }
        
        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(74, 66, 53, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .modal {
          background: var(--white);
          border-radius: 16px;
          padding: 32px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }
        
        .modal-large { max-width: 700px; }
        
        .modal h2 {
          font-size: 20px;
          margin-bottom: 24px;
          color: var(--brown);
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-group label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 6px;
          color: var(--brown);
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid var(--cream-dark);
          border-radius: 6px;
          font-size: 14px;
          color: var(--brown);
        }
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--olive);
        }
        
        .form-group textarea {
          min-height: 80px;
          resize: vertical;
        }
        
        .form-row {
          display: flex;
          gap: 16px;
        }
        
        .form-row .form-group { flex: 1; }
        
        .helper-text {
          font-size: 12px;
          color: var(--brown-light);
          margin-top: 4px;
        }
        
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }
        
        /* Formula Builder */
        .formula-builder h3 {
          font-size: 14px;
          margin-bottom: 12px;
        }
        
        .add-ingredient-row {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }
        
        .add-ingredient-row select { flex: 1; }
        
        .formula-ingredients-list {
          background: var(--cream);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
          max-height: 250px;
          overflow-y: auto;
        }
        
        .empty-state {
          text-align: center;
          color: var(--brown-light);
          font-size: 14px;
          padding: 20px;
        }
        
        .formula-totals {
          display: flex;
          justify-content: space-between;
          background: var(--olive);
          color: var(--white);
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
        }
        
        .formula-totals.warning {
          background: var(--gold);
        }
        
        .warning-text {
          color: var(--red);
          font-size: 13px;
          margin-top: 8px;
        }
        
        /* Batch Preview */
        .batch-preview {
          background: var(--cream);
          border-radius: 8px;
          padding: 16px;
          margin-top: 16px;
        }
        
        .batch-preview h4 {
          font-size: 13px;
          margin-bottom: 8px;
        }
        
        .batch-preview p {
          font-size: 14px;
          margin-bottom: 4px;
        }
        
        /* Status badges */
        .status-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .status-pending { background: var(--gold-light); color: var(--brown); }
        .status-completed { background: var(--olive-light); color: var(--white); }
        
        /* Low stock warning */
        .low-stock {
          color: var(--red);
          font-weight: 600;
        }
        
        /* Empty state */
        .empty-page {
          text-align: center;
          padding: 60px 20px;
          color: var(--brown-light);
        }
        
        .empty-page h3 {
          font-size: 18px;
          margin-bottom: 8px;
          color: var(--brown);
        }
        
        .empty-page p {
          margin-bottom: 20px;
        }
      `}</style>

      {/* Header */}
      <header className="header">
        <div className="logo">
          <span className="logo-icon">☀️</span>
          <div>
            <div className="logo-text">Sunray Savvy</div>
            <div className="logo-sub">Formula Manager</div>
          </div>
        </div>
        <div className="header-stats">
          <div className="stat">
            <div className="stat-value">{formulas.length}</div>
            <div className="stat-label">Formulas</div>
          </div>
          <div className="stat">
            <div className="stat-value">{ingredients.length}</div>
            <div className="stat-label">Ingredients</div>
          </div>
          <div className="stat">
            <div className="stat-value">${calculateInventoryValue().toFixed(2)}</div>
            <div className="stat-label">Inventory Value</div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="tabs">
        <button 
          className={`tab ${activeTab === 'formulas' ? 'active' : ''}`}
          onClick={() => setActiveTab('formulas')}
        >
          Formulas
        </button>
        <button 
          className={`tab ${activeTab === 'ingredients' ? 'active' : ''}`}
          onClick={() => setActiveTab('ingredients')}
        >
          Ingredients
        </button>
        <button 
          className={`tab ${activeTab === 'batches' ? 'active' : ''}`}
          onClick={() => setActiveTab('batches')}
        >
          Batches
        </button>
      </nav>

      {/* Content */}
      <main className="content">
        {/* FORMULAS TAB */}
        {activeTab === 'formulas' && (
          <>
            <div className="content-header">
              <h1>Formulas</h1>
              <button className="btn-primary" onClick={() => setShowFormulaModal(true)}>
                + New Formula
              </button>
            </div>
            
            {formulas.length === 0 ? (
              <div className="empty-page">
                <h3>No formulas yet</h3>
                <p>Create your first formula to get started</p>
                <button className="btn-primary" onClick={() => setShowFormulaModal(true)}>
                  + Create Formula
                </button>
              </div>
            ) : (
              <div className="card-grid">
                {formulas.map(formula => {
                  const cost = calculateFormulaCost(formula.ingredients);
                  const unitCost = cost * (formula.unitSize || 0.25);
                  const margin = formula.retailPrice 
                    ? ((formula.retailPrice - unitCost) / formula.retailPrice) * 100 
                    : null;
                  
                  return (
                    <div key={formula.id} className="card">
                      <div className="card-header">
                        <div>
                          <div className="card-title">{formula.name}</div>
                          <div className="card-subtitle">{formula.description || `${formula.ingredients.length} ingredients`}</div>
                        </div>
                        <div className="card-actions">
                          <button 
                            className="btn-icon" 
                            onClick={() => { setEditingItem(formula); setShowFormulaModal(true); }}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn-icon" 
                            onClick={() => deleteFormula(formula.id)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <div className="card-body">
                        <p><strong>Ingredients:</strong> {formula.ingredients.map(fi => {
                          const ing = ingredients.find(i => i.id === fi.ingredientId);
                          return ing ? ing.name : 'Unknown';
                        }).join(', ')}</p>
                      </div>
                      <div className="card-stats">
                        <div className="card-stat">
                          <div className="card-stat-value">${cost.toFixed(2)}</div>
                          <div className="card-stat-label">Per lb</div>
                        </div>
                        <div className="card-stat">
                          <div className="card-stat-value">${unitCost.toFixed(2)}</div>
                          <div className="card-stat-label">Per unit</div>
                        </div>
                        {formula.retailPrice && (
                          <>
                            <div className="card-stat">
                              <div className="card-stat-value">${formula.retailPrice}</div>
                              <div className="card-stat-label">Retail</div>
                            </div>
                            <div className="card-stat">
                              <div className="card-stat-value">{margin.toFixed(0)}%</div>
                              <div className="card-stat-label">Margin</div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* INGREDIENTS TAB */}
        {activeTab === 'ingredients' && (
          <>
            <div className="content-header">
              <h1>Ingredients</h1>
              <button className="btn-primary" onClick={() => setShowIngredientModal(true)}>
                + Add Ingredient
              </button>
            </div>
            
            {ingredients.length === 0 ? (
              <div className="empty-page">
                <h3>No ingredients yet</h3>
                <p>Add your first ingredient to build formulas</p>
                <button className="btn-primary" onClick={() => setShowIngredientModal(true)}>
                  + Add Ingredient
                </button>
              </div>
            ) : (
              <div className="card">
                <table>
                  <thead>
                    <tr>
                      <th>Ingredient</th>
                      <th>Cost/lb</th>
                      <th>In Stock</th>
                      <th>Value</th>
                      <th>Supplier</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingredients.map(ing => (
                      <tr key={ing.id}>
                        <td><strong>{ing.name}</strong></td>
                        <td>${ing.costPerLb.toFixed(2)}</td>
                        <td className={ing.quantityLbs < 1 ? 'low-stock' : ''}>
                          {ing.quantityLbs.toFixed(2)} lbs
                          {ing.quantityLbs < 1 && ' ⚠️'}
                        </td>
                        <td>${(ing.quantityLbs * ing.costPerLb).toFixed(2)}</td>
                        <td>{ing.supplier || '-'}</td>
                        <td>
                          <div className="card-actions">
                            <button 
                              className="btn-icon" 
                              onClick={() => { setEditingItem(ing); setShowIngredientModal(true); }}
                            >
                              ✏️
                            </button>
                            <button 
                              className="btn-icon" 
                              onClick={() => deleteIngredient(ing.id)}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* BATCHES TAB */}
        {activeTab === 'batches' && (
          <>
            <div className="content-header">
              <h1>Batches</h1>
              <button className="btn-primary" onClick={() => setShowBatchModal(true)}>
                + Create Batch
              </button>
            </div>
            
            {batches.length === 0 ? (
              <div className="empty-page">
                <h3>No batches yet</h3>
                <p>Create a batch to generate production tickets</p>
                <button className="btn-primary" onClick={() => setShowBatchModal(true)}>
                  + Create Batch
                </button>
              </div>
            ) : (
              <div className="card-grid">
                {batches.sort((a, b) => b.id - a.id).map(batch => {
                  const formula = formulas.find(f => f.id === batch.formulaId);
                  const cost = formula ? calculateFormulaCost(formula.ingredients) * batch.batchSizeLbs : 0;
                  const units = formula ? calculateUnits(batch.batchSizeLbs, formula.unitSize) : 0;
                  
                  return (
                    <div key={batch.id} className="card">
                      <div className="card-header">
                        <div>
                          <div className="card-title">Batch #{batch.id}</div>
                          <div className="card-subtitle">{formula ? formula.name : 'Unknown Formula'}</div>
                        </div>
                        <span className={`status-badge status-${batch.status}`}>
                          {batch.status}
                        </span>
                      </div>
                      <div className="card-body">
                        <p><strong>Size:</strong> {batch.batchSizeLbs} lbs ({units} units)</p>
                        <p><strong>Cost:</strong> ${cost.toFixed(2)}</p>
                        <p><strong>Created:</strong> {new Date(batch.createdAt).toLocaleDateString()}</p>
                        {batch.notes && <p><strong>Notes:</strong> {batch.notes}</p>}
                      </div>
                      <div className="card-stats">
                        <button className="btn-small" onClick={() => printBatchTicket(batch)}>
                          🖨️ Print Ticket
                        </button>
                        {batch.status === 'pending' && (
                          <button 
                            className="btn-small" 
                            style={{ background: 'var(--green)' }}
                            onClick={() => completeBatch(batch.id)}
                          >
                            ✓ Complete
                          </button>
                        )}
                        <button 
                          className="btn-icon" 
                          onClick={() => deleteBatch(batch.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Modals */}
      {showIngredientModal && <IngredientModal />}
      {showFormulaModal && <FormulaModal />}
      {showBatchModal && <BatchModal />}
    </div>
  );
};

export default App;
