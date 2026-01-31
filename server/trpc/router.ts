import { router, publicProcedure } from "@/server/trpc/trpc";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";

function serializeRecord(record: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(record)) {
    out[k] = typeof v === "bigint" ? String(v) : v;
  }
  return out;
}

export const appRouter = router({
  explorer: router({
    getTree: publicProcedure.query(async () => {
      const [projectsRows, expRows, skillsetRows, contactRows] = await Promise.all([
        prisma.projects.findMany({
          select: { id: true, title: true, description: true, start_date: true, end_date: true, link: true, bulletin: true },
        }),
        prisma.exp.findMany({
          select: { id: true, title: true, organization: true, start_date: true, end_date: true, current: true, description: true },
        }),
        prisma.skillset.findMany({
          select: { id: true, skill: true, type: true, sub_type: true, tech_domain: true },
        }),
        prisma.contact.findMany({
          select: { id: true, contact_type: true, contact_detail: true, outreach_link: true },
        }),
      ]);

      const projects = projectsRows.map((p) => ({ ...p, id: String(p.id) }));
      const exp = expRows.map((e) => ({ ...e, id: String(e.id) }));
      const skillset = skillsetRows.map((s) => ({ ...s, id: String(s.id) }));
      const contact = contactRows.map((c) => ({ ...c, id: String(c.id) }));

      return { projects, exp, skillset, contact };
    }),

    openFile: publicProcedure
      .input(
        z.object({
          table: z.enum(["projects", "exp", "skillset", "contact"]),
          id: z.string(),
        })
      )
      .query(async ({ input }) => {
        const id = BigInt(input.id);
        let row: unknown;
        switch (input.table) {
          case "projects":
            row = await prisma.projects.findUnique({ where: { id } });
            break;
          case "exp":
            row = await prisma.exp.findUnique({ where: { id } });
            break;
          case "skillset":
            row = await prisma.skillset.findUnique({ where: { id } });
            break;
          case "contact":
            row = await prisma.contact.findUnique({ where: { id } });
            break;
        }
        if (row == null) return null;
        return serializeRecord(row as Record<string, unknown>);
      }),
  }),
});

export type AppRouter = typeof appRouter;
