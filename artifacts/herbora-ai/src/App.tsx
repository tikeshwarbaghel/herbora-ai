import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ArrowDownWideNarrow, ArrowLeft, ArrowRight, Bookmark, BookOpen, Check, ChevronDown, CircleAlert, FlaskConical, Grid2X2, ImagePlus, Info, Leaf, List, LoaderCircle, LogOut, Menu, Search, Settings, ShieldCheck, Sprout, Upload, UserRound, X } from "lucide-react";
import { Link, Redirect, Route, Switch, Router as WouterRouter, useLocation, useParams } from "wouter";
import { ClerkProvider, SignIn, SignUp, useClerk, useUser } from "@clerk/react";
import { useSignIn } from "@clerk/react/legacy";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { herbs, type Herb } from "@/lib/herb-data";
import { getEvidence, getHerbById, getHerbs, getRecommendations, getSafetyInformation, identifyHerb, searchHerbs } from "@/lib/herb-service";
import { useSavedHerbs } from "@/lib/use-saved-herbs";
import { AccountProfilePage, SavedHerbsPage, SettingsPage } from "@/AccountPages";
import { HerbVisual } from "@/components/herb-visual";

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
function stripBase(path: string): string { return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path; }
if (!clerkPubKey) throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: { logoPlacement: "inside" as const, logoLinkUrl: basePath || "/", logoImageUrl: `${window.location.origin}${basePath}/logo.svg` },
  variables: {
    colorPrimary: "#16834A", colorForeground: "#18251D", colorMutedForeground: "#4B5B50",
    colorDanger: "#B42318", colorBackground: "#FFFFFF", colorInput: "#FFFFFF",
    colorInputForeground: "#18251D", colorNeutral: "#D7E2D5", fontFamily: "DM Sans, sans-serif", borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[#123D2B] font-semibold",
    headerSubtitle: "text-[#4B5B50]",
    socialButtonsBlockButtonText: "text-[#18251D]",
    formFieldLabel: "text-[#18251D]",
    footerActionLink: "text-[#16834A]",
    footerActionText: "text-[#4B5B50]",
    dividerText: "text-[#4B5B50]",
    identityPreviewEditButton: "text-[#16834A]",
    formFieldSuccessText: "text-[#237A45]",
    alertText: "text-[#B42318]",
    logoBox: "rounded-xl",
    logoImage: "object-contain",
    socialButtonsBlockButton: "border-[#D7E2D5] bg-white",
    formButtonPrimary: "bg-[#16834A] hover:bg-[#123D2B] text-white",
    formFieldInput: "border-[#D7E2D5] bg-white text-[#18251D]",
    footerAction: "text-[#4B5B50]",
    dividerLine: "bg-[#D7E2D5]",
    alert: "border-[#B42318]",
    otpCodeFieldInput: "border-[#D7E2D5] text-[#18251D]",
    formFieldRow: "text-[#18251D]",
    main: "text-[#18251D]",
  },
};
const navItems = [
  { href: "/", label: "Overview", icon: Sprout },
  { href: "/identify", label: "Identify", icon: ImagePlus },
  { href: "/herbs", label: "Herb library", icon: BookOpen },
  { href: "/search", label: "Search", icon: Search },
  { href: "/recommendations", label: "Explore related", icon: ArrowDownWideNarrow },
  { href: "/evidence-safety", label: "Evidence & safety", icon: ShieldCheck },
  { href: "/about", label: "About & method", icon: Info },
];

