import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CirclePlus, Flag, Pencil, Target, Trash2, X } from "lucide-react";
import { UserContext } from "../../../context/userContext";
import { formatMoney } from "../../../utils/money";
import "../../styles/dashboard.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";
const blankForm = { title: "", category: "Personal", target_amount: "", saved_amount: "0", horizon_months: "12", target_date: "" };
const goalCategories = ["Personal", "Emergency fund", "Home", "Education", "Travel", "Transport", "Business", "Other"];
const horizonOptions = [
  { months: "1", label: "1 month" }, { months: "3", label: "3 months" }, { months: "6", label: "6 months" },
  { months: "12", label: "1 year" }, { months: "24", label: "2 years" }, { months: "60", label: "5 years" },
];

const formatTargetDate = (months) => {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() + Number(months));
  return new Intl.DateTimeFormat("en-KE", { month: "long", year: "numeric" }).format(date);
};

const targetDateAfterMonths = (months) => {
  const now = new Date();
  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  date.setUTCMonth(date.getUTCMonth() + Number(months));
  return date.toISOString().slice(0, 10);
};

const monthsUntilDate = (value) => {
  if (!value) return 12;
  const target = new Date(`${value}T00:00:00`);
  const now = new Date();
  const months = (target.getFullYear() - now.getFullYear()) * 12 + target.getMonth() - now.getMonth();
  return Math.max(1, months + (target.getDate() > now.getDate() ? 1 : 0));
};

const formatStoredDate = (value) => new Intl.DateTimeFormat("en-KE", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));

