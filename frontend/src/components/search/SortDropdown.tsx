'use client';

import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type SortOption = {
  field: 'relevance' | 'price' | 'rating' | 'distance' | 'createdAt';
  order: 'asc' | 'desc';
  label: string;
};

const SORT_OPTIONS: SortOption[] = [
  { field: 'relevance', order: 'desc', label: 'Most Relevant' },
  { field: 'price', order: 'asc', label: 'Price: Low to High' },
  { field: 'price', order: 'desc', label: 'Price: High to Low' },
  { field: 'rating', order: 'desc', label: 'Highest Rated' },
  { field: 'distance', order: 'asc', label: 'Nearest First' },
  { field: 'createdAt', order: 'desc', label: 'Newly Added' },
];

interface SortDropdownProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  showDistance?: boolean;
}

export function SortDropdown({ currentSort, onSortChange, showDistance }: SortDropdownProps) {
  const availableOptions = showDistance
    ? SORT_OPTIONS
    : SORT_OPTIONS.filter((opt) => opt.field !== 'distance');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ArrowUpDown className="h-4 w-4" />
          <span className="hidden sm:inline">Sort by: </span>
          <span>{currentSort.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Sort Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableOptions.map((option) => (
          <DropdownMenuItem
            key={`${option.field}-${option.order}`}
            onClick={() => onSortChange(option)}
            className={currentSort.field === option.field && currentSort.order === option.order ? 'bg-accent' : ''}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