const pageTitles: Record<string, string> = {
  "/": "Overview",
  "/identify": "Identify a herb",
  "/herbs": "Herbal library",
  "/search": "Search the library",
  "/recommendations": "Related field notes",
  "/evidence-safety": "Evidence & safety",
  "/about": "About the project",
  "/profile": "My profile",
  "/saved-herbs": "Saved herbs",
  "/settings": "Settings",
};

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
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState("");
  const { user } = useUser();
  const { signOut } = useClerk();
  const globalSearchRef = useRef<HTMLInputElement>(null);
  const accountMenuRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    setMenuOpen(false);
    if (accountMenuRef.current) accountMenuRef.current.open = false;
  }, [location]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
      event.preventDefault();
      globalSearchRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  const activePage = pageTitles[location] ?? (location.startsWith("/herbs/") ? "Herb profile" : "Field notes");
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username || user?.primaryEmailAddress?.emailAddress || "HERBORA member";
  const initials = displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const primaryItems = navItems.slice(0, 4);
  const studyItems = navItems.slice(4);
  return <div className="app-shell">
    {menuOpen && <button type="button" className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setMenuOpen(false)}/>}
    <aside className={`sidebar ${menuOpen ? "is-open" : ""}`} id="primary-navigation">
      <Link href="/" className="brand" aria-label="HERBORA AI overview" onClick={() => setMenuOpen(false)}>
        <span className="brand-mark"><Sprout size={23}/></span>
        <span><b>HERBORA</b><small>FIELD NOTES · AI</small></span>
      </Link>
      <div className="sidebar-rule"/>
      <p className="sidebar-label">Explore</p>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {primaryItems.map(({ href, label, icon: Icon }) => {
          const active = location === href || (href === "/herbs" && location.startsWith("/herbs/"));
          return <Link key={href} href={href} onClick={() => setMenuOpen(false)} className={`sidebar-link ${active ? "active" : ""}`} aria-current={active ? "page" : undefined} data-testid={`link-nav-${href === "/" ? "overview" : href.slice(1).replaceAll("/", "-")}`}><Icon size={18}/><span>{label}</span>{active && <span className="sidebar-active-mark"/>}</Link>;
        })}
      </nav>
      <p className="sidebar-label sidebar-label-spaced">Study & references</p>
      <nav className="sidebar-nav" aria-label="Study and reference navigation">
        {studyItems.map(({ href, label, icon: Icon }) => {
          const active = location === href;
          return <Link key={href} href={href} onClick={() => setMenuOpen(false)} className={`sidebar-link ${active ? "active" : ""}`} aria-current={active ? "page" : undefined} data-testid={`link-nav-${href.slice(1)}`}><Icon size={18}/><span>{label}</span>{active && <span className="sidebar-active-mark"/>}</Link>;
        })}
        <span className="sidebar-link sidebar-link-disabled" aria-label="Identification history, coming soon"><UserRound size={18}/><span>Identification history</span><small>SOON</small></span>
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-notice"><ShieldCheck size={17}/><p><strong>Learning reference</strong><br/>Educational use only. Not medical advice.</p></div>
        <div className="sidebar-caption">HERBORA AI <span>·</span> ACADEMIC PROJECT</div>
      </div>
    </aside>
    <div className="main-layout">
      <header className="topbar">
        <button type="button" className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="primary-navigation" aria-label={menuOpen ? "Close navigation" : "Open navigation"} data-testid="button-mobile-navigation"><Menu size={21}/></button>
        <div className="topbar-title"><span>HERBORA AI <i>/</i> FIELD NOTES</span><h1>{activePage}</h1></div>
        <form className="global-search" role="search" onSubmit={(event) => { event.preventDefault(); if (globalQuery.trim()) setLocation(`/search?q=${encodeURIComponent(globalQuery.trim())}`); }}>
          <Search size={18}/><input ref={globalSearchRef} value={globalQuery} onChange={(event) => setGlobalQuery(event.target.value)} placeholder="Search herbs and records" aria-label="Search the herb library" data-testid="input-global-search"/><kbd>/</kbd>
        </form>
        {user ? <details className="account-menu" ref={accountMenuRef}>
          <summary aria-label={`Account menu for ${displayName}`} data-testid="button-account-menu">
            <span className="account-avatar">{user.imageUrl ? <img src={user.imageUrl} alt=""/> : initials}</span><span className="account-menu-name">{displayName}</span><ChevronDown size={15}/>
          </summary>
          <div className="account-menu-panel">
            <div className="account-menu-identity"><strong>{displayName}</strong><span>{user.primaryEmailAddress?.emailAddress}</span></div>
            <Link href="/profile" data-testid="link-profile"><UserRound size={16}/>My profile</Link>
            <Link href="/saved-herbs" data-testid="link-saved-herbs"><Bookmark size={16}/>Saved herbs</Link>
            <Link href="/settings" data-testid="link-settings"><Settings size={16}/>Settings</Link>
            <span className="account-menu-soon"><BookOpen size={16}/>Identification history <small>Coming soon</small></span>
            <button type="button" onClick={() => void signOut({ redirectUrl: basePath || "/" })} data-testid="button-sign-out"><LogOut size={16}/>Sign out</button>
          </div>
        </details> : <Link href="/sign-in" className="account-signin" data-testid="link-sign-in"><UserRound size={17}/><span>Sign in</span></Link>}
      </header>
      <main className="page-wrap">{children}</main>
      <footer className="footer"><div className="footer-copy"><span className="footer-brand">HERBORA AI</span><span>AI-Based Ayurvedic Herbal Knowledge and Recommendation System · academic project.</span><span>Data-source attribution: no external dataset source was supplied for these local sample records.</span></div><nav className="footer-nav" aria-label="Footer navigation"><Link href="/herbs">Explore herbs</Link><Link href="/search">Search</Link><Link href="/about">About project</Link><Link href="/evidence-safety">Evidence & safety <ArrowRight size={14}/></Link></nav><p className="footer-disclaimer">Educational use only. Not medical advice.</p></footer>
    </div>
  </div>;
}

function PageIntro({ eyebrow, title, description, aside }: { eyebrow: string; title: string; description: string; aside?: ReactNode }) {
  return <div className="page-intro"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="intro-copy">{description}</p></div>{aside && <div className="intro-aside">{aside}</div>}</div>;
}

function HerbCard({ herb, list = false }: { herb: Herb; list?: boolean }) {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { saved, toggle } = useSavedHerbs(user?.id);
  const bookmarked = saved.includes(herb.id);
  const categories = [
    ...(herb.properties.length ? ["Properties"] : []),
    ...(herb.constituents.length ? ["Constituents"] : []),
    ...(herb.references.length ? ["References"] : []),
  ];
  return <article className="saved-card" data-testid={`card-herb-${herb.id}`}>
    <Link href={`/herbs/${herb.id}`} className={`herb-card ${list ? "list-card" : ""}`}>
      <HerbVisual herb={herb}/><div className="herb-card-copy"><span className="micro-label">{herb.family || "Family not recorded"}</span><h3>{herb.commonName}</h3><p className="latin">{herb.botanicalName}</p><p className="herb-summary">{herb.overview || "No summary has been added to this record."}</p><div className="chip-row">{herb.plantParts.map((part) => <span className="chip" key={part}>{part}</span>)}{categories.map((item) => <span className="chip" key={item}>{item}</span>)}</div></div><span className="card-arrow" aria-hidden="true"><ArrowRight size={16}/></span>
    </Link>
    <button type="button" className="bookmark-button" aria-label={bookmarked ? `Remove ${herb.commonName} from saved herbs` : `Save ${herb.commonName}`} aria-pressed={bookmarked} onClick={() => user ? toggle(herb.id) : setLocation("/sign-in")}><Bookmark size={18} fill={bookmarked ? "currentColor" : "none"}/></button>
  </article>;
}

