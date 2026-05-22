import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

// Re-run a react-query refetch whenever the screen regains focus. Screens in a
// tab/stack navigator stay mounted, so `refetchOnMount` never fires on tab
// switches — this keeps every page fresh when the user navigates back to it.
// The first focus is skipped because mounting already triggers the initial fetch.
//
// The refetch fn is held in a ref so the focus callback stays referentially
// stable: passing an inline/unmemoised fn would otherwise re-arm the effect on
// every render and refetch in a loop.
export function useRefetchOnFocus(refetch) {
  const isFirst = useRef(true);
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useFocusEffect(
    useCallback(() => {
      if (isFirst.current) {
        isFirst.current = false;
        return;
      }
      const fn = refetchRef.current;
      if (typeof fn === 'function') fn();
    }, [])
  );
}
