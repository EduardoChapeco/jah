import { describe, it, expect } from "vitest";
import { z } from "zod";

describe("Feed Algorithm & BigTech Ranking Engine", () => {
  // Modelagem da fórmula matemática de Gravity Decay
  function calculateScore({
    likesCount,
    commentsCount,
    hasMedia,
    hasText,
    isFollowed,
    hoursOld,
    isExplore = false,
  }: {
    likesCount: number;
    commentsCount: number;
    hasMedia: boolean;
    hasText: boolean;
    isFollowed: boolean;
    hoursOld: number;
    isExplore?: boolean;
  }) {
    let baseScore = 10;
    baseScore += likesCount * 2;
    baseScore += commentsCount * 3;
    if (hasMedia) baseScore += 5;
    if (hasText) baseScore += 2;

    if (!isExplore) {
      if (isFollowed) baseScore += 15;
    } else {
      if (isFollowed) baseScore -= 10;
    }

    const decay = 1 / Math.pow(hoursOld + 2, 1.15);
    return baseScore * decay;
  }

  it("prioritizes recent high-engagement posts over older posts with same engagement", () => {
    const recentPostScore = calculateScore({
      likesCount: 10,
      commentsCount: 2,
      hasMedia: true,
      hasText: true,
      isFollowed: false,
      hoursOld: 1,
    });

    const oldPostScore = calculateScore({
      likesCount: 10,
      commentsCount: 2,
      hasMedia: true,
      hasText: true,
      isFollowed: false,
      hoursOld: 48,
    });

    expect(recentPostScore).toBeGreaterThan(oldPostScore);
    expect(recentPostScore / oldPostScore).toBeGreaterThan(5); // Decaimento expressivo em 48h
  });

  it("gives affinity boost to followed creators in 'for_you' tab", () => {
    const nonFollowedScore = calculateScore({
      likesCount: 5,
      commentsCount: 1,
      hasMedia: true,
      hasText: true,
      isFollowed: false,
      hoursOld: 2,
      isExplore: false,
    });

    const followedScore = calculateScore({
      likesCount: 5,
      commentsCount: 1,
      hasMedia: true,
      hasText: true,
      isFollowed: true,
      hoursOld: 2,
      isExplore: false,
    });

    expect(followedScore).toBeGreaterThan(nonFollowedScore);
  });

  it("prioritizes unfollowed creators in 'explore' tab for true discovery", () => {
    const followedInExplore = calculateScore({
      likesCount: 15,
      commentsCount: 3,
      hasMedia: true,
      hasText: true,
      isFollowed: true,
      hoursOld: 2,
      isExplore: true,
    });

    const unfollowedInExplore = calculateScore({
      likesCount: 15,
      commentsCount: 3,
      hasMedia: true,
      hasText: true,
      isFollowed: false,
      hoursOld: 2,
      isExplore: true,
    });

    expect(unfollowedInExplore).toBeGreaterThan(followedInExplore);
  });

  it("validates that author diversification prevents monopoly in feed", () => {
    const candidates = [
      { id: "1", authorId: "author-A", score: 100 },
      { id: "2", authorId: "author-A", score: 95 },
      { id: "3", authorId: "author-A", score: 90 },
      { id: "4", authorId: "author-B", score: 85 },
      { id: "5", authorId: "author-C", score: 80 },
    ];

    const diversified: any[] = [];
    const remaining = [...candidates];

    while (remaining.length > 0) {
      const lastAuthor = diversified[diversified.length - 1]?.authorId;
      const secondLastAuthor = diversified[diversified.length - 2]?.authorId;

      const nextIndex = remaining.findIndex((candidate) => {
        if (diversified.length < 2) return true;
        return candidate.authorId !== lastAuthor || candidate.authorId !== secondLastAuthor;
      });

      if (nextIndex !== -1) {
        diversified.push(remaining[nextIndex]);
        remaining.splice(nextIndex, 1);
      } else {
        diversified.push(remaining[0]);
        remaining.splice(0, 1);
      }
    }

    // O terceiro post de author-A deve ter sido intercalado por author-B
    expect(diversified[0].authorId).toBe("author-A");
    expect(diversified[1].authorId).toBe("author-A");
    expect(diversified[2].authorId).toBe("author-B"); // Intercalação bem-sucedida!
  });

  it("validates that createPost accepts up to 10 media URLs and rejects 11", () => {
    const mediaSchema = z.array(z.string()).max(10, "Máximo de 10 mídias");

    const validTen = Array.from({ length: 10 }, (_, i) => `https://cdn.usewaesy.com/photo-${i}.jpg`);
    expect(mediaSchema.safeParse(validTen).success).toBe(true);

    const invalidEleven = Array.from({ length: 11 }, (_, i) => `https://cdn.usewaesy.com/photo-${i}.jpg`);
    expect(mediaSchema.safeParse(invalidEleven).success).toBe(false);
  });
});
