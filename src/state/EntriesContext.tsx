import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from 'react';

import { deletePersistedImageAsync } from '../services/media';
import {
  loadEntriesFromStorage,
  saveEntriesToStorage,
} from '../services/storage';
import type { TravelEntry } from '../types/travel';
import { sortEntriesByNewest } from '../utils/entries';

type EntriesState = {
  entries: TravelEntry[];
  hydrated: boolean;
};

type EntriesAction =
  | {
      type: 'hydrate';
      entries: TravelEntry[];
    }
  | {
      type: 'set';
      entries: TravelEntry[];
    };

type RemoveEntryResult = {
  mediaDeleteFailed: boolean;
};

type EntriesContextValue = {
  entries: TravelEntry[];
  hydrated: boolean;
  addEntry: (entry: TravelEntry) => Promise<void>;
  removeEntry: (entry: TravelEntry) => Promise<RemoveEntryResult>;
  getEntryById: (entryId: string) => TravelEntry | undefined;
};

const initialState: EntriesState = {
  entries: [],
  hydrated: false,
};

const EntriesContext = createContext<EntriesContextValue | undefined>(undefined);

function entriesReducer(state: EntriesState, action: EntriesAction): EntriesState {
  switch (action.type) {
    case 'hydrate':
      return {
        entries: action.entries,
        hydrated: true,
      };
    case 'set':
      return {
        ...state,
        entries: action.entries,
      };
    default:
      return state;
  }
}

export function EntriesProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(entriesReducer, initialState);
  const entriesRef = useRef<TravelEntry[]>([]);

  useEffect(() => {
    entriesRef.current = state.entries;
  }, [state.entries]);

  useEffect(() => {
    let isMounted = true;

    async function hydrateEntries() {
      const storedEntries = await loadEntriesFromStorage();

      if (isMounted) {
        entriesRef.current = storedEntries;
        dispatch({
          type: 'hydrate',
          entries: storedEntries,
        });
      }
    }

    void hydrateEntries();

    return () => {
      isMounted = false;
    };
  }, []);

  async function addEntry(entry: TravelEntry) {
    const nextEntries = sortEntriesByNewest([entry, ...entriesRef.current]);
    await saveEntriesToStorage(nextEntries);
    entriesRef.current = nextEntries;
    dispatch({
      type: 'set',
      entries: nextEntries,
    });
  }

  async function removeEntry(entry: TravelEntry): Promise<RemoveEntryResult> {
    const nextEntries = entriesRef.current.filter((item) => item.id !== entry.id);
    await saveEntriesToStorage(nextEntries);

    const mediaDeleteSucceeded = await deletePersistedImageAsync(entry.imageUri);

    entriesRef.current = nextEntries;
    dispatch({
      type: 'set',
      entries: nextEntries,
    });

    return {
      mediaDeleteFailed: !mediaDeleteSucceeded,
    };
  }

  function getEntryById(entryId: string): TravelEntry | undefined {
    return state.entries.find((entry) => entry.id === entryId);
  }

  return (
    <EntriesContext.Provider
      value={{
        entries: state.entries,
        hydrated: state.hydrated,
        addEntry,
        removeEntry,
        getEntryById,
      }}
    >
      {children}
    </EntriesContext.Provider>
  );
}

export function useEntries(): EntriesContextValue {
  const value = useContext(EntriesContext);

  if (!value) {
    throw new Error('useEntries must be used inside EntriesProvider.');
  }

  return value;
}
