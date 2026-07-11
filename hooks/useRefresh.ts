import { useCallback, useState } from "react";

// Pull-to-refresh spinner state, kept deliberately separate from a store's
// own `status` field. Binding RefreshControl directly to `status === 'loading'`
// makes it fire on the very first automatic fetch too — showing a spinner at
// the top of the list at the same time DataState shows one in the body.
// This only turns on for a refresh the user actually triggered by pulling.
export function useRefresh(refetch: () => Promise<void> | void) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return { refreshing, onRefresh };
}
