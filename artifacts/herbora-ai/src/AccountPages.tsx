import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, BookOpen, Check, ShieldCheck, UserRound } from "lucide-react";
import { Redirect, Link } from "wouter";
import { useUser } from "@clerk/react";
import { herbs } from "@/lib/herb-data";
import { useSavedHerbs } from "@/lib/use-saved-herbs";
import { HerbVisual } from "@/components/herb-visual";

function AccountFrame({ children, title, intro }: { children: ReactNode; title: string; intro: string }) {
  return <div className="account-layout"><p className="eyebrow">HERBORA account</p><h1 className="account-title">{title}</h1><p className="account-lede">{intro}</p>{children}</div>;
}

function SignedInRequired() {
  return <Redirect to="/login" />;
}

export function AccountProfilePage() {
  const { user, isLoaded } = useUser();
  const { saved } = useSavedHerbs(user?.id);
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  if (!isLoaded) return <div className="skeleton-page" aria-label="Loading account"><div/><div/><div/></div>;
  if (!user) return <SignedInRequired />;
  const beginEdit = () => {
    setFirstName(user.firstName || "");
    setLastName(user.lastName || "");
    setSuccess("");
    setError("");
    setEditing(true);
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!firstName.trim()) { setError("Enter a first name before saving."); return; }
    try {
      await user.update({ firstName: firstName.trim(), lastName: lastName.trim() || undefined });
      setEditing(false);
      setSuccess("Your profile name was updated with Clerk.");
      setError("");
    } catch {
      setError("Clerk could not update your profile. Please try again.");
      setSuccess("");
    }
  };
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "HERBORA member";
  const initials = displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return <AccountFrame title="My profile" intro="Review the account details provided by your sign-in service. Only your display name is editable here.">
    <div className="account-grid">
      <section className="account-card">
        <div className="profile-identity"><div className="profile-avatar" aria-label={`${displayName} initials`}>{initials}</div><div><h2 className="account-title" style={{ fontSize: 31, marginBottom: 4 }}>{displayName}</h2><p className="account-help">HERBORA learning account</p></div></div>
        {success && <p className="account-success" role="status">{success}</p>}
        {error && <p className="account-error" role="alert">{error}</p>}
        {editing ? <form className="account-form" onSubmit={(event) => void save(event)}>
          <label htmlFor="profile-first-name">First name</label><input className="account-input" id="profile-first-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} maxLength={50} required/>
          <label htmlFor="profile-last-name">Last name <span className="account-help">(optional)</span></label><input className="account-input" id="profile-last-name" value={lastName} onChange={(event) => setLastName(event.target.value)} maxLength={50}/>
          <div className="account-actions"><button className="button button-primary" type="submit">Save profile <Check size={16}/></button><button className="button button-outline" type="button" onClick={() => { setEditing(false); setError(""); }}>Cancel</button></div>
        </form> : <><div className="account-row"><span>Email</span><strong>{user.primaryEmailAddress?.emailAddress || "Not provided"}</strong></div><div className="account-row"><span>Account created</span><strong>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Not provided"}</strong></div><div className="account-actions"><button type="button" className="button button-primary" onClick={beginEdit}>Edit profile <UserRound size={16}/></button></div></>}
      </section>
      <section className="account-card">
        <h2 className="account-section-title">Your field notes</h2>
        <div className="account-row"><span>Saved herbs</span><strong>{saved.length}</strong></div>
        <p className="account-help">Saved items are kept in this browser on this device, scoped to your Clerk user ID. They are not synced to a server.</p>
        <Link href="/saved-herbs" className="under-link">View saved herbs <ArrowRight size={15}/></Link>
        <div className="account-section" style={{ marginTop: 22 }}><h2>Identification history</h2><p>Unavailable. The image workflow has no connected prediction model, so no identification history is created.</p></div>
      </section>
    </div>
  </AccountFrame>;
}

export function SavedHerbsPage() {
  const { user, isLoaded } = useUser();
  const { saved, remove } = useSavedHerbs(user?.id);
  if (!isLoaded) return <div className="skeleton-page" aria-label="Loading saved herbs"><div/><div/><div/></div>;
  if (!user) return <SignedInRequired />;
  const records = saved.map((id) => herbs.find((herb) => herb.id === id)).filter((herb): herb is (typeof herbs)[number] => Boolean(herb));
  return <AccountFrame title="Saved herbs" intro="A personal reading list stored locally in this browser and associated with your signed-in Clerk user ID. It does not sync between devices.">
    {records.length ? <div className="herb-grid">{records.map((herb) => <article className="saved-card" key={herb.id}>
      <Link href={`/herbs/${herb.id}`} className="herb-card"><HerbVisual herb={herb}/><div className="herb-card-copy"><span className="micro-label">{herb.family || "Family not recorded"}</span><h3>{herb.commonName}</h3><p className="latin">{herb.botanicalName}</p><div className="chip-row">{herb.plantParts.map((part) => <span className="chip" key={part}>{part}</span>)}</div></div><span className="card-arrow" aria-hidden="true"><ArrowRight size={16}/></span></Link>
      <button type="button" className="remove-saved" onClick={() => remove(herb.id)} aria-label={`Remove ${herb.commonName} from saved herbs`}>Remove saved herb</button>
    </article>)}</div> : <div className="empty-state"><BookOpen size={28}/><h2>Your field notes start here.</h2><p>Bookmark a herb profile to keep it in this device’s local reading list.</p><Link href="/herbs" className="button button-primary">Explore the herb library <ArrowRight size={16}/></Link></div>}
  </AccountFrame>;
}

