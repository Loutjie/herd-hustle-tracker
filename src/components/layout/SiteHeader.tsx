import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md transition-colors ${
    isActive ? "bg-secondary text-secondary-foreground" : "hover:bg-accent hover:text-accent-foreground"
  }`;

export const SiteHeader = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <Link to="/" className="font-semibold tracking-tight text-lg">
          Cattle Manager
        </Link>
        <nav className="flex items-center gap-1">
          <NavLink to="/" className={navLinkClass} end>
            Dashboard
          </NavLink>
          <NavLink to="/transactions" className={navLinkClass}>
            Transactions
          </NavLink>
          <NavLink to="/costs" className={navLinkClass}>
            Costs
          </NavLink>
          <NavLink to="/reports" className={navLinkClass}>
            Reports
          </NavLink>
        </nav>
        <div className="hidden sm:flex items-center gap-2">
          <Button asChild variant="default">
            <Link to="/transactions">Add Transaction</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/costs">Add Cost</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
