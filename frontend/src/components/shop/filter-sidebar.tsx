import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const fabrics = ["Silk", "Zari", "Jacquard", "Georgette"];

export function FilterSidebar({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (fabric: string) => void;
}) {
  return (
    <aside className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-base font-semibold">Filters</h2>
      <div className="mt-4 space-y-3">
        <p className="text-sm font-medium">Fabric</p>
        {fabrics.map((fabric) => (
          <div key={fabric} className="flex items-center gap-2">
            <Checkbox id={fabric} checked={selected.includes(fabric)} onCheckedChange={() => onToggle(fabric)} />
            <Label htmlFor={fabric}>{fabric}</Label>
          </div>
        ))}
      </div>
    </aside>
  );
}