function HerbBookmark({ herbId, herbName }: { herbId: string; herbName: string }) {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { saved, toggle } = useSavedHerbs(user?.id);
  const bookmarked = saved.includes(herbId);
  return <button type="button" className="button button-outline profile-bookmark" aria-pressed={bookmarked} onClick={() => user ? toggle(herbId) : setLocation("/sign-in")}><Bookmark size={16} fill={bookmarked ? "currentColor" : "none"}/>{bookmarked ? "Saved to your field notes" : `Save ${herbName}`}</button>;
}

function Overview() {
  const featured = herbs.slice(0, 4);
  return <><PageMeta title="Overview" description="A careful learning space for Ayurvedic herbal knowledge."/>
    <section className="hero">
      <div className="hero-content"><p className="eyebrow"><span className="eyebrow-line"/>AYURVEDIC HERBAL INTELLIGENCE</p><h1>Discover the intelligence<br/><em>within every leaf.</em></h1><p className="hero-copy">Explore medicinal plant identification, structured Ayurvedic herbal knowledge, related botanical properties, and research references through one intelligent platform.</p><div className="hero-actions"><Link href="/identify" className="button button-primary">Identify a Herb <ArrowRight size={16}/></Link><Link href="/herbs" className="button button-outline">Explore Herbal Library</Link></div><div className="hero-footnote"><span>FIELD NOTES / 01</span><span className="footnote-rule"/><span>A learning tool, not a clinical resource</span></div></div>
      <div className="hero-art" aria-hidden="true"><img className="hero-botanical-photo" src={`${import.meta.env.BASE_URL}botanical-hero.png`} alt=""/><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="sun-disc"/><div className="hero-leaf leaf-large"/><div className="hero-leaf leaf-small"/><div className="hero-plant-line"/><span className="art-caption">BOTANICAL<br/>OBSERVATION</span><span className="art-index">H · 01</span><span className="hero-plant-label">A study starts<br/>with looking closer.</span></div>
    </section>
    <section className="overview-band"><div><span className="stat-number">06</span><span className="stat-label">sample herb records</span></div><p>Small by design. Every profile separates traditional knowledge from research references, and leaves unsupported fields blank.</p><Link href="/evidence-safety" className="under-link">Our evidence boundaries <ArrowRight size={15}/></Link></section>
    <section className="section-block"><div className="section-heading"><div><p className="eyebrow">AYURVEDIC HERBAL INTELLIGENCE</p><h2>Begin with a question.</h2></div><Link className="text-link" href="/about">Our approach <ArrowRight size={15}/></Link></div>
      <div className="entry-grid">
        <Link href="/identify" className="entry-card entry-terracotta"><span className="entry-num">01</span><ImagePlus size={22}/><h3>AI Herb Identification</h3><p>Preview an image in your browser. Identification remains demo-only until a real prediction model is connected.</p><span className="entry-link">Open image study <ArrowRight size={15}/></span></Link>
        <Link href="/herbs" className="entry-card entry-sage"><span className="entry-num">02</span><BookOpen size={22}/><h3>Herbal Knowledge Library</h3><p>Browse botanical names, recorded families and plant parts in the small local sample library.</p><span className="entry-link">Explore the library <ArrowRight size={15}/></span></Link>
        <Link href="/recommendations" className="entry-card entry-ivory"><span className="entry-num">03</span><ArrowDownWideNarrow size={22}/><h3>Intelligent Recommendations</h3><p>Explore shared family and plant-part metadata; similarity does not imply health suitability.</p><span className="entry-link">Explore metadata <ArrowRight size={15}/></span></Link>
        <Link href="/evidence-safety" className="entry-card entry-sage"><span className="entry-num">04</span><ShieldCheck size={22}/><h3>Evidence & Safety</h3><p>Separate traditional context from traceable research and source-linked safety notes.</p><span className="entry-link">Read the boundaries <ArrowRight size={15}/></span></Link>
      </div>
    </section>
    <section className="overview-search"><div><p className="eyebrow">Search the sample library</p><h2>Find knowledge, naturally.</h2><p>Search names, plant families, parts and categories in this local reference set.</p></div><OverviewSearch/></section>
    <section className="section-block featured-herbs"><div className="section-heading"><div><p className="eyebrow">Explore the botanical library</p><h2>Featured field notes.</h2></div><Link href="/herbs" className="text-link">See all six records <ArrowRight size={15}/></Link></div><div className="herb-grid">{featured.map((herb) => <HerbCard key={herb.id} herb={herb}/>)}</div><p className="dataset-footnote">Only factual fields supplied by the local sample data are shown; blank sections remain absent.</p></section>
    <section className="workflow-section"><div className="section-heading"><div><p className="eyebrow">A transparent workflow</p><h2>From observation to context.</h2></div><Link href="/about" className="text-link">Read our method <ArrowRight size={15}/></Link></div><div className="workflow-steps"><article><span>01</span><h3>Start with a record</h3><p>Search or filter botanical entries by their recorded name, family, plant part or study category.</p></article><article><span>02</span><h3>Review what exists</h3><p>Open a profile to see attributed traditional context and documented fields. Empty fields are not guessed into completeness.</p></article><article><span>03</span><h3>Follow the evidence</h3><p>Check linked references and safety notes where available, then read the limits of this educational dataset.</p></article></div></section>
    <section className="research-path"><div><p className="eyebrow">Research & safety</p><h2>Keep evidence and tradition distinct.</h2><p>HERBORA shows source-linked research and safety records only when the dataset includes them. No references or medical claims are invented to fill a gap.</p></div><Link href="/evidence-safety" className="button button-primary">Read evidence & safety <ArrowRight size={16}/></Link></section>
    <section className="note-strip"><div className="note-icon"><FlaskConical size={22}/></div><div><p className="eyebrow">A note on what this is</p><h2>Curiosity, with clear edges.</h2><p>Traditional use is not the same as clinical evidence. HERBORA is an educational prototype and does not provide diagnosis, treatment, or medical advice.</p></div><Link href="/evidence-safety" className="button button-outline">Read evidence & safety</Link></section>
  </>;
}

