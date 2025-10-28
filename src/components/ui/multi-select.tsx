import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface MultiSelectProps {
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
  className
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [focusedIndex, setFocusedIndex] = React.useState(-1)

  const handleSelect = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option))
    } else {
      onChange([...selected, option])
    }
  }

  const handleRemove = (option: string) => {
    onChange(selected.filter(item => item !== option))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        setOpen(true)
        setFocusedIndex(0)
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setFocusedIndex(prev => 
          prev < options.length - 1 ? prev + 1 : 0
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : options.length - 1
        )
        break
      case "Enter":
      case " ":
        e.preventDefault()
        if (focusedIndex >= 0 && focusedIndex < options.length) {
          handleSelect(options[focusedIndex])
        }
        break
      case "Escape":
        e.preventDefault()
        setOpen(false)
        setFocusedIndex(-1)
        break
      case "Tab":
        setOpen(false)
        setFocusedIndex(-1)
        break
    }
  }

  React.useEffect(() => {
    if (!open) {
      setFocusedIndex(-1)
    }
  }, [open])

  // Scroll focused option into view
  React.useEffect(() => {
    if (focusedIndex >= 0 && open) {
      const focusedElement = document.querySelector(`[data-option-index="${focusedIndex}"]`)
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [focusedIndex, open])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={selected.length > 0 ? `${selected.length} options selected` : placeholder}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full justify-between min-h-9 h-auto",
            className
          )}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selected.map((item) => (
                <Badge
                  key={item}
                  variant="secondary"
                  className="mr-1 mb-1"
                >
                  {item}
                  <button
                    tabIndex={0}
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        handleRemove(item)
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onClick={() => handleRemove(item)}
                    aria-label={`Remove ${item}`}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-1" onKeyDown={handleKeyDown}>
        <div className="max-h-60 overflow-auto" role="listbox" aria-multiselectable="true">
          {options.map((option, index) => (
            <div
              key={option}
              data-option-index={index}
              className={cn(
                "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                selected.includes(option) && "bg-accent",
                focusedIndex === index && "bg-accent text-accent-foreground"
              )}
              onClick={() => handleSelect(option)}
              role="option"
              aria-selected={selected.includes(option)}
              tabIndex={focusedIndex === index ? 0 : -1}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  selected.includes(option) ? "opacity-100" : "opacity-0"
                )}
              />
              {option}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}