The code changes aim to add a "Prof Dev" column to the LogEntriesTable component, displaying professional development hours for each log entry.
```

```replit_final_file
import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLogEntries } from "@/hooks/use-firestore";
import type { LogEntry } from "@shared/schema";

type SortField = "dateOfContact" | "clientContactHours" | "supervisionHours";
type SortDirection = "asc" | "desc";

export const LogEntriesTable = () => {
  const { entries, loading, error } = useLogEntries();

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [supervisionFilter, setSupervisionFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<{from?: Date; to?: Date}>({});
  const [dateCalendarOpen, setDateCalendarOpen] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState<SortField>("dateOfContact");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredAndSortedEntries = useMemo(() => {
    let filtered = [...entries];

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(entry => {
        if (typeFilter === "direct") return !entry.indirectHours;
        if (typeFilter === "indirect") return entry.indirectHours;
        return true;
      });
    }

    // Supervision filter
    if (supervisionFilter !== "all") {
      filtered = filtered.filter(entry => {
        if (supervisionFilter === "none") return entry.supervisionType === "none" || entry.supervisionHours === 0;
        return entry.supervisionType === supervisionFilter;
      });
    }

    // Date range filter
    if (dateRange.from) {
      filtered = filtered.filter(entry => 
        new Date(entry.dateOfContact) >= dateRange.from!
      );
    }
    if (dateRange.to) {
      filtered = filtered.filter(entry => 
        new Date(entry.dateOfContact) <= dateRange.to!
      );
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.notes.toLowerCase().includes(query)
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === "dateOfContact") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [entries, typeFilter, supervisionFilter, searchQuery, dateRange, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedEntries.length / itemsPerPage);
  const paginatedEntries = filteredAndSortedEntries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const formatSupervisionDisplay = (entry: LogEntry) => {
    if (entry.supervisionHours === 0 || entry.supervisionType === "none") {
      return "None";
    }
    const typeDisplay = entry.supervisionType.charAt(0).toUpperCase() + entry.supervisionType.slice(1);
    return `${typeDisplay} (${entry.supervisionHours}h)`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="direct">Direct</SelectItem>
            <SelectItem value="indirect">Indirect</SelectItem>
          </SelectContent>
        </Select>

        <Select value={supervisionFilter} onValueChange={setSupervisionFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Supervision" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Supervision</SelectItem>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="individual">Individual</SelectItem>
            <SelectItem value="dyadic">Dyadic</SelectItem>
            <SelectItem value="group">Group</SelectItem>
          </SelectContent>
        </Select>

        <Popover open={dateCalendarOpen} onOpenChange={setDateCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-60 justify-start text-left font-normal",
                !dateRange.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} -{" "}
                    {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                "Pick a date range"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={dateRange}
              onSelect={(range) => {
                setDateRange(range || {});
                if (range?.from && range?.to) {
                  setDateCalendarOpen(false);
                }
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        <Input
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-0"
        />
      </div>

      {/* Table */}
      {paginatedEntries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {entries.length === 0 
              ? "No log entries yet. Start by adding your first entry!"
              : "No entries match your current filters."
            }
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("dateOfContact")}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      Date <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("clientContactHours")}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      Hours <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("supervisionHours")}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      Supervision <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Prof Dev</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEntries.map((entry) => (
                  <TableRow key={entry.id} className="hover:bg-muted/50">
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(entry.dateOfContact), "MM/dd/yyyy")}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {entry.clientContactHours.toFixed(1)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={entry.indirectHours ? "secondary" : "default"}
                        className={entry.indirectHours ? "" : "bg-primary/10 text-primary"}
                      >
                        {entry.indirectHours ? "Indirect" : "Direct"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {entry.supervisionHours > 0 ? (
                        <div className="space-y-1">
                          <div className="font-medium text-blue-600">
                            {entry.supervisionHours}h
                          </div>
                          <div className="text-xs text-gray-500 capitalize">
                            {entry.supervisionType.replace('_', ' ')}
                          </div>
                          {entry.techAssistedSupervision && (
                            <Badge variant="outline" className="text-xs">
                              Tech Assisted
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {(entry.professionalDevelopmentHours || 0) > 0 ? (
                        <div className="space-y-1">
                          <div className="font-medium text-green-600">
                            {entry.professionalDevelopmentHours}h
                          </div>
                          <div className="text-xs text-gray-500 capitalize">
                            {(entry.professionalDevelopmentType || 'none').replace('_', ' ')}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={entry.notes}>
                        {entry.notes || "—"}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredAndSortedEntries.length)} of{" "}
                {filteredAndSortedEntries.length} entries
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};