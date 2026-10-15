import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ArrowDownWideNarrow, ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, CircleAlert, FlaskConical, Grid2X2, ImagePlus, Info, Leaf, List, LoaderCircle, Menu, Search, ShieldCheck, Sprout, Upload, X } from "lucide-react";
import { Link, Route, Switch, Router as WouterRouter, useLocation, useParams } from "wouter";
import { herbs, type Herb } from "@/lib/herb-data";
import { getEvidence, getHerbById, getHerbs, getRecommendations, getSafetyInformation, identifyHerb, searchHerbs } from "@/lib/herb-service";

const queryClient = new QueryClient();
const navItems = [
  { href: "/", label: "Overview", icon: Sprout },
  { href: "/identify", label: "Identify", icon: ImagePlus },
  { href: "/herbs", label: "Herb library", icon: BookOpen },
  { href: "/search", label: "Search", icon: Search },
  { href: "/recommendations", label: "Explore related", icon: ArrowDownWideNarrow },
  { href: "/evidence-safety", label: "Evidence & safety", icon: ShieldCheck },
  { href: "/about", label: "About & method", icon: Info },
];

function PageMeta({ title, description }: { title: string; description: string }) {
  useEffect(() => {
    document.title = `${title} — HERBORA AI`;
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); }
    meta.content = description;
  }, [title, description]);
  return null;
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMenuOpen(false), [location]);
  return <div className="app-shell">
    <header className="topbar">
      <Link href="/" className="brand" aria-label="HERBORA AI overview"><span className="brand-mark"><Sprout size={22}/></span><span><b>HERBORA</b><small>FIELD NOTES · AI</small></span></Link>
      <button type="button" className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label={menuOpen ? "Close navigation" : "Open navigation"}><Menu size={22}/></button>
      <nav className={`nav-links ${menuOpen ? "is-open" : ""}`} aria-label="Main navigation">
        {navItems.map(({ href, label }) => <Link key={href} href={href} className={`nav-link ${location === href || (href === "/herbs" && location.startsWith("/herbs/")) ? "active" : ""}`} aria-current={location === href ? "page" : undefined}>{label}</Link>)}
      </nav>
      <div className="top-note"><span className="status-dot"/><span>Learning reference</span></div>
    </header>
    <main className="page-wrap">{children}</main>
    <footer className="footer"><div><span className="footer-brand">HERBORA AI</span><span>Botanical knowledge, carefully contextualized.</span></div><Link href="/evidence-safety">Educational use only <ArrowRight size={14}/></Link></footer>
  </div>;
}

function PageIntro({ eyebrow, title, description, aside }: { eyebrow: string; title: string; description: string; aside?: ReactNode }) {
  return <div className="page-intro"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="intro-copy">{description}</p></div>{aside && <div className="intro-aside">{aside}</div>}</div>;
}

function HerbVisual({ herb, className = "" }: { herb: Herb; className?: string }) {
  const [failed, setFailed] = useState(false);
  return <div className={`herb-visual ${className}`} aria-label={herb.imageUrl && !failed ? `${herb.commonName} image` : `${herb.commonName} botanical illustration placeholder`}>
    {herb.imageUrl && !failed ? <img src={herb.imageUrl} alt={herb.commonName} onError={() => setFailed(true)}/> :
      <div className={`plant-placeholder plant-${herb.id}`} aria-hidden="true"><span className="botanical-ring"/><span className="plant-stem"/><span className="plant-leaf leaf-a"/><span className="plant-leaf leaf-b"/><span className="plant-leaf leaf-c"/><span className="plant-name">{herb.botanicalName.split(" ")[0]}</span></div>}
  </div>;
}

function HerbCard({ herb, list = false }: { herb: Herb; list?: boolean }) {
  return <Link href={`/herbs/${herb.id}`} className={`herb-card ${list ? "list-card" : ""}`} data-testid={`card-herb-${herb.id}`}>
    <HerbVisual herb={herb}/><div className="herb-card-copy"><span className="micro-label">{herb.family || "Family not recorded"}</span><h3>{herb.commonName}</h3><p className="latin">{herb.botanicalName}</p><div className="chip-row">{herb.plantParts.map((part) => <span className="chip" key={part}>{part}</span>)}</div></div><span className="card-arrow" aria-hidden="true"><ArrowRight size={16}/></span>
  </Link>;
}

