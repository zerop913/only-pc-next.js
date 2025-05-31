"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { PcBuildResponse } from "@/types/pcbuild";
import EditBuildNameModal from "@/components/modals/profile/EditBuildNameModal";
import DeleteBuildModal from "@/components/modals/profile/DeleteBuildModal";
import CookieInfoModal from "@/components/modals/profile/CookieInfoModal";
import ConfigurationModal from "@/components/modals/configurator/ConfigurationModal";
import SaveBuildModal from "@/components/modals/configurator/SaveBuildModal";
import ReplaceProductModal from "@/components/modals/configurator/ReplaceProductModal";
import QrCodeHelpModal from "@/components/modals/payment/QrCodeHelpModal";
import { AnimatePresence } from "framer-motion";
import { Category } from "@/types/category";
import { SelectedProduct } from "@/contexts/ConfiguratorContext";
import { Product } from "@/types/product";

// Определяем типы для конфигуратора
interface ConfigurationModalProps {
  categories: Category[];
  selectedProducts: SelectedProduct[];
  progress: number;
  isComplete: boolean;
  onClose: () => void;
  editingBuildName?: string | null;
  editingBuildSlug?: string | null;
}

interface SaveBuildModalProps {
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  initialName?: string;
  isEditing?: boolean;
}

interface ReplaceProductModalProps {
  currentProduct: Product;
  newProduct: Product;
  onConfirm: () => void;
  onCancel: () => void;
}

interface ModalContextType {
  openEditBuildModal: (
    build: PcBuildResponse,
    onSave: (name: string) => Promise<void>
  ) => void;
  openDeleteBuildModal: (
    build: PcBuildResponse,
    onConfirm: () => Promise<void>
  ) => void;
  closeModal: () => void;
  openConfigurationModal: (props: ConfigurationModalProps) => void;
  openSaveBuildModal: (props: SaveBuildModalProps) => void;
  openReplaceProductModal: (props: ReplaceProductModalProps) => void;
  openQrCodeHelpModal: () => void;
  openCookieInfoModal: () => void;
  closeConfigurationModal: () => void;
  closeSaveBuildModal: () => void;
  closeReplaceProductModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [editingBuild, setEditingBuild] = useState<{
    build: PcBuildResponse;
    onSave: (name: string) => Promise<void>;
  } | null>(null);

  const [deletingBuild, setDeletingBuild] = useState<{
    build: PcBuildResponse;
    onConfirm: () => Promise<void>;
  } | null>(null);

  const [configurationModal, setConfigurationModal] =
    useState<ConfigurationModalProps | null>(null);
  const [saveBuildModal, setSaveBuildModal] =
    useState<SaveBuildModalProps | null>(null);
  const [replaceProductModal, setReplaceProductModal] =
    useState<ReplaceProductModalProps | null>(null);
  const [qrCodeHelpModal, setQrCodeHelpModal] = useState<boolean>(false);
  const [cookieInfoModal, setCookieInfoModal] = useState<boolean>(false);

  const closeModal = () => {
    setEditingBuild(null);
    setDeletingBuild(null);
    setConfigurationModal(null);
    setSaveBuildModal(null);
    setReplaceProductModal(null);
    setQrCodeHelpModal(false);
    setCookieInfoModal(false);
  };

  return (
    <ModalContext.Provider
      value={{
        openEditBuildModal: (build, onSave) =>
          setEditingBuild({ build, onSave }),
        openDeleteBuildModal: (build, onConfirm) =>
          setDeletingBuild({ build, onConfirm }),
        closeModal,
        openConfigurationModal: (props) => setConfigurationModal(props),
        openCookieInfoModal: () => setCookieInfoModal(true),
        openSaveBuildModal: (props) => {
          setSaveBuildModal({
            ...props,
            onClose: () => {
              props.onClose?.();
              setSaveBuildModal(null);
            },
          });
        },
        openReplaceProductModal: (props) => setReplaceProductModal(props),
        openQrCodeHelpModal: () => setQrCodeHelpModal(true),
        closeConfigurationModal: () => setConfigurationModal(null),
        closeSaveBuildModal: () => setSaveBuildModal(null),
        closeReplaceProductModal: () => setReplaceProductModal(null),
      }}
    >
      {children}
      <AnimatePresence mode="sync">
        {editingBuild && (
          <EditBuildNameModal
            key="edit-build-modal"
            build={editingBuild.build}
            onSave={editingBuild.onSave}
            onClose={closeModal}
          />
        )}
        {deletingBuild && (
          <DeleteBuildModal
            key="delete-build-modal"
            build={deletingBuild.build}
            onConfirm={async () => {
              await deletingBuild.onConfirm();
              closeModal();
            }}
            onClose={closeModal}
          />
        )}
        {configurationModal && (
          <ConfigurationModal
            key="configuration-modal"
            {...configurationModal}
            onClose={closeModal}
          />
        )}
        {saveBuildModal && (
          <SaveBuildModal key="save-build-modal" {...saveBuildModal} />
        )}
        {replaceProductModal && (
          <ReplaceProductModal
            key="replace-product-modal"
            {...replaceProductModal}
          />
        )}{" "}
        {qrCodeHelpModal && (
          <QrCodeHelpModal key="qrcode-help-modal" onClose={closeModal} />
        )}
        {cookieInfoModal && (
          <CookieInfoModal key="cookie-info-modal" onClose={closeModal} />
        )}
      </AnimatePresence>
    </ModalContext.Provider>
  );
}

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};
