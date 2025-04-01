import { useState, useEffect } from "react";
import { PcBuildResponse } from "@/types/pcbuild";
import { Package, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProfileSectionHeader from "./ProfileSectionHeader";
import { useModal } from "@/contexts/ModalContext";

export default function ProfileBuilds() {
  const [builds, setBuilds] = useState<PcBuildResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { openEditBuildModal, openDeleteBuildModal } = useModal();

  useEffect(() => {
    const fetchBuilds = async () => {
      try {
        const response = await fetch("/api/builds/user", {
          credentials: "include",
        });
        const data = await response.json();
        setBuilds(data.builds || []);
      } catch (error) {
        console.error("Error fetching builds:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBuilds();
  }, []);

  const handleEdit = (build: PcBuildResponse) => {
    openEditBuildModal(build, async (newName) => {
      await handleUpdateName(newName, build);
    });
  };

  const handleDelete = (build: PcBuildResponse) => {
    openDeleteBuildModal(build, async () => {
      await handleConfirmDelete(build);
    });
  };

  const handleEditInConfigurator = (build: PcBuildResponse) => {
    router.push(`/configurator?loadBuild=${build.slug}`);
  };

  const handleUpdateName = async (
    newName: string,
    editingBuild: PcBuildResponse
  ) => {
    try {
      const response = await fetch(`/api/builds/${editingBuild.slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: newName,
          components:
            typeof editingBuild.components === "string"
              ? JSON.parse(editingBuild.components)
              : editingBuild.components,
        }),
      });

      if (!response.ok) throw new Error("Failed to update build");

      setBuilds(
        builds.map((build) =>
          build.id === editingBuild.id ? { ...build, name: newName } : build
        )
      );
    } catch (error) {
      console.error("Error updating build:", error);
    }
  };

  const handleConfirmDelete = async (deletingBuild: PcBuildResponse) => {
    try {
      const response = await fetch(`/api/builds/${deletingBuild.slug}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to delete build");

      setBuilds(builds.filter((build) => build.id !== deletingBuild.id));
    } catch (error) {
      console.error("Error deleting build:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/4 bg-gradient-from/20 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-gradient-from/20 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-from/10 border border-primary-border rounded-lg shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20" />
        <div className="p-6">
          <ProfileSectionHeader
            title="Мои сборки"
            description="Сохраненные конфигурации компьютеров"
            icon={Package}
          />

          {builds.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-secondary-light">
                У вас пока нет сохраненных сборок
              </p>
              <Link
                href="/configurator"
                className="inline-block mt-4 px-4 py-2 rounded-lg bg-gradient-from/20 
                         hover:bg-gradient-from/30 text-blue-400 border border-blue-500/30 
                         hover:border-blue-500/50 transition-all duration-300"
              >
                Создать первую сборку
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {builds.map((build) => (
                <div key={build.id} className="relative">
                  <Link href={`/catalog/${build.slug}`} className="block group">
                    <div
                      className="p-4 bg-gradient-from/20 rounded-lg border border-primary-border 
                                  transition-all duration-300 hover:border-blue-500/30"
                    >
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <h3 className="text-lg font-medium text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                          {build.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleEdit(build);
                            }}
                            className="p-1.5 rounded-lg bg-gradient-from/30 hover:bg-gradient-from/50 
                                     text-secondary-light hover:text-white transition-all"
                            title="Переименовать"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDelete(build);
                            }}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 
                                     text-red-400 hover:text-red-300 transition-all"
                            title="Удалить"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <p className="text-secondary-light text-sm mb-3">
                        Создано:{" "}
                        {new Date(build.createdAt).toLocaleDateString()}
                      </p>

                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-primary-border/30">
                        <span className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {Number(build.totalPrice).toLocaleString()} ₽
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleEditInConfigurator(build);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 
                                     text-blue-400 hover:text-blue-300 border border-blue-500/30 
                                     transition-all text-sm"
                          >
                            Редактировать
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
