import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listLatest = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("events").order("desc").take(50);
  },
});

export const add = mutation({
  args: { kind: v.string(), payload: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("events", {
      kind: args.kind,
      payload: args.payload,
      createdAt: Date.now(),
    });
  },
});
