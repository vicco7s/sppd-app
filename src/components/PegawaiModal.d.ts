import { Pegawai } from "@/types/index";

export interface PegawaiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: Record<string, unknown>) => Promise<void>;
  pegawaiData: Pegawai | null | undefined;
  isSaving?: boolean;
}

declare const PegawaiModal: React.FC<PegawaiModalProps>;
export default PegawaiModal;
