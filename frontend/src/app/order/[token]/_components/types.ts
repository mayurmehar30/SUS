import { Product, ClassStudentCount } from "@/types";

export interface UniformSection {
  topwear: Product | null;
  bottomwear: Product | null;
  accessories: Product[];   // multiple accessories allowed
}

export type UniformType = "Regular" | "Sport" | "Scout Guide" | "Other";

export interface UniformSet {
  id: string;
  name: string;
  uniformType: UniformType;
  boys: UniformSection;
  girls: UniformSection;
  classRows: ClassStudentCount[];
}

export type SectionType = keyof UniformSection;
export type GenderKey = "boys" | "girls";

export const FIXED_CLASSES = [
  "Nursery", "Jr. KG", "Sr. KG",
  "1st", "2nd", "3rd", "4th", "5th", "6th",
  "7th", "8th", "9th", "10th",
];

export function emptyUniform(name: string, classNames?: string[]): UniformSet {
  const classes = (classNames && classNames.length > 0) ? classNames : FIXED_CLASSES;
  return {
    id: Math.random().toString(36).slice(2),
    name,
    uniformType: "Regular",
    boys: { topwear: null, bottomwear: null, accessories: [] },
    girls: { topwear: null, bottomwear: null, accessories: [] },
    classRows: classes.map(c => ({ className: c, boysCount: 0, girlsCount: 0, totalCount: 0 })),
  };
}

export function hasAnyProduct(u: UniformSet): boolean {
  return !!(
    u.boys.topwear || u.boys.bottomwear || u.boys.accessories.length ||
    u.girls.topwear || u.girls.bottomwear || u.girls.accessories.length
  );
}

export function getUniformTotalQty(u: UniformSet, classRows?: ClassStudentCount[]): number {
  const rows = classRows ?? u.classRows;
  return rows.reduce((s, r) => s + r.boysCount + r.girlsCount, 0);
}

export function getSectionProducts(u: UniformSet, gender: GenderKey): Product[] {
  const s = u[gender];
  return [
    ...(s.topwear ? [s.topwear] : []),
    ...(s.bottomwear ? [s.bottomwear] : []),
    ...s.accessories,
  ];
}

/** All product IDs already used across all uniforms for a given gender+section */
export function getUsedProductIds(
  uniforms: UniformSet[],
  excludeUniformId: string,
  gender: GenderKey,
  type: SectionType,
): Set<number> {
  const ids = new Set<number>();
  for (const u of uniforms) {
    if (u.id === excludeUniformId) continue;
    if (type === "accessories") {
      u[gender].accessories.forEach(p => ids.add(p.id));
    } else {
      const p = u[gender][type] as Product | null;
      if (p) ids.add(p.id);
    }
  }
  return ids;
}

export function getProductsForSection(
  allProducts: Product[],
  gender: GenderKey,
  type: SectionType,
): Product[] {
  const genders = gender === "boys" ? ["Boys", "Unisex"] : ["Girls", "Unisex"];
  return allProducts.filter(p => {
    const gMatch = genders.includes(p.gender || "");
    const sub = (p.subCategoryName || "").toLowerCase();
    if (type === "accessories") return gMatch && (p.categoryName || "").toLowerCase() === "accessories";
    if (type === "topwear")     return gMatch && sub.includes("top");
    if (type === "bottomwear")  return gMatch && sub.includes("bottom");
    return false;
  });
}

export function getUniformEstimate(u: UniformSet, classRows?: ClassStudentCount[]): number {
  const rows = classRows ?? u.classRows;
  const boysQty = rows.reduce((s, r) => s + r.boysCount, 0);
  const girlsQty = rows.reduce((s, r) => s + r.girlsCount, 0);
  const boysAmount = getSectionProducts(u, "boys").reduce((s, p) => s + boysQty * p.finalPrice, 0);
  const girlsAmount = getSectionProducts(u, "girls").reduce((s, p) => s + girlsQty * p.finalPrice, 0);
  return boysAmount + girlsAmount;
}
