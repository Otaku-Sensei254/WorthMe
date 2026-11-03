import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CalendarDays, CirclePlus, Pencil, Repeat2, Trash2, X } from "lucide-react";
import { UserContext } from "../../../context/userContext";
import { formatMoney } from "../../../utils/money";
import { recurringMonthlyEquivalent, recurringScheduleLabel } from "../../../utils/recurring";
import "../../styles/dashboard.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";
const categories = ["Housing", "Utilities", "Subscriptions", "Transport", "Food", "Insurance", "Debt", "Other"];
const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const blankForm = {
  name: "", category: "Subscriptions", amount: "", frequency: "monthly",
  due_day: "1", due_month: "1", due_weekday: "1",
};

const nextDueDate = (item) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (item.frequency === "daily") return today;
  if (item.frequency === "weekly") {
    const daysAhead = (Number(item.due_weekday) - today.getDay() + 7) % 7;
    const next = new Date(today);
    next.setDate(today.getDate() + daysAhead);
    return next;
  }

  if (item.frequency === "yearly") {
    const month = Number(item.due_month) - 1;
    const day = Number(item.due_day);
    const forYear = (year) => new Date(year, month, Math.min(day, new Date(year, month + 1, 0).getDate()));
    let next = forYear(today.getFullYear());
    if (next < today) next = forYear(today.getFullYear() + 1);
    return next;
  }

  const day = Number(item.due_day);
  let nextMonth = today.getMonth();
  let nextYear = today.getFullYear();
  let next = new Date(nextYear, nextMonth, Math.min(day, new Date(nextYear, nextMonth + 1, 0).getDate()));
  if (next < today) {
    nextMonth += 1;
    if (nextMonth > 11) { nextMonth = 0; nextYear += 1; }
    next = new Date(nextYear, nextMonth, Math.min(day, new Date(nextYear, nextMonth + 1, 0).getDate()));
  }
  return next;
};