function OverviewSearch() {
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();
  return <form className="overview-search-form" onSubmit={(event) => { event.preventDefault(); if (query.trim()) setLocation(`/search?q=${encodeURIComponent(query.trim())}`); }}>
    <Search size={19}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a herb, botanical name, property, or formulation..." aria-label="Search a herb, botanical name, property, or formulation"/><button className="button button-primary" type="submit" disabled={!query.trim()}>Search <ArrowRight size={15}/></button>
  </form>;
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
    const extension = incoming.name.toLocaleLowerCase().split(".").pop();
    const supportedMime = ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(incoming.type);
    const supportedExtensionWithoutMime = !incoming.type && ["jpg", "jpeg", "png", "webp"].includes(extension || "");
    if (!supportedMime && !supportedExtensionWithoutMime) { setError("Choose a JPG, JPEG, PNG or WEBP image."); if (inputRef.current) inputRef.current.value = ""; return; }
    if (incoming.size > 10 * 1024 * 1024) { setError("This image is larger than 10 MB. Choose a smaller file."); if (inputRef.current) inputRef.current.value = ""; return; }
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
  return <><PageMeta title="Identify a medicinal herb" description="Upload and preview a plant image in the browser. Real image identification is not connected."/><PageIntro eyebrow="Image study · demo mode" title="Identify a medicinal herb." description="Upload a clear leaf or plant image to explore a possible match. This prototype has no trained model connected, so it cannot identify the plant or generate a confidence score."/>
    <div className="identify-layout"><section className="upload-panel">
      <div className="panel-topline"><span className="eyebrow">01 / Upload</span><span className="file-limit">JPG · PNG · WEBP <i/> UP TO 10 MB</span></div>
      {!file ? <div className="drop-zone" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); processFile(e.dataTransfer.files[0]); }} aria-label="Drop an image here">
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" hidden onChange={(e) => processFile(e.target.files?.[0])} data-testid="input-plant-image"/>
        <div className="upload-icon"><Upload size={24}/></div><h2>Drop a plant image here</h2><p>or choose a file from your device</p><button type="button" className="button button-outline" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>Browse files</button><small>For this demo, the image stays in your browser.</small>
      </div> : <div className="preview-box"><img src={preview} alt={`Preview of ${file.name}`}/><div className="preview-caption"><span><b>{file.name}</b><small>{(file.size / 1024 / 1024).toFixed(2)} MB · ready to review</small></span><button className="icon-button" type="button" onClick={remove} aria-label="Remove image"><X size={18}/></button></div></div>}
      {error && <p className="form-error" role="alert"><CircleAlert size={16}/>{error}</p>}
       {file && <div className="upload-actions"><button type="button" className="text-link" onClick={() => inputRef.current?.click()}>Replace image</button><button type="button" className="button button-primary" disabled={loading} onClick={analyze}>{loading ? <><LoaderCircle className="spin" size={16}/> Preparing demo status…</> : <>Analyze image <ArrowRight size={16}/></>}</button></div>}
      {result && <div className="demo-result" role="status"><span className="result-stamp"><Info size={18}/></span><div><strong>Demo result — model not connected</strong><p>No identification or confidence score has been generated. Connect a trained model API to enable this step.</p><button type="button" className="text-link" onClick={remove}>Analyze another image <ArrowRight size={14}/></button></div></div>}
      </section><aside className="identify-aside"><div className="aside-mark"><Leaf size={23}/></div><p className="eyebrow">Before you begin</p><h2>A photograph is a starting point, not proof.</h2><p>Reliable plant identification can depend on leaves, flowers, fruit, habitat and season. Never rely on an image match to decide whether a plant is safe to use.</p><div className="fine-rule"/><p className="eyebrow">Image tips</p><ul className="clean-list"><li>Use a clear, focused leaf image.</li><li>Prefer natural lighting.</li><li>Avoid heavily blurred images.</li><li>Include one prominent leaf when possible.</li></ul><div className="fine-rule"/><p className="small-note">Nothing is uploaded to a server in this demo. The future integration should send only the chosen file to a dedicated identification endpoint, with consent and retention rules made clear.</p><Link href="/about" className="under-link">Read the API notes <ArrowRight size={14}/></Link></aside></div>
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
  return <><PageMeta title="Explore the herbal library" description="Search and filter the local HERBORA sample herb records."/><PageIntro eyebrow="Reference library" title="Explore the herbal library." description="Browse medicinal plants by common name, botanical name, family and plant part. Open a profile to review the details present in this local sample; unavailable fields remain clearly marked." aside={<span className="collection-count"><b>06</b><small>sample entries</small></span>}/>
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

