// Reconstructs the visual look of a borderless, rounded Card wrapping a list
// of rows — for use as the outer className of each row in a virtualized
// list (FlatList/SectionList), where a single enclosing Card is no longer
// possible since the list itself owns scrolling. Border color is still set
// so callers can add "border-b" as an in-card row separator.
export function cardRowClassAt(isFirst: boolean, isLast: boolean): string {
  return [
    "px-4",
    "bg-card dark:bg-card-dark",
    "border-border dark:border-border-dark",
    // Without this, a rounded corner set only via className can fail to
    // clip the row's own background fill on Android when the row is also
    // animated with a transform (see AnimatedPressable's press-scale) —
    // the corner radius is there but nothing clips content/background to
    // it, so the row paints as a square. overflow-hidden is what actually
    // makes the radius visible, not just declared.
    "overflow-hidden",
    isFirst ? "rounded-t-2xl" : "",
    isLast ? "rounded-b-2xl" : "",
  ].filter(Boolean).join(" ");
}

export function cardRowClass(index: number, length: number): string {
  return cardRowClassAt(index === 0, index === length - 1);
}
