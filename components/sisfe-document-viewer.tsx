"use client"

import { Download, FileText } from "lucide-react"
import { apiUrl } from "@/lib/api"
import type { SisfeDocument } from "@/lib/types"
import { buttonVariants } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Props = {
  document: SisfeDocument | null
  onOpenChange: (open: boolean) => void
}

export function SisfeDocumentViewer({ document, onOpenChange }: Props) {
  return (
    <Dialog open={Boolean(document)} onOpenChange={onOpenChange}>
      <DialogContent className="h-[92dvh] grid-rows-[auto_minmax(0,1fr)] gap-3 p-3 sm:max-w-[min(96vw,1400px)]">
        <DialogHeader className="pr-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <DialogTitle className="flex items-center gap-2"><FileText className="size-4 shrink-0" /><span className="truncate">{document?.fileName || "Documento SISFE"}</span></DialogTitle>
            <DialogDescription>Vista previa del documento almacenado en el expediente.</DialogDescription>
          </div>
          {document ? <a href={apiUrl(`/api/sisfe/documents/${document.id}/download`)} className={buttonVariants({ variant: "outline", size: "sm", className: "mt-2 shrink-0 sm:mt-0" })}><Download /> Descargar</a> : null}
        </DialogHeader>
        <div className="min-h-0 overflow-hidden rounded-lg border bg-muted">
          {document ? <iframe key={document.id} src={apiUrl(`/api/sisfe/documents/${document.id}/view`)} title={`Vista previa de ${document.fileName}`} className="size-full bg-white" /> : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
