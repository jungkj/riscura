import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Types
export interface RcsaEntry {
  id: string
  riskId: string;
  riskDescription: string;
  organizationId: string;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
  controls: ControlEntry[];
}

export interface ControlEntry {
  id: string;
  controlId: string;
  controlDescription: string;
  rcsaEntryId: string;
}

export interface ExtractedRisk {
  id: string;
  text: string;
  confidence?: number;
}

export interface ExtractedControl {
  id: string;
  text: string;
  confidence?: number;
}

export interface PolicyExtraction {
  risks: ExtractedRisk[];
  controls: ExtractedControl[];
}

export interface UploadState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

// Store interface
export interface ImportStore {
  // State
  rcsaEntries: RcsaEntry[]
  policyExtraction: PolicyExtraction | null;
  uploadStates: {
    rcsa: UploadState;
    policy: UploadState;
  }

  // Actions
  addRcsaEntries: (entries: RcsaEntry[]) => void
  setPolicyExtraction: (extraction: PolicyExtraction) => void;
  clearImports: () => void;

  // Upload state management
  setRcsaLoading: (loading: boolean) => void
  setRcsaError: (__error: string | null) => void;
  setRcsaSuccess: (success: boolean) => void;

  setPolicyLoading: (loading: boolean) => void;
  setPolicyError: (__error: string | null) => void;
  setPolicySuccess: (success: boolean) => void;

  // Async thunks
  uploadRcsaFile: (_file: File) => Promise<void>
  uploadPolicyFile: (_file: File) => Promise<void>;
}

// Initial state
const initialUploadState: UploadState = {
  loading: false,
  error: null,
  success: false,
}

// Create store
export const useImportStore = create<ImportStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      rcsaEntries: [],
      policyExtraction: null,
      uploadStates: {
        rcsa: { ...initialUploadState },
        policy: { ...initialUploadState },
      },

      // Basic actions
      addRcsaEntries: (entries) =>
        set((state) => ({
          rcsaEntries: [...state.rcsaEntries, ...entries],
        })),

      setPolicyExtraction: (extraction) => set({ policyExtraction: extraction }),

      clearImports: () =>
        set({
          rcsaEntries: [],
          policyExtraction: null,
          uploadStates: {
            rcsa: { ...initialUploadState },
            policy: { ...initialUploadState },
          },
        }),

      // RCSA upload state management
      setRcsaLoading: (loading) =>
        set((state) => ({
          uploadStates: {
            ...state.uploadStates,
            rcsa: { ...state.uploadStates.rcsa, loading },
          },
        })),

      setRcsaError: (error) =>
        set((state) => ({
          uploadStates: {
            ...state.uploadStates,
            rcsa: { ...state.uploadStates.rcsa, error, loading: false },
          },
        })),

      setRcsaSuccess: (success) =>
        set((state) => ({
          uploadStates: {
            ...state.uploadStates,
            rcsa: { ...state.uploadStates.rcsa, success, loading: false },
          },
        })),

      // Policy upload state management
      setPolicyLoading: (loading) =>
        set((state) => ({
          uploadStates: {
            ...state.uploadStates,
            policy: { ...state.uploadStates.policy, loading },
          },
        })),

      setPolicyError: (error) =>
        set((state) => ({
          uploadStates: {
            ...state.uploadStates,
            policy: { ...state.uploadStates.policy, error, loading: false },
          },
        })),

      setPolicySuccess: (success) =>
        set((state) => ({
          uploadStates: {
            ...state.uploadStates,
            policy: { ...state.uploadStates.policy, success, loading: false },
          },
        })),

      // Async thunk for RCSA file upload
      uploadRcsaFile: async (_file: File) => {
        const { setRcsaLoading, setRcsaError, setRcsaSuccess, addRcsaEntries } = get()

        try {
          setRcsaLoading(true);
          setRcsaError(null);

          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch('/api/upload/rcsa', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Upload failed');
          }

          const _result = await response.json();

          if (result.success && result.data) {
            // Transform API response to match our store types
            const entries: RcsaEntry[] = result.data.map((entry: any) => ({
              id: entry.id,
              riskId: entry.riskId,
              riskDescription: entry.riskDescription,
              organizationId: entry.organizationId,
              uploadedBy: entry.uploadedBy,
              createdAt: new Date(entry.createdAt),
              updatedAt: new Date(entry.updatedAt),
              controls: entry.controls || [],
            }))

            addRcsaEntries(entries);
            setRcsaSuccess(true);
          } else {
            throw new Error(result.error || 'Upload failed');
          }
        } catch (error) {
          // console.error('RCSA upload error:', error)
          setRcsaError(error instanceof Error ? error.message : 'Upload failed');
        }
      },

      // Async thunk for policy file upload
      uploadPolicyFile: async (_file: File) => {
        const { setPolicyLoading, setPolicyError, setPolicySuccess, setPolicyExtraction } = get()

        try {
          setPolicyLoading(true);
          setPolicyError(null);

          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch('/api/upload/policy', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Upload failed');
          }

          const _result = await response.json();

          if (result.success && result.data) {
            const extraction: PolicyExtraction = {
              risks: result.data.risks || [],
              controls: result.data.controls || [],
            }

            setPolicyExtraction(extraction);
            setPolicySuccess(true);
          } else {
            throw new Error(result.error || 'Upload failed');
          }
        } catch (error) {
          // console.error('Policy upload error:', error)
          setPolicyError(error instanceof Error ? error.message : 'Upload failed');
        }
      },
    }),
    {
      name: 'import-store',
    }
  )
);

// Selector hooks for better performance
export const useRcsaEntries = () => useImportStore((state) => state.rcsaEntries)
export const usePolicyExtraction = () => useImportStore((state) => state.policyExtraction);
export const useUploadStates = () => useImportStore((state) => state.uploadStates);

// Async action hooks
export const useRcsaUpload = () =>
  useImportStore((state) => ({
    uploadFile: state.uploadRcsaFile,
    loading: state.uploadStates.rcsa.loading,
    error: state.uploadStates.rcsa.error,
    success: state.uploadStates.rcsa.success,
  }))

export const usePolicyUpload = () =>
  useImportStore((state) => ({
    uploadFile: state.uploadPolicyFile,
    loading: state.uploadStates.policy.loading,
    error: state.uploadStates.policy.error,
    success: state.uploadStates.policy.success,
  }));