function Overview() {
  return <><PageMeta title="Overview" description="A careful learning space for Ayurvedic herbal knowledge."/>
    <section className="hero">
      <div className="hero-content"><p className="eyebrow"><span className="eyebrow-line"/>A living study companion</p><h1>Learn the plant.<br/><em>Question the claim.</em></h1><p className="hero-copy">HERBORA brings botanical reference, traditional context and evidence boundaries into one thoughtful place for students and researchers.</p><div className="hero-actions"><Link href="/herbs" className="button button-primary">Explore the library <ArrowRight size={16}/></Link><Link href="/about" className="text-link">How this works <ArrowRight size={15}/></Link></div><div className="hero-footnote"><span>01 / 03</span><span className="footnote-rule"/><span>A learning tool, not a clinical resource</span></div></div>
      <div className="hero-art" aria-hidden="true"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="sun-disc"/><div className="hero-leaf leaf-large"/><div className="hero-leaf leaf-small"/><div className="hero-plant-line"/><span className="art-caption">BOTANICAL<br/>OBSERVATION</span><span className="art-index">H · 01</span><span className="hero-plant-label">A study starts<br/>with looking closer.</span></div>
    </section>
    <section className="overview-band"><div><span className="stat-number">06</span><span className="stat-label">sample herb records</span></div><p>Small by design. Every profile separates traditional knowledge from research references, and leaves unsupported fields blank.</p><Link href="/evidence-safety" className="under-link">Our evidence boundaries <ArrowRight size={15}/></Link></section>
    <section className="section-block"><div className="section-heading"><div><p className="eyebrow">Choose a way in</p><h2>Begin with a question.</h2></div><Link className="text-link" href="/about">Our approach <ArrowRight size={15}/></Link></div>
      <div className="entry-grid">
        <Link href="/identify" className="entry-card entry-terracotta"><span className="entry-num">01</span><ImagePlus size={22}/><h3>Look at a plant</h3><p>Explore the image-upload workflow. Identification is a demo only; no model is connected.</p><span className="entry-link">Try the demo <ArrowRight size={15}/></span></Link>
        <Link href="/herbs" className="entry-card entry-sage"><span className="entry-num">02</span><BookOpen size={22}/><h3>Browse herb notes</h3><p>Search a small sample library by common name, family or plant part.</p><span className="entry-link">Open the library <ArrowRight size={15}/></span></Link>
        <Link href="/search" className="entry-card entry-ivory"><span className="entry-num">03</span><Search size={22}/><h3>Follow a thread</h3><p>Find records with a local keyword search across documented fields.</p><span className="entry-link">Search notes <ArrowRight size={15}/></span></Link>
      </div>
    </section>
    <section className="note-strip"><div className="note-icon"><FlaskConical size={22}/></div><div><p className="eyebrow">A note on what this is</p><h2>Curiosity, with clear edges.</h2><p>Traditional use is not the same as clinical evidence. HERBORA is an educational prototype and does not provide diagnosis, treatment, or medical advice.</p></div><Link href="/evidence-safety" className="button button-outline">Read evidence & safety</Link></section>
  </>;
}

function IdentifyPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const processFile = (incoming?: File) => {
    setError(""); setResult(false);
    if (!incoming) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(incoming.type)) { setError("Choose a JPG, JPEG, PNG or WEBP image."); return; }
    if (incoming.size > 10 * 1024 * 1024) { setError("This image is larger than 10 MB. Choose a smaller file."); return; }
    if (preview) URL.revokeObjectURL(preview);
    setFile(incoming); setPreview(URL.createObjectURL(incoming));
  };
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const remove = () => { setFile(null); setResult(false); setError(""); if (preview) URL.revokeObjectURL(preview); setPreview(""); if (inputRef.current) inputRef.current.value = ""; };
  const analyze = async () => {
    if (!file) return;
    setLoading(true); setError("");
    try { const response = await identifyHerb(file); setResult(response.status === "model-not-connected"); }
    catch { setError("The demo service could not process this file. Try again."); }
    finally { setLoading(false); }
  };
  return <><PageMeta title="Identify a plant" description="Image upload demo for future plant identification."/><PageIntro eyebrow="Image study · demo" title="Start with an image." description="Add a plant image to explore the planned identification flow. This prototype has no trained model connected, so it cannot identify the plant."/>
    <div className="identify-layout"><section className="upload-panel">
      <div className="panel-topline"><span className="eyebrow">01 / Upload</span><span className="file-limit">JPG · PNG · WEBP <i/> UP TO 10 MB</span></div>
      {!file ? <div className="drop-zone" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); processFile(e.dataTransfer.files[0]); }} aria-label="Drop an image here">
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" hidden onChange={(e) => processFile(e.target.files?.[0])} data-testid="input-plant-image"/>
        <div className="upload-icon"><Upload size={24}/></div><h2>Drop a plant image here</h2><p>or choose a file from your device</p><button type="button" className="button button-outline" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>Browse files</button><small>For this demo, the image stays in your browser.</small>
      </div> : <div className="preview-box"><img src={preview} alt={`Preview of ${file.name}`}/><div className="preview-caption"><span><b>{file.name}</b><small>{(file.size / 1024 / 1024).toFixed(2)} MB · ready to review</small></span><button className="icon-button" type="button" onClick={remove} aria-label="Remove image"><X size={18}/></button></div></div>}
      {error && <p className="form-error" role="alert"><CircleAlert size={16}/>{error}</p>}
      {file && <div className="upload-actions"><button type="button" className="text-link" onClick={() => inputRef.current?.click()}>Replace image</button><button type="button" className="button button-primary" disabled={loading} onClick={analyze}>{loading ? <><LoaderCircle className="spin" size={16}/> Preparing…</> : <>Continue to demo <ArrowRight size={16}/></>}</button></div>}
      {result && <div className="demo-result" role="status"><span className="result-stamp"><Info size={18}/></span><div><strong>Demo result — model not connected</strong><p>No identification or confidence score has been generated. Connect a trained model API to enable this step.</p><button type="button" className="text-link" onClick={remove}>Analyze another image <ArrowRight size={14}/></button></div></div>}
    </section><aside className="identify-aside"><div className="aside-mark"><Leaf size={23}/></div><p className="eyebrow">Before you begin</p><h2>A photograph is a starting point, not proof.</h2><p>Reliable plant identification can depend on leaves, flowers, fruit, habitat and season. Never rely on an image match to decide whether a plant is safe to use.</p><div className="fine-rule"/><p className="small-note">Nothing is uploaded to a server in this demo. The future integration should send only the chosen file to a dedicated identification endpoint, with consent and retention rules made clear.</p><Link href="/about" className="under-link">Read the API notes <ArrowRight size={14}/></Link></aside></div>
  </>;
}

