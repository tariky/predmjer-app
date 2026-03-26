import { Database } from "bun:sqlite";
import { requireAuth, checkSubscription } from "../auth/middleware";
import { generatePDF } from "../lib/pdf";
import { generateExcel } from "../lib/excel";

export function createExportRoutes(db: Database) {
  function getEstimateData(db: Database, estimateId: number) {
    const estimate = db.query("SELECT * FROM estimates WHERE id = ?").get(estimateId) as any;
    if (!estimate) return null;

    const company = db.query("SELECT * FROM companies WHERE id = ?").get(estimate.company_id) as any;

    const groups = db
      .query("SELECT * FROM estimate_groups WHERE estimate_id = ? ORDER BY sort_order")
      .all(estimateId) as any[];

    for (const group of groups) {
      group.items = db
        .query("SELECT * FROM estimate_items WHERE estimate_group_id = ? ORDER BY sort_order")
        .all(group.id);
    }

    return { estimate, company, groups };
  }

  return {
    "/api/estimates/:id/export/pdf": {
      GET(req: Request) {
        const user = requireAuth(db, req);
        if (user instanceof Response) return user;
        const sub = checkSubscription(db, user);
        if (sub) return sub;

        const id = parseInt(req.params.id);
        const data = getEstimateData(db, id);
        if (!data) return Response.json({ error: "Not found" }, { status: 404 });
        if (user.role !== "super_admin" && data.estimate.company_id !== user.company_id) {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        const pdfBuffer = generatePDF(data);
        const filename = `predmjer-${data.estimate.name.replace(/\s+/g, "-")}.pdf`;
        const asciiFilename = filename.replace(/[^\x20-\x7E]/g, "_");
        const encodedFilename = encodeURIComponent(filename);

        return new Response(pdfBuffer, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`,
          },
        });
      },
    },
    "/api/estimates/:id/export/excel": {
      async GET(req: Request) {
        const user = requireAuth(db, req);
        if (user instanceof Response) return user;
        const sub = checkSubscription(db, user);
        if (sub) return sub;

        const id = parseInt(req.params.id);
        const data = getEstimateData(db, id);
        if (!data) return Response.json({ error: "Not found" }, { status: 404 });
        if (user.role !== "super_admin" && data.estimate.company_id !== user.company_id) {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        const excelBuffer = await generateExcel(data);
        const filename = `predmjer-${data.estimate.name.replace(/\s+/g, "-")}.xlsx`;
        const asciiFilename = filename.replace(/[^\x20-\x7E]/g, "_");
        const encodedFilename = encodeURIComponent(filename);

        return new Response(excelBuffer, {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`,
          },
        });
      },
    },
  };
}
