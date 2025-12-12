import {
  Utensils,
  Dumbbell,
  Palette,
  BookOpen,
  ChefHat,
  Gamepad2,
  Plane,
  GraduationCap,
  MoreHorizontal,
} from "lucide-react";

export const CATEGORY_ICONS = {
  맛집: Utensils,
  운동: Dumbbell,
  문화: Palette,
  독서: BookOpen,
  요리: ChefHat,
  게임: Gamepad2,
  여행: Plane,
  스터디: GraduationCap,
  기타: MoreHorizontal,
} as const;

export const getCategoryIcon = (category?: string) => {
  if (!category) return MoreHorizontal;
  return (
    CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || MoreHorizontal
  );
};

export const getCategoryColor = (category?: string) => {
  const colors = {
    맛집: "text-orange-500",
    운동: "text-blue-500",
    문화: "text-purple-500",
    독서: "text-green-500",
    요리: "text-red-500",
    게임: "text-pink-500",
    여행: "text-cyan-500",
    스터디: "text-indigo-500",
    기타: "text-gray-500",
  };

  if (!category) return "text-gray-500";
  return colors[category as keyof typeof colors] || "text-gray-500";
};
