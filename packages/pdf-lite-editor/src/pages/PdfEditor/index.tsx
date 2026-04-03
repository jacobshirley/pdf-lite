import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PdfViewer } from "@/components/PdfViewer";
import {
  MousePointer2,
  Type,
  CheckSquare,
  Wand2,
  Undo2,
  Redo2,
  FolderOpen,
  Download,
  Upload,
  FileUp,
} from "lucide-react";

type FieldType = "Text" | "Checkbox";

type MockField = {
  id: string;
  name: string;
  type: FieldType;
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
};

type LayerItem = {
  id: string;
  name: string;
  kind: string;
  visible: boolean;
};

type ToolButtonProps = {
  label: string;
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
};

type ActionButtonProps = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  wide?: boolean;
};

type FieldBadgeProps = {
  children: React.ReactNode;
  soft?: boolean;
};

type LayerListButtonProps = {
  onClick: () => void;
};

type PdfPageProps = {
  page: number;
  activeTool: string;
  selectedField: string;
  setSelectedField: React.Dispatch<React.SetStateAction<string>>;
  showAllLayers: boolean;
  setShowAllLayers: React.Dispatch<React.SetStateAction<boolean>>;
};

const pages: number[] = [1, 2, 3, 4];

const mockFields: MockField[] = [
  { id: "f1", name: "CustomerName", type: "Text", page: 1, x: 90, y: 190, w: 240, h: 40 },
  { id: "f2", name: "OrderId", type: "Text", page: 1, x: 90, y: 280, w: 180, h: 40 },
  { id: "f3", name: "Approved", type: "Checkbox", page: 2, x: 470, y: 250, w: 28, h: 28 },
];

const mockAllLayers: LayerItem[] = [
  { id: "l1", name: "Background PDF", kind: "Base", visible: true },
  { id: "l2", name: "Editable text layer", kind: "Text", visible: true },
  { id: "l3", name: "AcroForm", kind: "Form", visible: true },
];

function runSelfChecks(): void {
  const fieldIds = new Set<string>();
  for (const field of mockFields) {
    if (fieldIds.has(field.id)) throw new Error(`Duplicate field id: ${field.id}`);
    fieldIds.add(field.id);
    if (!pages.includes(field.page)) throw new Error(`Field ${field.id} references missing page ${field.page}`);
    if (field.w <= 0 || field.h <= 0) throw new Error(`Field ${field.id} must have positive dimensions`);
  }

  const layerIds = new Set<string>();
  for (const layer of mockAllLayers) {
    if (layerIds.has(layer.id)) throw new Error(`Duplicate layer id: ${layer.id}`);
    layerIds.add(layer.id);
  }

  if (!mockAllLayers.some((layer) => layer.name === "Editable text layer")) {
    throw new Error("Missing Editable text layer");
  }

  if (!mockAllLayers.some((layer) => layer.name === "AcroForm")) {
    throw new Error("Missing AcroForm layer");
  }
}

runSelfChecks();

function ToolButton({ label, active, icon: Icon, onClick }: ToolButtonProps) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "ghost"}
      onClick={onClick}
      className="h-10 w-full justify-start rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]"
    >
      <Icon className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}

function ActionButton({ label, icon: Icon, wide = false }: ActionButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className={`rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:border-slate-400 active:scale-[0.98] ${wide ? "col-span-2" : ""}`}
    >
      <Icon className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}

function FieldBadge({ children, soft = false }: FieldBadgeProps) {
  return (
    <Badge variant={soft ? "secondary" : "outline"} className="rounded-full px-3 py-1 font-normal">
      {children}
    </Badge>
  );
}

function LayerListButton({ onClick }: LayerListButtonProps) {
  return (
    <Button 
      type="button" 
      variant="outline" 
      size="sm" 
      onClick={onClick} 
      className="rounded-full px-3 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md hover:bg-slate-100 active:scale-95"
    >
      All
    </Button>
  );
}