function LibraryPage() {
  const [query, setQuery] = useState(""); const [family, setFamily] = useState(""); const [part, setPart] = useState(""); const [category, setCategory] = useState(""); const [sort, setSort] = useState<"name" | "botanical">("name"); const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [results, setResults] = useState<Herb[]>(herbs); const [loading, setLoading] = useState(false); const [failed, setFailed] = useState(false);
  const families = useMemo(() => [...new Set(herbs.map((h) => h.family).filter(Boolean))] as string[], []);
  const parts = useMemo(() => [...new Set(herbs.flatMap((h) => h.plantParts))].sort(), []);
  const categories = useMemo(() => [...new Set(herbs.map((h) => h.studyCategory).filter(Boolean))] as string[], []);
  useEffect(() => { let alive = true; setLoading(true); getHerbs({ query, family, part, category, sort }).then((data) => { if (alive) { setResults(data); setFailed(false); } }).catch(() => { if (alive) setFailed(true); }).finally(() => { if (alive) setLoading(false); }); return () => { alive = false; }; }, [query, family, part, category, sort]);
  const clear = () => { setQuery(""); setFamily(""); setPart(""); setCategory(""); };
  return <><PageMeta title="Herb library" description="Search and filter HERBORA sample herb records."/><PageIntro eyebrow="Reference library" title="A small field guide." description="Browse the current sample records. Each entry is intentionally modest: details appear only when present in the local reference data." aside={<span className="collection-count"><b>06</b><small>sample entries</small></span>}/>
    <section className="library-controls"><label className="search-field"><Search size={18}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search names, family, plant parts…" aria-label="Search herb library" data-testid="input-library-search"/>{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={16}/></button>}</label>
      <div className="filter-row"><label>Family <span className="select-wrap"><select value={family} onChange={(e) => setFamily(e.target.value)} aria-label="Filter by family"><option value="">All families</option>{families.map((v) => <option key={v}>{v}</option>)}</select><ChevronDown size={14}/></span></label><label>Plant part <span className="select-wrap"><select value={part} onChange={(e) => setPart(e.target.value)} aria-label="Filter by plant part"><option value="">All parts</option>{parts.map((v) => <option key={v}>{v}</option>)}</select><ChevronDown size={14}/></span></label><label>Category <span className="select-wrap"><select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category"><option value="">All categories</option>{categories.map((v) => <option key={v}>{v}</option>)}</select><ChevronDown size={14}/></span></label><label className="sort-label"><span>Sort</span><span className="select-wrap"><select value={sort} onChange={(e) => setSort(e.target.value as "name" | "botanical")} aria-label="Sort herbs"><option value="name">Common name</option><option value="botanical">Botanical name</option></select><ChevronDown size={14}/></span></label><div className="view-toggle" aria-label="View layout"><button type="button" onClick={() => setLayout("grid")} className={layout === "grid" ? "selected" : ""} aria-label="Grid view" aria-pressed={layout === "grid"}><Grid2X2 size={17}/></button><button type="button" onClick={() => setLayout("list")} className={layout === "list" ? "selected" : ""} aria-label="List view" aria-pressed={layout === "list"}><List size={18}/></button></div></div>
      <div className="results-line"><span>{loading ? "Updating records…" : `${results.length} ${results.length === 1 ? "record" : "records"} found`}</span>{(query || family || part || category) && <button type="button" className="text-link" onClick={clear}>Clear filters <X size={14}/></button>}</div>
    </section>
    {failed ? <div className="empty-state"><CircleAlert size={26}/><h2>Library unavailable</h2><p>Something interrupted this local lookup.</p><button className="button button-outline" onClick={() => { setFailed(false); void getHerbs({ query, family, part, category, sort }).then(setResults).catch(() => setFailed(true)); }}>Try again</button></div> :
      results.length ? <div className={`herb-grid ${layout === "list" ? "is-list" : ""}`}>{results.map((herb) => <HerbCard key={herb.id} herb={herb} list={layout === "list"}/>)}</div> :
      <div className="empty-state"><Search size={28}/><h2>No records match those filters.</h2><p>Try a different spelling or widen your selection.</p><button className="button button-outline" onClick={clear}>Clear all filters</button></div>}
    <p className="dataset-footnote">Sample records are for educational navigation only. The library is not comprehensive.</p>
  </>;
}

