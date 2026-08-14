// Reconstructs the visual look of a borderless, rounded Card wrapping a list
// of rows — for use as the outer className of each row in a virtualized
// list (FlatList/SectionList), where a single enclosing Card is no longer
// possible since the list itself owns scrolling. Border color is still set
// so callers can add "border-b" as an in-card row separator.
export function cardRowClass(index: number, length: number): string {
  const isFirst = index === 0;
  const isLast = index === length - 1;
  return [
    "px-4",
    "bg-card dark:bg-card-dark",
    "border-border dark:border-border-dark",
    isFirst ? "rounded-t-2xl" : "",
    isLast ? "rounded-b-2xl" : "",
  ].filter(Boolean).join(" ");
}
