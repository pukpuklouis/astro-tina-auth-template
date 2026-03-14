import { defineCollection, z } from "astro:content";
import client from "../tina/__generated__/client";

const blog = defineCollection({
  loader: async () => {
    const postsResponse = await client.queries.blogConnection();
    const edges = postsResponse.data.blogConnection.edges ?? [];

    return edges.flatMap((edge) => {
      const node = edge?.node;
      const sys = node?._sys;
      const relativePath = sys?.relativePath;

      if (!node || !sys || typeof relativePath !== "string") {
        return [];
      }

      return [
        {
          ...node,
          id: relativePath.replace(/\.mdx?$/, ""),
          tinaInfo: sys,
        },
      ];
    });
  },
  schema: z.object({
    tinaInfo: z.object({
      filename: z.string(),
      basename: z.string(),
      path: z.string(),
      relativePath: z.string(),
    }),
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().nullish(),
  }),
});

const page = defineCollection({
  loader: async () => {
    const postsResponse = await client.queries.pageConnection();
    const edges = postsResponse.data.pageConnection.edges ?? [];

    return edges.flatMap((edge) => {
      const node = edge?.node;
      const sys = node?._sys;
      const relativePath = sys?.relativePath;

      if (!node || !sys || typeof relativePath !== "string") {
        return [];
      }

      return [
        {
          ...node,
          id: relativePath.replace(/\.mdx?$/, ""),
          tinaInfo: sys,
        },
      ];
    });
  },
  schema: z.object({
    tinaInfo: z.object({
      filename: z.string(),
      basename: z.string(),
      path: z.string(),
      relativePath: z.string(),
    }),
    seoTitle: z.string(),
    body: z.any(),
  }),
});

export const collections = { blog, page };
