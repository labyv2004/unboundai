import { useState } from "react";
import { TerminalPanel, CRTOverlay } from "@/components/Terminal";
import { FileImage, FileText, FileJson, Video, UploadCloud } from "lucide-react";

export default function UploadTab() {
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const processFile = (file: File) => {
    setProcessing(true);
    setStatusMsg(`ANALYZING: ${file.name}...`);
    
    // Simulate upload and processing based on type
    setTimeout(() => {
      if (file.type.includes("video")) {
        setStatusMsg("Converting Video to Text... Extracting frames...");
        setTimeout(() => {
          setStatusMsg("SUCCESS: Video ingested to neural context.");
          setProcessing(false);
        }, 2000);
      } else {
        setStatusMsg("SUCCESS: File parsed and loaded into memory.");
        setProcessing(false);
      }
    }, 1500);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <TerminalPanel title="SECURE_FILE_INGESTION" className="flex-1 flex flex-col h-full items-center justify-center p-8">
      
      <div className="w-full max-w-3xl flex justify-around mb-12 text-muted-foreground">
        <div className="flex flex-col items-center gap-2"><FileImage size={48} className="text-primary" /><span>.JPG .PNG .GIF</span></div>
        <div className="flex flex-col items-center gap-2"><FileText size={48} className="text-primary" /><span>.TXT .MD</span></div>
        <div className="flex flex-col items-center gap-2"><FileJson size={48} className="text-primary" /><span>.JSON .CSV</span></div>
        <div className="flex flex-col items-center gap-2"><Video size={48} className="text-primary" /><span>.MP4 .WEBM</span></div>
      </div>

      <label
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          w-full max-w-3xl h-64 border-4 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all
          ${dragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}
          ${processing ? "pointer-events-none opacity-50" : ""}
        `}
      >
        <input type="file" className="hidden" onChange={handleChange} disabled={processing} />
        
        {processing ? (
          <div className="text-2xl text-primary animate-pulse glow-text flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            {statusMsg}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <UploadCloud size={64} className="text-primary glow-text" />
            <span className="text-2xl text-primary glow-text">DRAG & DROP FILES HERE</span>
            <span className="text-muted-foreground text-xl">OR CLICK TO BROWSE</span>
          </div>
        )}
      </label>

      {!processing && statusMsg && (
        <div className="mt-8 text-xl text-primary glow-text">
          &gt; {statusMsg}
        </div>
      )}
    </TerminalPanel>
  );
}
