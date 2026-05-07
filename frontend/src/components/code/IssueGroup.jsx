import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import IssueCard from "@/components/code/IssueCard";
import { Badge } from "@/components/ui/badge";

const BADGE = {
  High: "bg-red-500/15 text-red-300 border-red-500/30",
  Medium: "bg-amber-400/15 text-amber-200 border-amber-400/30",
  Low: "bg-emerald-400/15 text-emerald-200 border-emerald-400/30",
};

export default function IssueGroup({ groups }) {
  const entries = Object.entries(groups || {});

  return (
    <Accordion type="multiple" className="w-full" defaultValue={entries.map(([k]) => k)}>
      {entries.map(([severity, issues]) => (
        <AccordionItem key={severity} value={severity} className="border-zinc-800">
          <AccordionTrigger className="text-left hover:no-underline">
            <div className="flex items-center gap-3">
              <Badge className={`border ${BADGE[severity] || "border-zinc-700 bg-zinc-800 text-zinc-200"}`} variant="secondary">
                {severity}
              </Badge>
              <div className="text-sm text-zinc-200">{issues?.length || 0} issues</div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            {(issues || []).map((issue, idx) => (
              <IssueCard key={issue?.id || `${severity}-${idx}`} issue={issue} />
            ))}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