function HerbProfilePage() {
  const { id = "" } = useParams<{ id: string }>();
  const [herb, setHerb] = useState<Herb | undefined>(); const [safety, setSafety] = useState<Awaited<ReturnType<typeof getSafetyInformation>>>([]); const [ready, setReady] = useState(false);
  useEffect(() => { setReady(false); Promise.all([getHerbById(id), getSafetyInformation(id)]).then(([record, records]) => { setHerb(record); setSafety(records); }).finally(() => setReady(true)); }, [id]);
  if (!ready) return <div className="skeleton-page" aria-label="Loading herb profile"><div/><div/><div/></div>;
  if (!herb) return <><PageMeta title="Record not found" description="No herb record found."/><div className="empty-state"><Leaf size={28}/><h1>That record isn't in the field notes.</h1><p>The sample library may not include this plant.</p><Link href="/herbs" className="button button-primary">Return to library <ArrowRight size={16}/></Link></div></>;
  const siblings = herbs.filter((item) => item.id !== herb.id && (item.family === herb.family || item.plantParts.some((part) => herb.plantParts.includes(part)))).slice(0, 3);
  return <><PageMeta title={herb.commonName} description={`Educational botanical profile for ${herb.commonName}.`}/><Link href="/herbs" className="back-link"><ArrowLeft size={15}/> Back to library</Link>
     <section className="profile-head"><HerbVisual herb={herb}/><div><p className="eyebrow">Herb record · sample data</p><h1>{herb.commonName}</h1><p className="profile-latin">{herb.botanicalName}</p><div className="profile-tags"><span className="chip">{herb.family || "Family not recorded"}</span>{herb.plantParts.map((item) => <span className="chip" key={item}>{item}</span>)}</div><p className="profile-overview">{herb.overview || "No overview has been added to this record."}</p><HerbBookmark herbId={herb.id} herbName={herb.commonName}/></div><div className="record-stamp">FIELD<br/>NOTE<br/><b>0{herbs.indexOf(herb) + 1}</b></div></section>
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
  const [query, setQuery] = useState(() => new URLSearchParams(window.location.search).get("q") || ""); const [submitted, setSubmitted] = useState(""); const [results, setResults] = useState<Herb[]>([]); const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>(() => { try { return JSON.parse(sessionStorage.getItem("herbora-recent-searches") || "[]") as string[]; } catch { return []; } });
  const run = async (value = query) => { const q = value.trim(); if (!q) return; setQuery(q); setSubmitted(q); setLoading(true); try { const found = await searchHerbs(q); setResults(found); const next = [q, ...recent.filter((item) => item.toLowerCase() !== q.toLowerCase())].slice(0, 5); setRecent(next); sessionStorage.setItem("herbora-recent-searches", JSON.stringify(next)); } finally { setLoading(false); } };
  useEffect(() => { const initial = new URLSearchParams(window.location.search).get("q"); if (initial?.trim()) void run(initial); }, []);
  const clearRecent = () => { setRecent([]); sessionStorage.removeItem("herbora-recent-searches"); };
  return <><PageMeta title="Intelligent search" description="Local keyword search across available sample herb records."/><PageIntro eyebrow="Local research tool" title="Find knowledge, naturally." description="Search names, botanical names, families, plant parts and categories in the current local records. Search is keyword-based, typo-tolerant and never sent to a server."/>
    <form className="search-page-form" onSubmit={(e) => { e.preventDefault(); void run(); }}><Search size={21}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ask about a herb, plant part, property, or formulation..." aria-label="Search about a herb, plant part, property, or formulation" data-testid="input-search"/><button type="submit" className="button button-primary" disabled={!query.trim() || loading}>{loading ? "Searching…" : "Search"} <ArrowRight size={15}/></button></form>
     <div className="search-examples"><span className="micro-label">Try an example</span>{["Ashwagandha", "Ginger", "Licorice", "Amla"].map((item) => <button type="button" key={item} onClick={() => { setQuery(item); void run(item); }}>{item}</button>)}</div>
    <div className="search-columns"><section className="search-results">{submitted ? <><div className="section-heading"><div><p className="eyebrow">Search results</p><h2>{results.length} {results.length === 1 ? "match" : "matches"} for “{submitted}”</h2></div></div>{results.length ? <div className="herb-grid is-list">{results.map((herb) => {
      const terms = submitted.toLocaleLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((term) => term.length > 2 && !["tell","about","explore","the","botanical","profile","show","herbs","with","documented","similar","find","formulations","associated"].includes(term));
      const searchable = [
        ["Common name", herb.commonName], ["Botanical name", herb.botanicalName], ["Family", herb.family || ""],
        ["Plant parts", herb.plantParts.join(" ")], ["Study category", herb.studyCategory || ""], ["Overview", herb.overview || ""],
        ["Traditional context", herb.traditionalUses.join(" ")], ["Properties", herb.properties.map((item) => `${item.name} ${item.description || ""}`).join(" ")],
        ["Constituents", herb.constituents.map((item) => `${item.name} ${item.note || ""}`).join(" ")],
        ["Formulations", herb.formulations.map((item) => `${item.name} ${item.note || ""}`).join(" ")],
      ];
      const matched = searchable.filter(([, value]) => terms.some((term) => String(value).toLocaleLowerCase().includes(term))).map(([label]) => label);
      return <div className="search-result-item" key={herb.id}><HerbCard herb={herb} list/><p className="match-fields"><span>Matched recorded fields</span>{matched.length ? matched.join(" · ") : "Close spelling match in the sample record"}</p></div>;
    })}</div> : <div className="empty-state compact"><Search size={24}/><h3>No close matches.</h3><p>Try a common or botanical name, a documented family, or a plant part present in the sample records.</p></div>}</> : <div className="search-prompt"><div className="prompt-mark"><Leaf size={22}/></div><p className="eyebrow">Local reference search</p><h2>One good question<br/>can open a field.</h2><p>Searches match only fields currently present in the sample records.</p></div>}</section>
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
  const [evidence, setEvidence] = useState<Awaited<ReturnType<typeof getEvidence>>>([]); const [safety, setSafety] = useState<Awaited<ReturnType<typeof getSafetyInformation>>>([]); const [filter, setFilter] = useState("");
  useEffect(() => { Promise.all([getEvidence(), getSafetyInformation()]).then(([refs, records]) => { setEvidence(refs); setSafety(records); }); }, []);
  const filteredEvidence = evidence.filter((ref) => `${ref.title} ${ref.topic} ${ref.category} ${ref.authors?.join(" ") || ""}`.toLocaleLowerCase().includes(filter.toLocaleLowerCase()));
  return <><PageMeta title="Evidence & safety" description="Understand reference availability and limitations of this educational prototype."/><PageIntro eyebrow="Read with care" title="Evidence deserves context." description="Clear provenance matters. This page distinguishes traditional knowledge from scientific research, and makes gaps visible rather than filling them with assumptions."/>
    <div className="evidence-callout"><div className="callout-mark"><ShieldCheck size={23}/></div><div><p className="eyebrow">Educational disclaimer</p><h2>HERBORA AI is not medical advice.</h2><p>This platform is for educational and research purposes. It does not replace professional medical advice, diagnosis, or treatment. Herb identification may be uncertain, and absence of a listed interaction does not establish safety.</p></div></div>
    <div className="evidence-columns"><section className="evidence-panel"><span className="evidence-number">01</span><BookOpen size={21}/><p className="eyebrow">Traditional knowledge</p><h2>A cultural and historical record.</h2><p>Traditional-use notes describe knowledge traditions as attributed in the sample data. They do not establish clinical efficacy, dosage or safety.</p><div className="evidence-rule"/><span className="evidence-state">No sourced traditional-use details supplied</span></section><section className="evidence-panel evidence-research"><span className="evidence-number">02</span><FlaskConical size={21}/><p className="eyebrow">Scientific research</p><h2>References only when sourced.</h2><p>Research references should include traceable bibliographic details. No references are currently supplied in this prototype dataset.</p><div className="evidence-rule"/><span className="evidence-state">{evidence.length} verified references available</span></section></div>
    <section className="reference-list"><div className="section-heading"><div><p className="eyebrow">Source ledger</p><h2>Reference records</h2></div></div><label className="search-field evidence-search"><Search size={18}/><input value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter research references" placeholder="Search publication, topic, category, or author"/></label>{evidence.length ? filteredEvidence.length ? filteredEvidence.map((ref) => <article key={ref.id} className="reference-entry"><p className="eyebrow">{ref.category} · {ref.topic}</p><h3>{ref.title}</h3><p>{ref.authors?.join(", ") || "Authors not recorded"}{ref.year ? ` · ${ref.year}` : ""}</p>{ref.doi && <p>DOI: {ref.doi}</p>}{ref.sourceUrl && <a href={ref.sourceUrl} target="_blank" rel="noreferrer" className="under-link">Open source <ArrowRight size={14}/></a>}</article>) : <div className="reference-empty"><Info size={19}/><p>No references match that filter. Try a different title, topic, or author.</p></div> : <div className="reference-empty"><Info size={19}/><p><b>No evidence references supplied.</b><br/>No papers, authors, DOIs or clinical outcomes are shown because none are included in the current sample data.</p></div>}</section>
    <section className="safety-section"><div><p className="eyebrow">Safety ledger</p><h2>Absence of a note is not assurance.</h2><p>Safety records are included only when source-linked data exists. This prototype has {safety.length} safety record{ safety.length === 1 ? "" : "s" }. Blank records do not imply that an herb is safe or free of interactions.</p></div><ShieldCheck size={24}/></section>
  </>;
}