type SettingsSection = "Account" | "Appearance" | "Notifications" | "Privacy" | "Data and History";
type LocalPreferences = { researchUpdates: boolean; productNews: boolean };
const preferenceKeyFor = (userId: string) => `herbora-local-preferences:${userId}`;
function readPreferences(userId?: string): LocalPreferences {
  if (!userId) return { researchUpdates: false, productNews: false };
  try {
    const value = JSON.parse(localStorage.getItem(preferenceKeyFor(userId)) || "{}");
    return { researchUpdates: Boolean(value.researchUpdates), productNews: Boolean(value.productNews) };
  } catch { return { researchUpdates: false, productNews: false }; }
}

export function SettingsPage() {
  const { user, isLoaded } = useUser();
  const { clear } = useSavedHerbs(user?.id);
  const [section, setSection] = useState<SettingsSection>("Account");
  const [preferences, setPreferences] = useState<LocalPreferences>({ researchUpdates: false, productNews: false });
  const [message, setMessage] = useState("");
  useEffect(() => setPreferences(readPreferences(user?.id)), [user?.id]);
  if (!isLoaded) return <div className="skeleton-page" aria-label="Loading settings"><div/><div/><div/></div>;
  if (!user) return <SignedInRequired />;
  const updatePreferences = (key: keyof LocalPreferences, value: boolean) => {
    const next = { ...preferences, [key]: value };
    try {
      localStorage.setItem(preferenceKeyFor(user.id), JSON.stringify(next));
      setPreferences(next);
      setMessage("Preference saved on this device.");
    } catch {
      setMessage("Browser storage is unavailable, so this preference could not be saved.");
    }
  };
  const sections: SettingsSection[] = ["Account", "Appearance", "Notifications", "Privacy", "Data and History"];
  return <AccountFrame title="Settings" intro="A clear view of what your account and this browser actually support. Local preferences stay on this device.">
    <nav className="setting-nav" aria-label="Settings sections">{sections.map((item) => <button type="button" key={item} aria-pressed={section === item} onClick={() => { setSection(item); setMessage(""); }}>{item}</button>)}</nav>
    <section className="account-card" aria-live="polite">
      <h2 className="account-section-title">{section}</h2>
      {section === "Account" && <><div className="account-row"><span>Name</span><strong>{[user.firstName, user.lastName].filter(Boolean).join(" ") || "Not provided"}</strong></div><div className="account-row"><span>Email</span><strong>{user.primaryEmailAddress?.emailAddress || "Not provided"}</strong></div><p className="account-help">Password and email verification are managed securely by Clerk.</p><Link href="/profile" className="under-link">Edit profile <ArrowRight size={15}/></Link></>}
      {section === "Appearance" && <div className="account-section"><h2>Light appearance</h2><p>This app currently supports the light botanical theme only. A dark theme is not available.</p><span className="chip"><Check size={13}/> Light theme active</span></div>}
      {section === "Notifications" && <><p className="account-help">These are local preference markers only. HERBORA does not send research or product emails.</p><label className="account-row"><span><strong>Research updates</strong><br/>Local interest preference; no email is sent</span><input type="checkbox" checked={preferences.researchUpdates} onChange={(event) => updatePreferences("researchUpdates", event.target.checked)} aria-label="Research updates local preference"/></label><label className="account-row"><span><strong>Product announcements</strong><br/>Local interest preference; no email is sent</span><input type="checkbox" checked={preferences.productNews} onChange={(event) => updatePreferences("productNews", event.target.checked)} aria-label="Product announcements local preference"/></label></>}
      {section === "Privacy" && <><div className="account-section"><h2><ShieldCheck size={18}/> Browser storage</h2><p>This device may store saved herb IDs and these preference toggles. Recent search terms are session-only. The image demo creates a local preview and does not send the selected file to an identification model.</p><p>Clerk manages authentication session data. HERBORA does not save passwords or auth tokens in localStorage.</p></div></>}
      {section === "Data and History" && <><div className="account-section"><h2>Identification history</h2><p>Unavailable until an actual model prediction service returns a result. No fake entries are generated.</p></div><div className="account-section" style={{ marginTop: 14 }}><h2>Saved herbs</h2><p>Saved herb IDs are stored locally for this signed-in user in this browser.</p><button className="button button-outline" type="button" onClick={() => { if (window.confirm("Remove all locally saved herb bookmarks for this account from this browser?")) { clear(); setMessage("Saved herbs cleared from this device."); } }}>Clear saved herbs</button></div><div className="account-section" style={{ marginTop: 14 }}><h2>Recent searches</h2><p>Recent searches are stored only for the current browser session.</p><button className="button button-outline" type="button" onClick={() => { if (window.confirm("Clear recent search terms for this browser session?")) { sessionStorage.removeItem("herbora-recent-searches"); setMessage("Recent searches cleared for this session."); } }}>Clear recent searches</button></div></>}
      {message && <p className="account-success" role="status">{message}</p>}
    </section>
  </AccountFrame>;
}
