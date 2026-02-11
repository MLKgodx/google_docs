/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";

// TODO: remplacer par ctx.session.user.id une fois l'auth en place
const TEMP_USER_ID = "temp-dev-user";

export const fichierRouter = createTRPCRouter({
  // CREATE
  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        type: z.enum(["Document", "Presentation", "Tableur", "Autre"]),
        content: z.string().optional(),
        dossierId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.fichier.create({
        data: {
          name: input.name,
          type: input.type,
          content: input.content,
          dossierId: input.dossierId,
          userId: TEMP_USER_ID,
        },
      });
    }),

  // READ - get one by id
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.fichier.findUnique({
        where: { id: input.id },
      });
    }),

  // READ - get all for current user
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.fichier.findMany({
      where: { userId: TEMP_USER_ID, active: true },
      orderBy: { updatedAt: "desc" },
    });
  }),

  // READ - get all favorites
  getFavoris: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.fichier.findMany({
      where: { userId: TEMP_USER_ID, active: true, favoris: true },
      orderBy: { updatedAt: "desc" },
    });
  }),

  // READ - get by dossier
  getByDossier: publicProcedure
    .input(z.object({ dossierId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.fichier.findMany({
        where: { dossierId: input.dossierId, active: true },
        orderBy: { updatedAt: "desc" },
      });
    }),

  // UPDATE - save content (auto-save)
  save: publicProcedure
    .input(
      z.object({
        id: z.string().optional(),
        name: z.string(),
        content: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.id) {
        return ctx.db.fichier.update({
          where: { id: input.id },
          data: {
            name: input.name,
            content: input.content,
          },
        });
      }

      return ctx.db.fichier.create({
        data: {
          name: input.name,
          content: input.content,
          type: "Document",
          userId: TEMP_USER_ID,
        },
      });
    }),

  // UPDATE - rename
  rename: publicProcedure
    .input(z.object({ id: z.string(), name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.fichier.update({
        where: { id: input.id },
        data: { name: input.name },
      });
    }),

  // UPDATE - toggle favoris
  toggleFavoris: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const fichier = await ctx.db.fichier.findUniqueOrThrow({
        where: { id: input.id },
        select: { favoris: true },
      });
      return ctx.db.fichier.update({
        where: { id: input.id },
        data: { favoris: !fichier.favoris },
      });
    }),

  // UPDATE - move to dossier
  move: publicProcedure
    .input(z.object({ id: z.string(), dossierId: z.string().nullable() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.fichier.update({
        where: { id: input.id },
        data: { dossierId: input.dossierId },
      });
    }),

  // DELETE - soft delete (active = false)
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.fichier.update({
        where: { id: input.id },
        data: { active: false },
      });
    }),

  // DELETE - permanent delete
  deletePermanent: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.fichier.delete({
        where: { id: input.id },
      });
    }),

  // RESTORE - restore soft-deleted
  restore: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.fichier.update({
        where: { id: input.id },
        data: { active: true },
      });
    }),
});