function AboutPage() {
  return <><PageMeta title="About project" description="Project scope, workflow, methodology and limitations of the HERBORA AI educational prototype."/><PageIntro eyebrow="Project notes" title="A learning tool in progress." description="HERBORA AI is an AI-Based Ayurvedic Herbal Knowledge and Recommendation System: an academic project exploring a transparent interface for botanical records, image-upload workflows and metadata-based discovery."/>
    <section className="about-lead"><span className="large-quote">“</span><div><p className="eyebrow">Project overview</p><h2>Make the limits as legible<br/>as the knowledge.</h2><p>The problem this project explores is fragmented plant knowledge and the need to keep attributed traditional context distinct from source-linked research. The goal is a study interface, not a clinical authority.</p></div><div className="leaf-engraving" aria-hidden="true"><Sprout size={78}/></div></section>
    <section className="project-detail-grid"><article><span className="method-number">01</span><h3>Objectives</h3><ul><li>Explore image-upload interaction without inventing a prediction.</li><li>Organize the fields present in a small herb dataset.</li><li>Search locally and explain metadata-based relationships.</li><li>Make evidence and safety gaps visible.</li></ul></article><article><span className="method-number">02</span><h3>Proposed image workflow</h3><p>Image input → preprocessing → image classification model → predicted herb → structured knowledge retrieval → metadata-based recommendations → evidence and safety presentation.</p><p className="account-help">The classification model is not connected in this frontend.</p></article><article><span className="method-number">03</span><h3>Search workflow</h3><p>Text query → local query processing → search across available record fields → relevant herb profiles.</p></article></section>
     <section className="section-block"><div className="section-heading"><div><p className="eyebrow">Prototype status</p><h2>Working now / planned next</h2></div></div><div className="status-columns"><article className="status-card"><span className="status-pill working"><span/>Working in this frontend</span><ul><li>Sample herb library, filters and local fuzzy keyword search</li><li>Herb profiles with empty fields explicitly visible</li><li>Metadata overlap links based on shared family and plant part</li><li>Image preview and validation in the browser</li><li>Real Clerk email/password authentication and profile editing</li><li>Per-account local bookmarks and session-only recent searches</li></ul></article><article className="status-card planned"><span className="status-pill planned-pill"><span/>Planned integration</span><ul><li>Python image-identification API with a documented model card</li><li>Reviewed, source-linked herb and safety records</li><li>Research references with traceable bibliographic details</li><li>API-backed search and recommendation services</li></ul></article></div></section>
    <section className="method-grid"><article><span className="method-number">01</span><h3>Image workflow</h3><p>Files are type-checked and limited to 10 MB. A local preview is created in the browser. The current identify service returns a model-not-connected status; it does not produce a species prediction or confidence score.</p></article><article><span className="method-number">02</span><h3>Text workflow</h3><p>Search runs against the local sample dataset over common and botanical names, family, plant parts and category. Recent terms are stored in session storage only and cleared when the session ends.</p></article><article><span className="method-number">03</span><h3>Recommendation logic</h3><p>Related entries are ranked by the count of shared, explicitly recorded family and plant-part features. No clinical, medicinal, dosha or personal suitability is predicted.</p></article></section>
    <section className="api-notes"><div><p className="eyebrow">For the next implementation</p><h2>API integration contract</h2><p>Local service functions are typed and replaceable in <code>src/lib/herb-service.ts</code>. Keep the UI contract stable when connecting a backend.</p></div><div className="contract"><div><span>POST</span><code>/identify</code><small>multipart image file → PredictionResult or explicit unavailable status</small></div><div><span>GET</span><code>/herbs</code><small>filters → Herb[] with field-level provenance</small></div><div><span>GET</span><code>/search · /recommendations</code><small>query or herb id → documented local matches and overlap reasons</small></div><p>Do not return a confidence score unless it is defined, calibrated, versioned and appropriate to display. No GPS, location tracking or device telemetry is part of the workflow.</p></div></section>
    <section className="project-detail-grid project-detail-secondary"><article><h3>Methodology</h3><p>Image preprocessing and model classification are a proposed future integration. Current local search uses exact and typo-tolerant matching on recorded names, families, plant parts, categories and present text fields. Related records use only shared family and plant-part metadata.</p></article><article><h3>Dataset approach</h3><p>The current sample contains six locally defined herb records. Traditional-use details, constituents, formulations, citations and safety records are empty when none were supplied. No external dataset attribution was supplied with this frontend data.</p></article><article><h3>Future enhancements</h3><p>Connect a documented model endpoint, add reviewed source-linked records, define provenance for dataset updates and evaluate model performance before displaying prediction scores.</p></article></section>
    <div className="about-disclaimer"><Info size={18}/><p><b>Limitations:</b> Sample entries are not a complete pharmacopeia, clinical evidence base or safety reference. Traditional knowledge and scientific research are distinct forms of information. Verify all material against appropriate primary sources and qualified expertise. No GPS, location tracking, blockchain, supply-chain or user telemetry features are part of this product.</p></div>
  </>;
}