function ProfilePage() {
  const { id = "" } = useParams<{ id: string }>();
  const [herb, setHerb] = useState<Herb | undefined>(); const [safety, setSafety] = useState<Awaited<ReturnType<typeof getSafetyInformation>>>([]); const [ready, setReady] = useState(false);
  useEffect(() => { setReady(false); Promise.all([getHerbById(id), getSafetyInformation(id)]).then(([record, records]) => { setHerb(record); setSafety(records); }).finally(() => setReady(true)); }, [id]);
  if (!ready) return <div className="skeleton-page" aria-label="Loading herb profile"><div/><div/><div/></div>;
  if (!herb) return <><PageMeta title="Record not found" description="No herb record found."/><div className="empty-state"><Leaf size={28}/><h1>That record isn't in the field notes.</h1><p>The sample library may not include this plant.</p><Link href="/herbs" className="button button-primary">Return to library <ArrowRight size={16}/></Link></div></>;
  const siblings = herbs.filter((item) => item.id !== herb.id && (item.family === herb.family || item.plantParts.some((part) => herb.plantParts.includes(part)))).slice(0, 3);
  return <><PageMeta title={herb.commonName} description={`Educational botanical profile for ${herb.commonName}.`}/><Link href="/herbs" className="back-link"><ArrowLeft size={15}/> Back to library</Link>
    <section className="profile-head"><HerbVisual herb={herb}/><div><p className="eyebrow">Herb record · sample data</p><h1>{herb.commonName}</h1><p className="profile-latin">{herb.botanicalName}</p><div className="profile-tags"><span className="chip">{herb.family || "Family not recorded"}</span>{herb.plantParts.map((item) => <span className="chip" key={item}>{item}</span>)}</div><p className="profile-overview">{herb.overview || "No overview has been added to this record."}</p></div><div className="record-stamp">FIELD<br/>NOTE<br/><b>0{herbs.indexOf(herb) + 1}</b></div></section>
    <div className="profile-columns"><div className="profile-main">
      <section className="info-section"><p className="eyebrow">Traditional knowledge</p><h2>Use in traditional context</h2>{herb.traditionalUses.length ? <ul className="clean-list">{herb.traditionalUses.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="missing-note">No traditional-use notes have been added to this record.</p>}<p className="section-caveat">Traditional knowledge is presented as cultural and historical context, not as evidence of clinical efficacy.</p></section>
      <section className="info-section"><p className="eyebrow">Documented fields</p><h2>What this record contains</h2><div className="data-rows"><DataRow label="Properties" count={herb.properties.length}/><DataRow label="Constituents" count={herb.constituents.length}/><DataRow label="Formulations" count={herb.formulations.length}/><DataRow label="Evidence references" count={herb.references.length}/></div>
        {herb.properties.length > 0 && <RecordList title="Properties" items={herb.properties.map((item) => item.description ? `${item.name} — ${item.description}` : item.name)}/>}
        {herb.constituents.length > 0 && <RecordList title="Constituents" items={herb.constituents.map((item) => item.note ? `${item.name} — ${item.note}` : item.name)}/>}
        {herb.formulations.length > 0 && <RecordList title="Formulations" items={herb.formulations.map((item) => item.note ? `${item.name} — ${item.note}` : item.name)}/>}
        {herb.references.length > 0 && <div className="profile-references"><h3>Source references</h3>{herb.references.map((reference) => <div key={reference.id}><span className="micro-label">{reference.category} · {reference.topic}</span><p>{reference.title}</p>{reference.sourceUrl && <a className="under-link" href={reference.sourceUrl} target="_blank" rel="noreferrer">View source <ArrowRight size={13}/></a>}</div>)}</div>}
        <p className="missing-note">An empty field means no entry is currently available here; it does not mean the information is unknown in the wider literature.</p></section>
    </div><aside className="profile-side"><div className="side-card safety-card"><ShieldCheck size={20}/><p className="eyebrow">Safety record</p>{safety.length ? <><h3>Source-linked notes</h3>{safety.map((record) => <div key={record.id}>{[...record.precautions, ...record.contraindications, ...record.interactions].map((note, index) => <p key={`${record.id}-${index}`}>{note}</p>)}{record.sourceUrl && <a className="under-link" href={record.sourceUrl} target="_blank" rel="noreferrer">Open safety source <ArrowRight size={14}/></a>}</div>)}</> : <><h3>No source-linked safety record</h3><p>This sample record has no safety references attached. Do not interpret this as a safety assurance.</p></>}<Link href="/evidence-safety" className="under-link">Read the safety note <ArrowRight size={14}/></Link></div><div className="side-card"><p className="eyebrow">Record details</p><p>Plant family <b>{herb.family || "Not recorded"}</b></p><p>Plant parts <b>{herb.plantParts.join(", ") || "Not recorded"}</b></p><p>Image <b>{herb.imageUrl ? "Available" : "Not supplied"}</b></p></div></aside></div>
    {siblings.length > 0 && <section className="section-block related-section"><div className="section-heading"><div><p className="eyebrow">Based on shared record features</p><h2>Related field notes</h2></div><Link className="text-link" href="/recommendations">How relationships are derived <ArrowRight size={15}/></Link></div><div className="herb-grid">{siblings.map((item) => <HerbCard key={item.id} herb={item}/>)}</div></section>}
  </>;
}

function DataRow({ label, count }: { label: string; count: number }) { return <div className="data-row"><span>{label}</span><span>{count ? `${count} recorded` : "No data in this sample"}<ChevronDown size={14}/></span></div>; }
function RecordList({ title, items }: { title: string; items: string[] }) { return <div className="profile-record-list"><h3>{title}</h3><ul className="clean-list">{items.map((item) => <li key={item}>{item}</li>)}</ul></div>; }

function SearchPage() {
  const [query, setQuery] = useState(""); const [submitted, setSubmitted] = useState(""); const [results, setResults] = useState<Herb[]>([]); const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>(() => { try { return JSON.parse(sessionStorage.getItem("herbora-recent-searches") || "[]") as string[]; } catch { return []; } });
  const run = async (value = query) => { const q = value.trim(); if (!q) return; setQuery(q); setSubmitted(q); setLoading(true); try { const found = await searchHerbs(q); setResults(found); const next = [q, ...recent.filter((item) => item.toLowerCase() !== q.toLowerCase())].slice(0, 5); setRecent(next); sessionStorage.setItem("herbora-recent-searches", JSON.stringify(next)); } finally { setLoading(false); } };
  const clearRecent = () => { setRecent([]); sessionStorage.removeItem("herbora-recent-searches"); };
  return <><PageMeta title="Search notes" description="Local keyword search across sample herb records."/><PageIntro eyebrow="Find a thread" title="Search the notes." description="A local keyword and typo-tolerant search across names, botanical names, plant families, parts and study categories. No search is sent to a server."/>
    <form className="search-page-form" onSubmit={(e) => { e.preventDefault(); void run(); }}><Search size={21}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try a plant name or family…" aria-label="Search field notes" data-testid="input-search"/><button type="submit" className="button button-primary" disabled={!query.trim() || loading}>{loading ? "Searching…" : "Search"} <ArrowRight size={15}/></button></form>
    <div className="search-examples"><span className="micro-label">Try an example</span>{["Lamiaceae", "rhizome", "amla", "Withania"].map((item) => <button type="button" key={item} onClick={() => { setQuery(item); void run(item); }}>{item}</button>)}</div>
    <div className="search-columns"><section className="search-results">{submitted ? <><div className="section-heading"><div><p className="eyebrow">Search results</p><h2>{results.length} {results.length === 1 ? "match" : "matches"} for “{submitted}”</h2></div></div>{results.length ? <div className="herb-grid is-list">{results.map((herb) => <HerbCard key={herb.id} herb={herb} list/>)}</div> : <div className="empty-state compact"><Search size={24}/><h3>No close matches.</h3><p>Try a broader term such as a plant part or family.</p></div>}</> : <div className="search-prompt"><div className="prompt-mark"><Leaf size={22}/></div><p className="eyebrow">Local reference search</p><h2>One good question<br/>can open a field.</h2><p>Searches match only fields currently present in the sample records.</p></div>}</section>
      <aside className="recent-panel"><div className="section-heading"><div><p className="eyebrow">This session only</p><h3>Recent searches</h3></div>{recent.length > 0 && <button type="button" className="subtle-button" onClick={clearRecent}>Clear</button>}</div>{recent.length ? <ul>{recent.map((item) => <li key={item}><button type="button" onClick={() => void run(item)}><Search size={14}/>{item}<ArrowRight size={14}/></button></li>)}</ul> : <p className="missing-note">Search terms you run will appear here until this browser session ends.</p>}</aside></div>
  </>;
}

function RecommendationsPage() {
  const [selected, setSelected] = useState(""); const [items, setItems] = useState<Awaited<ReturnType<typeof getRecommendations>>>([]);
  useEffect(() => { getRecommendations(selected).then(setItems); }, [selected]);
  return <><PageMeta title="Explore related" description="Explore sample herbs through documented metadata overlap."/><PageIntro eyebrow="Metadata exploration" title="Find shared ground." description="Explore related sample entries through transparent overlap in recorded plant family and plant parts. Similarity is descriptive only—not a measure of efficacy or suitability."/>
    <section className="recommend-control"><label htmlFor="recommend-herb">Compare a record</label><span className="select-wrap"><select id="recommend-herb" value={selected} onChange={(e) => setSelected(e.target.value)}><option value="">Choose a herb to begin…</option>{herbs.map((herb) => <option key={herb.id} value={herb.id}>{herb.commonName} · {herb.botanicalName}</option>)}</select><ChevronDown size={14}/></span></section>
    {!selected ? <div className="recommend-empty"><div className="overlap-graphic"><span/><span/><span/></div><p className="eyebrow">No ranking without overlap</p><h2>Choose an entry to map its metadata.</h2><p>Only shared family and plant-part values currently support these links. No health outcomes, doshas, or treatment recommendations are inferred.</p></div> :
      items.length ? <div className="recommend-list"><div className="results-line"><span>{items.length} records share at least one documented feature</span><span className="micro-label">Sorted by overlap count</span></div>{items.map(({ herb, result }) => <article className="recommend-row" key={herb.id}><div className="recommend-index">0{herbs.indexOf(herb) + 1}</div><div className="recommend-title"><p className="eyebrow">Shared with {herbs.find((h) => h.id === selected)?.commonName}</p><Link href={`/herbs/${herb.id}`}><h3>{herb.commonName} <ArrowRight size={15}/></h3></Link><p className="latin">{herb.botanicalName}</p></div><div className="overlap-tags"><span className="micro-label">Documented overlap</span><div>{result.sharedFeatures.map((feature) => <span className="chip" key={feature}><Check size={12}/>{feature}</span>)}</div></div><p className="overlap-disclaimer">Metadata similarity only</p></article>)}</div> :
      <div className="empty-state"><p>No other sample record shares a documented family or plant part with this entry.</p></div>}
  </>;
}

function EvidencePage() {
  const [evidence, setEvidence] = useState<Awaited<ReturnType<typeof getEvidence>>>([]); const [safety, setSafety] = useState<Awaited<ReturnType<typeof getSafetyInformation>>>([]);
  useEffect(() => { Promise.all([getEvidence(), getSafetyInformation()]).then(([refs, records]) => { setEvidence(refs); setSafety(records); }); }, []);
  return <><PageMeta title="Evidence & safety" description="Understand reference availability and limitations of this educational prototype."/><PageIntro eyebrow="Read with care" title="What the record can—and can't—say." description="Clear provenance matters. This page distinguishes traditional knowledge from scientific research, and makes gaps visible rather than filling them with assumptions."/>
    <div className="evidence-callout"><div className="callout-mark"><ShieldCheck size={23}/></div><div><p className="eyebrow">Educational disclaimer</p><h2>HERBORA AI is not medical advice.</h2><p>Information here is for education and research orientation only. It is not intended to diagnose, treat, cure or prevent any condition. Do not use an image demo or this reference library to make health decisions. Consult a qualified health professional for personal care.</p></div></div>
    <div className="evidence-columns"><section className="evidence-panel"><span className="evidence-number">01</span><BookOpen size={21}/><p className="eyebrow">Traditional knowledge</p><h2>A cultural and historical record.</h2><p>Traditional-use notes describe knowledge traditions as attributed in the sample data. They do not establish clinical efficacy, dosage or safety.</p><div className="evidence-rule"/><span className="evidence-state">No sourced traditional-use details supplied</span></section><section className="evidence-panel evidence-research"><span className="evidence-number">02</span><FlaskConical size={21}/><p className="eyebrow">Scientific research</p><h2>References only when sourced.</h2><p>Research references should include traceable bibliographic details. No references are currently supplied in this prototype dataset.</p><div className="evidence-rule"/><span className="evidence-state">{evidence.length} verified references available</span></section></div>
    <section className="reference-list"><div className="section-heading"><div><p className="eyebrow">Source ledger</p><h2>Reference records</h2></div></div>{evidence.length ? evidence.map((ref) => <article key={ref.id} className="reference-entry"><p className="eyebrow">{ref.category} · {ref.topic}</p><h3>{ref.title}</h3><p>{ref.authors?.join(", ") || "Authors not recorded"}{ref.year ? ` · ${ref.year}` : ""}</p>{ref.sourceUrl && <a href={ref.sourceUrl} target="_blank" rel="noreferrer" className="under-link">Open source <ArrowRight size={14}/></a>}</article>) : <div className="reference-empty"><Info size={19}/><p><b>No evidence references supplied.</b><br/>No papers, authors, DOIs or clinical outcomes are shown because none are included in the current sample data.</p></div>}</section>
    <section className="safety-section"><div><p className="eyebrow">Safety ledger</p><h2>Absence of a note is not assurance.</h2><p>Safety records are included only when source-linked data exists. This prototype has {safety.length} safety record{ safety.length === 1 ? "" : "s" }. Blank records do not imply that an herb is safe or free of interactions.</p></div><ShieldCheck size={24}/></section>
  </>;
}

function AboutPage() {
  return <><PageMeta title="About & method" description="HERBORA AI project scope, methodology, limitations and API integration notes."/><PageIntro eyebrow="Project notes" title="A learning tool in progress." description="HERBORA AI is a frontend prototype for studying Ayurvedic herb records with a transparent boundary between what works, what is planned and what remains unknown."/>
    <section className="about-lead"><span className="large-quote">“</span><div><p className="eyebrow">Design principle</p><h2>Make the limits as legible<br/>as the knowledge.</h2><p>We want a useful reference surface that invites close reading—not an authority that replaces it.</p></div><div className="leaf-engraving" aria-hidden="true"><Sprout size={78}/></div></section>
    <section className="section-block"><div className="section-heading"><div><p className="eyebrow">Prototype status</p><h2>Working now / planned next</h2></div></div><div className="status-columns"><article className="status-card"><span className="status-pill working"><span/>Working in this frontend</span><ul><li>Sample herb library, filters and local fuzzy keyword search</li><li>Herb profiles with empty fields explicitly visible</li><li>Metadata overlap links based on shared family and plant part</li><li>Image preview and validation in the browser</li><li>Session-only recent searches</li></ul></article><article className="status-card planned"><span className="status-pill planned-pill"><span/>Planned integration</span><ul><li>Python image-identification API with a documented model card</li><li>Reviewed, source-linked herb and safety records</li><li>Research references with traceable bibliographic details</li><li>API-backed search and recommendation services</li></ul></article></div></section>
    <section className="method-grid"><article><span className="method-number">01</span><h3>Image workflow</h3><p>Files are type-checked and limited to 10 MB. A local preview is created in the browser. The current identify service returns a model-not-connected status; it does not produce a species prediction or confidence score.</p></article><article><span className="method-number">02</span><h3>Text workflow</h3><p>Search runs against the local sample dataset over common and botanical names, family, plant parts and category. Recent terms are stored in session storage only and cleared when the session ends.</p></article><article><span className="method-number">03</span><h3>Recommendation logic</h3><p>Related entries are ranked by the count of shared, explicitly recorded family and plant-part features. No clinical, medicinal, dosha or personal suitability is predicted.</p></article></section>
    <section className="api-notes"><div><p className="eyebrow">For the next implementation</p><h2>API integration contract</h2><p>Local service functions are typed and replaceable in <code>src/lib/herb-service.ts</code>. Keep the UI contract stable when connecting a backend.</p></div><div className="contract"><div><span>POST</span><code>/identify</code><small>multipart image file → PredictionResult or explicit unavailable status</small></div><div><span>GET</span><code>/herbs</code><small>filters → Herb[] with field-level provenance</small></div><div><span>GET</span><code>/search · /recommendations</code><small>query or herb id → documented local matches and overlap reasons</small></div><p>Do not return a confidence score unless it is defined, calibrated, versioned and appropriate to display. No GPS, location tracking or device telemetry is part of the workflow.</p></div></section>
    <div className="about-disclaimer"><Info size={18}/><p><b>Limitations:</b> Sample entries are not a complete pharmacopeia, clinical evidence base or safety reference. Traditional knowledge and scientific research are distinct forms of information. Verify all material against appropriate primary sources and qualified expertise.</p></div>
  </>;
}

function NotFound() { return <><PageMeta title="Page not found" description="The requested HERBORA page could not be found."/><div className="not-found"><span className="eyebrow">404 · off the path</span><h1>This page isn't in<br/><em>the field notes.</em></h1><p>It may have moved, or it may never have been recorded.</p><Link href="/" className="button button-primary"><ArrowLeft size={16}/> Return to overview</Link></div></>; }

function RoutedErrorBoundary({ children }: { children: ReactNode }) { const [location] = useLocation(); return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>; }
function Router() { return <RoutedErrorBoundary><Shell><Switch><Route path="/" component={Overview}/><Route path="/identify" component={IdentifyPage}/><Route path="/herbs" component={LibraryPage}/><Route path="/herbs/:id" component={ProfilePage}/><Route path="/search" component={SearchPage}/><Route path="/recommendations" component={RecommendationsPage}/><Route path="/evidence-safety" component={EvidencePage}/><Route path="/about" component={AboutPage}/><Route component={NotFound}/></Switch></Shell></RoutedErrorBoundary>; }

function App() { return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}><Router/></WouterRouter><Toaster/></TooltipProvider></QueryClientProvider>; }
export default App;
