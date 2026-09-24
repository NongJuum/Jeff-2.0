import { describe, it, expect } from "vitest";

// Pure functions under test
function epley1RM(weight: number, reps: number): number {
  return reps <= 1 ? weight : weight * (1 + reps / 30);
}

function roundToFive(value: number) {
  return Math.round(value / 5) * 5;
}

function getWarmupSets(bestWeight?: number) {
  if (!bestWeight || bestWeight <= 0) return [];
  return [
    { label: "Warmup 1", weight: roundToFive(bestWeight * 0.4), reps: "8 to 10" },
    { label: "Warmup 2", weight: roundToFive(bestWeight * 0.6), reps: "5 to 6" },
    { label: "Warmup 3", weight: roundToFive(bestWeight * 0.8), reps: "2 to 3" },
  ];
}

describe("epley1RM", () => {
  it("คืนค่าน้ำหนักจริงเมื่อ reps = 1", () => {
    expect(epley1RM(100, 1)).toBe(100);
  });

  it("คำนวณ 1RM ถูกต้องสำหรับ reps > 1", () => {
    expect(epley1RM(100, 10)).toBeCloseTo(133.33, 1);
  });

  it("1RM เพิ่มขึ้นตาม reps", () => {
    expect(epley1RM(100, 10)).toBeGreaterThan(epley1RM(100, 5));
  });
});

describe("roundToFive", () => {
  it("ปัดเป็นเลขคูณ 5", () => {
    expect(roundToFive(42)).toBe(40);
    expect(roundToFive(43)).toBe(45);
    expect(roundToFive(47)).toBe(45);
  });
});

describe("getWarmupSets", () => {
  it("คืนค่า array ว่างเมื่อไม่มี PR", () => {
    expect(getWarmupSets(undefined)).toEqual([]);
    expect(getWarmupSets(0)).toEqual([]);
  });

  it("คืนค่า 3 เซตเมื่อมี PR", () => {
    const sets = getWarmupSets(100);
    expect(sets).toHaveLength(3);
    expect(sets[0].weight).toBe(40); // 40%
    expect(sets[1].weight).toBe(60); // 60%
    expect(sets[2].weight).toBe(80); // 80%
  });

  it("น้ำหนัก warmup เพิ่มขึ้นตามลำดับ", () => {
    const sets = getWarmupSets(200);
    expect(sets[0].weight).toBeLessThan(sets[1].weight);
    expect(sets[1].weight).toBeLessThan(sets[2].weight);
  });
});