function NotFound() { return <><PageMeta title="Page not found" description="The requested HERBORA page could not be found."/><div className="not-found"><span className="eyebrow">404 · off the path</span><h1>This page isn't in<br/><em>the field notes.</em></h1><p>It may have moved, or it may never have been recorded.</p><Link href="/" className="button button-primary"><ArrowLeft size={16}/> Return to overview</Link></div></>; }

function RoutedErrorBoundary({ children }: { children: ReactNode }) { const [location] = useLocation(); return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>; }
function SignInPage() { return <><PageMeta title="Sign in" description="Sign in to your HERBORA AI learning account."/><section className="auth-page"><div className="auth-story"><div><p className="eyebrow">Welcome back to HERBORA AI</p><h1>Continue exploring botanical knowledge.</h1><p>Sign in to keep a local reading list of herb records on this device. Your search and study remain grounded in the available evidence.</p></div><div className="hero-footnote"><span>FIELD NOTES</span><span className="footnote-rule"/><span>Learning reference · not medical advice</span></div></div><div className="auth-form-wrap"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /><Link className="auth-forgot-link" href="/forgot-password">Forgot your password?</Link></div></section></>; }
function SignUpPage() { return <><PageMeta title="Create account" description="Create a HERBORA AI account with Clerk."/><section className="auth-page"><div className="auth-story"><div><p className="eyebrow">A place for your field notes</p><h1>Create your HERBORA account.</h1><p>Use your account to keep saved herb bookmarks on this device. Authentication is handled by Clerk; HERBORA never stores your password.</p></div><div className="hero-footnote"><span>FIELD NOTES</span><span className="footnote-rule"/><span>Evidence boundaries stay visible</span></div></div><div className="auth-form-wrap"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div></section></>; }
function LoginAlias() { return <Redirect to="/sign-in"/>; }
function SignupAlias() { return <Redirect to="/sign-up"/>; }

function ForgotPasswordPage() {
  const { isLoaded, signIn } = useSignIn();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"email" | "code" | "password" | "done">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const explainError = (reason: unknown) => {
    setError(reason instanceof Error ? reason.message : "Clerk could not complete this step. Check your details and try again.");
  };

  const requestCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!signIn) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const attempt = await signIn.create({ strategy: "reset_password_email_code", identifier: email.trim() });
      if (attempt.status === "needs_first_factor") {
        setStep("code");
        setNotice("If this account can reset by email, Clerk has sent a verification code.");
      } else if (attempt.status === "needs_new_password") {
        setStep("password");
      } else {
        setError("This account cannot continue through email-code password reset. Return to sign in and use an available sign-in method.");
      }
    } catch (reason) {
      explainError(reason);
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!signIn) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const attempt = await signIn.attemptFirstFactor({ strategy: "reset_password_email_code", code: code.trim() });
      if (attempt.status === "needs_new_password") {
        setStep("password");
      } else if (attempt.status === "complete") {
        setError("Clerk completed the recovery step without requesting a new password. Return to sign in and try again.");
      } else {
        setError("Clerk needs another verification step before this password can be changed.");
      }
    } catch (reason) {
      explainError(reason);
    } finally {
      setBusy(false);
    }
  };

  const updatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!signIn) return;
    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await signIn.resetPassword({ password });
      if (result.status === "complete") {
        setStep("done");
        setPassword(""); setConfirmation("");
        setNotice("Your password was updated by Clerk. Sign in with the new password to continue.");
      } else {
        setError("Clerk requires another step before the password can be updated.");
      }
    } catch (reason) {
      explainError(reason);
    } finally {
      setBusy(false);
    }
  };

  if (!isLoaded) return <div className="skeleton-page" aria-label="Loading password reset"><div/><div/><div/></div>;
  return <><PageMeta title="Reset password" description="Reset a HERBORA AI account password through Clerk's secure email-code flow."/><section className="auth-page">
    <div className="auth-story"><div><p className="eyebrow">Account access</p><h1>{step === "done" ? "Back to your field notes." : "Reset your password."}</h1><p>Clerk handles this account recovery flow. HERBORA does not store your password or reset code.</p></div><div className="hero-footnote"><span>FIELD NOTES</span><span className="footnote-rule"/><span>Account security managed by Clerk</span></div></div>
    <div className="auth-form-wrap"><section className="reset-card">
      <p className="eyebrow">Password recovery</p>
      <h2>{step === "email" ? "Request a reset code" : step === "code" ? "Check your email" : step === "password" ? "Choose a new password" : "Password reset complete"}</h2>
      {notice && <p className="account-success" role="status">{notice}</p>}
      {error && <p className="account-error" role="alert">{error}</p>}
      {step === "email" && <form className="account-form" onSubmit={(event) => void requestCode(event)}>
        <label htmlFor="reset-email">Email address</label><input className="account-input" id="reset-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} data-testid="input-reset-email"/>
        <button type="submit" className="button button-primary" disabled={busy}>{busy ? "Sending…" : "Send reset code"} <ArrowRight size={16}/></button>
      </form>}
      {step === "code" && <form className="account-form" onSubmit={(event) => void verifyCode(event)}>
        <p className="account-help">Enter the code sent to {email}.</p>
        <label htmlFor="reset-code">Email verification code</label><input className="account-input" id="reset-code" inputMode="numeric" autoComplete="one-time-code" required maxLength={12} value={code} onChange={(event) => setCode(event.target.value)} data-testid="input-reset-code"/>
        <button type="submit" className="button button-primary" disabled={busy}>{busy ? "Verifying…" : "Verify code"} <ArrowRight size={16}/></button>
        <button type="button" className="text-link" onClick={() => { setStep("email"); setCode(""); setNotice(""); setError(""); }}>Use another email</button>
      </form>}
      {step === "password" && <form className="account-form" onSubmit={(event) => void updatePassword(event)}>
        <label htmlFor="reset-password">New password</label><input className="account-input" id="reset-password" type="password" autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} data-testid="input-new-password"/>
        <label htmlFor="reset-confirmation">Confirm new password</label><input className="account-input" id="reset-confirmation" type="password" autoComplete="new-password" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} data-testid="input-confirm-new-password"/>
        <button type="submit" className="button button-primary" disabled={busy}>{busy ? "Updating…" : "Update password"} <Check size={16}/></button>
      </form>}
      {step === "done" && <div className="reset-complete"><Check size={23}/><Link href="/sign-in" className="button button-primary" data-testid="link-reset-sign-in">Return to sign in <ArrowRight size={16}/></Link></div>}
      {step !== "done" && <Link href="/sign-in" className="reset-back" data-testid="link-reset-back">Back to sign in <ArrowRight size={14}/></Link>}
    </section></div>
  </section></>;
}

