// Reconstructs the visual look of a bordered, rounded Card wrapping a list
// of rows — for use as the outer className of each row in a virtualized
// list (FlatList/SectionList), where a single enclosing Card is no longer
// possible since the list itself owns scrolling.
export function cardRowClass(index: number, length: number): string {
  const isFirst = index === 0;
  const isLast = index === length - 1;
  return [
    "px-4",
    "bg-card dark:bg-card-dark",
    "border-l border-r border-border dark:border-border-dark",
    isFirst ? "border-t rounded-t-xl" : "",
    isLast ? "border-b rounded-b-xl" : "",
  ].filter(Boolean).join(" ");
}