function PdfPage({
  page,
  activeTool,
  selectedField,
  setSelectedField,
  showAllLayers,
  setShowAllLayers,
}: PdfPageProps) {
  const fields = mockFields.filter((field) => field.page === page);

  return (
    <div className="w-full">
      <Card className="overflow-hidden rounded-[24px] border-slate-200 shadow-sm">
        <div className="flex items-center justify-between border-b bg-slate-50 px-5 py-3 text-sm text-slate-600">
          <span className="font-semibold">Page {page}</span>
          <div className="relative flex items-center gap-2">
            <FieldBadge soft>Editable text layer</FieldBadge>
            <LayerListButton onClick={() => setShowAllLayers((value) => !value)} />
            <FieldBadge>AcroForm</FieldBadge>

            {showAllLayers && (
              <Card className="absolute right-0 top-[calc(100%+8px)] z-20 min-w-[240px] rounded-2xl border-slate-200 shadow-xl">
                <CardContent className="p-3">
                  <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    All layers
                  </div>
                  <div className="space-y-2">
                    {mockAllLayers.map((layer) => (
                      <div
                        key={layer.id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{layer.name}</div>
                          <div className="text-xs text-slate-500">{layer.kind}</div>
                        </div>
                        <FieldBadge>{layer.visible ? "Visible" : "Hidden"}</FieldBadge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="flex justify-center bg-slate-100/80 p-8">
          <div className="relative aspect-[1/1.35] w-full overflow-hidden rounded-[20px] border border-slate-200 bg-gradient-to-b from-white to-slate-50 shadow-sm">
            <div className="absolute inset-0 p-10 text-slate-800">
              <div className="mb-10 flex items-start justify-between gap-6">
                <div>
                  <h2 className="text-[32px] font-bold tracking-tight">Invoice Template</h2>
                  <div className="mt-1 text-sm text-slate-500">PDF preview mock</div>
                </div>
                <div className="min-w-[140px] rounded-2xl border border-slate-200 bg-white px-4 py-4 text-right">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Invoice</div>
                  <div className="mt-1 text-xl font-bold">INV-2026-0142</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-10 text-sm">
                <div className="space-y-8">
                  <div>
                    <div className="mb-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">Bill To</div>
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4">ACME Incorporated</div>
                  </div>
                  <div>
                    <div className="mb-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">Invoice Number</div>
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4">00048291</div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <div className="mb-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">Amount Due</div>
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4">$12,450.00</div>
                  </div>
                  <div>
                    <div className="mb-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">Approved By</div>
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4">—</div>
                  </div>
                </div>
              </div>

              {fields.map((field) => {
                const isSelected = selectedField === field.id;
                return (
                  <button
                    key={field.id}
                    type="button"
                    onClick={() => setSelectedField(field.id)}
                    className={`absolute rounded-xl border-2 bg-sky-50/90 text-xs shadow-sm transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "border-sky-500 ring-4 ring-sky-100"
                        : "border-sky-300 hover:border-sky-400 hover:bg-sky-100/90 hover:shadow-md hover:scale-105"
                    }`}
                    style={{
                      left: field.x,
                      top: field.y,
                      width: field.w,
                      height: field.h,
                    }}
                  >
                    <div className="flex h-full items-center justify-between gap-2 px-3 text-left">
                      <span className="truncate font-semibold text-slate-900">{field.name}</span>
                      <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] text-slate-700">
                        {field.type}
                      </span>
                    </div>
                  </button>
                );
              })}

              {activeTool === "rename" && (
                <div className="absolute left-[70px] top-[120px] rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 shadow-sm">
                  Rename: ACME Incorporated → Northwind Ltd.
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function PdfEditor() {
  const [activeTool, setActiveTool] = useState<string>("select");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setUploadedFile(file);
    } else if (file) {
      alert("Please upload a PDF file");
    }
  };

  const handleOpenClick = () => {
    fileInputRef.current?.click();
  };

  const handleClearFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 text-slate-900">
      <div className="mx-auto grid max-w-[1600px] grid-cols-[240px_minmax(0,1fr)] gap-4 items-start">
        <Card className="sticky top-6 flex h-[calc(100vh-48px)] flex-col rounded-[24px] border-slate-200 shadow-sm">
          <CardContent className="flex h-full flex-col gap-4 p-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight">PDF Editor</h1>
              <div className="mt-1 text-sm text-slate-500">Form + text editing</div>
            </div>

            <Separator />

            <div>
              <div className="mb-2 text-sm font-semibold text-slate-800">Tools</div>
              <div className="space-y-1">
                <ToolButton label="Select" icon={MousePointer2} active={activeTool === "select"} onClick={() => setActiveTool("select")} />
                <ToolButton label="Text Field" icon={Type} active={activeTool === "text"} onClick={() => setActiveTool("text")} />
                <ToolButton label="Checkbox" icon={CheckSquare} active={activeTool === "checkbox"} onClick={() => setActiveTool("checkbox")} />
                <ToolButton label="Rename" icon={Wand2} active={activeTool === "rename"} onClick={() => setActiveTool("rename")} />
              </div>
            </div>

            <Separator />

            <div className="mt-auto grid grid-cols-2 gap-2">
              <ActionButton label="Undo" icon={Undo2} />
              <ActionButton label="Redo" icon={Redo2} />
              <Button
                type="button"
                variant="outline"
                onClick={handleOpenClick}
                className="col-span-2 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:border-slate-400 hover:bg-slate-50 active:scale-[0.98]"
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                Open PDF
              </Button>
              <ActionButton label="Export" icon={Download} wide />
            </div>
          </CardContent>
        </Card>

        <div className="flex min-w-0 flex-col gap-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          {!uploadedFile ? (
            <Card className="rounded-[24px] border-slate-200 shadow-sm">
              <CardContent className="flex min-h-[500px] flex-col items-center justify-center p-8">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="rounded-2xl bg-slate-100 p-6">
                    <FileUp className="h-12 w-12 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">No PDF loaded</h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Upload a PDF file to start editing form fields and text
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleOpenClick}
                    className="mt-4 rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-[24px] border-slate-200 shadow-sm">
              <div className="flex items-center justify-between border-b bg-slate-50 px-5 py-3">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="rounded-full">
                    {uploadedFile.name}
                  </Badge>
                  <span className="text-xs text-slate-500">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFile}
                  className="rounded-full cursor-pointer transition-all duration-200 hover:scale-105 hover:bg-red-50 hover:text-red-600 active:scale-95"
                >
                  Clear
                </Button>
              </div>
              <CardContent className="p-6">
                <PdfViewer
                  file={uploadedFile}
                  className="w-full"
                  pageWrapper={(page, context) => (
                    <div key={context.pageNumber} className="mb-6">
                      <div className="mb-2 text-sm font-semibold text-slate-600">
                        Page {context.pageNumber}
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        {page}
                      </div>
                    </div>
                  )}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