function Router() {
  return <RoutedErrorBoundary><Shell><Switch>
    <Route path="/" component={Overview}/><Route path="/identify" component={IdentifyPage}/><Route path="/herbs" component={LibraryPage}/><Route path="/herbs/:id" component={HerbProfilePage}/>
    <Route path="/search" component={SearchPage}/><Route path="/recommendations" component={RecommendationsPage}/><Route path="/evidence-safety" component={EvidencePage}/><Route path="/about" component={AboutPage}/>
    <Route path="/profile" component={AccountProfilePage}/><Route path="/settings" component={SettingsPage}/><Route path="/saved-herbs" component={SavedHerbsPage}/>
    <Route path="/login" component={LoginAlias}/><Route path="/signup" component={SignupAlias}/>
    <Route component={NotFound}/>
  </Switch></Shell></RoutedErrorBoundary>;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) client.clear();
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, client]);
  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return <ClerkProvider
    publishableKey={clerkPubKey}
    proxyUrl={clerkProxyUrl}
    appearance={clerkAppearance}
    signInUrl={`${basePath}/sign-in`}
    signUpUrl={`${basePath}/sign-up`}
    localization={{
      signIn: { start: { title: "Welcome back to HERBORA AI", subtitle: "Continue exploring botanical knowledge and your saved research." } },
      signUp: { start: { title: "Create your HERBORA account", subtitle: "Keep a personal reading list of field notes on this device." } },
    }}
    routerPush={(to) => setLocation(stripBase(to))}
    routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
  >
    <ClerkQueryClientCacheInvalidator/>
    <Switch>
      <Route path="/sign-in/*?" component={SignInPage}/>
      <Route path="/sign-up/*?" component={SignUpPage}/>
      <Route path="/forgot-password" component={ForgotPasswordPage}/>
      <Route><Router/></Route>
    </Switch>
  </ClerkProvider>;
}

function App() { return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={basePath}><ClerkProviderWithRoutes/></WouterRouter><Toaster/></TooltipProvider></QueryClientProvider>; }
export default App;
