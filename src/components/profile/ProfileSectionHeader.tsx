import React from "react";

interface ProfileSectionHeaderProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
}

export default function ProfileSectionHeader({
  title,
  description,
  icon: Icon,
}: ProfileSectionHeaderProps) {
  return (
    <div className="flex items-center mb-4">
      {Icon && (
        <div className="p-2 mr-3 bg-gradient-from/20 rounded-lg border border-primary-border">
          <Icon className="w-5 h-5 text-blue-400" />
        </div>
      )}
      <div>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        {description && (
          <p className="text-sm text-secondary-light mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}
