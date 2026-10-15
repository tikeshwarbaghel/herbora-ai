import { useState } from "react";
import { type Herb } from "@/lib/herb-data";

export function HerbVisual({ herb, className = "" }: { herb: Herb; className?: string }) {
  const [failed, setFailed] = useState(false);
  return <div className={`herb-visual ${className}`} aria-label={herb.imageUrl && !failed ? `${herb.commonName} image` : `${herb.commonName} botanical illustration placeholder`}>
    {herb.imageUrl && !failed ? <img src={herb.imageUrl} alt={herb.commonName} onError={() => setFailed(true)}/> :
      <div className={`plant-placeholder plant-${herb.id}`} aria-hidden="true"><span className="botanical-ring"/><span className="plant-stem"/><span className="plant-leaf leaf-a"/><span className="plant-leaf leaf-b"/><span className="plant-leaf leaf-c"/><span className="plant-name">{herb.botanicalName.split(" ")[0]}</span></div>}
  </div>;
}
