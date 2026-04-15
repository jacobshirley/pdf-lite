import { CanvasPanel } from './components/CanvasPanel'
import { FieldPropertiesPanel } from './components/FieldPropertiesPanel'
import { TextPropertiesPanel } from './components/TextPropertiesPanel'
import { Toolbar } from './components/Toolbar'
import { usePdfEditor } from './usePdfEditor'

export function PdfEditor() {
    const editor = usePdfEditor()

    return (
        <div className="min-h-screen bg-slate-100 p-4 text-slate-900">
            <style>{`
                .field-overlay-label {
                    opacity: 0;
                    transition: opacity 0.2s ease-in-out;
                }
                .field-overlay-container:hover .field-overlay-label {
                    opacity: 1;
                }
                .react-pdf__Page__textContent {
                    pointer-events: none !important;
                }
                .react-pdf__Page__annotations {
                    pointer-events: none !important;
                }
            `}</style>
            <div
                className={`mx-auto grid ${editor.showRightPane ? 'max-w-[2000px] grid-cols-[240px_minmax(0,1fr)_320px]' : 'max-w-[1600px] grid-cols-[240px_minmax(0,1fr)]'} gap-4 items-start`}
            >
                <Toolbar
                    pdfLoaded={editor.pdfLoaded}
                    onAddField={editor.handleAddField}
                    onFieldDragStart={editor.handleFieldDragStart}
                    onFieldDragEnd={editor.handleFieldDragEnd}
                    onAddText={() => editor.handleAddTextBlock()}
                    onOpen={editor.handleOpenClick}
                    onExport={editor.handleExportPdf}
                />

                <CanvasPanel
                    uploadedFile={editor.uploadedFile}
                    pdfLoaded={editor.pdfLoaded}
                    pdfBytes={editor.pdfBytes}
                    pdfDebugText={editor.pdfDebugText}
                    activeView={editor.activeView}
                    onViewChange={editor.setActiveView}
                    fileInputRef={editor.fileInputRef}
                    onFileUpload={editor.handleFileUpload}
                    onOpenClick={editor.handleOpenClick}
                    onClearFile={editor.handleClearFile}
                    extractedFields={editor.extractedFields}
                    extractedTextBlocks={editor.extractedTextBlocks}
                    extractedGraphicsBlocks={editor.extractedGraphicsBlocks}
                    showAcroFormLayer={editor.showAcroFormLayer}
                    showTextLayer={editor.showTextLayer}
                    showGraphicsLayer={editor.showGraphicsLayer}
                    onToggleAcroFormLayer={() =>
                        editor.setShowAcroFormLayer(!editor.showAcroFormLayer)
                    }
                    onToggleTextLayer={() =>
                        editor.setShowTextLayer(!editor.showTextLayer)
                    }
                    onToggleGraphicsLayer={() =>
                        editor.setShowGraphicsLayer(!editor.showGraphicsLayer)
                    }
                    selectedFieldId={editor.selectedFieldId}
                    selectedTextBlockId={editor.selectedTextBlockId}
                    editingTextBlockId={editor.editingTextBlockId}
                    editText={editor.editText}
                    draggedFieldType={editor.draggedFieldType}
                    onFieldSelect={editor.handleFieldSelect}
                    onFieldPositionChange={editor.handleFieldPositionChange}
                    onTextBlockSelect={editor.handleTextBlockSelect}
                    onTextBlockDoubleClick={editor.handleTextBlockDoubleClick}
                    onEditTextChange={editor.setEditText}
                    onTextEditCommit={editor.handleTextEditCommit}
                    onTextEditCancel={editor.handleTextEditCancel}
                    onTextBlockPositionChange={
                        editor.handleTextBlockPositionChange
                    }
                    onBackgroundClick={editor.handleBackgroundClick}
                    onPageDrop={editor.handlePageDrop}
                />

                {editor.selectedFieldId && editor.selectedField && (
                    <FieldPropertiesPanel
                        field={editor.selectedField}
                        onNameChange={(v) =>
                            editor.handleFieldPropertyChange('name', v)
                        }
                        onValueChange={(v) =>
                            editor.handleFieldPropertyChange('value', v)
                        }
                        onFontSizeChange={(v) =>
                            editor.handleFieldPropertyChange('fontSize', v)
                        }
                        onAppearanceStateChange={
                            editor.handleAppearanceStateChange
                        }
                        onRectChange={editor.handleRectChange}
                        onClone={() =>
                            editor.handleCloneField(editor.selectedField!.id)
                        }
                        onRemove={() =>
                            editor.handleRemoveField(editor.selectedField!.id)
                        }
                        onClose={() => editor.setSelectedFieldId(null)}
                    />
                )}

                {editor.selectedTextBlock && !editor.selectedFieldId && (
                    <TextPropertiesPanel
                        textBlock={editor.selectedTextBlock}
                        segments={editor.selectedTextSegments}
                        standardFonts={editor.standardFonts}
                        embeddedFonts={editor.embeddedFonts}
                        fontInputRef={editor.fontInputRef}
                        onTextChange={editor.handleTextBlockPropertyEdit}
                        onFontChange={editor.handleFontChange}
                        onColorChange={editor.handleColorChange}
                        onMove={editor.handleTextBlockMove}
                        onFontUpload={editor.handleFontUpload}
                        onRemove={() =>
                            editor.handleRemoveTextBlock(
                                editor.selectedTextBlock!.id,
                            )
                        }
                        onClose={() => editor.setSelectedTextBlockId(null)}
                    />
                )}
            </div>
        </div>
    )
}