const RecurringView = () => {
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
      const response = await fetch(`${API_BASE}/api/planning/recurring`, {
        headers: { Accept: "application/json" }, credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load recurring items.");
      setItems(data.items || []);
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Could not load recurring items.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const monthlyTotal = useMemo(
    () => items.filter((item) => item.active).reduce((sum, item) => sum + recurringMonthlyEquivalent(item), 0),
    [items]
  );
  const nextItem = useMemo(() => {
    return items.filter((item) => item.active)
      .map((item) => ({ ...item, nextDue: nextDueDate(item) }))
      .sort((a, b) => a.nextDue - b.nextDue)[0];
  }, [items]);

  const daysInSelectedMonth = new Date(2024, Number(form.due_month), 0).getDate();

  const resetForm = () => {
    setForm(blankForm);
    setEditingId(null);
    setFormOpen(false);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/planning/recurring${editingId ? `/${editingId}` : ""}`, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify({
          item: {
            ...form,
            amount: Number(form.amount),
            due_day: form.frequency === "monthly" || form.frequency === "yearly" ? Number(form.due_day) : null,
            due_month: form.frequency === "yearly" ? Number(form.due_month) : null,
            due_weekday: form.frequency === "weekly" ? Number(form.due_weekday) : null,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.errors ? Object.values(data.errors).flat().join(" ") : data.error || "Could not save this item.");
      await loadItems();
      resetForm();
    } catch (requestError) {
      setError(requestError.message || "Could not save this item.");
    } finally {
      setSaving(false);
    }
  };

  const editItem = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      amount: String(item.amount),
      frequency: item.frequency || "monthly",
      due_day: String(item.due_day || 1),
      due_month: String(item.due_month || 1),
      due_weekday: String(item.due_weekday ?? 1),
    });
    setFormOpen(true);
  };

  const removeItem = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/planning/recurring/${id}`, { method: "DELETE", credentials: "include" });
      if (!response.ok) throw new Error("Could not remove this item.");
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (requestError) {
      setError(requestError.message || "Could not remove this item.");
    }
  };

  const toggleActive = async (item) => {
    try {
      const response = await fetch(`${API_BASE}/api/planning/recurring/${item.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include", body: JSON.stringify({ item: { active: !item.active } }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error("Could not update this item.");
      setItems((current) => current.map((entry) => entry.id === item.id ? data.item : entry));
    } catch (requestError) {
      setError(requestError.message || "Could not update this item.");
    }
  };

  return (
    <div className="view-container planning-view">
      <header className="view-header planning-view-header">
        <div>
          <span className="planning-eyebrow">YOUR RECURRING BASELINE</span>
          <h3>Recurring expenses</h3>
          <p>Keep track of the bills and subscriptions you expect each month.</p>
        </div>
        <button className="planning-primary-button" type="button" onClick={() => { setFormOpen((open) => !open); setEditingId(null); setForm(blankForm); }}>
          {formOpen ? <X size={17} /> : <CirclePlus size={17} />}{formOpen ? "Close" : "Add expense"}
        </button>
      </header>

      <div className="planning-summary-grid">
        <section className="planning-summary-card planning-summary-total">
            <span>Monthly equivalent</span>
          <strong>KES {formatMoney(monthlyTotal)}</strong>
            <small>Estimated from each item’s frequency</small>
        </section>
        <section className="planning-summary-card">
          <span>Next expected</span>
            <strong>{nextItem ? nextItem.nextDue.toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "—"}</strong>
            <small>{nextItem ? `${nextItem.name} · ${recurringScheduleLabel(nextItem)}` : "Add an expense to see what is coming up"}</small>
        </section>
        <section className="planning-summary-card">
          <span>Tracked items</span>
          <strong>{items.length}</strong>
            <small>Daily, weekly, monthly and yearly items</small>
        </section>
      </div>

      {formOpen && <form className="planning-form" onSubmit={submit}>
        <div className="planning-form-heading">
          <div><span>{editingId ? "UPDATE ITEM" : "NEW RECURRING ITEM"}</span><h4>{editingId ? "Edit recurring item" : "Add a recurring item"}</h4></div>
          <p>Set how often you expect to use or pay for it.</p>
        </div>
        <div className="planning-form-fields">
          <label className="planning-field planning-field-wide">Name<input required maxLength="100" placeholder="e.g. Rent, Spotify, bus pass" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label className="planning-field">Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
          <label className="planning-field">Amount per interval<input required type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0.00" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></label>
          <label className="planning-field">Frequency<select value={form.frequency} onChange={(event) => setForm({ ...form, frequency: event.target.value })}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></label>
          {form.frequency === "weekly" && <label className="planning-field">Day of week<select value={form.due_weekday} onChange={(event) => setForm({ ...form, due_weekday: event.target.value })}>{weekdays.map((weekday, index) => <option key={weekday} value={index}>{weekday}</option>)}</select></label>}
          {form.frequency === "monthly" && <label className="planning-field">Due day<input required type="number" min="1" max="31" inputMode="numeric" value={form.due_day} onChange={(event) => setForm({ ...form, due_day: event.target.value })} /><small>Day of each month</small></label>}
          {form.frequency === "yearly" && <>
            <label className="planning-field">Due month<select required value={form.due_month} onChange={(event) => {
              const due_month = event.target.value;
              const maxDay = new Date(2024, Number(due_month), 0).getDate();
              setForm({ ...form, due_month, due_day: String(Math.min(Number(form.due_day), maxDay)) });
            }}>{months.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}</select></label>
            <label className="planning-field">Due date<input required type="number" min="1" max={daysInSelectedMonth} inputMode="numeric" value={form.due_day} onChange={(event) => setForm({ ...form, due_day: event.target.value })} /><small>Day of the selected month</small></label>
          </>}
        </div>
        <div className="planning-form-actions">
          <button className="planning-secondary-button" type="button" onClick={resetForm}>Cancel</button>
          <button className="planning-primary-button" type="submit" disabled={saving}>{saving ? "Saving…" : editingId ? "Save changes" : "Add to expenses"}</button>
        </div>
      </form>}

      {error && <p className="planning-error" role="alert">{error}</p>}
      <section className="planning-list-section">
        <div className="planning-list-heading"><div><h4>Your recurring items</h4><p>Plan for expenses and spending that repeat on your schedule.</p></div><span>{items.length} {items.length === 1 ? "ITEM" : "ITEMS"}</span></div>
        {loading ? <div className="planning-empty-state"><Repeat2 size={21} /><p>Loading your recurring items…</p></div> : items.length === 0 ? (
          <div className="planning-empty-state"><CalendarDays size={23} /><h4>No recurring items yet</h4><p>Add rent, subscriptions, daily spending, or any other cost you expect regularly.</p><button type="button" className="planning-secondary-button" onClick={() => setFormOpen(true)}>Add your first item</button></div>
        ) : <div className="planning-items-list">{items.map((item) => (
          <article className={`planning-item-row ${item.active ? "" : "is-paused"}`} key={item.id}>
            <div className="planning-item-icon"><Repeat2 size={18} /></div>
            <div className="planning-item-name"><strong>{item.name}</strong><span>{item.category} <i>·</i> {recurringScheduleLabel(item)}</span></div>
            <div className="planning-item-date"><CalendarDays size={15} /><span>Next · {nextDueDate(item).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span></div>
            <strong className="planning-item-amount">KES {formatMoney(item.amount)}</strong>
            <div className="planning-item-actions">
              <button type="button" className="planning-icon-button" aria-label={`Edit ${item.name}`} onClick={() => editItem(item)}><Pencil size={16} /></button>
              <button type="button" className="planning-icon-button" aria-label={`Remove ${item.name}`} onClick={() => removeItem(item.id)}><Trash2 size={16} /></button>
            </div>
            <button type="button" className={`planning-status ${item.active ? "is-active" : ""}`} onClick={() => toggleActive(item)} aria-label={`${item.active ? "Pause" : "Activate"} ${item.name}`}>{item.active ? "Active" : "Paused"}</button>
          </article>
        ))}</div>}
      </section>
    </div>
  );
};

export default RecurringView;