const GoalsView = () => {
  const { user } = useContext(UserContext);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadItems = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/planning/goals`, { headers: { Accept: "application/json" }, credentials: "include" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load your goals.");
      setItems(data.items || []);
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Could not load your goals.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const totalTarget = useMemo(() => items.reduce((sum, item) => sum + Number(item.target_amount || 0), 0), [items]);
  const totalSaved = useMemo(() => items.reduce((sum, item) => sum + Number(item.saved_amount || 0), 0), [items]);
  const resetForm = () => { setForm(blankForm); setEditingId(null); setFormOpen(false); };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const selectedHorizon = form.horizon_months === "custom" ? form.custom_horizon : form.horizon_months;
      const dueDate = form.target_date || targetDateAfterMonths(selectedHorizon || 12);
      const horizonMonths = form.target_date ? monthsUntilDate(form.target_date) : Number(selectedHorizon || 12);
      const response = await fetch(`${API_BASE}/api/planning/goals${editingId ? `/${editingId}` : ""}`, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify({ item: { ...form, target_amount: Number(form.target_amount), saved_amount: Number(form.saved_amount), horizon_months: horizonMonths, target_date: dueDate } }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.errors ? Object.values(data.errors).flat().join(" ") : data.error || "Could not save this goal.");
      await loadItems();
      resetForm();
    } catch (requestError) {
      setError(requestError.message || "Could not save this goal.");
    } finally {
      setSaving(false);
    }
  };

  const editItem = (item) => {
    const knownHorizon = horizonOptions.some((option) => option.months === String(item.horizon_months));
    setEditingId(item.id);
    setForm({ title: item.title, category: item.category, target_amount: String(item.target_amount), saved_amount: String(item.saved_amount), horizon_months: knownHorizon ? String(item.horizon_months) : "custom", custom_horizon: knownHorizon ? "" : String(item.horizon_months), target_date: item.target_date });
    setFormOpen(true);
  };

  const removeItem = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/planning/goals/${id}`, { method: "DELETE", credentials: "include" });
      if (!response.ok) throw new Error("Could not remove this goal.");
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (requestError) {
      setError(requestError.message || "Could not remove this goal.");
    }
  };

  return (
    <div className="view-container planning-view goals-view">
      <header className="view-header planning-view-header">
        <div>
          <span className="planning-eyebrow">A PLAN WITH A PURPOSE</span>
          <h3>Your goals</h3>
          <p>Name something you are working towards and give it a timeline.</p>
        </div>
        <button className="planning-primary-button" type="button" onClick={() => { setFormOpen((open) => !open); setEditingId(null); setForm(blankForm); }}>
          {formOpen ? <X size={17} /> : <CirclePlus size={17} />}{formOpen ? "Close" : "Add a goal"}
        </button>
      </header>

      <div className="planning-summary-grid planning-goal-summary">
        <section className="planning-summary-card planning-summary-total"><span>Total goal amount</span><strong>KES {formatMoney(totalTarget)}</strong><small>Across {items.length} {items.length === 1 ? "goal" : "goals"}</small></section>
        <section className="planning-summary-card"><span>Set aside so far</span><strong>KES {formatMoney(totalSaved)}</strong><small>Based on your updates</small></section>
        <section className="planning-summary-card"><span>Goals in progress</span><strong>{items.length}</strong><small>Your personal milestones</small></section>
      </div>

      {formOpen && <form className="planning-form" onSubmit={submit}>
        <div className="planning-form-heading"><div><span>{editingId ? "UPDATE YOUR PLAN" : "SET A TARGET"}</span><h4>{editingId ? "Edit your goal" : "What are you saving for?"}</h4></div><p>You can adjust your target and progress any time.</p></div>
        <div className="planning-form-fields planning-goal-fields">
          <label className="planning-field planning-field-wide">Goal name<input required maxLength="100" placeholder="e.g. Emergency fund, new laptop" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
          <label className="planning-field">Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{goalCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
          <label className="planning-field">Target amount<input required type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0.00" value={form.target_amount} onChange={(event) => setForm({ ...form, target_amount: event.target.value })} /></label>
          <label className="planning-field">Already saved<input type="number" min="0" step="0.01" inputMode="decimal" value={form.saved_amount} onChange={(event) => setForm({ ...form, saved_amount: event.target.value })} /></label>
          <label className="planning-field">Due date<input required type="date" min={new Date().toISOString().slice(0, 10)} value={form.target_date} onChange={(event) => setForm({ ...form, target_date: event.target.value, horizon_months: event.target.value ? "custom" : form.horizon_months, custom_horizon: event.target.value ? String(monthsUntilDate(event.target.value)) : form.custom_horizon })} /></label>
        </div>
        {form.target_date && <p className="planning-form-hint">Target date: {formatStoredDate(form.target_date)}</p>}
        <div className="planning-form-actions"><button className="planning-secondary-button" type="button" onClick={resetForm}>Cancel</button><button className="planning-primary-button" type="submit" disabled={saving || (form.horizon_months === "custom" && !form.custom_horizon)}>{saving ? "Saving…" : editingId ? "Save changes" : "Create goal"}</button></div>
      </form>}

      {error && <p className="planning-error" role="alert">{error}</p>}
      <section className="planning-list-section">
        <div className="planning-list-heading"><div><h4>Goals you are working towards</h4><p>Progress reflects the amounts you have entered.</p></div><span>{items.length} {items.length === 1 ? "GOAL" : "GOALS"}</span></div>
        {loading ? <div className="planning-empty-state"><Target size={21} /><p>Loading your goals…</p></div> : items.length === 0 ? (
          <div className="planning-empty-state"><Flag size={23} /><h4>Your next milestone starts here</h4><p>Set a target amount and a timeline that works for you.</p><button type="button" className="planning-secondary-button" onClick={() => setFormOpen(true)}>Create your first goal</button></div>
        ) : <div className="planning-goals-grid">{items.map((item, index) => {
          const target = Number(item.target_amount) || 0;
          const saved = Number(item.saved_amount) || 0;
          const progress = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
          const dueDate = new Date(`${item.target_date}T00:00:00Z`);
          const today = new Date();
          const monthsUntilTarget = (dueDate.getUTCFullYear() - today.getFullYear()) * 12 + dueDate.getUTCMonth() - today.getMonth();
          const overdue = dueDate < new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
          const monthsLeft = Math.max(1, monthsUntilTarget);
          const monthlyPace = Math.max(0, target - saved) / monthsLeft;
          return <article className="planning-goal-card" key={item.id}>
            <div className="planning-goal-card-top"><div className={`planning-goal-icon tone-${index % 3}`}><Target size={19} /></div><span className="planning-goal-category">{item.category}</span><div className="planning-item-actions"><button type="button" className="planning-icon-button" aria-label={`Edit ${item.title}`} onClick={() => editItem(item)}><Pencil size={16} /></button><button type="button" className="planning-icon-button" aria-label={`Remove ${item.title}`} onClick={() => removeItem(item.id)}><Trash2 size={16} /></button></div></div>
            <h4>{item.title}</h4>
            <p className="planning-goal-date"><Flag size={14} /> {overdue ? "Past target date" : monthsUntilTarget <= 1 ? "Due this month" : monthsLeft < 12 ? `${monthsLeft} months` : monthsLeft % 12 === 0 ? `${monthsLeft / 12} ${monthsLeft === 12 ? "year" : "years"}` : `${Math.floor(monthsLeft / 12)}y ${monthsLeft % 12}m`} · target {formatStoredDate(item.target_date)}</p>
            <div className="planning-goal-progress"><div className="planning-progress-track"><span style={{ width: `${progress}%` }} /></div><div className="planning-progress-label"><span>KES {formatMoney(saved)} saved</span><strong>{progress}%</strong></div></div>
            <div className="planning-goal-footer"><div><span>Target</span><strong>KES {formatMoney(target)}</strong></div><div><span>Monthly pace</span><strong>KES {formatMoney(monthlyPace)} <ArrowUpRight size={14} /></strong></div></div>
          </article>;
        })}</div>}
      </section>
    </div>
  );
};

export default GoalsView;
