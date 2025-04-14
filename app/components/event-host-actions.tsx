"use client";

import { Button } from "@/app/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/app/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

interface EventHostActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export function EventHostActions({ onEdit, onDelete }: EventHostActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="bg-transparent border-white/30 hover:bg-white/10 text-white text-xs sm:text-sm h-8"
        >
          <MoreVertical className="h-3.5 w-3.5 mr-1 sm:mr-2" />
          Options
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="h-4 w-4 mr-2" />
          Edit Event
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={onDelete}
          className="text-red-500 focus:text-red-500"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Event
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 